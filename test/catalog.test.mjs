import test from 'node:test';
import assert from 'node:assert/strict';
import { attemptObservation, packageObservation, pythonPackageObservation, extensionObservation,
  repositoryObservation, validateSources, refresh, render, renderedFiles } from '../tools/catalog.mjs';
import { readFile } from 'node:fs/promises';

const now = '2026-10-13T12:00:00.000Z';
test('latest distribution tag wins over newer prereleases and stale next tags', () => {
  const data = { name: '@arxo/law', 'dist-tags': { latest: '0.4.2', next: '0.2.0', beta: '9.0.0-beta.1' },
    time: { '0.4.2': now }, versions: { '0.4.2': { dist: { integrity: 'sha512-test' } },
      '9.0.0-beta.1': { dist: { integrity: 'sha512-beta' } } } };
  assert.equal(packageObservation('@arxo/law', data, now).version, '0.4.2');
});
test('failed fetch retains the previous version and successful observation date', async () => {
  const previous = { availability: 'available', version: '0.4.2', observedAt: '2026-10-12T12:00:00.000Z' };
  const row = await attemptObservation(previous, async () => { throw Error('HTTP 503'); }, now);
  assert.equal(row.version, '0.4.2');
  assert.equal(row.observedAt, previous.observedAt);
  assert.equal(row.availability, 'unavailable');
  assert.equal(row.attemptedAt, now);
  assert.equal(previous.availability, 'available');
});
test('first failed observation supplies no invented version or successful timestamp', async () => {
  const row = await attemptObservation(undefined, async () => { throw Error('HTTP 404'); }, now);
  assert.equal(row.version, undefined);
  assert.equal(row.observedAt, undefined);
  assert.equal(row.availability, 'unavailable');
});
test('authenticated private results and repository redirects cannot count as public', () => {
  assert.throws(() => repositoryObservation('arxohq/example', {
    full_name: 'arxohq/example', private: true, visibility: 'private',
  }, now), /not public/);
  assert.throws(() => repositoryObservation('arxohq/example', {
    full_name: 'another-owner/example', private: false, visibility: 'public',
  }, now), /not public/);
});
test('unpublished packages and the excluded docs MCP cannot enter the catalogue', () => {
  assert.throws(() => packageObservation('@arxo/law', {
    name: '@arxo/law', 'dist-tags': { next: '0.1.0' }, versions: {}, time: {},
  }, now), /latest/);
  assert.throws(() => validateSources({ format: 'arxo.public-delivery-sources/1',
    packages: [{ name: '@arxo/docs-mcp', group: 'MCP', purpose: 'Excluded' }],
    repositories: [{ name: 'arxohq/example', purpose: 'Example' }],
  }), /Excluded package/);
});
test('a private binary repository cannot leak authenticated release metadata', async () => {
  const requested = [];
  const get = async url => {
    requested.push(url);
    if (url.startsWith('https://registry.npmjs.org/')) return {
      name: '@arxo/law', 'dist-tags': { latest: '0.4.2' }, time: { '0.4.2': now },
      versions: { '0.4.2': { dist: { integrity: 'sha512-test' } } },
    };
    if (url.includes('/releases?')) throw Error('Private release must not be requested');
    return { full_name: 'arxohq/law-releases', private: true, visibility: 'private' };
  };
  const snapshot = await refresh({ format: 'arxo.public-delivery-sources/1',
    packages: [{ name: '@arxo/law', group: 'SDK', purpose: 'Ask a question' }],
    repositories: [{ name: 'arxohq/law-releases', purpose: 'Binaries' }],
  }, {}, get, now);
  assert.equal(snapshot.repositories['arxohq/law-releases'].availability, 'unavailable');
  assert.equal(snapshot.binaryRelease.availability, 'unavailable');
  assert.equal(requested.some(url => url.includes('/releases?')), false);
});
test('binary catalogue skips newer canon images, draft and prerelease distributions', async () => {
  const sources = { format: 'arxo.public-delivery-sources/1',
    packages: [{ name: '@arxo/law', group: 'SDK', purpose: 'SDK' }],
    repositories: [{ name: 'arxohq/law-releases', purpose: 'Binaries' }] };
  const release = (tag, publishedAt, extra = {}) => ({ tag_name: tag, published_at: publishedAt,
    html_url: `https://github.com/arxohq/law-releases/releases/tag/${tag}`,
    assets: [{ name: 'install.sh', size: 100,
      browser_download_url: `https://github.com/arxohq/law-releases/releases/download/${tag}/install.sh` }],
    ...extra });
  let releases = [release('canon-de-wohngeld-assets-v0.1.0', now),
    release('law-v0.2.3', now, { draft: true }),
    release('law-v0.2.4', now, { prerelease: true }),
    release('law-v0.2.1', '2026-10-11T12:00:00.000Z'),
    release('law-v0.2.2', '2026-10-12T12:00:00.000Z')];
  const get = async url => {
    if (url.includes('registry.npmjs.org')) return { name: '@arxo/law', 'dist-tags': { latest: '0.4.2' },
      time: { '0.4.2': now }, versions: { '0.4.2': { dist: { integrity: 'sha512-test' } } } };
    if (url.includes('/releases?')) return releases;
    return { full_name: 'arxohq/law-releases', private: false, visibility: 'public' };
  };
  const first = await refresh(sources, {}, get, now);
  assert.equal(first.binaryRelease.tag, 'law-v0.2.2');
  assert.equal(first.binaryRelease.assets[0].name, 'install.sh');
  releases = [releases[0]];
  const second = await refresh(sources, first, get, '2026-10-14T12:00:00.000Z');
  assert.equal(second.binaryRelease.availability, 'unavailable');
  assert.equal(second.binaryRelease.tag, 'law-v0.2.2');
  assert.equal(second.binaryRelease.observedAt, now);
});
test('catalogue distinguishes a tested pin from a newer untested latest and exact known issues', async () => {
  const sources = JSON.parse(await readFile(new URL('../catalog/sources.json', import.meta.url)));
  const snapshot = JSON.parse(await readFile(new URL('../catalog/snapshot.json', import.meta.url)));
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
  snapshot.packages['@arxo/law'].version = '0.4.2';
  snapshot.packages['@arxo/canon-bgb-fristen'].version = '0.1.13';
  const page = render(sources, snapshot, pkg.dependencies).packages;
  assert.match(page, /@arxo\/law\).*0\.4\.2.*Example set/);
  assert.match(page, /@arxo\/canon-bgb-fristen\).*0\.1\.13.*Model load issue/);
  const changed = structuredClone(snapshot);
  changed.packages['@arxo/law'].version = '0.4.99';
  changed.packages['@arxo/canon-bgb-fristen'].version = '0.1.99';
  const newer = render(sources, changed, pkg.dependencies).packages;
  assert.match(newer, /@arxo\/law\).*0\.4\.99.*Not checked here/);
  assert.doesNotMatch(newer, /@arxo\/canon-bgb-fristen\).*Model load issue/);
});

