export type ModelPackFile = {
  path: string;
  sha256: string;
};

export type ModelPackManifest = {
  schemaVersion: 1;
  packId: string;
  packVersion: string;
  engineId: string;
  engineVersion: string;
  operation: "translate" | "explain";
  sourceLanguages: string[];
  targetLanguages: string[];
  local: true;
  license: string;
  files: ModelPackFile[];
};

const SHA256_RE = /^[a-f0-9]{64}$/i;
const SAFE_COMPONENT_RE = /^[A-Za-z0-9._-]+$/;

export function isSafePackComponent(value: string): boolean {
  return value.length > 0 && SAFE_COMPONENT_RE.test(value) && value !== "." && value !== "..";
}

export function isSafeRelativePackPath(value: string): boolean {
  if (!value || value.startsWith("/") || value.startsWith("\\")) return false;
  if (/^[A-Za-z]:[\\/]/.test(value)) return false;
  const parts = value.split(/[\\/]+/);
  return parts.length > 0 && parts.every(isSafePackComponent);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string" && item.length > 0);
}

export function parseModelPackManifest(value: unknown): ModelPackManifest {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Model-pack manifest must be an object.");
  const input = value as Record<string, unknown>;

  if (input.schemaVersion !== 1) throw new Error("Unsupported model-pack schema version.");
  if (typeof input.packId !== "string" || !isSafePackComponent(input.packId)) throw new Error("Invalid model-pack id.");
  if (typeof input.packVersion !== "string" || !isSafePackComponent(input.packVersion)) throw new Error("Invalid model-pack version.");
  if (typeof input.engineId !== "string" || input.engineId.length === 0) throw new Error("Invalid engine id.");
  if (typeof input.engineVersion !== "string" || input.engineVersion.length === 0) throw new Error("Invalid engine version.");
  if (input.operation !== "translate" && input.operation !== "explain") throw new Error("Invalid model-pack operation.");
  if (!isStringArray(input.sourceLanguages)) throw new Error("Model pack must declare source languages.");
  if (!isStringArray(input.targetLanguages)) throw new Error("Model pack must declare target languages.");
  if (input.local !== true) throw new Error("Model pack must declare local=true.");
  if (typeof input.license !== "string" || input.license.length === 0) throw new Error("Model pack must declare a license.");
  if (!Array.isArray(input.files) || input.files.length === 0) throw new Error("Model pack must declare files.");

  const files: ModelPackFile[] = input.files.map((candidate, index) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) throw new Error(`Invalid file entry at index ${index}.`);
    const file = candidate as Record<string, unknown>;
    if (typeof file.path !== "string" || !isSafeRelativePackPath(file.path)) throw new Error(`Unsafe model-pack path at index ${index}.`);
    if (typeof file.sha256 !== "string" || !SHA256_RE.test(file.sha256)) throw new Error(`Invalid SHA-256 at index ${index}.`);
    return { path: file.path, sha256: file.sha256.toLowerCase() };
  });

  const duplicate = files.find((file, index) => files.findIndex((other) => other.path === file.path) !== index);
  if (duplicate) throw new Error(`Duplicate model-pack file path: ${duplicate.path}`);

  return {
    schemaVersion: 1,
    packId: input.packId,
    packVersion: input.packVersion,
    engineId: input.engineId,
    engineVersion: input.engineVersion,
    operation: input.operation,
    sourceLanguages: [...input.sourceLanguages],
    targetLanguages: [...input.targetLanguages],
    local: true,
    license: input.license,
    files
  };
}

export function parseModelPackManifestJson(json: string): ModelPackManifest {
  return parseModelPackManifest(JSON.parse(json));
}

export function supportsEnglishToHindiTranslation(manifest: ModelPackManifest): boolean {
  return (
    manifest.operation === "translate" &&
    manifest.local === true &&
    manifest.sourceLanguages.includes("English") &&
    manifest.targetLanguages.includes("Hindi")
  );
}
