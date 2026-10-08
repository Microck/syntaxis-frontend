# Syntaxis

A monochrome résumé studio with an animated landing page, editable workspace, original LaTeX templates, local versions, and real browser PDF compilation.

## Run

Use Node.js 22.13+, npm, and a build-time TeX Live installation. On Ubuntu/Debian:

```sh
sudo apt-get install texlive-latex-extra texlive-fonts-recommended lmodern
npm ci
npm run dev
```

Open `http://localhost:5173`. Production Worker preview:

```sh
npm run build
npm start
```

No API keys are required. Keep `.env.example` unchanged for the standalone editor and explicitly simulated AI flow. Never put secrets in `NEXT_PUBLIC_*` variables.

The build obtains Aspekta from its publisher, copies the installed Siglum worker, and prepares unmodified TeX support files from the build machine's TeX distribution. Font binaries and generated support bundles are not committed to Git. TeX is needed at build/test time, not on the deployed server or a visitor's computer.

## Features

- GSAP headline, paper-stack, pointer and scroll animations with reduced-motion handling.
- Contact details, summary, experience, education, projects, and skills editing.
- Local autosave, undo/redo, saved versions, and JSON backup import/export.
- Original Vanguard, Silicon, and Genesis LaTeX designs with malformed placeholders/macros repaired.
- Actual pdfLaTeX WebAssembly compilation, exact PDF preview, and PDF download.
- Ten section-heading languages; user-authored writing is not translated automatically.

The instant HTML preview is approximate. **Compile PDF** typesets the original `.tex` and shows the exact result. Edits invalidate stale compiled PDFs. The separately labeled HTML print option is not LaTeX compilation.

## Mock AI and disconnected services

**Try AI edit — Demo** simulates a connection and tidies existing summary text deterministically. It does not sign in to ChatGPT, invoke an AI model, or consume credits. The user reviews, applies, discards, or undoes the result.

An optional backend adapter remains in `lib/api.ts`. Accounts, profile imports, and real AI generation are disabled unless a separate service is explicitly configured. No approved subscription-backed ChatGPT integration, API keys, or deployment credentials are included.

## Browser compilation

Open the website in its own secure tab. The compiler needs `SharedArrayBuffer` and cross-origin isolation. Both development and the production Worker emit:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

The first compilation downloads public WebAssembly engine/package assets from `cdn.siglum.org`. The résumé source remains in the browser worker; no PDF service or AI provider receives it. Cached public assets may persist locally. Unsupported browsers or a three-minute timeout produce an explicit error without losing the draft or substituting a fake PDF. `.tex` export does not need WebAssembly.

See `LATEX_PIPELINE.md` for architecture and limitations.

## Tests

```sh
npm run typecheck
npm run test:core
npm run build
# Start npm start in another terminal, then:
npm run test:routes
npx playwright install --with-deps chromium
npm run test:browser
# Requires pdfinfo/pdftotext from poppler-utils:
npm run test:latex
```

GitHub Actions runs the production Worker, desktop/mobile Chromium, three real browser PDF compilations, and 39 native LaTeX fixtures. Screenshots, PDFs, and reports are retained as artifacts. The independent **Live site audit** workflow reports what is currently deployed at `https://syntaxis.cv`, not merely what is in Git.

## Deploy

The production build target is Vinext + Cloudflare Workers. Deploy the generated `dist/server/wrangler.json` and associated assets through the authorized hosting pipeline. Preserve isolation headers and include `latex-worker.js` and `latex-packages.json`.

This repository intentionally has no production deployment token or automatic deployment workflow. Merging a PR does not, by itself, update the separately hosted `syntaxis.cv` site.

## Source and licenses

`app/` contains routes/styles; `components/syntaxis/` contains the landing/editor; `lib/latex*` contains the original-template renderer/compiler; `scripts/` contains asset preparation and checks.

See `COMPONENT_SOURCES.md` and `licenses/`. Third-party components retain their own licenses, including Animate UI's Commons Clause condition. Silicon retains Trey Hunner's original class notice. TeX package notices remain in the unmodified support files; downstream distribution must preserve their applicable source and license requirements. Font binaries are fetched during preparation, not distributed in this repository; retain `public/fonts/OFL.txt` with deployed font assets.
