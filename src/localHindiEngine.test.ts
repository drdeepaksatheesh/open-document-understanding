import { describe, expect, it } from "vitest";
import { referenceCatalogSize, runLocalHindi } from "./localHindiEngine";

const MEDICAL =
  "Myocardial contractility describes the intrinsic ability of cardiac muscle to generate force at a given preload and afterload.";

describe("local Hindi reference engine", () => {
  it("translates the synthetic medical passage entirely locally", () => {
    const result = runLocalHindi({
      sourceText: MEDICAL,
      operation: "translate",
      targetLanguage: "Hindi",
      explanationLevel: "Simple"
    });

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.output).toContain("मायोकार्डियल");
      expect(result.engine.local).toBe(true);
      expect(result.engine.id).toBe("odu.hindi-reference");
    }
  });

  it("explains the same passage in simple Hindi", () => {
    const result = runLocalHindi({
      sourceText: MEDICAL,
      operation: "explain",
      targetLanguage: "Hindi",
      explanationLevel: "Simple"
    });

    expect(result.status).toBe("ok");
    if (result.status === "ok") expect(result.output).toContain("सरल शब्दों में");
  });

  it("supports at least one non-medical passage", () => {
    const result = runLocalHindi({
      sourceText: "Submit Form B to Administration before 4 PM Friday.",
      operation: "explain",
      targetLanguage: "Hindi",
      explanationLevel: "Simple"
    });

    expect(result.status).toBe("ok");
    expect(referenceCatalogSize()).toBeGreaterThanOrEqual(3);
  });

  it("rejects unknown passages rather than fabricating an answer", () => {
    const result = runLocalHindi({
      sourceText: "An unseen passage that is not part of the regression catalog.",
      operation: "translate",
      targetLanguage: "Hindi",
      explanationLevel: "Simple"
    });

    expect(result.status).toBe("unsupported");
    if (result.status === "unsupported") expect(result.reason).toMatch(/outside the small built-in reference catalog/i);
  });

  it("rejects unsupported language and explanation settings explicitly", () => {
    expect(
      runLocalHindi({
        sourceText: MEDICAL,
        operation: "translate",
        targetLanguage: "English",
        explanationLevel: "Simple"
      }).status
    ).toBe("unsupported");

    expect(
      runLocalHindi({
        sourceText: MEDICAL,
        operation: "explain",
        targetLanguage: "Hindi",
        explanationLevel: "Technical"
      }).status
    ).toBe("unsupported");
  });
});
