import { useEffect, useMemo, useRef, useState } from "react";
import { getDocument, type PDFDocumentProxy, type PDFPageProxy } from "pdfjs-dist";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { PdfPage } from "./PdfPage";
import { runLocalHindi } from "./localHindiEngine";
import { anchorMatchesDocument, sha256Bytes, type SourceAnchor } from "./sourceAnchor";
import {
  addGeneratedRecord,
  addSourceRecord,
  createDocumentSidecar,
  latestGeneratedRecord,
  latestSourceAnchor,
  loadDocumentSidecar,
  saveDocumentSidecar,
  type DocumentSidecar
} from "./sidecar";

const SETTINGS_KEY = "odu.settings.v2";

type Mode = "translate" | "explain" | "ask";
type Theme = "light" | "dark";

type Settings = {
  targetLanguage: string;
  explanationLevel: string;
  theme: Theme;
};

const defaultSettings: Settings = {
  targetLanguage: "Hindi",
  explanationLevel: "Simple",
  theme: "light"
};

function loadSettings(): Settings {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") };
  } catch {
    return defaultSettings;
  }
}

export default function App() {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState<PDFPageProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.15);
  const [fileName, setFileName] = useState<string>("");
  const [documentSha256, setDocumentSha256] = useState<string>("");
  const [documentByteLength, setDocumentByteLength] = useState(0);
  const [anchor, setAnchor] = useState<SourceAnchor | null>(null);
  const [sidecar, setSidecar] = useState<DocumentSidecar | null>(null);
  const [mode, setMode] = useState<Mode>("explain");
  const [question, setQuestion] = useState("");
  const [runtimeMessage, setRuntimeMessage] = useState("");
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [status, setStatus] = useState("Ready. No document is open.");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    document.documentElement.dataset.theme = settings.theme;
  }, [settings]);

  useEffect(() => {
    if (!pdf) return;
    let cancelled = false;
    void pdf.getPage(pageNumber).then((loaded) => {
      if (!cancelled) setPage(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber]);

  useEffect(() => {
    setRuntimeMessage("");
  }, [mode, anchor?.quoteSha256, settings.targetLanguage, settings.explanationLevel]);

  async function loadPdfBytes(bytes: Uint8Array, name: string) {
    setStatus("Hashing and opening PDF locally…");
    const sha256 = await sha256Bytes(bytes);
    const task = getDocument({ data: bytes });
    const loaded = await task.promise;
    setPdf(loaded);
    setPageNumber(1);
    setPage(null);
    setFileName(name);
    setDocumentSha256(sha256);
    setDocumentByteLength(bytes.byteLength);

    const storedSidecar = await loadDocumentSidecar(sha256);
    const nextSidecar =
      storedSidecar ??
      createDocumentSidecar({
        sha256,
        fileName: name,
        byteLength: bytes.byteLength
      });
    setSidecar(nextSidecar);

    const previous = latestSourceAnchor(nextSidecar);
    if (previous && anchorMatchesDocument(previous, sha256)) {
      setAnchor(previous);
      setPageNumber(Math.min(Math.max(1, previous.page), loaded.numPages));
      setStatus("PDF opened locally. Source anchor and saved outputs restored from the local sidecar.");
    } else {
      setAnchor(null);
      setStatus("PDF opened locally. Select text to begin.");
    }
  }

  async function choosePdf() {
    try {
      if (isTauri()) {
        const selected = await open({
          multiple: false,
          directory: false,
          filters: [{ name: "PDF documents", extensions: ["pdf"] }]
        });
        if (!selected || Array.isArray(selected)) return;
        const bytes = await invoke<number[]>("read_pdf", { path: selected });
        const name = selected.split(/[\\/]/).pop() ?? "document.pdf";
        await loadPdfBytes(new Uint8Array(bytes), name);
      } else {
        fileInputRef.current?.click();
      }
    } catch (error) {
      setStatus(`Could not open PDF: ${String(error)}`);
    }
  }

  async function onBrowserFile(file: File | undefined) {
    if (!file) return;
    try {
      await loadPdfBytes(new Uint8Array(await file.arrayBuffer()), file.name);
    } catch (error) {
      setStatus(`Could not open PDF: ${String(error)}`);
    }
  }

  function rememberAnchor(next: SourceAnchor) {
    setAnchor(next);
    setSidecar((current) => {
      const base =
        current ??
        createDocumentSidecar({
          sha256: next.documentSha256,
          fileName: fileName || "document.pdf",
          byteLength: documentByteLength
        });
      const updated = addSourceRecord(base, next);
      void saveDocumentSidecar(updated).catch((error) => {
        setStatus(`Source is selected, but its sidecar could not be saved: ${String(error)}`);
      });
      return updated;
    });
    setStatus(`Source anchored on page ${next.page} and saved locally.`);
  }

  function returnToSource() {
    if (!anchor) return;
    setPageNumber(anchor.page);
    setStatus(`Returned to anchored source on page ${anchor.page}.`);
  }

  function toggleTheme() {
    setSettings((current) => ({ ...current, theme: current.theme === "dark" ? "light" : "dark" }));
  }

  async function runLocalAction(operation: "translate" | "explain") {
    if (!anchor) {
      setRuntimeMessage("Select source text before running the local engine.");
      return;
    }

    const result = runLocalHindi({
      sourceText: anchor.quote,
      operation,
      targetLanguage: settings.targetLanguage,
      explanationLevel: settings.explanationLevel
    });

    if (result.status === "unsupported") {
      setRuntimeMessage(result.reason);
      setStatus("Reference engine declined unsupported text instead of inventing output.");
      return;
    }

    const base =
      sidecar ??
      createDocumentSidecar({
        sha256: anchor.documentSha256,
        fileName: fileName || "document.pdf",
        byteLength: documentByteLength
      });
    const updated = addGeneratedRecord(base, {
      operation,
      anchor,
      output: result.output,
      targetLanguage: settings.targetLanguage,
      explanationLevel: operation === "explain" ? settings.explanationLevel : undefined,
      engine: result.engine
    });

    setSidecar(updated);
    setRuntimeMessage("");
    try {
      await saveDocumentSidecar(updated);
      setStatus(`${operation === "translate" ? "Translation" : "Explanation"} generated locally and saved with provenance.`);
    } catch (error) {
      setStatus(`Output was generated locally, but its sidecar could not be saved: ${String(error)}`);
    }
  }

  const activeGeneratedRecord = useMemo(() => {
    if (!sidecar || !anchor || (mode !== "translate" && mode !== "explain")) return null;
    return latestGeneratedRecord(sidecar, {
      operation: mode,
      anchor,
      targetLanguage: settings.targetLanguage,
      explanationLevel: mode === "explain" ? settings.explanationLevel : undefined
    });
  }, [anchor, mode, settings.explanationLevel, settings.targetLanguage, sidecar]);

  const placeholder = useMemo(() => {
    if (runtimeMessage) return runtimeMessage;
    if (!anchor) return "Select text in the PDF. Your source passage will appear here before any engine is allowed to act on it.";
    if (mode === "ask") {
      return question.trim()
        ? "Document-grounded question engine is not installed yet. No answer has been invented."
        : "Type a question about the selected passage. Ask remains intentionally disabled in this slice.";
    }
    if (activeGeneratedRecord?.output) return activeGeneratedRecord.output;
    return mode === "translate"
      ? "No saved Hindi translation for this source yet. Run the local reference engine below."
      : "No saved simple Hindi explanation for this source yet. Run the local reference engine below.";
  }, [activeGeneratedRecord?.output, anchor, mode, question, runtimeMessage]);

  const savedSourceCount = sidecar?.records.filter((record) => record.operation === "source").length ?? 0;
  const savedGeneratedCount =
    sidecar?.records.filter((record) => record.operation === "translate" || record.operation === "explain").length ?? 0;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <strong>Open Document Understanding</strong>
          <span className="version">v0.1a</span>
        </div>
        <div className="privacy-badge" title="This slice has no runtime network path.">
          <span className="privacy-dot" /> LOCAL ONLY
        </div>
        <button className="theme-toggle" onClick={toggleTheme} aria-pressed={settings.theme === "dark"}>
          {settings.theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <button className="primary" onClick={() => void choosePdf()}>Open PDF</button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          hidden
          onChange={(event) => void onBrowserFile(event.target.files?.[0])}
        />
      </header>

      <main className="workspace">
        <section className="reader-column" aria-label="Document reader">
          <div className="reader-toolbar">
            <div className="file-label">{fileName || "No document open"}</div>
            <div className="toolbar-actions">
              <button disabled={!pdf || pageNumber <= 1} onClick={() => setPageNumber((value) => value - 1)}>←</button>
              <span>{pdf ? `Page ${pageNumber} / ${pdf.numPages}` : "Page —"}</span>
              <button disabled={!pdf || pageNumber >= (pdf?.numPages ?? 0)} onClick={() => setPageNumber((value) => value + 1)}>→</button>
              <button disabled={!pdf} onClick={() => setScale((value) => Math.max(0.65, value - 0.1))}>−</button>
              <span>{Math.round(scale * 100)}%</span>
              <button disabled={!pdf} onClick={() => setScale((value) => Math.min(2.4, value + 0.1))}>+</button>
            </div>
          </div>

          <div className="document-stage">
            {!pdf && (
              <div className="empty-state">
                <h1>Understand the document. Keep the source.</h1>
                <p>Open a selectable-text PDF. This reference slice does not upload the document.</p>
                <button className="primary large" onClick={() => void choosePdf()}>Open your first PDF</button>
              </div>
            )}
            {pdf && !page && <div className="loading">Rendering page…</div>}
            {page && (
              <PdfPage
                page={page}
                pageNumber={pageNumber}
                scale={scale}
                documentSha256={documentSha256}
                activeAnchor={anchor}
                onAnchor={rememberAnchor}
              />
            )}
          </div>
        </section>

        <aside className="understanding-panel" aria-label="Understanding panel">
          <div className="panel-tabs">
            <button className={mode === "translate" ? "active" : ""} onClick={() => setMode("translate")}>Translate</button>
            <button className={mode === "explain" ? "active" : ""} onClick={() => setMode("explain")}>Explain</button>
            <button className={mode === "ask" ? "active" : ""} onClick={() => setMode("ask")}>Ask</button>
          </div>

          <section className="source-card">
            <div className="eyebrow">SOURCE</div>
            {anchor ? (
              <>
                <div className="source-meta">Page {anchor.page} · items {anchor.startItem}–{anchor.endItem}</div>
                <blockquote>{anchor.quote}</blockquote>
                <div className="provenance-meta">
                  <span>Document SHA-256 {anchor.documentSha256.slice(0, 12)}…</span>
                  <span>Quote SHA-256 {anchor.quoteSha256.slice(0, 12)}…</span>
                  <span>{savedSourceCount} saved source {savedSourceCount === 1 ? "record" : "records"}</span>
                  <span>{savedGeneratedCount} saved generated {savedGeneratedCount === 1 ? "record" : "records"}</span>
                </div>
                <button className="link-button" onClick={returnToSource}>Return to source</button>
              </>
            ) : (
              <p>No source selected yet.</p>
            )}
          </section>

          <section className="controls-card">
            <label>
              Assistance language
              <select value={settings.targetLanguage} onChange={(event) => setSettings({ ...settings, targetLanguage: event.target.value })}>
                <option>Hindi</option>
                <option>English</option>
              </select>
            </label>
            <label>
              Explanation level
              <select value={settings.explanationLevel} onChange={(event) => setSettings({ ...settings, explanationLevel: event.target.value })}>
                <option>Simple</option>
                <option>Technical</option>
              </select>
            </label>
            {mode === "ask" && (
              <label>
                Your question
                <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What does this passage mean?" />
              </label>
            )}
          </section>

          <section className="output-card">
            <div className="eyebrow">{mode.toUpperCase()} OUTPUT</div>
            <p>{placeholder}</p>
            {(mode === "translate" || mode === "explain") && anchor && (
              <button className="primary local-action" onClick={() => void runLocalAction(mode)}>
                Run local {mode === "translate" ? "Hindi translation" : "simple Hindi explanation"}
              </button>
            )}
            {activeGeneratedRecord && (
              <div className="generation-meta">
                <span>LOCAL REFERENCE ENGINE</span>
                <span>{activeGeneratedRecord.engine?.id} · {activeGeneratedRecord.engine?.version}</span>
                <span>Externally verified: no · Human reviewed: no</span>
              </div>
            )}
          </section>

          <div className="reference-warning">
            v0.1a uses a tiny deterministic regression catalog to prove the local engine → provenance → restore path. It is not yet a general translator.
          </div>
          <div className="status-line" role="status">{status}</div>
        </aside>
      </main>
    </div>
  );
}
