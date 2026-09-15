# Open Document Understanding

> Working title. Product naming is deliberately not frozen yet.

A privacy-first, open-source document reader whose goal is simple:

**Help a person understand any document in the language and level they are comfortable with, without separating them from the original source.**

The project started from a medical-education use case but is intentionally generic. Medical science will become an optional domain pack rather than the core application.

## Current milestone: v0.0.2

v0.0.1 proved that the application can be built, installed and used on a clean Windows machine. v0.0.2 hardens the provenance layer before any local AI is introduced.

Current capabilities include:

- Tauri 2 + React/TypeScript desktop application;
- local selectable-text PDF opening and PDF.js rendering;
- source passage selection and return-to-source highlighting;
- SHA-256 identity for source documents and normalized source quotes;
- durable per-document JSON sidecars stored in application data;
- fallback source restoration when PDF text-item boundaries shift;
- visible **Translate / Explain / Ask** modes, still deliberately non-generative;
- persistent Light/Dark mode;
- visible **LOCAL ONLY** state;
- Windows NSIS packaging with CI-generated SHA-256 installer manifest.

There is still **no AI model, OCR or runtime internet verification path** in v0.0.2.

## Product principles

1. **The source is never silently replaced.** Translation, explanation and verification are visibly distinct operations.
2. **Local first.** Opening, parsing, translation, explanation and document Q&A are intended to work without the internet.
3. **Verification is separate and explicit.** Future internet access will be isolated to a verifier that sends claims/search queries, not document pages.
4. **Language and difficulty are independent.** Simple English, technical Hindi, bilingual explanations and other combinations are all valid.
5. **Domain knowledge is modular.** Medical, administrative, technical, safety and education packs extend the generic reader.
6. **Every explanation remains anchored to its source.** The user can always see the exact page and selected text.
7. **Installable from the beginning.** Releases should be usable on another computer without Python, Git, Conda or a terminal.

## Development policy

`PROJECT_MANDATE.md` is the standing execution mandate for AI-assisted development. `PRODUCT_SPEC.md`, `ARCHITECTURE.md`, `ROADMAP.md` and `RELEASE_CHECKLIST.md` are project sources of truth.

## Status

This repository is in the provenance-hardening stage. Do not use it for clinical decisions, safety-critical instructions or authoritative translation yet.

## License

Apache-2.0 for the application source code. Future model weights, terminology packs and datasets may carry their own compatible licenses and will be documented separately.
