# ADR 0002: Prove local intelligence with a deterministic reference engine before adding a model runtime

- Status: Accepted
- Date: 2026-09-15

## Context

The product needs real local Hindi translation/explanation, but introducing a production model immediately would couple provenance work to model packaging, runtime selection, hardware fallback, licensing, memory/performance and distribution concerns.

The provenance layer is already stable enough to store generated outputs. We need to prove the entire generated-output lifecycle independently from model quality.

## Decision

Introduce a tiny deterministic in-process Hindi reference engine with an explicit regression catalog. It supports only known passages and returns `unsupported` for everything else.

The engine uses the same interface and provenance metadata expected from future model-backed engines:

- operation;
- output;
- target language;
- explanation level;
- engine id/version/local flag;
- exact source anchor;
- external-verification and human-review flags.

No network capability is added.

## Consequences

Positive:

- UI → local engine → provenance record → durable sidecar → reopen/restore can be tested end-to-end now.
- The application never pretends that a fixture-backed engine is a general translator.
- Future model runtimes can replace the implementation without changing the sidecar contract.
- CI remains fast and deterministic.

Negative:

- v0.1a is not useful for arbitrary documents yet.
- The reference outputs must be clearly labelled to avoid giving users a false impression of coverage.

## Follow-up

A separate model-pack milestone will select and benchmark a distributable local English↔Indic translation/explanation runtime and preserve this provenance contract.
