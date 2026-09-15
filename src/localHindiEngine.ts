import { normalizeQuote } from "./sourceAnchor";

export type LocalHindiOperation = "translate" | "explain";

export type LocalHindiRequest = {
  sourceText: string;
  operation: LocalHindiOperation;
  targetLanguage: string;
  explanationLevel: string;
};

export type LocalHindiEngineDescriptor = {
  id: "odu.hindi-reference";
  version: "0.1a.1";
  local: true;
};

export type LocalHindiResult =
  | {
      status: "ok";
      output: string;
      engine: LocalHindiEngineDescriptor;
    }
  | {
      status: "unsupported";
      reason: string;
      engine: LocalHindiEngineDescriptor;
    };

export const LOCAL_HINDI_ENGINE: LocalHindiEngineDescriptor = {
  id: "odu.hindi-reference",
  version: "0.1a.1",
  local: true
};

type CatalogEntry = {
  source: string;
  translate: string;
  explainSimple: string;
};

const CATALOG: CatalogEntry[] = [
  {
    source:
      "Myocardial contractility describes the intrinsic ability of cardiac muscle to generate force at a given preload and afterload.",
    translate:
      "मायोकार्डियल कॉन्ट्रैक्टिलिटी हृदय की मांसपेशी की वह अंतर्निहित क्षमता है जिसके द्वारा वह दिए गए प्रीलोड और आफ्टरलोड पर बल उत्पन्न करती है।",
    explainSimple:
      "सरल शब्दों में, contractility बताती है कि हृदय की मांसपेशी अपनी स्वयं की संकुचन-शक्ति से कितना बल बना सकती है, जब preload और afterload को अलग-अलग रखा जाए।"
  },
  {
    source: "Increasing afterload can reduce stroke volume when other conditions are unchanged.",
    translate:
      "यदि अन्य परिस्थितियाँ समान रहें, तो आफ्टरलोड बढ़ने से स्ट्रोक वॉल्यूम कम हो सकता है।",
    explainSimple:
      "Afterload बढ़ने का अर्थ है कि निलय को रक्त बाहर निकालने के लिए अधिक प्रतिरोध के विरुद्ध काम करना पड़ता है। बाकी स्थितियाँ समान हों तो हर धड़कन में बाहर निकला रक्त कम हो सकता है।"
  },
  {
    source: "Submit Form B to Administration before 4 PM Friday.",
    translate: "शुक्रवार शाम 4 बजे से पहले Form B प्रशासन विभाग में जमा करें।",
    explainSimple:
      "आपको शुक्रवार शाम 4 बजे की समय-सीमा से पहले Form B प्रशासन विभाग में देना है। मुख्य काम: Form B जमा करना; अंतिम समय: शुक्रवार 4 PM।"
  },
  {
    source: "Ensure the device is electrically isolated before servicing.",
    translate: "मरम्मत या सर्विसिंग शुरू करने से पहले उपकरण को बिजली की आपूर्ति से पूरी तरह अलग करें।",
    explainSimple:
      "सर्विसिंग से पहले मशीन की बिजली बंद करें और उसे विद्युत स्रोत से अलग करें, ताकि काम करते समय बिजली का झटका या अनचाहा चालू होना रोका जा सके।"
  }
];

function lookupKey(value: string): string {
  return normalizeQuote(value).toLocaleLowerCase("en-US");
}

const CATALOG_BY_SOURCE = new Map(CATALOG.map((entry) => [lookupKey(entry.source), entry]));

export function runLocalHindi(request: LocalHindiRequest): LocalHindiResult {
  if (request.targetLanguage !== "Hindi") {
    return {
      status: "unsupported",
      reason: "The built-in reference engine currently supports Hindi only.",
      engine: LOCAL_HINDI_ENGINE
    };
  }

  if (request.operation === "explain" && request.explanationLevel !== "Simple") {
    return {
      status: "unsupported",
      reason: "The built-in reference engine currently supports Simple Hindi explanations only.",
      engine: LOCAL_HINDI_ENGINE
    };
  }

  const entry = CATALOG_BY_SOURCE.get(lookupKey(request.sourceText));
  if (!entry) {
    return {
      status: "unsupported",
      reason:
        "This passage is outside the small built-in reference catalog. No translation or explanation was invented.",
      engine: LOCAL_HINDI_ENGINE
    };
  }

  return {
    status: "ok",
    output: request.operation === "translate" ? entry.translate : entry.explainSimple,
    engine: LOCAL_HINDI_ENGINE
  };
}

export function referenceCatalogSize(): number {
  return CATALOG.length;
}
