/** Real pdfTeX WebAssembly compilation. Only public engine assets are fetched;
 * the résumé source stays in the browser. */
import type { SiglumCompiler } from '@siglum/engine';
let compilerPromise: Promise<SiglumCompiler> | null = null;
let instance: SiglumCompiler | null = null;
let busy = false;
let reportProgress: (message: string) => void = () => {};

async function getCompiler(): Promise<SiglumCompiler> {
  if (!compilerPromise) {
    compilerPromise = (async () => {
      const { SiglumCompiler } = await import('@siglum/engine');
      instance = new SiglumCompiler({
        bundlesUrl: 'https://cdn.siglum.org/tl2025/bundles',
        wasmUrl: 'https://cdn.siglum.org/tl2025/busytex.wasm',
        jsUrl: 'https://cdn.siglum.org/tl2025/busytex.js',
        workerUrl: '/latex-worker.js',
        maxRetries: 20,
        enableCtan: false,
        verbose: false,
        onProgress: (stage, detail) => reportProgress(detail ? `${stage}: ${detail}` : stage),
      });
      await instance.init();
      return instance;
    })().catch(error => { compilerPromise = null; instance?.terminate(); instance = null; throw error; });
  }
  return compilerPromise;
}

export async function compileLatexPdf(source: string, progress: (message: string) => void): Promise<Blob> {
  if (typeof window === 'undefined' || !window.crossOriginIsolated || typeof SharedArrayBuffer === 'undefined') {
    throw new Error('LaTeX requires an isolated browser tab. Open Syntaxis directly, not in an embedded preview. You can still download the .tex source.');
  }
  if (busy) throw new Error('A PDF is already being compiled.');
  busy = true;
  reportProgress = progress;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      (async () => {
        progress('Loading TeX engine…');
        const compiler = await getCompiler();
        progress('Typesetting the original template…');
        return compiler.compile(source, { engine: 'pdflatex' });
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          instance?.terminate(); instance = null; compilerPromise = null;
          reject(new Error('LaTeX compilation timed out. Your draft is safe; retry or download the .tex source.'));
        }, 180000);
      }),
    ]);
    if (!result.success || !result.pdf?.byteLength) {
      const hint = (result.error || result.log || '').split('\n').filter(line => /! |error|not found/i.test(line)).slice(0, 3).join(' ');
      throw new Error('LaTeX could not compile the document.' + (hint ? ' ' + hint.slice(0, 240) : ' Download the .tex source to inspect it.'));
    }
    const bytes = new Uint8Array(result.pdf);
    if (new TextDecoder().decode(bytes.subarray(0, 5)) !== '%PDF-') throw new Error('The TeX engine did not return a valid PDF.');
    return new Blob([bytes], { type: 'application/pdf' });
  } finally {
    clearTimeout(timer);
    busy = false;
    reportProgress = () => {};
  }
}
