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
  if (!row?.observedAt) return 'unobserved';
  return `${row.observedAt}${row.availability === 'available' ? '' : ' (previous observation; fetch failed)'}`;
}

function packageTable(sources, snapshot, detailed = false) {
  const lines = detailed
    ? ['| Package | Observed `latest` | Purpose | Published (UTC) | Observation (UTC) |', '|---|---|---|---|---|']
    : ['| Package | Observed `latest` | Use it for |', '|---|---|---|'];
  for (const spec of sources) {
    const item = snapshot.packages[spec.name];
    const warning = item?.deprecated ? ' (deprecated)' : '';
    const version = (item?.version ?? 'unobserved') + warning +
      (item?.availability === 'available' ? '' : ' (unavailable)');
    const cells = [`[${spec.name}](https://www.npmjs.com/package/${spec.name})`,
      cell(version), cell(spec.purpose)];
    if (detailed) cells.push(cell(item?.publishedAt ?? '—'), cell(observed(item)));
    lines.push(`| ${cells.join(' | ')} |`);
  }
  return lines.join('\n');
}

export function render(sources, snapshot) {
  validateSources(sources);
  if (snapshot.format !== 'arxo.public-delivery-catalogue/1') throw Error('Unknown snapshot format');
  const packages = [
    '# Published packages', '',
    'Generated from [the selected public sources](../catalog/sources.json) and',
    '[the captured observations](../catalog/snapshot.json). Package owners retain',
    'their versions; this is a delivery catalogue, not a conformance report.', '',
    `Last refresh attempt: **${snapshot.refreshedAt}**. Each row records its own successful observation.`, '',
    'An unavailable row retains its previous metadata and observation date. An',
    'observation is not a real-time availability guarantee. npm `latest` is the',
    'selected distribution tag, not the largest version number or a claim about',
    'compatibility. Exact dependency pins and integrity strings are in the JSON snapshot.', '',
  ];
  for (const group of ['SDK', 'CLI', 'Canons', 'MCP', 'Platform dependencies']) {
    packages.push(`## ${group}`, '', packageTable(sources.packages.filter(row => row.group === group), snapshot, true), '');
  }
  packages.push('## Using the catalogue', '',
    'Start with `@arxo/law` to ask a model a question, `@arxo/law-engine` to compile',
    'sources or embed the evaluator, or `@arxo/cli` for a command-line project.',
    'Canon packages contain particular models; MCP packages contain particular slices.',
    'Platform dependencies are installed by their launchers and are normally not chosen manually.', '',
    'For example, a slice pins its own MCP host version. A newer host release does',
    'not switch that slice automatically. The examples use a tested exact dependency',
    'set in [package-lock.json](../package-lock.json), independently of later catalogue updates.', '',
    'See [tested combinations and observed limitations](compatibility.md) before',
    'assuming that independently published packages are mutually compatible.', '',
    'Install an MCP slice with, for example:', '', '```sh',
    'claude mcp add arxo-bgb -- npx -y @arxo/mcp-de-bgb', '```', '',
    'Review the linked package README for its supported platforms and selected models.', '',
    'To refresh the catalogue, follow [the contribution instructions](../CONTRIBUTING.md).', '');
  const ecosystem = ['# Public ecosystem', '',
    'Generated from explicitly selected public repositories. Availability is',
    'checked against the public GitHub API; private or redirected private repositories',
    'are not accepted as public observations.', '',
    '| Repository | Purpose | Observation (UTC) |', '|---|---|---|'];
  for (const spec of sources.repositories) {
    const item = snapshot.repositories[spec.name];
    ecosystem.push(`| [${spec.name}](https://github.com/${spec.name}) | ${cell(spec.purpose)} | ${cell(observed(item))} |`);
  }
  const binary = snapshot.binaryRelease;
  ecosystem.push('', '## Downloadable CLI and LSP', '',
    binary?.tag ? `Observed stable release: [${cell(binary.tag)}](${binary.url}), published ${cell(binary.publishedAt)}.`
      : 'A stable binary release has not been observed.', '', `Observation (UTC): ${observed(binary)}.`, '',
    'Archives, installers and checksums stay in the existing binary-delivery repository.',
    'Download the archive and its checksum from the same release and follow its installation instructions.', '');
  if (binary?.assets?.length) {
    ecosystem.push('| Asset | Bytes |', '|---|---:|');
    for (const asset of binary.assets) ecosystem.push(`| [${cell(asset.name)}](${asset.url}) | ${asset.bytes} |`);
    ecosystem.push('');
  }
  ecosystem.push('## More entry points', '',
    '- [Arxo](https://www.arxo.io/): project overview.',
    '- [Documentation](https://docs.arxo.io/): authoring and integration guides.',
    '- [npm catalogue](packages.md): SDK, CLI, canons and available MCP slices.',
    '- [French benefits lab](https://french-benefits.law.arxo.io/): explore the selected demonstration models.', '',
    'These are separate projects with their own licences and notices.',
    'A model repository or demonstration is not a claim of complete legal coverage.', '');
  return { featured: packageTable(sources.packages.filter(row => row.featured), snapshot),
    packages: packages.join('\n'), ecosystem: ecosystem.join('\n') };
}

export async function renderedFiles(sources, snapshot) {
  const pages = render(sources, snapshot);
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
