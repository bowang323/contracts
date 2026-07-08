import { loadDocumentFonts } from "@/lib/load-document-fonts";
import {
  buildPreviewPrintHtml,
  waitForPrintDocumentFonts,
} from "@/lib/export-preview-html";
import type { PageFormat } from "@/lib/page-format";

export type PdfExportProgress = {
  current: number;
  total: number;
};

async function waitForLayout(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
  await new Promise((resolve) => setTimeout(resolve, 200));
}

function mountPrintDocument(html: string, pageWidthPx: number, pageHeightPx: number): {
  iframe: HTMLIFrameElement;
  cleanup: () => void;
} {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("data-pdf-export-frame", "true");
  iframe.setAttribute("title", "PDF export");
  iframe.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    `width:${pageWidthPx}px`,
    `height:${pageHeightPx}px`,
    "border:0",
    "opacity:0",
    "pointer-events:none",
    "z-index:-1",
  ].join(";");

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    throw new Error("Could not create export frame");
  }

  doc.open();
  doc.write(html);
  doc.close();

  return {
    iframe,
    cleanup: () => {
      iframe.remove();
    },
  };
}

/**
 * Export the paginated preview as a text PDF via the browser print pipeline.
 * The user chooses "Save as PDF" in the print dialog — output is selectable text
 * with embedded document fonts, not rasterized images.
 */
export async function downloadPreviewPdf(
  canvas: HTMLElement,
  title: string,
  pageFormat: PageFormat,
  options?: { onProgress?: (progress: PdfExportProgress) => void },
): Promise<void> {
  await loadDocumentFonts();
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }

  options?.onProgress?.({ current: 0, total: 1 });

  const html = buildPreviewPrintHtml(canvas, title, pageFormat);
  const paperWidth = canvas.offsetWidth || canvas.getBoundingClientRect().width;
  const paperHeight =
    canvas.querySelector(".contract-paper")?.getBoundingClientRect().height ??
    canvas.getBoundingClientRect().height;

  const { iframe, cleanup } = mountPrintDocument(
    html,
    Math.max(1, Math.round(paperWidth)),
    Math.max(1, Math.round(paperHeight)),
  );

  try {
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) {
      throw new Error("Export frame is not ready");
    }

    options?.onProgress?.({ current: 1, total: 1 });

    await waitForPrintDocumentFonts(doc);
    await waitForLayout();

    await new Promise<void>((resolve, reject) => {
      const onAfterPrint = () => {
        win.removeEventListener("afterprint", onAfterPrint);
        resolve();
      };
      win.addEventListener("afterprint", onAfterPrint);

      try {
        win.focus();
        win.print();
      } catch (error) {
        win.removeEventListener("afterprint", onAfterPrint);
        reject(error);
      }

      // Some browsers never fire afterprint when the dialog is dismissed.
      window.setTimeout(() => {
        win.removeEventListener("afterprint", onAfterPrint);
        resolve();
      }, 60_000);
    });
  } finally {
    cleanup();
  }
}
