# Roadmap

This roadmap is intentionally milestone-based rather than date-based. Each milestone should produce something testable and closer to a distributable application.

## v0.0.1 — Product shell ✅

Goal: prove the application boundary before adding AI complexity.

Completed and clean-machine validated on Windows:

- Tauri 2 desktop shell;
- React/TypeScript UI;
- open local selectable-text PDF;
- PDF rendering with text selection;
- source side panel;
- Translate / Explain / Ask controls present but stubbed;
- local/network status indicator;
- basic settings storage;
- CI build workflow;
- Windows NSIS packaging;
- synthetic smoke-test document.

## v0.0.2 — Robust source anchoring and release hardening ✅

- SHA-256 document identity;
- SHA-256 normalized quote identity;
- page/selection anchoring;
- fallback source-text range recovery if PDF text-item boundaries shift;
- jump back to source;
- durable per-document JSON sidecars in application data storage;
- versioned sidecar schema for future Translate / Explain / Ask provenance;
- regression tests for hash stability, range recovery and sidecar records;
- persistent Light/Dark mode;
- cross-file version consistency checks;
- validated Windows installer checksum manifest;
- clean-machine persistence validation.

## v0.1a — Local Hindi reference intelligence ✅

Goal: prove the complete local-generation lifecycle without coupling it to a heavyweight model runtime.

Completed:

- deterministic built-in Hindi reference engine;
- Translate and Simple Explain operations;
- medical, administrative and safety regression passages;
- explicit `unsupported` behavior for unknown text;
- generated-output sidecar records with language, level and engine provenance;
- externally-verified and human-reviewed states explicit and false by default;
- saved generated outputs restore when the same source is reopened;
- PDF text-layer spacing regression hardened;
- no runtime network path added;
- clean Windows GUI validation completed.

## v0.1b — Real offline Hindi translation model boundary (current)

Goal: replace the normal Translate path with a secure installable model-pack/provider boundary before adding heavyweight model files.

Phase 1:

- `TranslationProvider` abstraction;
- reference translator retained for regression/dev use but removed as automatic normal-user fallback;
- separate model-pack schema;
- local model-pack directory import;
- SHA-256 validation of every declared pack file;
- relative-path/path-traversal protection;
- model-pack discovery under application data;
- explicit no-pack and runtime-not-connected states;
- SourceAnchor, GeneratedRecord and document-sidecar schemas unchanged.

Phase 2:

- local JSON-lines translation worker protocol;
- packaged CPU Windows worker;
- pinned AI4Bharat IndicTrans2 En-Indic distilled 200M model revision;
- arbitrary unseen English -> Hindi translation;
- existing provenance mapping and sidecar persistence;
- internet-disconnected clean-machine test.

Exit criterion: a normal Windows user can install the app and validated Hindi model pack, select an arbitrary English sentence in a local PDF, translate it into Hindi with internet disabled, and restore the generated record after restarting the app.

## v0.1 — First production local understanding loop

- local explanation engine beyond the fixed regression catalog;
- document-grounded Ask mode;
- clear provenance labels for Translate / Explain / Ask;
- no document upload required;
- CPU-only Windows benchmark and memory/latency targets;
- model/runtime license documentation.

Exit criterion: a normal Windows user can install the app + required model packs and use Translate, Explain and Ask on a local English PDF without internet access.

## v0.2 — Medical science pack

- medical terminology system;
- physiology-oriented terminology seed;
- bilingual medical vocabulary mode;
- protected terms/units/symbols;
- simple/MBBS/advanced explanation profiles;
- medical regression corpus using synthetic/open material;
- human review workflow.

## v0.3 — OCR and photographed documents

- scanned PDF detection;
- local OCR;
- image/photo import;
- confidence display;
- OCR-to-source anchoring.

## v0.4 — More Indic languages

- multilingual translation routing;
- language pack UX;
- terminology packs per language;
- script/font testing;
- bilingual and bridge-language modes.

## v0.5 — Optional verification

- explicit Verify action;
- claim extraction;
- external search/retrieval boundary;
- provenance/citations;
- verified / disputed / unverified states;
- network activity log;
- medical source hierarchy rules.

## v0.6 — Accessibility and speech

- text-to-speech;
- simplified reading mode;
- keyboard accessibility;
- large-text/high-contrast behavior;
- action-oriented summaries for circulars/SOPs.

## v0.7 — Additional document formats

- DOCX;
- common text/office formats;
- exportable annotations/sidecars;
- careful handling of reflowing layouts.

## v0.8 — Android vertical slice

- mobile reader;
- camera/photo workflow;
- local model strategy appropriate for phones;
- offline packs;
- share-sheet/open-with integration.

## Later

Potential directions after the core is stable:

- figure and diagram label translation;
- collaborative expert review;
- institution-specific terminology packs;
- classroom/teacher modes;
- local-network deployment for institutions;
- portable offline bundles for low-connectivity environments;
- richer provenance and correction datasets.

## Scope discipline

Do not pull later features forward unless they are required to validate the current vertical slice. A smaller working product is preferred to a broad non-working prototype.
