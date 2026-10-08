# Syntaxis

A monochrome résumé studio: an animated landing page, editable résumé workspace, three original LaTeX templates, local version history, and real browser PDF compilation.

## Run locally

Use Node.js 22.13 or newer, npm, and `tar` with XZ support (Linux, macOS, or WSL).

```sh
npm ci
npm run dev
```

Open `http://localhost:5173`. For a production build and local Cloudflare Worker preview:

```sh
npm run build
npm start
```

No API keys or account are required. Leave `.env.example` values unchanged for the standalone experience. The first build obtains the typeface from its publisher, the local Siglum worker from the installed package, and template support files from TeX Live's historic mirrors. Generated assets are not committed to Git.

## What works

- Landing page with GSAP headline, paper-stack, pointer, and scroll choreography; reduced-motion handling.
- Editable contact details, summary, experience, projects, education, and skills.
- Local autosave, undo/redo, named versions, and JSON backup import/export.
- Vanguard, Silicon, and Genesis LaTeX source generation using the original backend designs, with malformed template placeholders and macro calls repaired.
- Actual pdfLaTeX WebAssembly compilation, exact PDF preview, and PDF download.
- Ten section-heading languages. User-authored text is not automatically translated.

The immediate HTML résumé preview is approximate. **Compile PDF** typesets the original LaTeX source and shows the exact PDF. Changing a draft invalidates an older compiled PDF so it cannot be mistaken for the current document.

## Deliberately mocked or disconnected

The **Try AI edit — Demo** flow does not authenticate to ChatGPT, invoke a model, or consume credits. It simulates a connection and presents a deterministic edit of existing text for review. Account services, profile imports, and live AI generation remain disabled unless a separate backend is explicitly configured. This repository does not provide an approved subscription-backed ChatGPT integration.

An API adapter is retained in `lib/api.ts`, but no API keys or backend credentials are included. `NEXT_PUBLIC_*` values are public and must never contain secrets.

## Browser compiler requirements

Open the site in its own secure browser tab. The WebAssembly worker requires `SharedArrayBuffer` and cross-origin isolation. Development, the generated Worker, and static-asset headers supply:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

The first PDF compilation downloads public TeX runtime and bundle assets from `cdn.siglum.org`; résumé source is processed locally in a worker, not uploaded to a compilation service. Compilation therefore still needs network access for uncached assets. A timeout or unsupported browser produces an explicit error and leaves the draft and `.tex` export intact.

Template support files are prepared from fixed TeX Live 2025 archives, with provenance and SHA-256 hashes recorded in the generated `public/latex-packages.json`. TLS verification is not disabled. Read `LATEX_PIPELINE.md` for details and limitations.

## Verify

```sh
npm run typecheck
npm run test:core
npm run build
# In another terminal: npm start
npm run test:routes
npx playwright install --with-deps chromium
npm run test:browser
```

Native compilation checks additionally require `pdflatex`, `pdfinfo`, and `pdftotext`:

```sh
npm run test:latex
```

GitHub Actions covers the production Worker, desktop and mobile Chromium, downloads, stale-PDF invalidation, mocked AI behavior, and 39 native LaTeX fixtures. A separate workflow isolates browser TeX compilation from the UI build. Screenshots, PDFs, and JSON reports are uploaded as test artifacts.

`Live site audit` independently inspects `https://syntaxis.cv`. It reports the currently deployed website, not merely what exists in this repository. A merged PR is not evidence that the external hosting platform has deployed it.

## Deployment

The tested build target is Vinext + Cloudflare Workers. `npm run build` creates `dist/server/wrangler.json` and its assets. Deploy that build through the site's authorized hosting pipeline and preserve the cross-origin isolation headers. This repository intentionally does not contain deployment tokens or an automatic production deployment workflow.

## Source map

- `app/`: routes, theme, responsive styles.
- `components/syntaxis/`: landing page, editor, animation lifecycle, mock assistant.
- `lib/latex-templates.ts`: repaired original template definitions.
- `lib/latex.ts`: escaped data-to-LaTeX renderer.
- `lib/latex-pdf.ts`: browser compilation and dependency loading.
- `scripts/`: asset preparation and repeatable verification.
- `COMPONENT_SOURCES.md`, `licenses/`: component provenance and notices.

Font binaries are obtained during asset preparation, not distributed in the source repository. The font license notice must remain with deployed font assets. Third-party components retain their respective licenses; in particular Animate UI includes its Commons Clause condition.
