import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

export const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const readJson = async name => JSON.parse(await readFile(path.join(root, name), 'utf8'));
const stable = value => JSON.stringify(value, null, 2) + '\n';
const cell = value => String(value ?? '—').replaceAll('|', '\\|').replace(/[\r\n]+/g, ' ');
const versionPattern = /^\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/;

export function validateSources(sources) {
  if (sources.format !== 'arxo.public-delivery-sources/1') throw Error('Unknown sources format');
  for (const key of ['packages', 'repositories']) {
    if (!Array.isArray(sources[key]) || !sources[key].length) throw Error(`Empty ${key} selection`);
    const names = new Set();
    for (const row of sources[key]) {
      if (names.has(row.name)) throw Error(`Duplicate ${row.name}`);
      names.add(row.name);
      if (typeof row.purpose !== 'string' || !row.purpose) throw Error(`Missing purpose: ${row.name}`);
      if (key === 'packages') {
        if (!(row.name === 'create-arxo' || /^@arxo\/[a-z0-9-]+$/.test(row.name))) {
          throw Error(`Unapproved package namespace: ${row.name}`);
        }
        if (row.name === '@arxo/docs-mcp') throw Error('Excluded package: @arxo/docs-mcp');
        if (!['SDK', 'CLI', 'Canons', 'MCP', 'Platform dependencies'].includes(row.group)) {
          throw Error(`Unknown package group: ${row.group}`);
        }
      } else if (!/^arxohq\/[a-z0-9-]+$/.test(row.name)) {
        throw Error(`Unapproved public repository: ${row.name}`);
      }
    }
  }
  if (sources.knownIssues !== undefined && !Array.isArray(sources.knownIssues)) throw Error('Invalid knownIssues selection');
  for (const issue of sources.knownIssues ?? []) {
    if (!sources.packages.some(row => row.name === issue.package) ||
        !sources.packages.some(row => row.name === issue.engine) ||
        !versionPattern.test(issue.version ?? '') || !versionPattern.test(issue.engineVersion ?? '') ||
        typeof issue.summary !== 'string' || !issue.summary ||
        !/^[a-z][a-z-]*\.md(?:#[a-z-]+)?$/.test(issue.guide ?? '')) {
      throw Error('Known issue needs selected packages, exact versions and a local guide');
    }
  }
}

export async function fetchJson(url) {
  const headers = { Accept: 'application/json', 'User-Agent': 'arxo-law-public-catalogue' };
  if (url.startsWith('https://api.github.com/') && process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw Error(`HTTP ${response.status}`);
  return response.json();
}

const arxoDependencies = value => Object.fromEntries(
  Object.entries(value ?? {}).filter(([name]) => name.startsWith('@arxo/')).sort(([a], [b]) => a.localeCompare(b)),
);

export function packageObservation(name, data, now) {
  const version = data['dist-tags']?.latest;
  if (data.name !== name || !versionPattern.test(version ?? '')) throw Error('Missing valid latest release');
  const release = data.versions?.[version];
  const publishedAt = data.time?.[version];
  if (!release || !publishedAt || !Number.isFinite(Date.parse(publishedAt))) throw Error('Incomplete published release');
  if (!release.dist?.integrity) throw Error('Missing npm integrity');
  return {
    availability: 'available', observedAt: now, version, publishedAt,
    distTags: Object.fromEntries(Object.entries(data['dist-tags']).sort(([a], [b]) => a.localeCompare(b))),
    licence: typeof release.license === 'string' ? release.license : null,
    node: release.engines?.node ?? null, deprecated: release.deprecated ?? null,
    dependencies: arxoDependencies(release.dependencies),
    optionalDependencies: arxoDependencies(release.optionalDependencies),
    integrity: release.dist.integrity,
    url: `https://www.npmjs.com/package/${name}`,
  };
}

export function repositoryObservation(name, data, now) {
  if (data.private !== false || data.visibility !== 'public' || data.full_name !== name) {
    throw Error('Selected repository is not public at its declared address');
  }
  return { availability: 'available', observedAt: now, url: `https://github.com/${name}`,
    defaultBranch: data.default_branch, archived: data.archived === true };
}

export async function attemptObservation(previous, observe, now) {
  try { return await observe(); }
  catch (error) {
    return { ...(previous ?? {}), availability: 'unavailable', attemptedAt: now,
      error: error.message === 'HTTP 404' ? 'HTTP 404 (not publicly available)' : error.message };
  }
}

export async function refresh(sources, previous = {}, get = fetchJson, now = new Date().toISOString()) {
  validateSources(sources);
  const snapshot = { format: 'arxo.public-delivery-catalogue/1', refreshedAt: now,
    packages: {}, repositories: {}, binaryRelease: null };
  // A bounded pool avoids both registry bursts and an unbounded public API fan-out.
  const tasks = [
    ...sources.packages.map(row => async () => {
      snapshot.packages[row.name] = await attemptObservation(previous.packages?.[row.name], async () =>
        packageObservation(row.name, await get(`https://registry.npmjs.org/${encodeURIComponent(row.name)}`), now), now);
    }),
    ...sources.repositories.map(row => async () => {
      snapshot.repositories[row.name] = await attemptObservation(previous.repositories?.[row.name], async () =>
        repositoryObservation(row.name, await get(`https://api.github.com/repos/${row.name}`), now), now);
    }),
  ];
  let cursor = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (cursor < tasks.length) { const task = tasks[cursor++]; await task(); }
  }));
  snapshot.packages = Object.fromEntries(sources.packages.map(row => [row.name, snapshot.packages[row.name]]));
  snapshot.repositories = Object.fromEntries(sources.repositories.map(row => [row.name, snapshot.repositories[row.name]]));
  snapshot.binaryRelease = await attemptObservation(previous.binaryRelease, async () => {
    if (snapshot.repositories['arxohq/law-releases']?.availability !== 'available') {
      throw Error('Binary repository has no fresh public observation');
    }
    const data = await get('https://api.github.com/repos/arxohq/law-releases/releases/latest');
    if (data.draft || data.prerelease || !data.tag_name ||
        !data.html_url?.startsWith('https://github.com/arxohq/law-releases/releases/')) {
      throw Error('No public stable binary release');
    }
    return { availability: 'available', observedAt: now, tag: data.tag_name,
      publishedAt: data.published_at, url: data.html_url,
      assets: data.assets.map(asset => ({ name: asset.name, bytes: asset.size, url: asset.browser_download_url })) };
  }, now);
  return snapshot;
}

