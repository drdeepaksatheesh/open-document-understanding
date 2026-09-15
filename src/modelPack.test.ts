import { describe, expect, it } from "vitest";
import { parseModelPackManifest, supportsEnglishToHindiTranslation } from "./modelPack";
import { chooseUserTranslationProvider } from "./translationProvider";

const VALID = {
  schemaVersion: 1,
  packId: "odu-model-indictrans2-en-indic-dist-200m-hi",
  packVersion: "0.1.0",
  engineId: "ai4bharat.indictrans2-en-indic-dist-200m",
  engineVersion: "pinned-revision",
  operation: "translate",
  sourceLanguages: ["English"],
  targetLanguages: ["Hindi"],
  local: true,
  license: "MIT",
  files: [
    {
      path: "runtime/odu-translate.exe",
      sha256: "a".repeat(64)
    }
  ]
};

describe("model-pack manifest", () => {
  it("accepts the intended English-to-Hindi pack contract", () => {
    const manifest = parseModelPackManifest(VALID);
    expect(manifest.packId).toBe(VALID.packId);
    expect(supportsEnglishToHindiTranslation(manifest)).toBe(true);
  });

  it.each(["../secret.bin", "model/../../secret.bin", "/absolute/model.bin", "C:\\model\\weights.bin"])(
    "rejects unsafe file path %s",
    (path) => {
      expect(() => parseModelPackManifest({ ...VALID, files: [{ path, sha256: "a".repeat(64) }] })).toThrow(/unsafe/i);
    }
  );

  it("rejects malformed hashes", () => {
    expect(() => parseModelPackManifest({ ...VALID, files: [{ path: "model/weights.bin", sha256: "not-a-hash" }] })).toThrow(
      /sha-256/i
    );
  });

  it("rejects duplicate file paths", () => {
    const file = { path: "model/weights.bin", sha256: "b".repeat(64) };
    expect(() => parseModelPackManifest({ ...VALID, files: [file, file] })).toThrow(/duplicate/i);
  });
});

describe("translation provider selection", () => {
  it("returns a no-pack model provider when no compatible pack exists", async () => {
    const provider = chooseUserTranslationProvider([]);
    expect(provider.kind).toBe("model-pack");
    expect(await provider.isAvailable()).toBe(false);
    const result = await provider.translate({ sourceText: "Arbitrary text", sourceLanguage: "English", targetLanguage: "Hindi" });
    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.code).toBe("model_not_installed");
  });

  it("selects a compatible validated pack without changing provenance metadata shape", async () => {
    const manifest = parseModelPackManifest(VALID);
    const provider = chooseUserTranslationProvider([manifest]);
    expect(await provider.isAvailable()).toBe(true);
    expect(provider.descriptor()).toEqual({
      id: VALID.engineId,
      version: VALID.engineVersion,
      local: true
    });
    const result = await provider.translate({ sourceText: "Unseen sentence", sourceLanguage: "English", targetLanguage: "Hindi" });
    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.code).toBe("runtime_not_connected");
  });
});
