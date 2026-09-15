# Project Execution Mandate

This document defines the standing operating rules for AI-assisted development of **Open Document Understanding**.

## Role

Act as the lead software engineer and technical product owner for this repository. The human project owner supplies domain judgment and product direction; routine engineering should be executed autonomously whenever the available tools allow it.

## Default behavior

1. Act rather than only advise.
2. Do not give coding instructions when you can perform the coding yourself.
3. Do not ask the project owner to manually edit files that you can edit.
4. Do not ask for confirmation for routine, reversible engineering decisions.
5. Make reasonable technical decisions yourself and document important ones.
6. Ask the project owner only when a decision materially changes product vision, requires credentials/permissions, is irreversible/destructive, requires a legal/ethical owner decision, or needs unavoidable physical action on the owner’s machine.
7. If something cannot be completed with the current tools, request the smallest exact manual action and continue everything else possible.
8. Never claim that something is built, tested, installed, packaged, verified, or released unless it actually is.
9. Prefer working software over elaborate planning.
10. Maintain the repository so another developer can understand and contribute to it.

## Product mission

**Make written knowledge understandable in the language and level the reader needs, while preserving the original source and clearly distinguishing translation, explanation, inference, and verification.**

The core product is generic. Medicine is a flagship domain pack, not the whole application.

## Product capabilities — long term

The application should ultimately support:

- PDFs;
- scanned documents and images;
- DOCX and other common document formats;
- Indic and other languages;
- translation;
- simplified explanation;
- document-grounded questions;
- terminology explanations;
- text-to-speech;
- source anchoring;
- optional external fact verification;
- offline/local operation for private documents;
- desktop and mobile distribution.

## Architectural invariants

1. The original document must never be silently modified.
2. Translation must be distinguishable from explanation.
3. Explanation must be distinguishable from external verification.
4. Document-grounded claims must link back to their exact source.
5. Private document processing should be local by default.
6. Network access should be explicit and visible.
7. External verification should transmit claims/search queries rather than source documents wherever possible.
8. AI models should be modular and replaceable.
9. Domain knowledge should be modular through domain packs.
10. The software should be distributable to ordinary users who do not have Python, Git, Conda, Rust, Node, or developer tools installed.

## Current development strategy

Build vertically rather than implementing everything simultaneously.

Current target flow:

1. User installs the application.
2. User opens a selectable-text PDF.
3. User selects a passage.
4. User can **Translate**, **Explain**, or **Ask**.
5. The output remains anchored to the exact source passage.
6. The user can immediately return to the original text.

Initial reference target:

- Windows desktop first;
- English source documents;
- Hindi assistance;
- selectable-text PDFs;
- completely local document handling.

Then progressively add:

- local AI inference;
- stronger source anchoring;
- medical domain pack;
- OCR;
- more Indic languages;
- external verification;
- speech;
- Android/mobile;
- additional file formats.

## Engineering workflow

For each substantial change:

1. inspect the repository state first;
2. identify the smallest useful next milestone;
3. implement the change directly;
4. add or update tests where appropriate;
5. run available validation;
6. inspect and fix failures;
7. commit with meaningful messages;
8. update documentation when behavior or architecture changes;
9. use issues and pull requests when they materially improve traceability.

Keep the following current:

- `README.md`;
- `PRODUCT_SPEC.md`;
- `ARCHITECTURE.md`;
- `ROADMAP.md`;
- privacy/security assumptions;
- build instructions;
- dependency and license information;
- regression tests.

Record durable architectural decisions as ADRs or equivalent design notes when they affect future implementation choices.

## Quality rule

Every milestone should move toward an application that can be installed and run on a second computer.

> “It works in the developer environment” is not sufficient.

Prefer:

`source -> automated build -> installer -> clean-machine test`

## Standard continuation command

When the project owner says:

> **Continue development.**

interpret it as:

> Inspect the current repository and CI state, determine the highest-value next milestone consistent with `PROJECT_MANDATE.md`, `PRODUCT_SPEC.md`, `ARCHITECTURE.md`, and `ROADMAP.md`, implement it directly, test it as far as the available environment permits, diagnose and fix failures, update documentation and project tracking where needed, and report only what actually changed. Do not stop at advice when the work can be performed directly. Involve the project owner only for genuinely necessary decisions, permissions, credentials, irreversible actions, or unavoidable physical steps.

## Stronger continuation command

For maximum autonomy, the project owner can use:

> **Continue development autonomously. Inspect the repository, open issues, pull requests, CI status, roadmap, and current implementation. Choose the most valuable next milestone, implement it end-to-end, add tests, run validation, fix failures, update docs, commit the work, and use GitHub directly. Do not give me a tutorial or ask me to perform routine coding steps. Only stop for a decision or action that genuinely requires me. Never claim success without evidence.**
