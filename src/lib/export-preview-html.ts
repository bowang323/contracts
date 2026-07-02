import { isSafariBrowser } from "@/lib/is-safari";
import {
  getPaperCssSize,
  getPaperPixels,
  PAGE_GAP_PX,
  type PageFormat,
} from "@/lib/page-format";

/** Safari print layout renders slightly taller than our 96dpi page box. */
const SAFARI_PRINT_PAGE_HEIGHT_TRIM_PX = 8;

function getPrintPageHeightPx(pageHeightPx: number, safari: boolean): number {
  return safari
    ? pageHeightPx - SAFARI_PRINT_PAGE_HEIGHT_TRIM_PX
    : pageHeightPx;
}

const PREVIEW_CANVAS_SELECTOR = "[data-contract-preview-canvas]";

const PRINT_LAYOUT_CSS = `
  @page {
    size: var(--print-page-size);
    margin: 0;
  }
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    box-sizing: border-box;
  }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
  }
  .print-root {
    margin: 0 auto;
    background: #fff;
  }
  .paginated-paper-canvas {
    position: relative;
    margin: 0 auto;
    transform: none !important;
  }
  .contract-paper {
    page-break-after: always;
    break-after: page;
    box-shadow: none !important;
    border-radius: 0 !important;
  }
  .contract-paper:last-child {
    page-break-after: auto;
    break-after: auto;
  }
`;

function collectDocumentStyles(): string {
  const chunks: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = Array.from(sheet.cssRules);
      chunks.push(rules.map((rule) => rule.cssText).join("\n"));
    } catch {
      // Skip cross-origin stylesheets.
    }
  }
  return chunks.join("\n");
}

function buildPrintLayoutCss(
  pageFormat: PageFormat,
  printPageHeightPx: number,
  safari: boolean,
): string {
  const paper = getPaperPixels(pageFormat.page.size);
  const pageSize = getPaperCssSize(pageFormat.page.size);

  const safariPrintCss = safari
    ? `
  html.is-safari .contract-paper,
  html.is-safari article {
    height: ${printPageHeightPx}px !important;
    max-height: ${printPageHeightPx}px !important;
    overflow: hidden !important;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  html.is-safari .page-footer {
    flex-shrink: 0;
  }
`
    : "";

  return `
  :root { --print-page-size: ${pageSize}; }
  ${PRINT_LAYOUT_CSS}
  .paginated-paper-canvas {
    width: ${paper.width}px !important;
  }
  ${safariPrintCss}
`;
}

function parsePx(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function collapsePreviewGapsForPrint(
  root: HTMLElement,
  pageHeightPx: number,
  pageGapPx: number,
  options?: { enforcePageHeight?: boolean; sourcePageHeightPx?: number },
): void {
  const sourcePageHeightPx = options?.sourcePageHeightPx ?? pageHeightPx;
  const sourceStridePx = sourcePageHeightPx + pageGapPx;
  const pageCount = root.querySelectorAll(".contract-paper").length;
  const clipTopPx = parsePx(
    root.querySelector<HTMLElement>("[data-contract-content]")?.style.top,
  );

  root.style.transform = "none";
  root.style.width = `${root.offsetWidth || parsePx(root.style.width)}px`;
  root.style.height = `${pageCount * pageHeightPx}px`;

  root.querySelectorAll<HTMLElement>(".contract-paper").forEach((el, index) => {
    el.style.top = `${index * pageHeightPx}px`;
    el.style.left = "0";
    el.style.boxShadow = "none";
    el.style.borderRadius = "0";
    if (options?.enforcePageHeight) {
      el.style.height = `${pageHeightPx}px`;
      el.style.maxHeight = `${pageHeightPx}px`;
      el.style.overflow = "hidden";
    }
  });

  const clipHost = root.querySelector<HTMLElement>(
    "[data-contract-clip-host]",
  );
  if (clipHost) {
    clipHost.style.height = `${pageCount * pageHeightPx}px`;
  }

  root.querySelectorAll<SVGRectElement>("clipPath rect").forEach((rect) => {
    const y = parsePx(rect.getAttribute("y"));
    const pageIndex =
      clipTopPx > 0
        ? Math.max(0, Math.round((y - clipTopPx) / sourceStridePx))
        : Math.max(0, Math.round(y / sourceStridePx));
    rect.setAttribute("y", String(clipTopPx + pageIndex * pageHeightPx));
  });

  root.querySelectorAll<HTMLElement>("article").forEach((article) => {
    const top = parsePx(article.style.top);
    const pageIndex = Math.max(0, Math.round(top / sourceStridePx));
    article.style.top = `${pageIndex * pageHeightPx}px`;
    if (options?.enforcePageHeight) {
      article.style.height = `${pageHeightPx}px`;
      article.style.maxHeight = `${pageHeightPx}px`;
      article.style.overflow = "hidden";
    }
  });
}

export function findPreviewCanvas(): HTMLElement | null {
  const canvas = document.querySelector(PREVIEW_CANVAS_SELECTOR);
  return canvas instanceof HTMLElement ? canvas : null;
}

export function buildPreviewPrintHtml(
  canvas: HTMLElement,
  title: string,
  pageFormat: PageFormat,
): string {
  const paper = getPaperPixels(pageFormat.page.size);
  const safari = isSafariBrowser();
  const printPageHeightPx = getPrintPageHeightPx(paper.height, safari);
  const clone = canvas.cloneNode(true) as HTMLElement;
  collapsePreviewGapsForPrint(clone, printPageHeightPx, PAGE_GAP_PX, {
    enforcePageHeight: safari,
    sourcePageHeightPx: paper.height,
  });

  const styles = `${collectDocumentStyles()}\n${buildPrintLayoutCss(pageFormat, printPageHeightPx, safari)}`;
  const safeTitle = title
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="en"${safari ? ' class="is-safari"' : ""}>
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="print-root">${clone.outerHTML}</div>
</body>
</html>`;
}

export function openPreviewPrintWindow(
  canvas: HTMLElement,
  title: string,
  pageFormat: PageFormat,
): Window | null {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return null;

  printWindow.document.write(buildPreviewPrintHtml(canvas, title, pageFormat));
  printWindow.document.close();
  printWindow.document.title = title;
  printWindow.focus();
  return printWindow;
}
