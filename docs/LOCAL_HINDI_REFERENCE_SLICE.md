# Local Hindi Translate/Explain reference slice

## Purpose

v0.1a is the smallest end-to-end proof that a source-anchored passage can be sent to a **local understanding engine**, produce a Hindi output, persist that output in the document sidecar, close/reopen the app, and restore the generated result with provenance intact.

It is deliberately **not** a general-purpose translator yet.

## Why a reference engine first

A production Indic model introduces several independent engineering problems at the same time:

- model-pack download and offline installation;
- inference runtime and CPU/GPU fallback;
- RAM/disk requirements;
- tokenizer/model compatibility;
- model and dataset licensing;
- model versioning and upgrades;
- packaging size and release distribution;
- quality evaluation for translation and explanation.

The reference engine lets the application prove the architectural path before those concerns are added.

## Supported behavior

The built-in engine is `odu.hindi-reference` version `0.1a.1`.

It supports:

- target language: **Hindi**;
- operations: **Translate** and **Explain**;
- explanation level: **Simple**;
- a tiny deterministic regression catalog containing medical, administrative and safety passages.

Unknown passages are returned as `unsupported`. The engine must never improvise an answer outside the catalog.

## Provenance path

```text
PDF source selection
    ↓
SourceAnchor v2
(document SHA-256 + quote SHA-256 + page/range)
    ↓
local Hindi reference engine
    ↓
translate OR explain output
    ↓
ProvenanceRecord
(operation + output + language + level + engine metadata)
    ↓
per-document local JSON sidecar
    ↓
close/reopen document
    ↓
output restored from the same sidecar
```

Every generated record explicitly stores:

- operation (`translate` or `explain`);
- exact source anchor;
- generated output;
- target language;
- explanation level where applicable;
- engine id/version/local flag;
- `externallyVerified: false`;
- `humanReviewed: false`.

## Privacy

The reference engine is ordinary TypeScript bundled inside the desktop application. It performs no HTTP requests and adds no network permission or runtime endpoint. The current CSP remains local-only.

## Quality limitation

A successful output means only that the architecture worked for a supported regression passage. It does **not** mean the application can accurately translate arbitrary English text or safely explain arbitrary medical/safety material.

The UI therefore labels generated output as coming from a **LOCAL REFERENCE ENGINE** and displays that it has not been externally verified or human reviewed.

## Next step

Replace the deterministic reference implementation behind the same engine contract with an installable local model pack. The first production candidate should be evaluated separately for:

1. English → Hindi translation quality;
2. simple-English/Hindi explanation quality;
3. CPU-only latency and RAM on ordinary Windows laptops;
4. distributable model license;
5. fully offline installation;
6. medical terminology preservation;
7. deterministic provenance/version identification.

The model-pack runtime must not require changes to the sidecar provenance contract introduced here.
