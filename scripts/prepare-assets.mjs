import { copyFile, mkdir, access, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

await mkdir('public/fonts', { recursive: true });
await copyFile(resolve('node_modules/@siglum/engine/src/worker.js'), resolve('public/latex-worker.js'));
// Fetch the typeface from its publisher at build time; binaries are not in Git.
const fontPath = resolve('public/fonts/AspektaVF.woff2');
try {
  await access(fontPath);
} catch {
  const response = await fetch('https://raw.githubusercontent.com/ivodolenc/aspekta/main/packages/fonts/variable/AspektaVF.woff2', { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Could not obtain Aspekta from its publisher (${response.status}).`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (new TextDecoder().decode(bytes.slice(0, 4)) !== 'wOF2') throw new Error('Aspekta download is not WOFF2.');
  await writeFile(fontPath, bytes);
}
console.log('Prepared the local TeX worker and font assets.');
