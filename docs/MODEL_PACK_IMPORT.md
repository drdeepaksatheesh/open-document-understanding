# Offline Model-Pack Import Boundary

This document describes the v0.1b phase-1 model-pack boundary. It is intentionally independent of document provenance and sidecar storage.

## What v0.1b phase 1 proves

The desktop app can:

1. discover already installed model packs under application data;
2. import a user-selected local directory containing `manifest.json`;
3. reject unsafe paths and invalid manifests;
4. SHA-256 verify every declared file before activation;
5. copy only the manifest and explicitly declared files into application data;
6. revalidate the copied pack before exposing it to the UI;
7. select a compatible English -> Hindi local translation provider;
8. report `model_not_installed` or `runtime_not_connected` explicitly rather than silently using the deterministic reference translator.

No document-sidecar migration is involved.

## Installed location

Tauri resolves the platform application-data directory and stores packs below:

```text
<app-data>/models/<pack-id>/<pack-version>/
```

A temporary `<pack-version>.importing` directory is used during import. The final directory is activated only after a second validation pass.

## Security rules

A model pack is rejected when:

- `manifest.json` is missing, malformed or exceeds the manifest size limit;
- `schemaVersion` is not `1`;
- pack id/version contain unsafe filesystem characters;
- the operation is not `translate`;
- `local` is not `true`;
- English -> Hindi support is not declared;
- the license field is empty;
- no files are declared;
- a declared path is absolute, drive-prefixed, contains `..`, or otherwise leaves the pack root;
- a file is missing or is not a regular file;
- a symbolic/canonicalized file resolves outside the selected pack root;
- a file SHA-256 does not match the manifest;
- duplicate declared paths are present.

Only files explicitly declared by the manifest are copied during import.

## What is deliberately not implemented yet

The presence of a valid pack does **not** yet mean inference can run. The phase-1 `ModelPackTranslationProvider` deliberately returns `runtime_not_connected` after successful pack discovery. The next phase connects a local worker process through non-HTTP IPC.

This split is intentional: pack integrity/discovery and inference-runtime execution are separate trust boundaries.

## Synthetic smoke-test pack

The repository contains:

```text
test-fixtures/model-pack-valid/
```

This is a tiny non-model fixture. Importing that directory should result in a validated installed pack and the UI should show it as available. Pressing Translate should then report that the local inference worker is not connected yet. It must not fall back to the reference translator.

## Provenance invariants

The following remain unchanged:

- `SourceAnchor`;
- quote/document hashes;
- `GeneratedRecord` shape;
- `DocumentSidecar` schema;
- `externallyVerified` and `humanReviewed` semantics.

When real inference is connected, its engine id/version/local flag will populate the existing `engine` object exactly as the reference engine already does.
