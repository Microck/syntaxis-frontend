import { mkdtemp, mkdir, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Explicit TeX Live 2025 dependencies missing from Siglum's core bundles.
// Build-time downloads contain only public package code, never résumé data.
const packages = ['titlesec', 'enumitem', 'fancyhdr', 'preprint', 'parskip', 'geometry', 'marvosym'];
const archiveRoot = 'https://ftp.tug.org/historic/systems/texlive/2025/tlnet-final/archive';
export async function prepareLatexAssets() {
  const destination = resolve('public/latex-packages.json');
  try { const previous = JSON.parse(await readFile(destination, 'utf8')); if (previous.version === 1 && previous.files?.['titlesec.sty']) return; } catch { /* Generate on the first build. */ }
  const temporary = await mkdtemp(join(tmpdir(), 'syntaxis-tex-packages-'));
  const files = {}, provenance = [];
  try {
    for (const name of packages) {
      const url = `${archiveRoot}/${name}.tar.xz`;
      const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error(`Cannot download TeX Live package ${name}: HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      const archive = join(temporary, name + '.tar.xz');
      await writeFile(archive, bytes);
      const entries = execFileSync('tar', ['-tJf', archive], { encoding: 'utf8' }).split('\n').filter(entry => entry.startsWith('tex/') && /\.(?:sty|def|fd|cfg|tex|clo|cls)$/.test(entry));
      if (entries.some(entry => entry.split('/').includes('..') || entry.includes('\\'))) throw new Error('Unsafe TeX package path.');
      const extracted = join(temporary, name);
      await mkdir(extracted);
      if (entries.length) execFileSync('tar', ['-xJf', archive, '-C', extracted, '--', ...entries]);
      for (const entry of entries) {
        const content = await readFile(join(extracted, entry), 'utf8');
        const key = basename(entry);
        if (content.length > 2000000) throw new Error('Unexpectedly large TeX support file.');
        if (files[key] && files[key] !== content) throw new Error('Conflicting TeX package file: ' + key);
        files[key] = content;
      }
      provenance.push({ package: name, url, sha256: createHash('sha256').update(bytes).digest('hex') });
    }
    if (!files['titlesec.sty'] || !files['enumitem.sty']) throw new Error('Required TeX support files are missing.');
    await mkdir('public', { recursive: true });
    await writeFile(destination, JSON.stringify({ version: 1, provenance, files }));
    console.log(`Prepared ${Object.keys(files).length} TeX support files from fixed TeX Live 2025 archives.`);
  } finally { await rm(temporary, { recursive: true, force: true }); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await prepareLatexAssets();
