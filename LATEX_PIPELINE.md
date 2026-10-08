# Original-template LaTeX pipeline

## Rendering

`lib/latex.ts` escapes user fields and fills the selected design in `lib/latex-templates.ts`. Vanguard and Genesis retain their original article preambles, measurements, section rules and résumé macros. Genesis's malformed macro signature and invalid placeholders were repaired. Silicon embeds the original Trey Hunner `resume.cls` using `filecontents*`, preserving its copyright and permission notice.

This is the original template architecture with correctness fixes, not the earlier simplified generic article export and not a claim of byte-for-byte unchanged backend source.

## Actual compilation

1. The user explicitly selects Compile PDF.
2. The app validates cross-origin isolation and serializes the draft as LaTeX.
3. A browser-only `@siglum/engine` 0.1.4 worker loads the TeX Live 2025 WebAssembly engine and core bundles.
4. Template support files prepared during the site build are passed as `additionalFiles`.
5. pdfLaTeX returns real PDF bytes. The app checks their signature and provides a Blob-backed preview/download.

A draft fingerprint protects against stale results. Failed compilation never silently falls back to printing HTML or presenting a previous document as current. There is a three-minute timeout.

## Explicit template dependencies

Core browser bundles omit packages used by these templates, including `titlesec` and `etoolbox`. `scripts/prepare-latex.mjs` resolves an explicit allowlist using build-time `kpsewhich`, copies unmodified text support files, and records the distribution version and file SHA-256 hashes in `public/latex-packages.json`. It preserves inline license notices and excludes font binaries and executable files.

Use TeX Live with `texlive-latex-extra`, `texlive-fonts-recommended`, and `lmodern` installed to build. Visitors and deployed servers do not need native TeX. Runtime CTAN fallback is disabled. The generated support bundle is served by the application itself.

Siglum's optional `blake3-wasm` dependency has a broken browser entry in the pinned release. A narrow alias activates Siglum's built-in change-detection hash fallback. That fallback is not used for authentication, signatures, or security verification.

## Privacy and scope

Only public engine assets are requested externally. Résumé source stays in the page/worker. No OpenAI, Anthropic, or hosted PDF calls occur. Browser-local drafts, versions and package caches may remain on the device; asset hosts see ordinary asset requests.

The ten language options localize headings, not the user's writing. The current pdfLaTeX font encoding supports the Latin-script fixtures tested here; unrestricted emoji, CJK and arbitrary Unicode are not claimed. Unsupported content should fail visibly rather than be invented or silently removed.

The instant HTML preview and separately labeled HTML print option are approximate. Only the compiled PDF is exact LaTeX output.

## Verification

- 13 core checks for normalization, backup fidelity, escaping, template structure and disconnected API behavior.
- 39 native compilations: three templates × ten heading languages, plus special-character, empty and multi-page fixtures per template. PDF validity and extracted text are checked.
- Independent Chromium/WebAssembly compilation of all three original templates, with real PDF bytes and external-request assertions.
- Production Worker tests for navigation, editing, undo/redo, persistence, versions, mock AI review, source/PDF downloads, invalidation, mobile/reduced-motion layout and unhandled errors.

Use the Actions result for the exact reviewed commit as the pass/fail source of truth. A passing build or a merged PR is not evidence that an external hosting platform deployed that commit.