function observed(row) {
  if (!row?.observedAt) return 'not yet observed';
  return `${row.observedAt}${row.availability === 'available' ? '' : ' (previous observation; fetch failed)'}`;
}

function shortDate(value) {
  return value && Number.isFinite(Date.parse(value))
    ? new Date(value).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
    : 'not yet observed';
}

function availability(row) {
  if (row?.availability === 'available') return '';
  return row?.observedAt ? ` — unavailable; last seen ${shortDate(row.observedAt)}` : ' — unavailable';
}

function exampleStatus(spec, row, dependencies, sources) {
  const issue = (sources.knownIssues ?? []).find(item => item.package === spec.name &&
    item.version === row?.version && dependencies[item.engine] === item.engineVersion);
  if (issue) return `[${cell(issue.summary)}](${issue.guide})`;
  if (row?.version && dependencies[spec.name] === row.version) return '[Example set](compatibility.md)';
  return 'Not checked here';
}

function packageTable(selection, snapshot, { featured = false, dependencies = {}, sources = {} } = {}) {
  const lines = featured
    ? ['| Package | Latest | Start with |', '|---|---|---|']
    : ['| Package | Latest | Use it for | Checks |', '|---|---|---|---|'];
  const starts = {
    '@arxo/law': '[Run a model](docs/run-a-model.md)',
    '@arxo/law-engine': '[Write rules](docs/write-rules.md)',
    '@arxo/cli': '[CLI and editor](docs/write-rules.md#use-the-cli-or-editor)',
  };
  for (const spec of selection) {
    const row = snapshot.packages[spec.name];
    const version = (row?.version ?? 'not observed') + (row?.deprecated ? ' (deprecated)' : '') + availability(row);
    const cells = [`[${spec.name}](https://www.npmjs.com/package/${spec.name})`, cell(version)];
    if (featured) cells.push(starts[spec.name] ?? cell(spec.purpose));
    else cells.push(cell(spec.purpose), exampleStatus(spec, row, dependencies, sources));
    lines.push(`| ${cells.join(' | ')} |`);
  }
  return lines.join('\n');
}

