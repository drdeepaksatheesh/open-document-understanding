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
│   ├── durable per-document sidecars
│   ├── model metadata
│   └── reversible annotations/provenance
└── Optional network verifier
    └── explicit outbound requests only
```

## Application shell

The desktop shell is Tauri 2 with a TypeScript/React front end. This gives the project a modern document interface while preserving a native desktop packaging path.

PDF rendering uses PDF.js with a canvas plus selectable text overlay.

The application UI supports persistent Light/Dark mode. The rendered PDF itself is not recolored or rewritten by theme changes; dark mode changes only the reader chrome/background so the document remains visually faithful.

## Local engine

Machine-learning components must not be tightly coupled to the UI.

The initial local engine may use Python because of model ecosystem support, but communication should occur through a narrow local process boundary. The UI should not depend on Python-specific APIs.

Preferred boundary:

- bundled sidecar process;
- structured messages over stdin/stdout or another auditable local IPC mechanism;
- no localhost HTTP server unless a later technical reason justifies one.

This keeps future replacement with ONNX Runtime, C++, Rust, llama.cpp-class runtimes, or other local engines practical.

## Source anchoring

Beginning in v0.0.2, source identity uses cryptographic hashes rather than the fast UI fingerprint used by v0.0.1.

A source anchor contains:

- SHA-256 of the complete source document bytes;
- one-based page number;
- normalized selected source text;
- SHA-256 of the normalized source quote;
- PDF text-item start/end indices;
- start/end character offsets;
- creation time;
- schema/version information.

Restoration first attempts the stored text-item range. If those renderer boundaries have shifted, the page text layer is searched for the same normalized quote and the recovered range is highlighted. The original PDF remains unchanged.

## Document sidecars

The original file remains byte-for-byte untouched unless the user deliberately exports a derivative document.

v0.0.2 introduces a versioned JSON sidecar model. In the installed Tauri application, sidecars are stored under the application's data directory in a dedicated `sidecars` directory, keyed by the source document's SHA-256. The browser-development fallback uses local storage only for development convenience.

A sidecar can contain records for:

- source selections;
- translations;
- explanations;
- questions/answers;
- user notes/corrections;
- model/version provenance;
- domain-pack provenance;
- verification citations/status;
- human-review status.

v0.0.2 writes source-selection records only; future AI outputs must attach to the same provenance model rather than inventing a parallel store.

The sidecar JSON format is described by `schemas/document-sidecar.schema.json`.

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
- dependency review for unexpected network behavior;
- document and sidecar size limits at the native boundary;
- SHA-256 source identity for provenance.

## Packaging and release validation

The application is packaged from early development.

Reference distribution path:

`source -> CI checks -> platform bundle/installer -> checksum -> clean-machine smoke test`

Windows is the initial reference platform. CI verifies application-version consistency, runs tests/builds, produces exactly one NSIS installer, applies a minimum-size sanity check, calculates SHA-256 and uploads the installer with its checksum manifest. The clean-machine GUI workflow is documented separately in `RELEASE_CHECKLIST.md`.

Linux and macOS follow once the Windows vertical slice is stable. Android is a first-class future platform, especially for camera/SOP/accessibility use cases.

## Architectural decision discipline

Durable choices that constrain future development should be recorded in `docs/adr/`.
