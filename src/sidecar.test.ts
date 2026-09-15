import { describe, expect, it } from "vitest";
import { createSourceAnchor } from "./sourceAnchor";
import {
  addSourceRecord,
  createDocumentSidecar,
  latestSourceAnchor,
  parseDocumentSidecar
} from "./sidecar";

const DOC_SHA = "c".repeat(64);

describe("document sidecar", () => {
  it("persists source provenance without modifying the document", async () => {
    const sidecar = createDocumentSidecar({
      sha256: DOC_SHA,
      fileName: "sample.pdf",
      byteLength: 1234
    });
    const anchor = await createSourceAnchor({
      documentSha256: DOC_SHA,
      page: 2,
      quote: "source passage",
      startItem: 3,
      endItem: 4,
      startOffset: 0,
      endOffset: 7
    });

    const updated = addSourceRecord(sidecar, anchor);
    expect(updated.records).toHaveLength(1);
    expect(updated.records[0].operation).toBe("source");
    expect(updated.records[0].externallyVerified).toBe(false);
    expect(latestSourceAnchor(updated)?.quote).toBe("source passage");
  });

  it("deduplicates the same source selection", async () => {
    let sidecar = createDocumentSidecar({ sha256: DOC_SHA, fileName: "sample.pdf", byteLength: 1234 });
    const anchor = await createSourceAnchor({
      documentSha256: DOC_SHA,
      page: 1,
      quote: "same selection",
      startItem: 0,
      endItem: 1,
      startOffset: 0,
      endOffset: 4
    });
    sidecar = addSourceRecord(sidecar, anchor);
    sidecar = addSourceRecord(sidecar, anchor);
    expect(sidecar.records).toHaveLength(1);
  });

  it("rejects malformed serialized sidecars", () => {
    expect(parseDocumentSidecar("not json")).toBeNull();
    expect(parseDocumentSidecar(JSON.stringify({ schemaVersion: 2 }))).toBeNull();
  });
});
