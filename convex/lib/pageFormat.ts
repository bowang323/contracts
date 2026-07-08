export type PaperSize = "letter" | "a4";

export type PageSlotMode = "text" | "page-number";

export type PageSlot = {
  show: boolean;
  text: string;
  mode?: PageSlotMode;
};

export type PageSettings = {
  size: PaperSize;
  marginIn: number;
  bodyBottomInsetPx?: number;
};

export type PageFormat = {
  page: PageSettings;
  redTitle: {
    show: boolean;
    text: string;
  };
  header: {
    left: PageSlot;
    center: PageSlot;
    right: PageSlot;
  };
  footer: {
    left: PageSlot;
    center: PageSlot;
    right: PageSlot;
  };
};

export const DEFAULT_PAGE_FORMAT: PageFormat = {
  page: { size: "letter", marginIn: 1, bodyBottomInsetPx: 24 },
  redTitle: { show: false, text: "" },
  header: {
    left: { show: false, text: "" },
    center: { show: false, text: "" },
    right: { show: false, text: "" },
  },
  footer: {
    left: { show: false, text: "" },
    center: { show: false, text: "", mode: "text" },
    right: { show: false, text: "" },
  },
};

const TABLE_HEADER = "| page-format-key | page-format-value |";
const TABLE_SEPARATOR = "| --- | --- |";

const PAPER_DIMENSIONS: Record<PaperSize, { width: string; height: string }> = {
  letter: { width: "8.5in", height: "11in" },
  a4: { width: "210mm", height: "297mm" },
};

export function getPaperDimensions(size: PaperSize) {
  return PAPER_DIMENSIONS[size];
}

export function getPaperCssSize(size: PaperSize): string {
  return size === "a4" ? "A4" : "letter";
}

export function measureLengthPx(
  root: HTMLElement,
  value: string,
  fallback: number,
): number {
  const probe = document.createElement("div");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.height = value;
  root.appendChild(probe);
  const px = probe.offsetHeight;
  root.removeChild(probe);
  return px > 0 ? px : fallback;
}

function emptySlot(): PageSlot {
  return { show: false, text: "" };
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function unescapeCell(value: string): string {
  return value.replace(/\\\|/g, "|");
}

function parseBool(value: string | undefined): boolean {
  return value === "true";
}

function parsePaperSize(value: string | undefined): PaperSize {
  return value === "a4" ? "a4" : "letter";
}

function parseMarginIn(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1;
}

const DEFAULT_BODY_BOTTOM_INSET_PX = 24;

function parseBodyBottomInsetPx(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : DEFAULT_BODY_BOTTOM_INSET_PX;
}

export function getBodyBottomInsetPx(format: PageFormat): number {
  const value = format.page.bodyBottomInsetPx;
  return typeof value === "number" && value >= 0
    ? value
    : DEFAULT_BODY_BOTTOM_INSET_PX;
}

function parseSlotMode(value: string | undefined): PageSlotMode {
  return value === "page-number" ? "page-number" : "text";
}

function formatRows(format: PageFormat): Array<[string, string]> {
  return [
    ["page.size", format.page.size],
    ["page.margin-in", String(format.page.marginIn)],
    [
      "page.body-bottom-inset-px",
      String(getBodyBottomInsetPx(format)),
    ],
    ["red-title.show", String(format.redTitle.show)],
    ["red-title.text", format.redTitle.text],
    ["header.left.show", String(format.header.left.show)],
    ["header.left.text", format.header.left.text],
    ["header.center.show", String(format.header.center.show)],
    ["header.center.text", format.header.center.text],
    ["header.right.show", String(format.header.right.show)],
    ["header.right.text", format.header.right.text],
    ["footer.left.show", String(format.footer.left.show)],
    ["footer.left.text", format.footer.left.text],
    ["footer.center.show", String(format.footer.center.show)],
    ["footer.center.text", format.footer.center.text],
    ["footer.center.mode", format.footer.center.mode ?? "text"],
    ["footer.right.show", String(format.footer.right.show)],
    ["footer.right.text", format.footer.right.text],
  ];
}

function rowsToFormat(rows: Map<string, string>): PageFormat {
  const slot = (showKey: string, textKey: string, modeKey?: string): PageSlot => ({
    show: parseBool(rows.get(showKey)),
    text: rows.get(textKey) ?? "",
    ...(modeKey ? { mode: parseSlotMode(rows.get(modeKey)) } : {}),
  });

  return {
    page: {
      size: parsePaperSize(rows.get("page.size")),
      marginIn: parseMarginIn(rows.get("page.margin-in")),
      bodyBottomInsetPx: parseBodyBottomInsetPx(
        rows.get("page.body-bottom-inset-px"),
      ),
    },
    redTitle: {
      show: parseBool(rows.get("red-title.show")),
      text: rows.get("red-title.text") ?? "",
    },
    header: {
      left: slot("header.left.show", "header.left.text"),
      center: slot("header.center.show", "header.center.text"),
      right: slot("header.right.show", "header.right.text"),
    },
    footer: {
      left: slot("footer.left.show", "footer.left.text"),
      center: slot(
        "footer.center.show",
        "footer.center.text",
        "footer.center.mode",
      ),
      right: slot("footer.right.show", "footer.right.text"),
    },
  };
}

export function normalizePageFormat(format: PageFormat): PageFormat {
  const next = structuredClone(format);
  if (!next.page) {
    next.page = { size: "letter", marginIn: 1, bodyBottomInsetPx: 24 };
  }
  if (next.page.marginIn < 0) {
    next.page.marginIn = 1;
  }
  next.page.bodyBottomInsetPx = Math.min(
    200,
    Math.max(0, getBodyBottomInsetPx(next)),
  );
  if (next.redTitle.show) {
    next.header = {
      left: emptySlot(),
      center: emptySlot(),
      right: emptySlot(),
    };
  }
  if (!next.footer.center.mode) {
    next.footer.center.mode = "text";
  }
  if (next.footer.center.mode === "page-number") {
    next.footer.center.text = "";
  }
  return next;
}

export function parseDocumentMarkdown(markdown: string): {
  pageFormat: PageFormat;
  body: string;
} {
  const lines = markdown.split("\n");
  if (lines[0]?.trim() !== TABLE_HEADER) {
    return { pageFormat: DEFAULT_PAGE_FORMAT, body: markdown };
  }
  if (lines[1]?.trim() !== TABLE_SEPARATOR) {
    return { pageFormat: DEFAULT_PAGE_FORMAT, body: markdown };
  }

  const rows = new Map<string, string>();
  let index = 2;
  for (; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line?.trim()) break;
    const match = line.match(/^\|\s*([^|]+?)\s*\|\s*(.*?)\s*\|$/);
    if (!match) break;
    rows.set(match[1].trim(), unescapeCell(match[2]));
  }

  if (rows.size === 0) {
    return { pageFormat: DEFAULT_PAGE_FORMAT, body: markdown };
  }

  const body = lines.slice(index).join("\n").replace(/^\n+/, "");
  return {
    pageFormat: normalizePageFormat(rowsToFormat(rows)),
    body,
  };
}

