# Original-template LaTeX pipeline

## Data and rendering

A `Draft` contains the résumé, selected template, and section-heading language. `lib/latex.ts` escapes LaTeX control characters in user fields and fills the template-specific structures in `lib/latex-templates.ts`.

Vanguard and Genesis retain their original article preambles, dimensions, section formatting, and résumé macros. Genesis's malformed macro signature was repaired. Silicon retains the original Trey Hunner `resume.cls` and copyright/permission notice; it is embedded using `filecontents*` so the downloaded `.tex` is self-contained. Invalid original placeholders were replaced by explicit typed rendering.

This is not the previously simplified generic article export. It is also not byte-for-byte unmodified backend source: correctness and empty-section fixes are intentional and documented.

## Real PDF generation

1. The user explicitly chooses **Compile PDF** or **Compile LaTeX PDF**.
2. The app checks cross-origin isolation and serializes the current draft into LaTeX.
3. A dynamically loaded `@siglum/engine` 0.1.4 compiler starts its same-origin worker.
4. The worker loads public TeX Live 2025 engine and core bundle assets from Siglum's CDN.
5. Original-template support packages, obtained during the site build, are passed as `additionalFiles`.
6. pdfLaTeX runs inside WebAssembly and returns PDF bytes.
7. The application validates the PDF signature, displays a Blob-backed PDF frame, and offers a download.

The PDF cache is tied to the entire draft fingerprint. Any content, template, or language change invalidates it. A failed or timed-out compile does not silently substitute browser printing, fabricated output, or the previous document.

## Why packages are prepared at build time

The browser engine's core bundles do not include every package required by the original templates. For example, the original Vanguard preamble uses `titlesec.sty`. Merely importing a compiler does not make these dependencies available.

`scripts/prepare-latex.mjs` downloads an explicit package allowlist from official historic TeX Live mirrors, extracts text support files, preserves their inline licenses, and records archive provenance and hashes. No résumé data is involved. Runtime CTAN fallback is disabled; the expected original-template dependencies are supplied explicitly.

The published `blake3-wasm` browser entry used by Siglum has a missing generated module. A narrowly scoped alias activates Siglum's own optional-accelerator fallback for local change detection. This is not a substitute for cryptographic verification or an authentication mechanism.

## Privacy and limits

Résumé source remains in the page/worker and is not uploaded to Siglum, OpenAI, Anthropic, or a PDF service. Public asset servers still see normal requests for their files. Browser-local drafts, versions, and runtime caches may persist on the device.

The first compile can require substantial engine and package downloads. Browser memory limits and cross-origin isolation apply. There is a three-minute compile timeout. Downloads of the `.tex` source remain available without loading WebAssembly.

The ten language options localize headings only. pdfLaTeX with the selected font encoding supports the tested Latin-script content; arbitrary emoji, CJK, or other Unicode characters are not claimed to work. A failing character should produce a visible compile error, not invented or silently removed content. For unrestricted Unicode, a separately tested XeLaTeX/LuaLaTeX path would be needed.

The live HTML preview and the separately labeled HTML print option are convenient approximations. Only the compiled PDF is the exact LaTeX output.

## Test coverage

- Thirteen core checks: normalization, backups, non-truncation, escaping, template/language source structure, and disconnected API behavior.
- Thirty-nine native compilations: all three templates in ten heading languages, plus special-character, empty-document, and multi-page fixtures for every template. PDF validity and extracted content are checked.
- Isolated browser compilation: actual Chromium, WebAssembly, downloaded public assets, all three original templates, PDF signature/content validation, and no résumé upload.
- Production Worker browser tests: navigation, editing, autosave, undo/redo, saved versions, explicit mock AI review, raw source and PDF downloads, stale-PDF invalidation, mobile layout, and browser-error capture.

Current pass/fail results and evidence belong to the GitHub Actions run for the commit being reviewed. Do not infer a successful deployment from a successful source build.