export function render(sources, snapshot, dependencies = {}) {
  validateSources(sources);
  if (snapshot.format !== 'arxo.public-delivery-catalogue/1') throw Error('Unknown snapshot format');
  const packages = [
    '# Choose a package', '', '[← Arxo Law](../README.md)', '',
    '| I want to… | Start with |', '|---|---|',
    '| Run a published model | [Run a model](run-a-model.md) with `@arxo/law` |',
    '| Compile my own rules | [Write rules](write-rules.md) with `@arxo/law-engine` |',
    '| Connect an assistant | [Connect MCP](connect-mcp.md) with a selected slice |', '',
    `Last refresh attempt: **${shortDate(snapshot.refreshedAt)}**.`, '',
    '**Example set** means that exact version is used by this repository\'s CI examples.',
    'Other entries are observed deliveries with the checks stated below. Each package',
    'has its own version. See [tested combinations](compatibility.md).', '',
  ];
  for (const group of ['SDK', 'CLI', 'Canons', 'MCP']) {
    packages.push(`## ${group}`, '', packageTable(sources.packages.filter(row => row.group === group), snapshot,
      { dependencies, sources }), '');
    if (group === 'MCP') packages.push('A slice keeps its own pinned MCP host version.',
      '[Connection instructions →](connect-mcp.md)', '');
  }
  packages.push('<details>', '<summary>Platform dependencies — installed by the launchers</summary>', '',
    'These are normally selected automatically for the operating system and architecture.', '',
    packageTable(sources.packages.filter(row => row.group === 'Platform dependencies'), snapshot,
      { dependencies, sources }), '', '</details>', '',
    '<details>', '<summary>Publication dates, observations and package integrity</summary>', '',
    '| Package | Published (UTC) | Last successful observation (UTC) |', '|---|---|---|');
  for (const spec of sources.packages) {
    const row = snapshot.packages[spec.name];
    packages.push(`| ${spec.name} | ${cell(row?.publishedAt)} | ${cell(observed(row))} |`);
  }
  packages.push('', 'Full integrity strings and exact dependency pins are in the',
    '[captured snapshot](../catalog/snapshot.json). npm `latest` is a distribution',
    'tag; it does not establish compatibility. When a fetch fails, the version',
    'retains its original observation date and is labelled unavailable.', '',
    'The [source selection](../catalog/sources.json) is curated. Follow the',
    '[contribution instructions](../CONTRIBUTING.md) to refresh it.', '', '</details>', '',
    'The [example lockfile](../package-lock.json) pins the runnable examples.',
    'Refreshing the catalogue does not upgrade those examples or validate the full corpus.', '');

  const ecosystem = ['# Explore the public ecosystem', '', '[← Arxo Law](../README.md)', '',
    'Model sources, examples, editor tools and delivery channels maintained separately.',
    `Last refresh attempt: **${shortDate(snapshot.refreshedAt)}**.`, '',
    '| Project | What you can do |', '|---|---|'];
  for (const spec of sources.repositories) {
    const row = snapshot.repositories[spec.name];
    ecosystem.push(`| [${spec.name}](https://github.com/${spec.name})${cell(availability(row))} | ${cell(spec.purpose)} |`);
  }
  const binary = snapshot.binaryRelease;
  ecosystem.push('', '## Install the CLI', '', '```sh', 'npm install -g @arxo/cli',
    'law --help', '```', '',
    binary?.tag ? `Observed stable binary release: [${cell(binary.tag)}](${binary.url})${cell(availability(binary))}.`
      : 'A stable binary release has not been observed.', '',
    'CLI and LSP archives, installers and matching checksums are in',
    '[law-releases](https://github.com/arxohq/law-releases).', '',
    '<details>', '<summary>Binary assets and observation details</summary>', '',
    `Binary observation (UTC): ${observed(binary)}.`, '');
  if (binary?.assets?.length) {
    ecosystem.push('| Asset | Bytes |', '|---|---:|');
    for (const asset of binary.assets) ecosystem.push(`| [${cell(asset.name)}](${asset.url}) | ${asset.bytes} |`);
    ecosystem.push('');
  }
  ecosystem.push('| Repository | Last successful observation (UTC) |', '|---|---|');
  for (const spec of sources.repositories) {
    ecosystem.push(`| ${spec.name} | ${cell(observed(snapshot.repositories[spec.name]))} |`);
  }
  ecosystem.push('', 'Only repositories reported public at the selected address are accepted',
    'as successful observations. Linked projects retain their own licences and notices.', '',
    '</details>', '', '## More entry points', '',
    '- [Try the French benefits lab](https://french-benefits.law.arxo.io/).',
    '- [Read the authoring and integration guides](https://docs.arxo.io/).',
    '- [Choose an npm package or MCP slice](packages.md).',
    '- [Visit Arxo](https://www.arxo.io/).', '');
  return { featured: packageTable(sources.packages.filter(row => row.featured), snapshot, { featured: true }),
    packages: packages.join('\n'), ecosystem: ecosystem.join('\n') };
}

