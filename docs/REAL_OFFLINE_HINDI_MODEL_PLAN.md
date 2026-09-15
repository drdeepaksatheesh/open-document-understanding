# Smallest Real Offline Hindi Model Integration Plan

## Goal

Replace the built-in deterministic Hindi reference catalog with a real local translation model **without changing** the existing source-anchor, generated-record provenance, or sidecar schema.

The first real-model milestone is intentionally narrower than full v0.1:

- English -> Hindi **Translate** becomes general-purpose and model-backed.
- **Explain** remains available only through the current reference path until a separate local explanation model is introduced.
- The reader, source anchors, generated-record structure, sidecar persistence and restore logic remain unchanged.

This avoids coupling two very different model problems (machine translation and instruction-following explanation) into the first model-runtime integration.

## Chosen first translation model

Use AI4Bharat **IndicTrans2 En-Indic distilled 200M** as the initial candidate.

Reasons:

- designed specifically for English -> Indic translation;
- supports Hindi and the other scheduled Indian languages, giving a clean future path beyond Hindi;
- distilled variant is much smaller than the base model;
- upstream checkpoint is MIT-licensed;
- can run completely offline after weights are installed locally.

The exact model revision used by a released pack must be pinned and checksummed. No runtime `from_pretrained()` network download is allowed.

## Architecture

Keep the desktop application and provenance path unchanged:

```text
PDF selection
   -> existing SourceAnchor
   -> TranslationProvider.translate(request)
   -> local model sidecar process
   -> result text + engine descriptor
   -> existing GeneratedRecord
   -> existing sidecar JSON
```

The only new application-level abstraction is a provider interface:

```ts
interface TranslationProvider {
  descriptor(): EngineDescriptor;
  isAvailable(): Promise<boolean>;
  translate(request: TranslationRequest): Promise<TranslationResult>;
}
```

The current reference engine becomes one provider. The real model becomes another provider. `App.tsx` should not know which runtime produced the result beyond the existing engine metadata.

## Runtime boundary

For the first real model, use a **separate local sidecar process** rather than embedding PyTorch/Transformers into the Tauri process.

Reasons:

- isolates crashes and model memory use from the reader UI;
- keeps Rust/Tauri independent of Python ML dependencies;
- permits later replacement by ONNX Runtime, CTranslate2 or another native runtime without touching provenance/storage;
- makes network auditing straightforward;
- keeps the normal app installer small when the model pack is absent.

Communication should use stdin/stdout JSON lines or another local IPC mechanism. Do not expose an HTTP listener.

## Smallest model pack

Create one pack:

`odu-model-indictrans2-en-indic-dist-200m-hi`

Contents:

```text
manifest.json
LICENSES/
  indictrans2.txt
runtime/
  odu-translate.exe
model/
  <pinned local model/tokenizer files>
checksums.sha256
```

The model pack is installed outside the application binary, under application data, for example:

```text
%LOCALAPPDATA%/OpenDocumentUnderstanding/models/<pack-id>/<version>/
```

The application installer must continue to work without the pack.

## Manifest

The pack manifest is separate from the document sidecar schema and may evolve independently.

Minimum fields:

```json
{
  "schemaVersion": 1,
  "packId": "odu-model-indictrans2-en-indic-dist-200m-hi",
  "packVersion": "0.1.0",
  "engineId": "ai4bharat.indictrans2-en-indic-dist-200m",
  "engineVersion": "<pinned upstream revision>",
  "operation": "translate",
  "sourceLanguages": ["English"],
  "targetLanguages": ["Hindi"],
  "local": true,
  "license": "MIT",
  "files": [{"path": "...", "sha256": "..."}]
}
```

## Provenance mapping

Do **not** alter `GeneratedRecord` or the sidecar schema.

Populate the existing fields as follows:

- `operation`: `translate`
- `sourceAnchor`: unchanged
- `targetLanguage`: `Hindi`
- `engine.id`: `ai4bharat.indictrans2-en-indic-dist-200m`
- `engine.version`: pinned model-pack/runtime version
- `engine.local`: `true`
- `externallyVerified`: `false`
- `humanReviewed`: `false`

The generated translation is therefore stored exactly like the reference-engine output today.

## First Windows runtime

For the first integration, optimize for correctness and packaging reliability rather than ultimate size.

Recommended first implementation:

1. Python translation worker using pinned `transformers` + `torch` + IndicTrans preprocessing.
2. Package the worker and its Python dependencies into the **model pack**, not the main Tauri installer.
3. CPU-first inference on x86-64 Windows.
4. GPU acceleration is explicitly out of scope for the first real-model milestone.
5. No network APIs and no Hugging Face download calls at runtime.

Once this works end-to-end, benchmark conversion to a leaner ONNX/CTranslate2/native runtime as a follow-up optimization. Do not make runtime optimization a prerequisite for proving the real-model path.

## UX

When no real model pack is installed:

- Translate panel shows `Hindi model pack not installed`.
- A local `Install model pack` flow may be added later; the first milestone can support manual import of a downloaded pack file/directory.

When installed:

- Translate button uses the real provider.
- UI provenance badge reads `LOCAL MODEL` rather than `LOCAL REFERENCE ENGINE`.
- Reference engine remains available only in developer/regression mode, not as an automatic fallback for arbitrary user text.

Never silently fall back from a real model failure to the deterministic catalog in normal user mode.

## Scope exclusions

Not part of this milestone:

- Hindi -> English;
- Indic -> Indic;
- OCR;
- DOCX;
- Ask;
- free-form Explain model;
- internet verification;
- GPU acceleration;
- automatic model downloading;
- mobile runtime;
- quantization/runtime optimization beyond what is required to run acceptably on a normal Windows laptop.

## Tests

### Unit tests

- provider selection chooses real provider when a valid pack is present;
- pack manifest validation rejects missing/wrong hashes;
- provider request preserves source text exactly;
- generated provenance maps to existing schema unchanged;
- no-pack state returns `model_not_installed`, not fabricated output;
- runtime errors return a typed failure and do not create a generated record.

### Integration tests

Use synthetic/open English passages spanning:

- physiology;
- administrative instruction;
- safety/SOP;
- an unseen sentence not present in the reference catalog.

The unseen sentence must receive a Hindi translation from the real model.

### CI

CI should:

- run all existing source-anchor/sidecar tests;
- run provider/manifest unit tests without downloading model weights;
- build the Windows app installer;
- build/test the translation worker separately;
- optionally run one heavyweight model smoke test in a manually triggered or cached workflow rather than forcing every PR to download ~GB-scale model assets.

## Exit criterion

The milestone is complete when, on a clean Windows machine with internet disabled:

1. app installer is installed;
2. model pack is imported/installed locally;
3. a selectable English PDF is opened;
4. an arbitrary unseen English sentence is selected;
5. Translate produces Hindi using the local IndicTrans2 model;
6. the generated record uses the existing provenance/sidecar schema;
7. app is closed and reopened;
8. the translation restores from the sidecar;
9. Task Manager/firewall/Wireshark inspection shows no network requirement during translation.

## Next milestone

After the real translation provider is stable, add a **separate local explanation provider** rather than trying to make the translation model perform explanation. The explanation provider can then populate the same existing `operation: explain` provenance records.
