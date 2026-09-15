import { useEffect, useRef, useState } from "react";
import { Util, type PDFPageProxy } from "pdfjs-dist";
import type { SourceAnchor } from "./sourceAnchor";
import { createSourceAnchor } from "./sourceAnchor";

type TextItemLike = {
  str: string;
  transform: number[];
  width: number;
  height: number;
};

type Props = {
  page: PDFPageProxy;
  pageNumber: number;
  scale: number;
  documentFingerprint: string;
  activeAnchor: SourceAnchor | null;
  onAnchor: (anchor: SourceAnchor) => void;
};

function closestTextItem(node: Node | null): HTMLElement | null {
  if (!node) return null;
  const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  return element?.closest<HTMLElement>(".text-item") ?? null;
}

export function PdfPage({ page, pageNumber, scale, documentFingerprint, activeAnchor, onAnchor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<TextItemLike[]>([]);
  const viewport = page.getViewport({ scale });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const outputScale = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const renderTask = page.render({
      canvas,
      canvasContext: context,
      viewport,
      transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0]
    });

    void page.getTextContent().then((content) => {
      const nextItems: TextItemLike[] = content.items.flatMap((item) =>
        "str" in item
          ? [
              {
                str: item.str,
                transform: item.transform,
                width: item.width,
                height: item.height
              }
            ]
          : []
      );
      setItems(nextItems);
    });

    return () => renderTask.cancel();
  }, [page, scale]);

  useEffect(() => {
    if (!activeAnchor || activeAnchor.page !== pageNumber || !layerRef.current) return;
    const first = layerRef.current.querySelector<HTMLElement>(`[data-item-index="${activeAnchor.startItem}"]`);
    first?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeAnchor, pageNumber, items]);

  function captureSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !layerRef.current) return;
    const range = selection.getRangeAt(0);
    if (!layerRef.current.contains(range.commonAncestorContainer)) return;

    const startElement = closestTextItem(range.startContainer);
    const endElement = closestTextItem(range.endContainer);
    if (!startElement || !endElement) return;

    const startItem = Number(startElement.dataset.itemIndex);
    const endItem = Number(endElement.dataset.itemIndex);
    if (!Number.isFinite(startItem) || !Number.isFinite(endItem)) return;

    const anchor = createSourceAnchor({
      documentFingerprint,
      page: pageNumber,
      quote: selection.toString(),
      startItem: Math.min(startItem, endItem),
      endItem: Math.max(startItem, endItem),
      startOffset: range.startOffset,
      endOffset: range.endOffset
    });
    onAnchor(anchor);
  }

  return (
    <div className="pdf-page" style={{ width: viewport.width, height: viewport.height }} onMouseUp={captureSelection}>
      <canvas ref={canvasRef} className="pdf-canvas" aria-label={`PDF page ${pageNumber}`} />
      <div ref={layerRef} className="text-layer" style={{ width: viewport.width, height: viewport.height }}>
        {items.map((item, index) => {
          const tx = Util.transform(viewport.transform, item.transform);
          const fontHeight = Math.hypot(tx[2], tx[3]);
          const angle = Math.atan2(tx[1], tx[0]);
          const left = tx[4];
          const top = tx[5] - fontHeight;
          const anchored =
            activeAnchor?.page === pageNumber && index >= activeAnchor.startItem && index <= activeAnchor.endItem;
          return (
            <span
              key={`${index}-${item.str}`}
              className={`text-item${anchored ? " anchored" : ""}`}
              data-item-index={index}
              style={{
                left,
                top,
                fontSize: fontHeight,
                transform: `rotate(${angle}rad)`,
                transformOrigin: "0 0",
                minWidth: Math.max(1, item.width * scale),
                height: Math.max(fontHeight, item.height * scale)
              }}
            >
              {item.str}
            </span>
          );
        })}
      </div>
    </div>
  );
}
