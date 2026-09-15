# Architecture

## Guiding idea

The product is a local-first document reader with modular understanding services. The original document remains canonical. Generated assistance is layered beside or over the source and is always attributable to a specific source anchor.

## High-level components

```text
Desktop application
├── Document reader
│   ├── PDF rendering
│   ├── text extraction
│   ├── selection
│   └── source anchors
├── Understanding panel
│   ├── Translate
│   ├── Explain
│   ├── Ask
│   └── Verify (later)
├── Local engine boundary
│   ├── translation
│   ├── local tutor/LLM
│   ├── glossary/domain packs
│   └── document retrieval
├── Persistence
│   ├── settings
│   ├── model metadata
│   └── reversible sidecar annotations
└── Optional network verifier
    └── explicit outbound requests only
```

## Application shell

The planned desktop shell is Tauri 2 with a TypeScript/React front end. This gives the project a modern document interface while preserving a native desktop packaging path.

PDF rendering should use PDF.js or an equivalent permissively licensed renderer suitable for selectable-text overlays.

## Local engine

Machine-learning components must not be tightly coupled to the UI.

The initial local engine may use Python because of model ecosystem support, but communication should occur through a narrow local process boundary. The UI should not depend on Python-specific APIs.

Preferred boundary:

- bundled sidecar process;
- structured messages over stdin/stdout or another auditable local IPC mechanism;
- no localhost HTTP server unless a later technical reason justifies one.

This keeps future replacement with ONNX Runtime, C++, Rust, llama.cpp-class runtimes, or other local engines practical.

## Source anchoring

A source anchor should identify enough information to restore the user to the exact context used for an answer.

Initial anchor fields should include:

- document fingerprint;
- page number;
- selected source text;
- optional text-item/block identifiers;
- bounding box(es) when reliable;
- normalized source hash.

Anchors should survive ordinary UI actions and be stored separately from the source document.

## Document sidecars

The original file should remain byte-for-byte untouched unless the user deliberately exports a derivative document.

Generated material should be stored in a sidecar format that can contain:

- source-document fingerprint;
- anchors;
- translations;
- explanations;
- user notes/corrections;
- model/version provenance;
- domain-pack provenance;
- verification citations/status.

The sidecar must not be assumed legally safe to redistribute merely because it does not contain the original PDF.

## Network boundary

The core reader and local understanding path should function without internet access.

Networked verification is a separate capability with explicit user intent and visible status.

Where feasible, the verifier receives a narrow claim/search query rather than:

- the PDF;
- a page image;
- an entire chapter;
- unrelated surrounding text.

Any runtime dependency that communicates externally must be documented.

## Model packs

Large model assets should be independently installable from the application where practical.

A model pack should declare:

- pack identifier;
- version;
- upstream source;
- license;
- hashes;
- supported languages;
- runtime requirements;
- intended tasks;
- known limitations.

This avoids coupling every application update to multi-gigabyte model downloads.

## Domain packs

Domain packs are distinct from model packs.

A domain pack can contain:

- terminology/glossaries;
- preferred bilingual forms;
- protected tokens;
- domain-specific prompts/templates;
- explanation-level rules;
- verification source hierarchy;
- test fixtures and expected behavior.

The first domain pack will be medical science.

## Security and privacy assumptions

The project should aim for auditable privacy rather than marketing claims.

Engineering requirements include:

- no hidden telemetry;
- no silent upload of source documents;
- explicit visible network state;
- deterministic logging of externally transmitted verification queries where reasonable;
- minimal permissions;
- dependency review for unexpected network behavior.

## Packaging

The application should be packaged from early development.

Reference distribution path:

`source -> CI build -> platform bundle/installer -> clean-machine smoke test`

Windows is the initial reference platform. Linux and macOS follow once the Windows vertical slice is stable. Android is a first-class future platform, especially for camera/SOP/accessibility use cases.

## Architectural decision discipline

Durable choices that constrain future development should be recorded in `docs/adr/`.
