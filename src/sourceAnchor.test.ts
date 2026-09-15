import { describe, expect, it } from "vitest";
import {
  anchorMatchesDocument,
  createSourceAnchor,
  normalizeQuote,
  resolveAnchorRange,
  sha256Bytes,
  sha256Text
} from "./sourceAnchor";

const DOC_SHA = "a".repeat(64);

describe("source anchors", () => {
  it("normalizes selected text without changing meaning", () => {
    expect(normalizeQuote("  increased\n afterload   reduces stroke volume ")).toBe(
      "increased afterload reduces stroke volume"
    );
  });

  it("creates a one-based SHA-256 source anchor", async () => {
    const anchor = await createSourceAnchor({
      documentSha256: DOC_SHA,
      page: 4,
      quote: "  sample   text ",
      startItem: 2,
      endItem: 4,
      startOffset: 0,
      endOffset: 5
    });
    expect(anchor.quote).toBe("sample text");
    expect(anchor.page).toBe(4);
    expect(anchor.version).toBe(2);
    expect(anchor.quoteSha256).toBe(await sha256Text("sample text"));
    expect(anchorMatchesDocument(anchor, DOC_SHA)).toBe(true);
    expect(anchorMatchesDocument(anchor, "b".repeat(64))).toBe(false);
  });

  it("rejects invalid ranges", async () => {
    await expect(
      createSourceAnchor({
        documentSha256: DOC_SHA,
        page: 1,
        quote: "text",
        startItem: 3,
        endItem: 2,
        startOffset: 0,
        endOffset: 1
      })
    ).rejects.toThrow();
  });

  it("hashes identical bytes deterministically with SHA-256", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    expect(await sha256Bytes(bytes)).toBe(await sha256Bytes(bytes));
    expect(await sha256Bytes(bytes)).not.toBe(await sha256Bytes(new Uint8Array([1, 2, 3, 4, 6])));
  });

  it("restores a stored range directly when text items are stable", async () => {
    const anchor = await createSourceAnchor({
      documentSha256: DOC_SHA,
      page: 1,
      quote: "beta gamma",
      startItem: 1,
      endItem: 2,
      startOffset: 0,
      endOffset: 5
    });
    expect(resolveAnchorRange(anchor, ["alpha", "beta", "gamma", "delta"])).toEqual({
      startItem: 1,
      endItem: 2
    });
  });

  it("recovers the quote if PDF text-item boundaries shift", async () => {
    const anchor = await createSourceAnchor({
      documentSha256: DOC_SHA,
      page: 1,
      quote: "beta gamma",
      startItem: 4,
      endItem: 5,
      startOffset: 0,
      endOffset: 5
    });
    expect(resolveAnchorRange(anchor, ["alpha", "beta", "gamma", "delta"])).toEqual({
      startItem: 1,
      endItem: 2
    });
  });
});
