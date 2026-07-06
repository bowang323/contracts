import { loadDocumentFonts } from "@/lib/load-document-fonts";
import { mountPreviewForCapture } from "@/lib/export-preview-html";
import type { PageFormat, PaperSize } from "@/lib/page-format";

const CAPTURE_SCALE = 2;
const JPEG_QUALITY = 0.92;

export type PdfExportProgress = {
  current: number;
  total: number;
};

type Html2CanvasFn = (
  element: HTMLElement,
  options?: {
    scale?: number;
    width?: number;
    height?: number;
    backgroundColor?: string | null;
    logging?: boolean;
    useCORS?: boolean;
    allowTaint?: boolean;
    imageTimeout?: number;
    onclone?: (document: Document, element: HTMLElement) => void;
  },
) => Promise<HTMLCanvasElement>;

function sanitizeFilename(title: string): string {
  const trimmed = title.trim() || "document";
  const cleaned = trimmed
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "document";
}

function jsPdfPageSize(size: PaperSize): "a4" | "letter" {
  return size === "a4" ? "a4" : "letter";
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Unknown error";
}

async function waitForLayout(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
  await new Promise((resolve) => setTimeout(resolve, 150));
}

/** Rebind SVG clip-path IDs so url(#…) references stay valid after cloning. */
function remountClipPath(root: HTMLElement): void {
  const clipPath = root.querySelector("clipPath");
  const clipHost = root.querySelector<HTMLElement>("[data-contract-clip-host]");
  if (!clipPath || !clipHost) return;

  const clipId = `pdf-page-clip-${Math.random().toString(36).slice(2)}`;
  clipPath.id = clipId;
  const clipUrl = `url(#${clipId})`;
  clipHost.style.clipPath = clipUrl;
  clipHost.style.setProperty("-webkit-clip-path", clipUrl);
}

/**
 * html2canvas often mishandles clip-path:url(#id). Fall back to no clip so
 * capture still succeeds (margins may show body text).
 */
function neutralizeClipPath(root: HTMLElement): void {
  const clipHost = root.querySelector<HTMLElement>("[data-contract-clip-host]");
  if (clipHost) {
    clipHost.style.clipPath = "none";
    clipHost.style.setProperty("-webkit-clip-path", "none");
  }
  root.querySelectorAll("svg").forEach((svg) => {
    if (svg.querySelector("clipPath")) svg.remove();
  });
}

function slicePageFromSnapshot(
  snapshot: HTMLCanvasElement,
  pageIndex: number,
  pageWidthPx: number,
  pageHeightPx: number,
): HTMLCanvasElement {
  const scale = CAPTURE_SCALE;
  const pageCanvas = document.createElement("canvas");
  pageCanvas.width = Math.round(pageWidthPx * scale);
  pageCanvas.height = Math.round(pageHeightPx * scale);
  const ctx = pageCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create page canvas");
  }
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
  ctx.drawImage(
    snapshot,
    0,
    Math.round(pageIndex * pageHeightPx * scale),
    pageCanvas.width,
    pageCanvas.height,
    0,
    0,
    pageCanvas.width,
    pageCanvas.height,
  );
  return pageCanvas;
}

function canvasToJpeg(pageCanvas: HTMLCanvasElement): string {
  try {
    return pageCanvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } catch {
    throw new Error(
      "Could not encode page image (canvas security restriction)",
    );
  }
}

async function rasterizeFullStack(
  html2canvas: Html2CanvasFn,
  liveRoot: HTMLElement,
  pageWidthPx: number,
  totalHeightPx: number,
): Promise<HTMLCanvasElement> {
  remountClipPath(liveRoot);

  const options = {
    scale: CAPTURE_SCALE,
    width: pageWidthPx,
    height: totalHeightPx,
    backgroundColor: "#ffffff",
    logging: false,
    useCORS: true,
    allowTaint: false,
    imageTimeout: 15_000,
    onclone: (_clonedDoc: Document, element: HTMLElement) => {
      remountClipPath(element);
    },
  };

  try {
    return await html2canvas(liveRoot, options);
  } catch (firstError) {
    neutralizeClipPath(liveRoot);
    try {
      return await html2canvas(liveRoot, options);
    } catch {
      throw new Error(`Could not render preview: ${errorMessage(firstError)}`);
    }
  }
}

/** Rasterize the paginated preview and download a multi-page PDF. */
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

  const mounted = mountPreviewForCapture(canvas, pageFormat);
  const { clone, stage, pageWidthPx, pageHeightPx, pageCount } = mounted;

  if (pageCount < 1) {
    mounted.cleanup();
    throw new Error("No pages to export");
  }

  const totalHeightPx = pageCount * pageHeightPx;

  try {
    stage.style.overflow = "visible";
    stage.style.width = `${pageWidthPx}px`;
    stage.style.height = `${totalHeightPx}px`;
    stage.style.left = `-${pageWidthPx + 64}px`;
    stage.style.top = "0";
    stage.style.opacity = "1";
    stage.style.zIndex = "-1";

    clone.style.width = `${pageWidthPx}px`;
    clone.style.height = `${totalHeightPx}px`;
    clone.style.opacity = "1";

    await waitForLayout();

    if (clone.offsetWidth < 1 || clone.offsetHeight < 1) {
      throw new Error("Preview layout is not ready for export");
    }

    options?.onProgress?.({ current: 0, total: pageCount });

    // html2canvas-pro supports oklch (Tailwind v4); stock html2canvas does not.
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas-pro"),
      import("jspdf"),
    ]);

    options?.onProgress?.({ current: 1, total: pageCount });

    const snapshot = await rasterizeFullStack(
      html2canvas,
      clone,
      pageWidthPx,
      totalHeightPx,
    );

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: jsPdfPageSize(pageFormat.page.size),
      compress: true,
    });

    const pageWidthMm = pdf.internal.pageSize.getWidth();
    const pageHeightMm = pdf.internal.pageSize.getHeight();

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      options?.onProgress?.({ current: pageIndex + 1, total: pageCount });

      const pageCanvas = slicePageFromSnapshot(
        snapshot,
        pageIndex,
        pageWidthPx,
        pageHeightPx,
      );
      const imageData = canvasToJpeg(pageCanvas);

      if (pageIndex > 0) {
        pdf.addPage();
      }

      pdf.addImage(
        imageData,
        "JPEG",
        0,
        0,
        pageWidthMm,
        pageHeightMm,
        undefined,
        "FAST",
      );
    }

    pdf.save(`${sanitizeFilename(title)}.pdf`);
  } finally {
    mounted.cleanup();
  }
}
