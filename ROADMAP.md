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

## v0.1a — Local Hindi reference intelligence (current)

Goal: prove the complete local-generation lifecycle without coupling it to a heavyweight model runtime.

- deterministic built-in Hindi reference engine;
- Translate and Simple Explain operations;
- medical, administrative and safety regression passages;
- explicit `unsupported` behavior for unknown text;
- generated-output sidecar records with language, level and engine provenance;
- externally-verified and human-reviewed states remain explicit and false by default;
- saved generated outputs restore when the same source is reopened;
- no runtime network path added;
- Windows installer and CI validation retained.

Exit criterion: a supported English passage can be translated and explained in Hindi locally, each output is separately persisted with its exact source anchor and engine provenance, and the output survives restart/reopen. Unknown passages must be rejected rather than fabricated.

## v0.1 — First production local understanding loop

- replace the reference engine behind the same contract with a distributable local model/runtime;
- English -> Hindi general translation vertical slice;
- local explanation engine beyond the fixed regression catalog;
- document-grounded Ask mode;
- clear provenance labels for Translate / Explain / Ask;
- no document upload required;
- model pack manifest and installation path;
- CPU-only Windows benchmark and memory/latency targets;
- model/runtime license documentation.

Exit criterion: a normal Windows user can install the app + required model pack and use Translate, Explain and Ask on a local English PDF without internet access.

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
