const { createRequire } = require('node:module');
const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const requireAudit = createRequire(path.join(process.env.RUNNER_TEMP || '/tmp', 'syntaxis-audit/package.json'));
const { chromium } = requireAudit('playwright');

(async () => {
  mkdirSync('live-audit', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const report = { origin: 'https://syntaxis.cv', pages: [], errors: [], failedRequests: [] };
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), failure: request.failure()?.errorText }));
  try {
    for (const pathname of ['/', '/workspace']) {
      const response = await page.goto(report.origin + pathname, { waitUntil: 'networkidle', timeout: 60000 });
      const state = await page.evaluate(() => ({
        title: document.title,
        text: document.body.innerText.slice(0, 18000),
        isolated: crossOriginIsolated,
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        links: [...document.querySelectorAll('a')].map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') })),
      }));
      const name = pathname === '/' ? 'landing' : 'workspace';
      report.pages.push({ path: pathname, status: response.status(), headers: response.headers(), ...state });
      await page.screenshot({ path: `live-audit/${name}.png`, fullPage: true });
      assert.equal(response.status(), 200, `${pathname} did not return HTTP 200`);
    }
    const compile = page.getByRole('button', { name: 'Compile PDF', exact: true });
    report.latexCompilerAvailable = await compile.count() > 0;
    if (report.latexCompilerAvailable) {
      await compile.click();
      await page.locator('iframe[title="Compiled LaTeX résumé"]').waitFor({ timeout: 180000 });
      report.latexPdfRendered = true;
      await page.screenshot({ path: 'live-audit/compiled-pdf.png', fullPage: true });
    }
    report.result = report.latexCompilerAvailable ? 'Live LaTeX compilation passed' : 'Live site is reachable but the LaTeX compiler is not deployed';
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    report.result = 'Live verification failed';
    report.failure = error.stack;
    console.log(JSON.stringify(report, null, 2));
    await page.screenshot({ path: 'live-audit/failure.png', fullPage: true }).catch(() => {});
    process.exitCode = 1;
  } finally {
    writeFileSync('live-audit/report.json', JSON.stringify(report, null, 2));
    await browser.close();
  }
})();
