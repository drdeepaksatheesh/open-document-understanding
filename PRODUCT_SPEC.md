# Product Specification

## Product mission

Open Document Understanding helps a person understand a document in the language and level they are comfortable with while preserving the original source.

The application is not primarily a translator. Translation is one tool inside a broader document-understanding workflow.

## Target users

The core product should be useful to:

- students who understand concepts better in a preferred language;
- students whose English is adequate but who need conceptual explanation;
- technical staff reading manuals and SOPs;
- office staff reading circulars, forms, notices and policies;
- housekeeping and support staff reading instructions and safety documents;
- patients or families reading non-sensitive informational material;
- educators and professionals working across language boundaries.

## Core interaction model

A user opens a document and can act on selected text with clearly separated operations:

- **Translate** — preserve the meaning of the source in another language;
- **Explain** — teach what the source means at the requested level;
- **Ask** — answer a question using the selected passage/document as context;
- **Verify** — later, optionally compare claims against external authoritative sources.

Translation, explanation, inference and verification must never be silently blended.

## v0.1 product contract

The first useful public milestone should allow a user to:

1. install the application on Windows without developer tools;
2. open a selectable-text PDF stored locally;
3. read the PDF in the application;
4. select a sentence or paragraph;
5. see the exact selected source text and page anchor;
6. choose **Translate**, **Explain**, or **Ask**;
7. receive Hindi assistance locally;
8. return immediately to the exact original passage;
9. use the core document workflow without uploading the PDF.

## v0.1 constraints

### Included

- Windows desktop;
- selectable-text PDF;
- English source documents;
- Hindi assistance;
- local source handling;
- source anchoring;
- translation/explanation/question modes;
- visible local/network state;
- synthetic regression fixtures.

### Explicitly deferred

- OCR for scanned PDFs;
- DOCX;
- camera capture;
- Android/iOS;
- speech;
- automatic internet fact checking;
- all Indic languages;
- figure-label translation;
- safety-critical use;
- clinical decision support.

## Language and explanation settings

Language and explanation depth are independent dimensions.

Examples of valid future combinations:

- simple English;
- MBBS-level English;
- simple Hindi;
- technical Hindi;
- bilingual Hindi + English medical vocabulary;
- advanced explanation in an Indic language.

The product must not encode the assumption that an Indic-language explanation is inherently simpler than an English explanation.

## Source/provenance model

Each generated response should retain provenance metadata sufficient to answer:

- which document produced this context?
- which page?
- which selected text or source block?
- which operation generated the output?
- which model/engine/version generated it?
- was external verification used?
- has a human reviewed the output?

## Privacy model

The default reading path is local.

Opening a document must not require an account or document upload.

Future online verification must be explicit. Where practical, it should transmit a narrow claim or search query instead of the source document or page image.

## Domain packs

The generic reader should support optional domain packs.

The first sophisticated domain pack will be **Medical Science**, initially biased toward first-year medical education and physiology because that domain can be evaluated by the project owner.

A domain pack may provide:

- terminology;
- protected terms and symbols;
- preferred translations/transliterations;
- explanation templates;
- source hierarchies for verification;
- domain-specific warnings;
- educational depth profiles;
- evaluation fixtures.

## Non-goals

The project is not intended to:

- publish unauthorized translated editions of copyrighted books;
- silently rewrite source documents;
- replace professional translators for certified/legal translation;
- provide unreviewed clinical decision support;
- hide AI-generated statements as if they came from the source.

## Product quality bar

The application should be understandable to a normal user who has never used Git, Python, Node, Rust, Conda or a terminal.