const pythonRelease = () => ({ info: { name: 'arxo', version: '0.2.0', requires_python: '>=3.12' },
  releases: { '0.2.0': [{ filename: 'arxo-0.2.0-py3-none-any.whl', size: 123,
    upload_time_iso_8601: now, digests: { sha256: 'a'.repeat(64) },
    url: 'https://files.pythonhosted.org/packages/arxo.whl', yanked: false }] } });
const marketplaceRelease = (version = '0.1.1') => ({ results: [{ extensions: [{
  publisher: { publisherName: 'arxo' }, extensionName: 'law',
  versions: [{ version, lastUpdated: now, properties: [{ key: 'Microsoft.VisualStudio.Code.Engine', value: '^1.75.0' }] }],
}] }] });
const openVsxRelease = (version = '0.1.2') => ({ namespace: 'arxo', name: 'law', version,
  timestamp: now, engines: { vscode: '^1.75.0' }, license: 'Apache-2.0', preRelease: false });

test('PyPI observations require the selected package and non-yanked artifacts with hashes', () => {
  const valid = pythonRelease();
  const row = pythonPackageObservation('arxo', valid, now);
  assert.equal(row.version, '0.2.0');
  assert.equal(row.python, '>=3.12');
  assert.equal(row.artifacts[0].sha256, 'a'.repeat(64));
  const yanked = pythonRelease();
  yanked.releases['0.2.0'][0].yanked = true;
  assert.throws(() => pythonPackageObservation('arxo', yanked, now), /non-yanked/);
  const missingHash = pythonRelease();
  delete missingHash.releases['0.2.0'][0].digests;
  assert.throws(() => pythonPackageObservation('arxo', missingHash, now), /Incomplete/);
  assert.throws(() => pythonPackageObservation('arxo-canon-other', valid, now), /valid PyPI release/);
});

