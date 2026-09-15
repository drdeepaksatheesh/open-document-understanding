import { runLocalHindi } from "./localHindiEngine";
import type { ModelPackManifest } from "./modelPack";
import { supportsEnglishToHindiTranslation } from "./modelPack";

export type EngineDescriptor = {
  id: string;
  version: string;
  local: boolean;
};

export type TranslationRequest = {
  sourceText: string;
  sourceLanguage: "English";
  targetLanguage: "Hindi";
};

export type TranslationFailureCode =
  | "model_not_installed"
  | "unsupported_language"
  | "runtime_not_connected"
  | "runtime_failed";

export type TranslationResult =
  | { status: "ok"; output: string; engine: EngineDescriptor }
  | { status: "error"; code: TranslationFailureCode; message: string; engine?: EngineDescriptor };

export interface TranslationProvider {
  readonly kind: "reference" | "model-pack";
  descriptor(): EngineDescriptor | null;
  isAvailable(): Promise<boolean>;
  translate(request: TranslationRequest): Promise<TranslationResult>;
}

export class ReferenceTranslationProvider implements TranslationProvider {
  readonly kind = "reference" as const;

  descriptor(): EngineDescriptor {
    return { id: "odu.hindi-reference", version: "0.1a.2", local: true };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    if (request.sourceLanguage !== "English" || request.targetLanguage !== "Hindi") {
      return { status: "error", code: "unsupported_language", message: "Reference provider supports English to Hindi only." };
    }

    const result = runLocalHindi({
      sourceText: request.sourceText,
      operation: "translate",
      targetLanguage: request.targetLanguage,
      explanationLevel: "Simple"
    });

    if (result.status === "unsupported") {
      return {
        status: "error",
        code: "runtime_failed",
        message: result.reason,
        engine: result.engine
      };
    }

    return { status: "ok", output: result.output, engine: result.engine };
  }
}

export class ModelPackTranslationProvider implements TranslationProvider {
  readonly kind = "model-pack" as const;

  constructor(readonly manifest: ModelPackManifest | null) {}

  descriptor(): EngineDescriptor | null {
    if (!this.manifest) return null;
    return { id: this.manifest.engineId, version: this.manifest.engineVersion, local: true };
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.manifest && supportsEnglishToHindiTranslation(this.manifest));
  }

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    if (!this.manifest || !(await this.isAvailable())) {
      return {
        status: "error",
        code: "model_not_installed",
        message: "Hindi translation model pack is not installed."
      };
    }
    if (request.sourceLanguage !== "English" || request.targetLanguage !== "Hindi") {
      return {
        status: "error",
        code: "unsupported_language",
        message: "The installed pack does not support this language pair.",
        engine: this.descriptor() ?? undefined
      };
    }

    return {
      status: "error",
      code: "runtime_not_connected",
      message: "The validated model pack is installed, but its local inference worker is not connected in this phase.",
      engine: this.descriptor() ?? undefined
    };
  }
}

export function chooseUserTranslationProvider(manifests: ModelPackManifest[]): TranslationProvider {
  const compatible = manifests.find(supportsEnglishToHindiTranslation) ?? null;
  return new ModelPackTranslationProvider(compatible);
}

export function createReferenceTranslationProvider(): TranslationProvider {
  return new ReferenceTranslationProvider();
}
