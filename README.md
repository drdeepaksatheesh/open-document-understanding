# Open Document Understanding

> Working title. Product naming is deliberately not frozen yet.

A privacy-first, open-source document reader whose goal is simple:

**Help a person understand any document in the language and level they are comfortable with, without separating them from the original source.**

The project started from a medical-education use case but is intentionally generic. Medical science will become an optional domain pack rather than the core application.

## Current milestone: v0.1a

v0.0.1 proved clean-machine Windows installation. v0.0.2 added durable source provenance and sidecars. v0.1a adds the first end-to-end **local Hindi Translate/Explain path** through that provenance architecture.

Current capabilities include:

- Tauri 2 + React/TypeScript desktop application;
- local selectable-text PDF opening and PDF.js rendering;
- source passage selection and return-to-source highlighting;
- SHA-256 identity for source documents and normalized source quotes;
- durable per-document JSON sidecars stored in application data;
- fallback source restoration when PDF text-item boundaries shift;
- separate **Translate / Explain / Ask** modes;
- a tiny built-in **Hindi reference engine** for deterministic Translate/Explain regression passages;
- generated-output provenance including language, level, engine id/version/local flag, verification state and review state;
- restoration of saved Translate/Explain output when the same source is reopened;
- persistent Light/Dark mode;
- visible **LOCAL ONLY** state;
- Windows NSIS packaging with CI-generated SHA-256 installer manifest.

### Important v0.1a limitation

The built-in Hindi engine is **not a general translator**. It contains a very small, explicit regression catalog spanning medical, administrative and safety examples. Unknown text is rejected as unsupported rather than fabricated.

This milestone exists to prove:

`source → local engine → generated record → sidecar → close/reopen → provenance restore`

before introducing a heavyweight local model runtime and model-pack distribution system.

See `docs/LOCAL_HINDI_REFERENCE_SLICE.md` and ADR 0002 for the exact scope and rationale.

There is still **no OCR, runtime internet verification path, or general local AI model** in v0.1a.

## Product principles

1. **The source is never silently replaced.** Translation, explanation and verification are visibly distinct operations.
2. **Local first.** Opening, parsing, translation, explanation and document Q&A are intended to work without the internet.
3. **Verification is separate and explicit.** Future internet access will be isolated to a verifier that sends claims/search queries, not document pages.
4. **Language and difficulty are independent.** Simple English, technical Hindi, bilingual explanations and other combinations are all valid.
5. **Domain knowledge is modular.** Medical, administrative, technical, safety and education packs extend the generic reader.
6. **Every explanation remains anchored to its source.** The user can always see the exact page and selected text.
7. **Installable from the beginning.** Releases should be usable on another computer without Python, Git, Conda or a terminal.
8. **Unsupported beats fabricated.** A local engine that cannot responsibly handle a passage must say so.

## Development policy

`PROJECT_MANDATE.md` is the standing execution mandate for AI-assisted development. `PRODUCT_SPEC.md`, `ARCHITECTURE.md`, `ROADMAP.md` and `RELEASE_CHECKLIST.md` are project sources of truth.

## Status

This repository is in the local-intelligence architecture stage. Do not use it for clinical decisions, safety-critical instructions or authoritative translation yet.

## License

Apache-2.0 for the application source code. Future model weights, terminology packs and datasets may carry their own compatible licenses and will be documented separately.
