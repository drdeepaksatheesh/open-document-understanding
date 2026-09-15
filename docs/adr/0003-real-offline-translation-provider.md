# ADR 0003 — Real offline translation model as a replaceable provider

Status: Accepted for implementation planning

## Context

v0.1a proved the complete local source-anchor -> generated-output -> provenance -> sidecar lifecycle using a deterministic Hindi reference catalog. The next step is to introduce a real offline translation model without destabilizing the proven storage/provenance architecture.

## Decision

Introduce a replaceable `TranslationProvider` boundary and implement the first real provider using AI4Bharat IndicTrans2 En-Indic distilled 200M in a separate local sidecar process/model pack.

The existing SourceAnchor, GeneratedRecord and document sidecar schemas remain unchanged. Model-pack metadata lives in a separate manifest schema.

The first real-model milestone implements general English -> Hindi **Translate** only. Free-form **Explain** is a separate model problem and will be implemented by a later explanation provider. The existing reference engine remains for regression/developer use and must not silently masquerade as the production translator.

The initial Windows runtime may use packaged Python + pinned Transformers/PyTorch dependencies inside the model pack. This is intentionally a correctness-first integration; later optimization to ONNX/CTranslate2/native runtimes is allowed behind the same provider interface.

No runtime model downloads, HTTP listener, telemetry or document upload are permitted.

## Consequences

### Positive

- protects the proven provenance and sidecar contract;
- lets translation runtime technology change independently;
- keeps the main application installer smaller than the model/runtime bundle;
- creates a direct future path to other Indic target languages;
- cleanly separates translation from explanation.

### Costs

- first model pack may be large because Python/PyTorch are packaged for reliability;
- Windows CPU inference may be slower than a later optimized native runtime;
- model-pack installation and validation become a new subsystem.

## Candidate model rationale

AI4Bharat IndicTrans2 En-Indic distilled 200M is the initial candidate because it is purpose-built for English-to-Indic translation, has an MIT-licensed upstream checkpoint, and supports Hindi plus the broader Indic language roadmap.

## Non-goals

This ADR does not select the final long-term inference runtime, quantization format, explanation LLM, OCR stack, or mobile model strategy.
