# Components and attribution

The frontend keeps the requested reference components, adapted to the app's actual features rather than importing every unused variant.

| Reference | Integration |
| --- | --- |
| Base UI Toolbar | `@base-ui/react/toolbar`, used in landing and workspace. |
| Animate UI Base Toggle Group | Focused Base UI / Motion adaptation in `components/animate-ui/components/base/toggle-group.tsx`. |
| Magic UI Tweet Card | Local editorial notes, not fabricated social testimonials. |
| Next Bricks Decode Reveal | Original React/GSAP ScrambleText implementation of the reveal behavior; no proprietary WordPress component code is included. |
| Prompt Kit Steps | Adapted collapsible workflow details. |
| Motion Primitives Dock | Adapted magnifying dock with native buttons and reduced-motion handling. |

Sources:
- https://base-ui.com/react/components/toolbar
- https://animate-ui.com/docs/components/base/toggle-group
- https://magicui.design/docs/components/tweet-card
- https://nextbricks.io/decode-reveal/
- https://www.prompt-kit.com/docs/steps
- https://motion-primitives.com/docs/dock

Copyright notices are in `licenses/`. Animate UI carries its Commons Clause condition; do not relabel the whole dependency set as unrestricted MIT. UI primitives are based on Radix and shadcn patterns. Dependency packages retain their own licenses.

GSAP and its React integration supply entrance, scramble, paper stack, pointer tilt, magnetic buttons, and scroll choreography. GSAP is browser-loaded after hydration, never evaluated by the server renderer. License: https://gsap.com/standard-license

## Typeface

Aspekta is obtained at build time from its publisher. Font binaries are not committed to this repository. Its OFL notice is in `public/fonts/OFL.txt` and must remain with deployed font assets.

Publisher: https://github.com/ivodolenc/aspekta

Original Reddit research:
- https://www.reddit.com/r/typography/comments/1ezji7f/neogrotesque_sansserif_typefaces_driving_me_insane/
- https://www.reddit.com/r/typography/comments/1e9ig2w/does_somebody_else_really_love_grotesk_typefaces/

## LaTeX

The templates derive from the user-supplied Syntaxis backend. Silicon retains Trey Hunner's 2010 `resume.cls` copyright and redistribution notice inline. `lib/latex.ts` fixes malformed placeholders and macro calls while preserving template-specific typesetting.

The browser compiler is `@siglum/engine` 0.1.4 (https://github.com/SiglumProject/siglum). It downloads public TeX runtime/package assets; the résumé source remains in the local worker. TeX packages and runtime assets retain their upstream licenses.

`vendor/siglum-optional-hash.js` deliberately activates Siglum's documented-in-source fallback for a broken optional BLAKE3 browser entry. This hash is for local change detection, not security or artifact integrity.
