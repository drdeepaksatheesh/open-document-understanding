import { describe, expect, it } from "vitest";
import { createSourceAnchor } from "./sourceAnchor";
import {
  addGeneratedRecord,
  addSourceRecord,
  createDocumentSidecar,
  latestGeneratedRecord,
  latestSourceAnchor,
  parseDocumentSidecar
} from "./sidecar";

const DOC_SHA = "c".repeat(64);

async function makeAnchor(quote = "source passage") {
  return createSourceAnchor({
    documentSha256: DOC_SHA,
    page: 2,
    quote,
    startItem: 3,
    endItem: 4,
    startOffset: 0,
    endOffset: 7
  });
}

describe("document sidecar", () => {
  it("persists source provenance without modifying the document", async () => {
    const sidecar = createDocumentSidecar({
      sha256: DOC_SHA,
      fileName: "sample.pdf",
      byteLength: 1234
    });
    const anchor = await makeAnchor();

    const updated = addSourceRecord(sidecar, anchor);
    expect(updated.records).toHaveLength(1);
    expect(updated.records[0].operation).toBe("source");
    expect(updated.records[0].externallyVerified).toBe(false);
    expect(latestSourceAnchor(updated)?.quote).toBe("source passage");
  });

  it("deduplicates the same source selection", async () => {
    let sidecar = createDocumentSidecar({ sha256: DOC_SHA, fileName: "sample.pdf", byteLength: 1234 });
    const anchor = await makeAnchor("same selection");
    sidecar = addSourceRecord(sidecar, anchor);
    sidecar = addSourceRecord(sidecar, anchor);
    expect(sidecar.records).toHaveLength(1);
  });

  it("persists and restores a local translation independently from the source record", async () => {
    let sidecar = createDocumentSidecar({ sha256: DOC_SHA, fileName: "sample.pdf", byteLength: 1234 });
    const anchor = await makeAnchor("medical source");
    sidecar = addSourceRecord(sidecar, anchor);
    sidecar = addGeneratedRecord(sidecar, {
      operation: "translate",
      anchor,
      output: "स्थानीय हिन्दी अनुवाद",
      targetLanguage: "Hindi",
      engine: { id: "odu.hindi-reference", version: "0.1a.1", local: true }
    });

    const restored = latestGeneratedRecord(sidecar, {
      operation: "translate",
      anchor,
      targetLanguage: "Hindi"
    });

    expect(sidecar.records).toHaveLength(2);
    expect(restored?.output).toBe("स्थानीय हिन्दी अनुवाद");
    expect(restored?.engine?.local).toBe(true);
    expect(restored?.externallyVerified).toBe(false);
    expect(restored?.humanReviewed).toBe(false);
  });

  it("keeps Translate and Explain provenance records separate", async () => {
    let sidecar = createDocumentSidecar({ sha256: DOC_SHA, fileName: "sample.pdf", byteLength: 1234 });
    const anchor = await makeAnchor("same source");
    const engine = { id: "odu.hindi-reference", version: "0.1a.1", local: true };

    sidecar = addGeneratedRecord(sidecar, {
      operation: "translate",
      anchor,
      output: "अनुवाद",
      targetLanguage: "Hindi",
      engine
    });
    sidecar = addGeneratedRecord(sidecar, {
      operation: "explain",
      anchor,
      output: "सरल व्याख्या",
      targetLanguage: "Hindi",
      explanationLevel: "Simple",
      engine
    });

    expect(
      latestGeneratedRecord(sidecar, {
        operation: "translate",
        anchor,
        targetLanguage: "Hindi"
      })?.output
    ).toBe("अनुवाद");
    expect(
      latestGeneratedRecord(sidecar, {
        operation: "explain",
        anchor,
        targetLanguage: "Hindi",
        explanationLevel: "Simple"
      })?.output
    ).toBe("सरल व्याख्या");
  });

  it("rejects malformed serialized sidecars", () => {
    expect(parseDocumentSidecar("not json")).toBeNull();
    expect(parseDocumentSidecar(JSON.stringify({ schemaVersion: 2 }))).toBeNull();
  });
});
