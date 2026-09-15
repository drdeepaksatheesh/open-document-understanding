import { invoke, isTauri } from "@tauri-apps/api/core";
import type { SourceAnchor } from "./sourceAnchor";

const SIDECAR_PREFIX = "odu.sidecar.v1.";

export type ProvenanceOperation = "source" | "translate" | "explain" | "ask" | "verify";

export type ProvenanceRecord = {
  id: string;
  operation: ProvenanceOperation;
  anchor: SourceAnchor;
  createdAt: string;
  output?: string;
  question?: string;
  targetLanguage?: string;
  explanationLevel?: string;
  engine?: {
    id: string;
    version: string;
    local: boolean;
  };
  externallyVerified: boolean;
  humanReviewed: boolean;
};

export type DocumentSidecar = {
  schemaVersion: 1;
  document: {
    sha256: string;
    fileName: string;
    byteLength: number;
  };
  records: ProvenanceRecord[];
  createdAt: string;
  updatedAt: string;
};

export function sidecarStorageKey(documentSha256: string): string {
  return `${SIDECAR_PREFIX}${documentSha256}`;
}

export function createDocumentSidecar(document: DocumentSidecar["document"]): DocumentSidecar {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    document,
    records: [],
    createdAt: now,
    updatedAt: now
  };
}

export function addSourceRecord(sidecar: DocumentSidecar, anchor: SourceAnchor): DocumentSidecar {
  if (anchor.documentSha256 !== sidecar.document.sha256) {
    throw new Error("Cannot attach an anchor to a different document sidecar.");
  }

  const record: ProvenanceRecord = {
    id: `source-${anchor.quoteSha256.slice(0, 12)}-${Date.now()}`,
    operation: "source",
    anchor,
    createdAt: new Date().toISOString(),
    externallyVerified: false,
    humanReviewed: false
  };

  const records = [
    ...sidecar.records.filter(
      (existing) =>
        !(
          existing.operation === "source" &&
          existing.anchor.page === anchor.page &&
          existing.anchor.quoteSha256 === anchor.quoteSha256
        )
    ),
    record
  ];

  return {
    ...sidecar,
    records,
    updatedAt: record.createdAt
  };
}

export function addGeneratedRecord(
  sidecar: DocumentSidecar,
  input: {
    operation: "translate" | "explain";
    anchor: SourceAnchor;
    output: string;
    targetLanguage: string;
    explanationLevel?: string;
    engine: { id: string; version: string; local: boolean };
  }
): DocumentSidecar {
  if (input.anchor.documentSha256 !== sidecar.document.sha256) {
    throw new Error("Cannot attach generated output to a different document sidecar.");
  }
  if (!input.output.trim()) throw new Error("Generated output cannot be empty.");

  const createdAt = new Date().toISOString();
  const record: ProvenanceRecord = {
    id: `${input.operation}-${input.anchor.quoteSha256.slice(0, 12)}-${Date.now()}`,
    operation: input.operation,
    anchor: input.anchor,
    output: input.output.trim(),
    targetLanguage: input.targetLanguage,
    explanationLevel: input.explanationLevel,
    engine: input.engine,
    createdAt,
    externallyVerified: false,
    humanReviewed: false
  };

  const records = [
    ...sidecar.records.filter(
      (existing) =>
        !(
          existing.operation === input.operation &&
          existing.anchor.quoteSha256 === input.anchor.quoteSha256 &&
          existing.targetLanguage === input.targetLanguage &&
          existing.explanationLevel === input.explanationLevel &&
          existing.engine?.id === input.engine.id &&
          existing.engine?.version === input.engine.version
        )
    ),
    record
  ];

  return { ...sidecar, records, updatedAt: createdAt };
}

export function latestSourceAnchor(sidecar: DocumentSidecar): SourceAnchor | null {
  const sources = sidecar.records.filter((record) => record.operation === "source");
  if (sources.length === 0) return null;
  return sources[sources.length - 1].anchor;
}

export function latestGeneratedRecord(
  sidecar: DocumentSidecar,
  input: {
    operation: "translate" | "explain";
    anchor: SourceAnchor;
    targetLanguage: string;
    explanationLevel?: string;
  }
): ProvenanceRecord | null {
  const matching = sidecar.records.filter(
    (record) =>
      record.operation === input.operation &&
      record.anchor.quoteSha256 === input.anchor.quoteSha256 &&
      record.targetLanguage === input.targetLanguage &&
      record.explanationLevel === input.explanationLevel &&
      typeof record.output === "string"
  );
  return matching.length ? matching[matching.length - 1] : null;
}

export function parseDocumentSidecar(value: string): DocumentSidecar | null {
  try {
    const parsed = JSON.parse(value) as DocumentSidecar;
    if (parsed.schemaVersion !== 1) return null;
    if (!parsed.document || !/^[a-f0-9]{64}$/.test(parsed.document.sha256)) return null;
    if (!Array.isArray(parsed.records)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function loadDocumentSidecar(documentSha256: string): Promise<DocumentSidecar | null> {
  if (isTauri()) {
    const raw = await invoke<string | null>("load_sidecar", { documentSha256 });
    return raw ? parseDocumentSidecar(raw) : null;
  }

  const raw = localStorage.getItem(sidecarStorageKey(documentSha256));
  return raw ? parseDocumentSidecar(raw) : null;
}

export async function saveDocumentSidecar(sidecar: DocumentSidecar): Promise<void> {
  const serialized = JSON.stringify(sidecar, null, 2);
  if (isTauri()) {
    await invoke("save_sidecar", {
      documentSha256: sidecar.document.sha256,
      contents: serialized
    });
    return;
  }

  localStorage.setItem(sidecarStorageKey(sidecar.document.sha256), serialized);
}
