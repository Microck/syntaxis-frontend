import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { sampleResume, templates, toLatex } from '../lib/resume.ts';
const root = process.cwd();
const deps = process.env.COMPILER_TEST_DEPS || root;
const requireTest = createRequire(path.join(deps, 'package.json'));
const { chromium } = requireTest('playwright');
const { build } = requireTest('esbuild');
mkdirSync('compiler-evidence', { recursive: true });
const bundle = await build({
  stdin: { contents: "import { compileLatexPdf } from './lib/latex-pdf.ts'; window.compileResume = compileLatexPdf;", resolveDir: root },
  bundle: true, write: false, format: 'esm', platform: 'browser', target: 'es2022',
  alias: { '@siglum/engine': requireTest.resolve('@siglum/engine'), 'blake3-wasm/browser.js': path.join(root, 'vendor/siglum-optional-hash.js') },
});
const worker = readFileSync(path.join(path.dirname(requireTest.resolve('@siglum/engine')), 'worker.js'));
const headers = { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp', 'Cache-Control': 'no-store' };
const server = createServer((req, res) => {
  if (req.url === '/compiler.js') { res.writeHead(200, { ...headers, 'Content-Type': 'text/javascript' }); res.end(bundle.outputFiles[0].contents); }
  else if (req.url === '/latex-worker.js') { res.writeHead(200, { ...headers, 'Content-Type': 'text/javascript' }); res.end(worker); }
  else { res.writeHead(200, { ...headers, 'Content-Type': 'text/html' }); res.end('<!doctype html><html><head><title>Syntaxis compiler verification</title></head><body><h1>Original-template browser compilation</h1><pre id="status"></pre><script type="module" src="/compiler.js"></script></body></html>'); }
});
await new Promise(resolve => server.listen(5181, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const report = { compiled: [], errors: [], requests: [] };
page.on('pageerror', error => report.errors.push(error.message));
page.on('console', message => console.log('BROWSER', message.type(), message.text().slice(0, 500)));
page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1')) report.requests.push({ method: request.method(), url: request.url(), hasBody: Boolean(request.postData()) }); });
try {
  await page.goto('http://127.0.0.1:5181');
  await page.waitForFunction(() => typeof window.compileResume === 'function');
  assert.equal(await page.evaluate(() => crossOriginIsolated), true);
  for (const template of templates) {
    const source = toLatex({ title: 'Example résumé', template: template.id, language: 'en', resume: sampleResume });
    console.log('COMPILING', template.id);
    const bytes = await page.evaluate(async source => {
      const blob = await window.compileResume(source, text => { document.querySelector('#status').textContent = text; console.log(text); });
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    }, source);
    const pdf = Buffer.from(bytes);
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
    assert(pdf.length > 1000);
    writeFileSync(`compiler-evidence/${template.id}.pdf`, pdf);
    writeFileSync(`compiler-evidence/${template.id}.tex`, source);
    report.compiled.push({ template: template.id, size: pdf.length });
    console.log('PASS', template.id, pdf.length, 'bytes');
  }
  assert(report.requests.every(request => !request.hasBody && request.method === 'GET'), 'Résumé data must never be uploaded during compilation');
  assert.deepEqual(report.errors, []);
} catch (error) {
  report.failure = String(error.stack || error);
  console.error(report.failure);
  await page.screenshot({ path: 'compiler-evidence/failure.png', fullPage: true });
  process.exitCode = 1;
} finally {
  writeFileSync('compiler-evidence/report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
  server.close();
}
