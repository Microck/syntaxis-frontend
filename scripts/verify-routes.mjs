import assert from 'node:assert/strict';
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
for (const path of ['/', '/workspace']) {
  const response = await fetch(origin + path); assert.equal(response.status, 200, path);
  const html = await response.text(); assert(html.includes('syntaxis'), 'Missing application document');
  assert.equal(response.headers.get('cross-origin-opener-policy'), 'same-origin');
  assert.equal(response.headers.get('cross-origin-embedder-policy'), 'require-corp');
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match => match[1]); assert(scripts.length > 0, 'No client scripts');
  for (const src of new Set(scripts)) { const asset = await fetch(new URL(src, origin)); assert.equal(asset.status, 200, src); assert(/javascript/.test(asset.headers.get('content-type') || ''), src + ' wrong MIME'); }
  console.log('PASS', path, 'and', scripts.length, 'client scripts; isolation headers present');
}
const worker = await fetch(origin + '/latex-worker.js'); assert.equal(worker.status, 200); assert(/javascript/.test(worker.headers.get('content-type') || ''));
const response = await fetch(origin + '/latex-packages.json'); assert.equal(response.status, 200); const bundle = await response.json(); assert.equal(bundle.version, 1);
for (const name of ['titlesec.sty', 'enumitem.sty', 'parskip.sty', 'etoolbox.sty']) assert.equal(typeof bundle.files[name], 'string', 'Missing ' + name);
assert(bundle.provenance.length > 0); console.log('PASS same-origin TeX worker and original-template support files');
