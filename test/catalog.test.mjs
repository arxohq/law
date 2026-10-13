import test from 'node:test';
import assert from 'node:assert/strict';
import { attemptObservation, packageObservation, repositoryObservation, validateSources, refresh, render } from '../tools/catalog.mjs';
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
    if (url.endsWith('/releases/latest')) throw Error('Private release must not be requested');
    return { full_name: 'arxohq/law-releases', private: true, visibility: 'private' };
  };
  const snapshot = await refresh({ format: 'arxo.public-delivery-sources/1',
    packages: [{ name: '@arxo/law', group: 'SDK', purpose: 'Ask a question' }],
    repositories: [{ name: 'arxohq/law-releases', purpose: 'Binaries' }],
  }, {}, get, now);
  assert.equal(snapshot.repositories['arxohq/law-releases'].availability, 'unavailable');
  assert.equal(snapshot.binaryRelease.availability, 'unavailable');
  assert.equal(requested.some(url => url.endsWith('/releases/latest')), false);
});
test('catalogue distinguishes a tested pin from a newer untested latest and exact known issues', async () => {
  const sources = JSON.parse(await readFile(new URL('../catalog/sources.json', import.meta.url)));
  const snapshot = JSON.parse(await readFile(new URL('../catalog/snapshot.json', import.meta.url)));
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
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