test('editor observations check exact publisher and extension identity in each store', () => {
  const spec = { registry: 'marketplace', name: 'arxo.law' };
  assert.equal(extensionObservation(spec, marketplaceRelease(), now).version, '0.1.1');
  const wrongPublisher = marketplaceRelease();
  wrongPublisher.results[0].extensions[0].publisher.publisherName = 'another-publisher';
  assert.throws(() => extensionObservation(spec, wrongPublisher, now), /exact Marketplace/);
  assert.throws(() => extensionObservation({ registry: 'open-vsx', name: 'arxo.law' },
    { ...openVsxRelease(), name: 'other' }, now), /exact Open VSX/);
});

test('store versions stay independent and an older editor fetch is never presented as fresh', async () => {
  const sources = { format: 'arxo.public-delivery-sources/1',
    packages: [{ name: '@arxo/law', group: 'SDK', purpose: 'Ask a question' }],
    repositories: [{ name: 'arxohq/law-releases', purpose: 'Binaries' }],
    pythonPackages: [{ name: 'arxo', purpose: 'Python SDK' }],
    extensions: [{ registry: 'marketplace', name: 'arxo.law', purpose: 'VS Code' },
      { registry: 'open-vsx', name: 'arxo.law', purpose: 'Open VSX' }] };
  const requests = [];
  let failStore = false;
  const get = async (url, options) => {
    requests.push({ url, options });
    if (url.includes('registry.npmjs.org')) return { name: '@arxo/law', 'dist-tags': { latest: '0.4.2' },
      time: { '0.4.2': now }, versions: { '0.4.2': { dist: { integrity: 'sha512-test' } } } };
    if (url.includes('pypi.org')) return pythonRelease();
    if (url.includes('marketplace.visualstudio.com')) {
      if (failStore) throw Error('HTTP 503');
      return marketplaceRelease();
    }
    if (url.includes('open-vsx.org')) return openVsxRelease();
    if (url.includes('/releases?')) return [{ tag_name: 'law-v0.2.2', published_at: now,
      html_url: 'https://github.com/arxohq/law-releases/releases/tag/law-v0.2.2', assets: [] }];
    return { full_name: 'arxohq/law-releases', private: false, visibility: 'public' };
  };
  const first = await refresh(sources, {}, get, now);
  assert.equal(first.extensions['marketplace:arxo.law'].version, '0.1.1');
  assert.equal(first.extensions['open-vsx:arxo.law'].version, '0.1.2');
  assert.equal(first.pythonPackages.arxo.version, '0.2.0');
  const post = requests.find(row => row.url.includes('marketplace.visualstudio.com')).options;
  assert.equal(post.method, 'POST');
  assert.equal(JSON.parse(post.body).filters[0].criteria[0].value, 'arxo.law');
  const storeUrl = requests.find(row => row.url.includes('marketplace.visualstudio.com')).url;
  assert.equal(new URL(storeUrl).searchParams.get('arxo_observed_at'), now);
  failStore = true;
  const nextDate = '2026-10-14T12:00:00.000Z';
  const second = await refresh(sources, first, get, nextDate);
  const stale = second.extensions['marketplace:arxo.law'];
  assert.equal(stale.availability, 'unavailable');
  assert.equal(stale.version, '0.1.1');
  assert.equal(stale.observedAt, now);
  assert.equal(stale.attemptedAt, nextDate);
  const page = render(sources, second);
  assert.match(page.ecosystem, /0\.1\.1 — unavailable; last seen/);
  assert.match(page.ecosystem, /0\.1\.2/);
  assert.match(page.packages, /Node\.js example set does not validate these Python packages/);
});

test('curated sources reject credential-bearing URLs and unselected editor publishers', () => {
  const base = { format: 'arxo.public-delivery-sources/1',
    packages: [{ name: '@arxo/law', group: 'SDK', purpose: 'SDK' }],
    repositories: [{ name: 'arxohq/law-releases', purpose: 'Binaries' }] };
  assert.throws(() => validateSources({ ...base, community: [{ title: 'Link', purpose: 'Link',
    url: 'https://user:secret@example.com/' }] }), /Public links/);
  assert.throws(() => validateSources({ ...base, extensions: [{ registry: 'marketplace',
    name: 'someone.law', purpose: 'Unselected' }] }), /Unapproved editor/);
});

test('removing every selected social channel clears the generated README links', async () => {
  const sources = JSON.parse(await readFile(new URL('../catalog/sources.json', import.meta.url)));
  const snapshot = JSON.parse(await readFile(new URL('../catalog/snapshot.json', import.meta.url)));
  const pages = await renderedFiles({ ...sources, community: [] }, snapshot);
  assert.doesNotMatch(pages['README.md'], /youtube\.com\/@arxohq|t\.me\/arxoio/);
  assert.match(pages['README.md'], /npm start/);
});
