import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

export const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const readJson = async name => JSON.parse(await readFile(path.join(root, name), 'utf8'));
const stable = value => JSON.stringify(value, null, 2) + '\n';
const cell = value => String(value ?? '—').replaceAll('|', '\\|').replace(/[\r\n]+/g, ' ');
const versionPattern = /^\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/;
const pythonVersionPattern = /^[0-9][a-zA-Z0-9.!+_-]{0,127}$/;
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
export const extensionKey = row => `${row.registry}:${row.name}`;
export const extensionUrl = row => row.registry === 'marketplace'
  ? `https://marketplace.visualstudio.com/items?itemName=${row.name}`
  : `https://open-vsx.org/extension/${row.name.replace('.', '/')}`;

function publicLink(row) {
  let url;
  try { url = new URL(row.url); } catch { throw Error('Invalid public link'); }
  if (url.protocol !== 'https:' || url.username || url.password ||
      typeof row.title !== 'string' || !row.title || typeof row.purpose !== 'string' || !row.purpose) {
    throw Error('Public links need an HTTPS URL, title and purpose');
  }
}

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
  for (const key of ['pythonPackages', 'extensions', 'surfaces', 'community']) {
    if (sources[key] !== undefined && !Array.isArray(sources[key])) throw Error(`Invalid ${key} selection`);
    const names = new Set();
    for (const row of sources[key] ?? []) {
      const name = key === 'extensions' ? extensionKey(row) : row.name ?? row.url;
      if (names.has(name)) throw Error(`Duplicate ${name}`);
      names.add(name);
      if (typeof row.purpose !== 'string' || !row.purpose) throw Error(`Missing purpose: ${name}`);
      if (key === 'pythonPackages' && !/^arxo(?:-[a-z0-9-]+)?$/.test(row.name)) {
        throw Error(`Unapproved Python namespace: ${row.name}`);
      }
      if (key === 'extensions' && (row.name !== 'arxo.law' ||
          !['marketplace', 'open-vsx'].includes(row.registry))) throw Error('Unapproved editor listing');
      if (key === 'surfaces' || key === 'community') publicLink(row);
      if (key === 'surfaces' && !['Browser', 'Build and integrate', 'Learn'].includes(row.group)) {
        throw Error(`Unknown surface group: ${row.group}`);
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

export async function fetchJson(url, options = {}) {
  const headers = { Accept: 'application/json', 'User-Agent': 'arxo-law-public-catalogue', ...options.headers };
  if (url.startsWith('https://api.github.com/') && process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const response = await fetch(url, { ...options, headers, signal: AbortSignal.timeout(20000) });
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

export function pythonPackageObservation(name, data, now) {
  const normalize = value => String(value).toLowerCase().replace(/[-_.]+/g, '-');
  const version = data.info?.version;
  if (normalize(data.info?.name) !== normalize(name) || !pythonVersionPattern.test(version ?? '')) {
    throw Error('Missing valid PyPI release');
  }
  const files = data.releases?.[version]?.filter(file => !file.yanked);
  if (!files?.length) throw Error('No non-yanked PyPI release files');
  const artifacts = files.map(file => {
    const publishedAt = file.upload_time_iso_8601;
    if (!validDate(publishedAt) || !/^[a-f0-9]{64}$/.test(file.digests?.sha256 ?? '') ||
        !file.url?.startsWith('https://files.pythonhosted.org/') || !file.filename ||
        !Number.isSafeInteger(file.size) || file.size < 0) throw Error('Incomplete PyPI release file');
    return { name: file.filename, bytes: file.size, sha256: file.digests.sha256,
      publishedAt, url: file.url };
  });
  artifacts.sort((a, b) => a.name.localeCompare(b.name));
  return { availability: 'available', observedAt: now, version,
    publishedAt: artifacts.map(file => file.publishedAt).sort()[0],
    python: data.info.requires_python ?? null,
    licence: data.info.license_expression ?? data.info.license ?? null,
    artifacts, url: `https://pypi.org/project/${name}/` };
}

export function extensionObservation(spec, data, now) {
  let version, publishedAt, vscode, licence, preRelease;
  if (spec.registry === 'marketplace') {
    const matches = (data.results ?? []).flatMap(result => result.extensions ?? [])
      .filter(row => `${row.publisher?.publisherName}.${row.extensionName}` === spec.name);
    if (matches.length !== 1) throw Error('Missing exact Marketplace listing');
    const release = matches[0].versions?.[0];
    version = release?.version;
    publishedAt = release?.lastUpdated;
    const properties = Object.fromEntries((release?.properties ?? []).map(row => [row.key, row.value]));
    vscode = properties['Microsoft.VisualStudio.Code.Engine'] ?? null;
    licence = null;
    preRelease = properties['Microsoft.VisualStudio.Code.PreRelease'] === 'true';
  } else if (spec.registry === 'open-vsx') {
    if (`${data.namespace}.${data.name}` !== spec.name || data.error) throw Error('Missing exact Open VSX listing');
    version = data.version;
    publishedAt = data.timestamp;
    vscode = data.engines?.vscode ?? null;
    licence = data.license ?? null;
    preRelease = data.preRelease === true;
  } else throw Error('Unknown editor registry');
  if (!versionPattern.test(version ?? '') || !validDate(publishedAt)) throw Error('Incomplete editor release');
  return { availability: 'available', observedAt: now, version, publishedAt,
    vscode, licence, preRelease, url: extensionUrl(spec) };
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
    packages: {}, pythonPackages: {}, extensions: {}, repositories: {}, binaryRelease: null };
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
    ...(sources.pythonPackages ?? []).map(row => async () => {
      snapshot.pythonPackages[row.name] = await attemptObservation(previous.pythonPackages?.[row.name], async () =>
        pythonPackageObservation(row.name, await get(`https://pypi.org/pypi/${row.name}/json`), now), now);
    }),
    ...(sources.extensions ?? []).map(row => async () => {
      const key = extensionKey(row);
      snapshot.extensions[key] = await attemptObservation(previous.extensions?.[key], async () => {
        // Registry/CDN caches can retain the preceding release after a publish.
        // Give this observation a fresh cache key without changing the selection.
        const fresh = `?arxo_observed_at=${encodeURIComponent(now)}`;
        const data = row.registry === 'open-vsx'
          ? await get(`https://open-vsx.org/api/${row.name.replace('.', '/')}/latest${fresh}`)
          : await get(`https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery${fresh}`, {
            method: 'POST', headers: { Accept: 'application/json;api-version=7.2-preview.1', 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
            body: JSON.stringify({ filters: [{ criteria: [{ filterType: 7, value: row.name }] }], flags: 914 }),
          });
        return extensionObservation(row, data, now);
      }, now);
    }),
  ];
  let cursor = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (cursor < tasks.length) { const task = tasks[cursor++]; await task(); }
  }));
  snapshot.packages = Object.fromEntries(sources.packages.map(row => [row.name, snapshot.packages[row.name]]));
  snapshot.repositories = Object.fromEntries(sources.repositories.map(row => [row.name, snapshot.repositories[row.name]]));
  snapshot.pythonPackages = Object.fromEntries((sources.pythonPackages ?? []).map(row => [row.name, snapshot.pythonPackages[row.name]]));
  snapshot.extensions = Object.fromEntries((sources.extensions ?? []).map(row => [extensionKey(row), snapshot.extensions[extensionKey(row)]]));
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
    '| Work in Python | [Python packages](#python-pypi) and the Python SDK guide |',
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
  if (sources.pythonPackages?.length) {
    packages.push('## Python (PyPI)', '',
      '[Python SDK guide](https://docs.arxo.io/build/sdk/python/). Select the canon package as well as the facade.', '',
      '```sh', 'pip install arxo arxo-canon-bgb-fristen', '```', '',
      'Check the observed Python requirement and pin the package versions for your application.',
      'The Node.js example set does not validate these Python packages.', '',
      '| Package | Latest | Python | Use it for |', '|---|---|---|---|');
    for (const spec of sources.pythonPackages) {
      const row = snapshot.pythonPackages?.[spec.name];
      packages.push(`| [${spec.name}](https://pypi.org/project/${spec.name}/) | ${cell((row?.version ?? 'not observed') + availability(row))} | ${cell(row?.python)} | ${cell(spec.purpose)} |`);
    }
    packages.push('');
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
  for (const spec of sources.pythonPackages ?? []) {
    const row = snapshot.pythonPackages?.[spec.name];
    packages.push(`| ${spec.name} (PyPI) | ${cell(row?.publishedAt)} | ${cell(observed(row))} |`);
  }
  packages.push('', 'Full integrity strings and exact dependency pins are in the',
    '[captured snapshot](../catalog/snapshot.json), alongside SHA-256 hashes of PyPI release files.',
    'npm `latest` is a distribution',
    'tag; it does not establish compatibility. When a fetch fails, the version',
    'retains its original observation date and is labelled unavailable.', '',
    'The [source selection](../catalog/sources.json) is curated. Follow the',
    '[contribution instructions](../CONTRIBUTING.md) to refresh it.', '', '</details>', '',
    'The [example lockfile](../package-lock.json) pins the runnable examples.',
    'Refreshing the catalogue does not upgrade those examples or validate the full corpus.', '');

  const ecosystem = ['# Explore the public ecosystem', '', '[← Arxo Law](../README.md)', '',
    'Choose an editor, installation route, browser tool or learning format.',
    `Last refresh attempt: **${shortDate(snapshot.refreshedAt)}**.`, ''];
  if (sources.extensions?.length) {
    ecosystem.push('## Install the editor', '',
      '[Installation and first steps →](install-editor.md)', '',
      '| Store | Latest | Use it for |', '|---|---|---|');
    for (const spec of sources.extensions) {
      const row = snapshot.extensions?.[extensionKey(spec)];
      const title = spec.registry === 'marketplace' ? 'Visual Studio Marketplace' : 'Open VSX';
      ecosystem.push(`| [${title}](${extensionUrl(spec)}) | ${cell((row?.version ?? 'not observed') + (row?.preRelease ? ' (prerelease)' : '') + availability(row))} | ${cell(spec.purpose)} |`);
    }
    ecosystem.push('', 'VS Code command line:', '', '```sh', 'code --install-extension arxo.law', '```', '',
      'Check the installed version in the extension\'s Details view. Store releases can differ.',
      'The [editor guide](install-editor.md#check-which-release-you-installed) distinguishes',
      'published features from newer development work.', '');
  }
  const binary = snapshot.binaryRelease;
  ecosystem.push('## Install the CLI', '',
    '| Route | Start here |', '|---|---|',
    '| npm | `npm install -g @arxo/cli` |',
    '| Homebrew | `brew install arxohq/tap/law` · [tap](https://github.com/arxohq/homebrew-tap) |',
    '| APT: Debian and Ubuntu amd64 | [Repository setup](https://packages.arxo.io/) · package `arxo-law` |',
    '| Archive or shell installer | [Release assets and checksums](https://github.com/arxohq/law-releases/releases) |', '',
    'Follow the [installation guide](https://docs.arxo.io/cli/install/) for platform requirements.',
    'After installation, inspect the command:', '', '```sh',
    'law --help', '```', '',
    binary?.tag ? `Observed stable binary release: [${cell(binary.tag)}](${binary.url})${cell(availability(binary))}.`
      : 'A stable binary release has not been observed.', '',
    'CLI and LSP archives, installers and matching checksums are in',
    '[law-releases](https://github.com/arxohq/law-releases).', '');
  for (const group of ['Browser', 'Build and integrate', 'Learn']) {
    const selection = (sources.surfaces ?? []).filter(row => row.group === group);
    if (!selection.length) continue;
    ecosystem.push(`## ${group === 'Browser' ? 'Try in the browser' : group}`, '',
      '| Start here | What you can do |', '|---|---|');
    for (const row of selection) ecosystem.push(`| [${cell(row.title)}](${row.url}) | ${cell(row.purpose)} |`);
    ecosystem.push('');
  }
  ecosystem.push('## Public model and tool repositories', '', '| Project | What you can do |', '|---|---|');
  for (const spec of sources.repositories) {
    const row = snapshot.repositories[spec.name];
    ecosystem.push(`| [${spec.name}](https://github.com/${spec.name})${cell(availability(row))} | ${cell(spec.purpose)} |`);
  }
  ecosystem.push('', '## Other tools', '',
    'The [integration-pattern guide](https://docs.arxo.io/agent-engineering/integration-patterns/)',
    'also describes generated-code use. No dedicated generated-module distribution is observed here.',
    'Public installation routes for Zed, the desktop app and standalone agent skills',
    'have not been verified by this catalogue.', '', '## Follow and participate', '',
    '[Ask a question](https://github.com/arxohq/law/discussions) ·',
    '[Report a problem](https://github.com/arxohq/law/issues) ·',
    '[Community](https://community.arxo.io/)', '');
  if (sources.community?.length) {
    ecosystem.push('| Channel | What you will find |', '|---|---|');
    for (const row of sources.community) ecosystem.push(`| [${cell(row.title)}](${row.url}) | ${cell(row.purpose)} |`);
    ecosystem.push('');
  }
  ecosystem.push('Website and community links are curated entry points. Registry observations',
    'below record publication metadata; they do not establish runtime compatibility.', '',
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
  if (sources.extensions?.length) {
    ecosystem.push('', '| Editor store | Published / updated (UTC) | Last successful observation (UTC) |', '|---|---|---|');
    for (const spec of sources.extensions) {
      const row = snapshot.extensions?.[extensionKey(spec)];
      ecosystem.push(`| ${cell(spec.registry)}: ${spec.name} | ${cell(row?.publishedAt)} | ${cell(observed(row))} |`);
    }
  }
  ecosystem.push('', 'Only repositories reported public at the selected address are accepted',
    'as successful observations. Linked projects retain their own licences and notices.', '',
    '</details>', '',
    '- [Choose an npm package or MCP slice](packages.md).',
    '- [Visit Arxo](https://www.arxo.io/).', '');
  return { featured: packageTable(sources.packages.filter(row => row.featured), snapshot, { featured: true }),
    packages: packages.join('\n'), ecosystem: ecosystem.join('\n'),
    community: (sources.community ?? []).map(row => `[${row.title}](${row.url})`).join(' · ') };
}

export async function renderedFiles(sources, snapshot) {
  const pkg = await readJson('package.json');
  const pages = render(sources, snapshot, pkg.dependencies);
  const readme = await readFile(path.join(root, 'README.md'), 'utf8');
  function block(content, name, body) {
    const start = `<!-- catalog:${name}:start -->`, end = `<!-- catalog:${name}:end -->`;
    if (content.split(start).length !== 2 || content.split(end).length !== 2 || content.indexOf(start) > content.indexOf(end)) {
      throw Error(`README ${name} markers missing or ambiguous`);
    }
    return content.slice(0, content.indexOf(start) + start.length) + '\n\n' + body + '\n\n' + content.slice(content.indexOf(end));
  }
  let updated = block(readme, 'featured', pages.featured);
  if (sources.community !== undefined) updated = block(updated, 'community', pages.community);
  return { 'README.md': updated, 'docs/packages.md': pages.packages, 'docs/ecosystem.md': pages.ecosystem };
}

export async function checkCatalogue() {
  const sources = await readJson('catalog/sources.json');
  const snapshot = await readJson('catalog/snapshot.json');
  for (const key of ['packages', 'repositories', 'pythonPackages', 'extensions']) {
    const expected = (sources[key] ?? []).map(row => key === 'extensions' ? extensionKey(row) : row.name).sort();
    const actual = Object.keys(snapshot[key] ?? {}).sort();
    if (stable(expected) !== stable(actual)) throw Error(`Snapshot ${key} differs from selected sources`);
    for (const [name, row] of Object.entries(snapshot[key])) {
      if (!['available', 'unavailable'].includes(row.availability)) throw Error(`Invalid observation: ${name}`);
      if (row.observedAt && !Number.isFinite(Date.parse(row.observedAt))) throw Error(`Invalid observation date: ${name}`);
      if (row.availability === 'available' && !row.observedAt) throw Error(`Undated observation: ${name}`);
      if (key === 'packages' && row.observedAt && (!versionPattern.test(row.version ?? '') || !row.integrity)) {
        throw Error(`Invalid published package: ${name}`);
      }
      if (key === 'pythonPackages' && row.observedAt && (!pythonVersionPattern.test(row.version ?? '') ||
          !row.artifacts?.length || row.artifacts.some(file => !/^[a-f0-9]{64}$/.test(file.sha256 ?? '')))) {
        throw Error(`Invalid published Python package: ${name}`);
      }
      if (key === 'extensions' && row.observedAt && !versionPattern.test(row.version ?? '')) {
        throw Error(`Invalid published extension: ${name}`);
      }
      if (['pythonPackages', 'extensions'].includes(key) && row.observedAt && !validDate(row.publishedAt)) {
        throw Error(`Invalid publication date: ${name}`);
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
  const failed = ['packages', 'repositories', 'pythonPackages', 'extensions']
    .flatMap(key => Object.values(snapshot[key] ?? {})).concat(snapshot.binaryRelease)
    .filter(row => row?.availability === 'unavailable');
  console.log(`Catalogue: ${sources.packages.length} npm packages, ${sources.pythonPackages?.length ?? 0} PyPI packages, ${sources.extensions?.length ?? 0} editor listings, ${sources.repositories.length} repositories; ${failed.length} unavailable observations.`);
  if (mode[0] === '--refresh' && failed.length) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(`Catalogue: ${error.message}`); process.exitCode = 1; });
}