export function serializeDocumentMarkdown(
  format: PageFormat,
  body: string,
): string {
  const normalized = normalizePageFormat(format);
  const table = [
    TABLE_HEADER,
    TABLE_SEPARATOR,
    ...formatRows(normalized).map(
      ([key, value]) => `| ${key} | ${escapeCell(value)} |`,
    ),
    "",
  ].join("\n");
  const trimmedBody = body.trimStart();
  return trimmedBody ? `${table}${trimmedBody}` : table.trimEnd();
}

export function hasRedTitle(format: PageFormat): boolean {
  const normalized = normalizePageFormat(format);
  return (
    normalized.redTitle.show && normalized.redTitle.text.trim().length > 0
  );
}

export function hasVisibleFooter(format: PageFormat): boolean {
  const normalized = normalizePageFormat(format);
  return footerVisible(normalized);
}

export function slotVisible(slot: PageSlot): boolean {
  if (!slot.show) return false;
  if (slot.mode === "page-number") return true;
  return slot.text.trim().length > 0;
}

export function resolveSlotText(slot: PageSlot, pageNumber?: number): string {
  if (!slot.show) return "";
  if (slot.mode === "page-number") {
    return pageNumber === undefined ? "" : String(pageNumber);
  }
  return slot.text;
}

export function estimateChromeHeights(format: PageFormat): {
  top: number;
  bottom: number;
} {
  const normalized = normalizePageFormat(format);
  let top = 0;
  let bottom = 0;

  if (hasRedTitle(normalized)) {
    top += 72;
  } else if (
    slotVisible(normalized.header.left) ||
    slotVisible(normalized.header.center) ||
    slotVisible(normalized.header.right)
  ) {
    top += 28;
  }

  if (footerVisible(normalized)) {
    bottom += 36;
  }

  return { top, bottom };
}

function headerVisible(format: PageFormat): boolean {
  return (
    !format.redTitle.show &&
    (slotVisible(format.header.left) ||
      slotVisible(format.header.center) ||
      slotVisible(format.header.right))
  );
}

function footerVisible(format: PageFormat): boolean {
  return (
    slotVisible(format.footer.left) ||
    slotVisible(format.footer.center) ||
    slotVisible(format.footer.right)
  );
}

function renderSlot(
  slot: PageSlot,
  align: "left" | "center" | "right",
  pageNumber?: number,
): string {
  if (!slotVisible(slot)) return "";
  if (slot.mode === "page-number") {
    return `<div class="page-slot page-slot-${align} page-number-auto"></div>`;
  }
  return `<div class="page-slot page-slot-${align}">${escapeHtml(resolveSlotText(slot, pageNumber))}</div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderPageFormatHtml(format: PageFormat): string {
  const normalized = normalizePageFormat(format);
  const topParts: string[] = [];
  const bottomParts: string[] = [];

  if (normalized.redTitle.show && normalized.redTitle.text.trim()) {
    topParts.push(
      `<div class="page-red-title"><p class="page-red-title-text">${escapeHtml(normalized.redTitle.text)}</p><div class="page-red-title-line"></div></div>`,
    );
  }

  if (headerVisible(normalized)) {
    topParts.push(
      `<div class="page-header">${renderSlot(normalized.header.left, "left")}${renderSlot(normalized.header.center, "center")}${renderSlot(normalized.header.right, "right")}</div>`,
    );
  }

  if (footerVisible(normalized)) {
    bottomParts.push(
      `<div class="page-footer">${renderSlot(normalized.footer.left, "left")}${renderSlot(normalized.footer.center, "center")}${renderSlot(normalized.footer.right, "right")}</div>`,
    );
  }

  const sections: string[] = [];
  if (topParts.length > 0) {
    sections.push(`<div class="page-format-top">${topParts.join("")}</div>`);
  }
  if (bottomParts.length > 0) {
    sections.push(
      `<div class="page-format-bottom">${bottomParts.join("")}</div>`,
    );
  }
  return sections.join("");
}
