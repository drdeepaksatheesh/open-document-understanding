import { useEffect, useMemo, useRef, useState } from "react";
import { getDocument, type PDFDocumentProxy, type PDFPageProxy } from "pdfjs-dist";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { PdfPage } from "./PdfPage";
import { anchorMatchesDocument, sha256Bytes, type SourceAnchor } from "./sourceAnchor";
import {
  addSourceRecord,
  createDocumentSidecar,
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

    const storedSidecar = loadDocumentSidecar(sha256);
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
      setStatus("PDF opened locally. Source anchor restored from local sidecar.");
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
      saveDocumentSidecar(updated);
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

  const placeholder = useMemo(() => {
    if (!anchor) return "Select text in the PDF. Your source passage will appear here before any AI is allowed to act on it.";
    if (mode === "translate") {
      return `Translation engine not installed yet. Planned target: ${settings.targetLanguage}. The source remains unchanged.`;
    }
    if (mode === "ask") {
      return question.trim()
        ? "Document-grounded question engine not installed yet. The future answer will cite this exact source anchor."
        : "Type a question about the selected passage. v0.0.2 deliberately does not invent an answer.";
    }
    return `${settings.explanationLevel} explanation engine not installed yet. v0.0.2 hardens durable source provenance before local AI is added.`;
  }, [anchor, mode, question, settings]);

  const savedSourceCount = sidecar?.records.filter((record) => record.operation === "source").length ?? 0;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <strong>Open Document Understanding</strong>
          <span className="version">v0.0.2</span>
        </div>
        <div className="privacy-badge" title="The current milestone has no online verification path.">
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
                <p>Open a selectable-text PDF. Nothing is uploaded by this milestone.</p>
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
          </section>

          <div className="status-line" role="status">{status}</div>
        </aside>
      </main>
    </div>
  );
}
