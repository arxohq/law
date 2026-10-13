import { readdir, readFile, lstat } from 'node:fs/promises';
import path from 'node:path';
import { checkCatalogue, root } from './catalog.mjs';

const ignored = new Set(['.git', 'node_modules', 'output']);
const allowedTop = new Set(['.github', '.gitignore', 'AGENTS.md', 'README.md', 'CONTRIBUTING.md',
  'LICENSE', 'NOTICE', 'package.json', 'package-lock.json', 'catalog', 'docs', 'examples', 'tools', 'test']);
async function files(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name) || entry.name === '.DS_Store') continue;
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) throw Error(`Symlink outside publication contract: ${path.relative(root, full)}`);
    if (entry.isDirectory()) found.push(...await files(full));
    else found.push(full);
  }
  return found;
}

await checkCatalogue();
for (const name of await readdir(root)) {
  if (!ignored.has(name) && name !== '.DS_Store' && !allowedTop.has(name)) {
    throw Error(`Unexpected publication path: ${name}`);
  }
}
const privateReference = /\/Users\/|github\.com\/arxo-io\/|github\.com\/arxohq\/(?:arxo-corpus|arxo-marketing|arxo-ops)|\.\.\/engines\/|\.\.\/corpus\//;
let links = 0;
for (const full of await files(root)) {
  const relative = path.relative(root, full);
  if ((await lstat(full)).size > 1024 * 1024) throw Error(`Unexpected large file: ${relative}`);
  if (!['.md', '.json', '.yml'].includes(path.extname(full))) continue;
  const content = await readFile(full, 'utf8');
  if (privateReference.test(content)) throw Error(`Private workspace reference: ${relative}`);
  if (full.endsWith('.json')) JSON.parse(content);
  if (!full.endsWith('.md')) continue;
  for (const match of content.matchAll(/\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1];
    if (/^(?:https?:|mailto:|#)/.test(target)) continue;
    const local = path.resolve(path.dirname(full), decodeURIComponent(target.split('#')[0]));
    if (!(local === root || local.startsWith(root + path.sep))) throw Error(`Link escapes checkout: ${relative}: ${target}`);
    await lstat(local).catch(() => { throw Error(`Broken local link: ${relative}: ${target}`); });
    links++;
  }
}
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
if (pkg.private !== true) throw Error('The documentation/examples package must remain private');
for (const [name, version] of Object.entries(pkg.dependencies)) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw Error(`Example dependency is not exact: ${name}`);
}
const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8'));
const sortedDependencies = deps => JSON.stringify(Object.entries(deps ?? {}).sort(([a], [b]) => a.localeCompare(b)));
if (sortedDependencies(lock.packages[''].dependencies) !== sortedDependencies(pkg.dependencies)) {
  throw Error('Example lockfile does not match direct dependencies');
}
console.log(`Public files, ${links} local links, pinned dependencies and generated catalogue: PASS.`);
