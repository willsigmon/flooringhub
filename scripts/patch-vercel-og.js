/*
 * @vercel/og@1.0.3 bundles CommonJS HarfBuzz into ESM without module-local require/__dirname.
 * Its Vercel Node artifact needs a traceable hb.wasm lookup; remove/review this patch once upstream fixes the bundle.
 */
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const projectRequire = createRequire(path.resolve(__dirname, '../package.json'));
const ogEntry = projectRequire.resolve('@vercel/og');
const ogPackagePath = path.resolve(path.dirname(ogEntry), '../package.json');
const ogPackage = JSON.parse(fs.readFileSync(ogPackagePath, 'utf8'));

if (ogPackage.version !== '1.0.3') {
  throw new Error(`Expected @vercel/og@1.0.3, found @vercel/og@${ogPackage.version}`);
}

if (path.basename(ogEntry) !== 'index.node.js' || path.basename(path.dirname(ogEntry)) !== 'dist') {
  throw new Error(`Expected the @vercel/og Node entry, found ${ogEntry}`);
}

const ogRequire = createRequire(ogEntry);
const harfbuzzWasm = ogRequire.resolve('harfbuzzjs/hb.wasm');
fs.accessSync(harfbuzzWasm, fs.constants.R_OK);

const nodeEntry = fs.readFileSync(ogEntry, 'utf8');
const originalModuleSetup = 'var __create = Object.create;';
const patchedModuleSetup = [
  'var require = createRequire(import.meta.url);',
  'var __dirname = fileURLToPath(new URL(".", import.meta.url));',
  originalModuleSetup,
].join('\n');
const originalWasmLookup = [
  '        function findWasmBinary() {',
  '          return locateFile("hb.wasm");',
  '        }',
].join('\n');
const patchedWasmLookup = [
  '        function findWasmBinary() {',
  '          return ENVIRONMENT_IS_NODE ? require.resolve("harfbuzzjs/hb.wasm") : locateFile("hb.wasm");',
  '        }',
].join('\n');

function count(source, snippet) {
  return source.split(snippet).length - 1;
}

const alreadyPatched = count(nodeEntry, patchedModuleSetup) === 1 && count(nodeEntry, patchedWasmLookup) === 1;
if (alreadyPatched) {
  if (
    count(nodeEntry, originalModuleSetup) !== 1 ||
    count(nodeEntry, originalWasmLookup) !== 0 ||
    count(nodeEntry, 'import { createRequire } from "module";') !== 1 ||
    count(nodeEntry, 'import { fileURLToPath } from "url";') !== 1
  ) {
    throw new Error('Inconsistent existing @vercel/og@1.0.3 Node entry patch');
  }
  console.log('Verified existing @vercel/og@1.0.3 Node entry patch');
  process.exit(0);
}

if (
  count(nodeEntry, originalModuleSetup) !== 1 ||
  count(nodeEntry, originalWasmLookup) !== 1 ||
  count(nodeEntry, 'import { createRequire } from "module";') !== 1 ||
  count(nodeEntry, 'import { fileURLToPath } from "url";') !== 1 ||
  count(nodeEntry, 'var __require = /* @__PURE__ */') !== 1 ||
  count(nodeEntry, 'scriptDirectory = __dirname + "/";') !== 1 ||
  nodeEntry.includes('var require = createRequire(import.meta.url);') ||
  nodeEntry.includes('require.resolve("harfbuzzjs/hb.wasm")')
) {
  throw new Error('Unexpected @vercel/og@1.0.3 Node entry; refusing to apply a stale or partial patch');
}

const patchedEntry = nodeEntry
  .replace(originalModuleSetup, patchedModuleSetup)
  .replace(originalWasmLookup, patchedWasmLookup);

fs.writeFileSync(ogEntry, patchedEntry);
console.log('Patched @vercel/og@1.0.3 Node entry for Node ESM and HarfBuzz WASM tracing');
