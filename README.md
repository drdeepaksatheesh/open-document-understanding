# Open Document Understanding

> Working title. Product naming is deliberately not frozen yet.

A privacy-first, open-source document reader whose goal is simple:

**Help a person understand any document in the language and level they are comfortable with, without separating them from the original source.**

The project started from a medical-education use case but is intentionally generic. Medical science will become an optional domain pack rather than the core application.

## Current milestone: v0.1b

v0.0.1 proved clean-machine Windows installation. v0.0.2 added durable source provenance and sidecars. v0.1a proved the complete local generation/provenance loop with a deliberately tiny deterministic Hindi reference engine. v0.1b is now replacing normal-user Translate with a **real offline model-pack boundary**.

Current capabilities include:

- Tauri 2 + React/TypeScript desktop application;
- local selectable-text PDF opening and PDF.js rendering;
- source passage selection and return-to-source highlighting;
- SHA-256 identity for source documents and normalized source quotes;
- durable per-document JSON sidecars stored in application data;
- separate **Translate / Explain / Ask** provenance operations;
- generated-output provenance including language, level, engine id/version/local flag, verification state and review state;
- restoration of saved generated output when the same source is reopened;
- persistent Light/Dark mode;
- visible **LOCAL ONLY** state;
- Windows NSIS packaging with CI-generated SHA-256 installer manifest;
- a typed `TranslationProvider` boundary;
- local model-pack discovery/import under application data;
- strict manifest/path validation and SHA-256 verification of every declared pack file;
- explicit `model_not_installed` / `runtime_not_connected` behavior instead of hidden fallback translation.

### Important v0.1b phase-1 limitation

The actual heavyweight Hindi inference worker and IndicTrans2 weights are **not connected yet**. Phase 1 intentionally proves the model-pack trust/distribution boundary first.

Normal Translate no longer silently uses the canned reference translator. If there is no validated pack, the app says so. If a validated pack exists but inference is not connected yet, the app says that too.

Explain remains on the small reference path temporarily so the existing provenance regression loop stays testable while translation moves to the real provider architecture.

See:

- `docs/REAL_OFFLINE_HINDI_MODEL_PLAN.md`;
- `docs/MODEL_PACK_IMPORT.md`;
- ADR 0003;
- `schemas/model-pack.schema.json`.

The next phase connects a local, non-HTTP worker and a pinned AI4Bharat IndicTrans2 En-Indic distilled 200M pack to this boundary.

There is still **no OCR, runtime internet verification path, general Explain model or Ask model** in this milestone.

## Product principles

1. **The source is never silently replaced.** Translation, explanation and verification are visibly distinct operations.
2. **Local first.** Opening, parsing, translation, explanation and document Q&A are intended to work without the internet.
3. **Verification is separate and explicit.** Future internet access will be isolated to a verifier that sends claims/search queries, not document pages.
4. **Language and difficulty are independent.** Simple English, technical Hindi, bilingual explanations and other combinations are all valid.
5. **Domain knowledge is modular.** Medical, administrative, technical, safety and education packs extend the generic reader.
6. **Every explanation remains anchored to its source.** The user can always see the exact page and selected text.
7. **Installable from the beginning.** Releases should be usable on another computer without Python, Git, Conda or a terminal.
8. **Unsupported beats fabricated.** A local engine that cannot responsibly handle a passage must say so.
9. **Model packs are untrusted until verified.** Imported packs must pass local manifest/path/hash validation before they are activated.

## Development policy

`PROJECT_MANDATE.md` is the standing execution mandate for AI-assisted development. `PRODUCT_SPEC.md`, `ARCHITECTURE.md`, `ROADMAP.md` and `RELEASE_CHECKLIST.md` are project sources of truth.

## Status

This repository is in the offline-model integration stage. Do not use it for clinical decisions, safety-critical instructions or authoritative translation yet.

## License

Apache-2.0 for the application source code. Model weights, terminology packs and datasets may carry their own compatible licenses and are documented separately.
