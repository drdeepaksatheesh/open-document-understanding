import { describe, expect, it } from "vitest";
import { anchorMatchesDocument, createSourceAnchor, fingerprintBytes, normalizeQuote } from "./sourceAnchor";

describe("source anchors", () => {
  it("normalizes selected text without changing meaning", () => {
    expect(normalizeQuote("  increased\n afterload   reduces stroke volume ")).toBe(
      "increased afterload reduces stroke volume"
    );
  });

  it("creates a one-based page anchor", () => {
    const anchor = createSourceAnchor({
      documentFingerprint: "doc-1",
      page: 4,
      quote: "  sample   text ",
      startItem: 2,
      endItem: 4,
      startOffset: 0,
      endOffset: 5
    });
    expect(anchor.quote).toBe("sample text");
    expect(anchor.page).toBe(4);
    expect(anchor.version).toBe(1);
    expect(anchorMatchesDocument(anchor, "doc-1")).toBe(true);
    expect(anchorMatchesDocument(anchor, "doc-2")).toBe(false);
  });

  it("rejects invalid ranges", () => {
    expect(() =>
      createSourceAnchor({
        documentFingerprint: "doc-1",
        page: 1,
        quote: "text",
        startItem: 3,
        endItem: 2,
        startOffset: 0,
        endOffset: 1
      })
    ).toThrow();
  });

  it("fingerprints identical bytes deterministically", () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    expect(fingerprintBytes(bytes)).toBe(fingerprintBytes(bytes));
    expect(fingerprintBytes(bytes)).not.toBe(fingerprintBytes(new Uint8Array([1, 2, 3, 4, 6])));
  });
});
