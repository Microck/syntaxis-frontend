/** Real pdfTeX WebAssembly compilation. Only public engine/package assets are
 * fetched; résumé source and bounded diagnostics remain in this browser. */
import type { SiglumCompiler } from '@siglum/engine';
let compilerPromise: Promise<SiglumCompiler> | null = null;
let instance: SiglumCompiler | null = null;
let packagePromise: Promise<Record<string, string>> | null = null;
let busy = false;
let diagnostics: string[] = [];
let reportProgress: (message: string) => void = () => {};
async function supportFiles(): Promise<Record<string, string>> {
  if (!packagePromise) packagePromise = fetch('/latex-packages.json', { signal: AbortSignal.timeout(30000) }).then(async response => {
    if (!response.ok) throw new Error('Template dependencies are unavailable. Rebuild the deployment assets.');
    const data = await response.json();
    if (data.version !== 1 || typeof data.files?.['titlesec.sty'] !== 'string') throw new Error('Invalid template dependency bundle.');
    return data.files;
  }).catch(error => { packagePromise = null; throw error; });
  return packagePromise;
}
async function getCompiler(): Promise<SiglumCompiler> {
  if (!compilerPromise) compilerPromise = (async () => {
    const { SiglumCompiler } = await import('@siglum/engine');
    instance = new SiglumCompiler({
      bundlesUrl: 'https://cdn.siglum.org/tl2025/bundles', wasmUrl: 'https://cdn.siglum.org/tl2025/busytex.wasm', jsUrl: 'https://cdn.siglum.org/tl2025/busytex.js',
      workerUrl: '/latex-worker.js', maxRetries: 20, enableCtan: false, verbose: true,
      onLog: message => { diagnostics.push(message); if (diagnostics.length > 1200) diagnostics.shift(); },
      onProgress: (stage, detail) => reportProgress(detail ? `${stage}: ${detail}` : stage),
    });
    await instance.init(); return instance;
  })().catch(error => { compilerPromise = null; instance?.terminate(); instance = null; throw error; });
  return compilerPromise;
}
export async function compileLatexPdf(source: string, progress: (message: string) => void): Promise<Blob> {
  if (typeof window === 'undefined' || !window.crossOriginIsolated || typeof SharedArrayBuffer === 'undefined') throw new Error('LaTeX requires an isolated browser tab. Open Syntaxis directly, not in an embedded preview. You can still download the .tex source.');
  if (busy) throw new Error('A PDF is already being compiled.');
  busy = true; diagnostics = []; reportProgress = progress;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      (async () => { progress('Loading TeX engine…'); const [compiler, additionalFiles] = await Promise.all([getCompiler(), supportFiles()]); progress('Typesetting the original template…'); return compiler.compile(source, { engine: 'pdflatex', additionalFiles }); })(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => { instance?.terminate(); instance = null; compilerPromise = null; reject(new Error('LaTeX compilation timed out. Your draft is safe; retry or download the .tex source.')); }, 180000); }),
    ]);
    if (!result.success || !result.pdf?.byteLength) {
      const log = [result.error || '', result.log || '', ...diagnostics].join('\n');
      const hint = log.split('\n').filter(line => /! |error|not found|fatal|cannot|could not|Emergency stop/i.test(line)).slice(-5).join(' ');
      throw new Error('LaTeX could not compile the document.' + (hint ? ' ' + hint.slice(0, 700) : ' Download the .tex source to inspect it.'));
    }
    const bytes = new Uint8Array(result.pdf);
    if (new TextDecoder().decode(bytes.subarray(0, 5)) !== '%PDF-') throw new Error('The TeX engine did not return a valid PDF.');
    return new Blob([bytes], { type: 'application/pdf' });
  } finally { clearTimeout(timer); busy = false; diagnostics = []; reportProgress = () => {}; }
}
