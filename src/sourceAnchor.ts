export type SourceAnchor = {
  version: 2;
  documentSha256: string;
  page: number;
  quote: string;
  quoteSha256: string;
  startItem: number;
  endItem: number;
  startOffset: number;
  endOffset: number;
  createdAt: string;
};

export type ResolvedAnchorRange = {
  startItem: number;
  endItem: number;
};

export function normalizeQuote(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return bytesToHex(new Uint8Array(digest));
}

export async function sha256Text(value: string): Promise<string> {
  return sha256Bytes(new TextEncoder().encode(value));
}

export async function createSourceAnchor(
  input: Omit<SourceAnchor, "version" | "createdAt" | "quote" | "quoteSha256"> & { quote: string }
): Promise<SourceAnchor> {
  const quote = normalizeQuote(input.quote);
  if (!quote) throw new Error("Cannot anchor an empty selection.");
  if (!/^[a-f0-9]{64}$/.test(input.documentSha256)) throw new Error("Document SHA-256 is invalid.");
  if (input.page < 1) throw new Error("Page numbers are one-based.");
  if (input.startItem < 0 || input.endItem < input.startItem) throw new Error("Invalid text-item range.");
  if (input.startOffset < 0 || input.endOffset < 0) throw new Error("Selection offsets cannot be negative.");

  return {
    ...input,
    quote,
    quoteSha256: await sha256Text(quote),
    version: 2,
    createdAt: new Date().toISOString()
  };
}

export function anchorMatchesDocument(anchor: SourceAnchor, sha256: string): boolean {
  return anchor.documentSha256 === sha256;
}

export function resolveAnchorRange(anchor: SourceAnchor, itemTexts: string[]): ResolvedAnchorRange | null {
  const expected = normalizeQuote(anchor.quote);
  if (!expected) return null;

  const storedSlice = normalizeQuote(itemTexts.slice(anchor.startItem, anchor.endItem + 1).join(" "));
  if (storedSlice === expected) {
    return { startItem: anchor.startItem, endItem: anchor.endItem };
  }

  // Fallback for a renderer/text-item split that changes while the PDF content stays identical.
  // We search the page's text items for the same normalized source quote.
  for (let startItem = 0; startItem < itemTexts.length; startItem += 1) {
    let candidate = "";
    for (let endItem = startItem; endItem < itemTexts.length; endItem += 1) {
      candidate = normalizeQuote(`${candidate} ${itemTexts[endItem]}`);
      if (candidate === expected) return { startItem, endItem };
      if (candidate.length > expected.length + 16) break;
    }
  }

  return null;
}