export async function renderedFiles(sources, snapshot) {
  const pkg = await readJson('package.json');
  const pages = render(sources, snapshot, pkg.dependencies);
  const readme = await readFile(path.join(root, 'README.md'), 'utf8');
  const start = '<!-- catalog:featured:start -->';
  const end = '<!-- catalog:featured:end -->';
  if (readme.split(start).length !== 2 || readme.split(end).length !== 2 || readme.indexOf(start) > readme.indexOf(end)) {
    throw Error('README catalogue markers missing or ambiguous');
  }
  const updated = readme.slice(0, readme.indexOf(start) + start.length) + '\n\n' +
    pages.featured + '\n\n' + readme.slice(readme.indexOf(end));
  return { 'README.md': updated, 'docs/packages.md': pages.packages, 'docs/ecosystem.md': pages.ecosystem };
}

export async function checkCatalogue() {
  const sources = await readJson('catalog/sources.json');
  const snapshot = await readJson('catalog/snapshot.json');
  for (const key of ['packages', 'repositories']) {
    const expected = sources[key].map(row => row.name).sort();
    const actual = Object.keys(snapshot[key] ?? {}).sort();
    if (stable(expected) !== stable(actual)) throw Error(`Snapshot ${key} differs from selected sources`);
    for (const [name, row] of Object.entries(snapshot[key])) {
      if (!['available', 'unavailable'].includes(row.availability)) throw Error(`Invalid observation: ${name}`);
      if (row.observedAt && !Number.isFinite(Date.parse(row.observedAt))) throw Error(`Invalid observation date: ${name}`);
      if (row.availability === 'available' && !row.observedAt) throw Error(`Undated observation: ${name}`);
      if (key === 'packages' && row.observedAt && (!versionPattern.test(row.version ?? '') || !row.integrity)) {
        throw Error(`Invalid published package: ${name}`);
      }
    }
  }
  for (const [name, wanted] of Object.entries(await renderedFiles(sources, snapshot))) {
    if (await readFile(path.join(root, name), 'utf8') !== wanted) throw Error(`Generated page drift: ${name}`);
  }
}

async function main() {
  const mode = process.argv.slice(2);
  if (mode.length !== 1 || !['--refresh', '--render', '--check'].includes(mode[0])) {
    throw Error('Usage: node tools/catalog.mjs --refresh|--render|--check');
  }
  if (mode[0] === '--check') { await checkCatalogue(); console.log('Catalogue: captured observations and pages agree.'); return; }
  const sources = await readJson('catalog/sources.json');
  let snapshot;
  try { snapshot = await readJson('catalog/snapshot.json'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; snapshot = {}; }
  if (mode[0] === '--refresh') {
    snapshot = await refresh(sources, snapshot);
    await writeFile(path.join(root, 'catalog/snapshot.json'), stable(snapshot));
  }
  for (const [name, content] of Object.entries(await renderedFiles(sources, snapshot))) {
    await writeFile(path.join(root, name), content);
  }
  const failed = [...Object.values(snapshot.packages), ...Object.values(snapshot.repositories), snapshot.binaryRelease]
    .filter(row => row?.availability === 'unavailable');
  console.log(`Catalogue: ${sources.packages.length} packages, ${sources.repositories.length} repositories; ${failed.length} unavailable observations.`);
  if (mode[0] === '--refresh' && failed.length) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(`Catalogue: ${error.message}`); process.exitCode = 1; });
}
