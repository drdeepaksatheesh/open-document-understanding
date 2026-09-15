export type SourceAnchor = {
  version: 1;
  documentFingerprint: string;
  page: number;
  quote: string;
  startItem: number;
  endItem: number;
  startOffset: number;
  endOffset: number;
  createdAt: string;
};

export function normalizeQuote(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function createSourceAnchor(input: Omit<SourceAnchor, "version" | "createdAt" | "quote"> & { quote: string }): SourceAnchor {
  const quote = normalizeQuote(input.quote);
  if (!quote) throw new Error("Cannot anchor an empty selection.");
  if (input.page < 1) throw new Error("Page numbers are one-based.");
  if (input.startItem < 0 || input.endItem < input.startItem) throw new Error("Invalid text-item range.");

  return {
    ...input,
    quote,
    version: 1,
    createdAt: new Date().toISOString()
  };
}

export function anchorMatchesDocument(anchor: SourceAnchor, fingerprint: string): boolean {
  return anchor.documentFingerprint === fingerprint;
}

export function fingerprintBytes(bytes: Uint8Array): string {
  // Fast, deterministic non-cryptographic fingerprint for UI anchoring only.
  // A cryptographic document hash will replace this at the sidecar/provenance milestone.
  let hash = 2166136261;
  const step = Math.max(1, Math.floor(bytes.length / 8192));
  for (let i = 0; i < bytes.length; i += step) {
    hash ^= bytes[i];
    hash = Math.imul(hash, 16777619);
  }
  hash ^= bytes.length;
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}-${bytes.length}`;
}
