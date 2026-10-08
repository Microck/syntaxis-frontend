import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join, dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Copy public, unmodified TeX package support files from the build machine's
// installed TeX distribution. Compilation itself still runs in the browser.
// No font binaries or user résumé data enter this support bundle.
const required = ['titlesec.sty', 'enumitem.sty', 'fancyhdr.sty', 'fullpage.sty', 'parskip.sty', 'geometry.sty', 'marvosym.sty'];
export async function prepareLatexAssets() {
  const files = {}, provenance = [];
  let distribution;
  try { distribution = execFileSync('pdflatex', ['--version'], { encoding: 'utf8' }).split('\n')[0]; }
  catch { throw new Error('Build-time TeX support is missing. Install texlive-latex-extra and texlive-fonts-recommended (or a TeX Live distribution providing kpsewhich). PDF compilation runs in the browser after deployment.'); }
  const directories = new Set();
  for (const name of required) {
    let located;
    try { located = execFileSync('kpsewhich', [name], { encoding: 'utf8' }).trim(); }
    catch { throw new Error(`Required template dependency ${name} is not installed. Install texlive-latex-extra and texlive-fonts-recommended.`); }
    if (!located) throw new Error('Missing TeX dependency: ' + name);
    directories.add(dirname(located));
  }
  for (const directory of directories) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (!entry.isFile() || !/\.(?:sty|def|fd|cfg|tex|clo|cls)$/.test(entry.name)) continue;
      const bytes = await readFile(join(directory, entry.name));
      if (bytes.length > 2000000) throw new Error('Unexpectedly large TeX support file.');
      const content = bytes.toString('utf8');
      if (files[entry.name] && files[entry.name] !== content) throw new Error('Conflicting TeX support file: ' + entry.name);
      files[entry.name] = content;
      provenance.push({ file: entry.name, package: directory.split('/').at(-1), sha256: createHash('sha256').update(bytes).digest('hex') });
    }
  }
  for (const name of required) if (!files[name]) throw new Error('Missing prepared dependency: ' + name);
  await mkdir('public', { recursive: true });
  await writeFile(resolve('public/latex-packages.json'), JSON.stringify({ version: 1, distribution, provenance, files }));
  console.log(`Prepared ${Object.keys(files).length} unmodified TeX support files from ${distribution}.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await prepareLatexAssets();
