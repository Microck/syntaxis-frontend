import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Explicit dependencies of the original templates, absent from the core bundle.
// Official TUG historic mirrors, fixed TeX Live release; TLS is always verified.
const packages = ['titlesec', 'enumitem', 'fancyhdr', 'preprint', 'parskip', 'geometry', 'marvosym'];
const archiveRoots = [
  'https://texlive.info/historic/systems/texlive/2025/tlnet-final/archive',
  'https://ftp.math.utah.edu/pub/tex/historic/systems/texlive/2025/tlnet-final/archive',
];
async function download(name) {
  const errors = [];
  for (const root of archiveRoots) {
    const url = `${root}/${name}.tar.xz`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return { url, bytes: Buffer.from(await response.arrayBuffer()) };
    } catch (error) { errors.push(`${url}: ${error.message}`); }
  }
  throw new Error(`Cannot obtain TeX Live package ${name}. ${errors.join('; ')}`);
}
export async function prepareLatexAssets() {
  const destination = resolve('public/latex-packages.json');
  try { const previous = JSON.parse(await readFile(destination, 'utf8')); if (previous.version === 1 && previous.files?.['titlesec.sty']) return; } catch { /* Generate on the first build. */ }
  const temporary = await mkdtemp(join(tmpdir(), 'syntaxis-tex-packages-'));
  const files = {}, provenance = [];
  try {
    for (const name of packages) {
      const { url, bytes } = await download(name);
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
