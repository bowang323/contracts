export type PageFlowBreak = {
  unit: HTMLElement;
  spacerHeight: number;
  targetPageIndex: number;
};

export type PageFlowPlan = {
  breaks: PageFlowBreak[];
  pageCount: number;
};

const BREAK_ATTR = "data-page-flow-break";

const FLOW_BLOCK_TAGS = new Set([
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "BLOCKQUOTE",
  "PRE",
  "DIV",
]);

function isTableFlowUnit(unit: HTMLElement): boolean {
  return (
    unit.classList.contains("tableWrapper") ||
    unit.tagName === "TABLE" ||
    (unit.tagName === "DIV" && unit.querySelector(":scope > table") !== null)
  );
}

/** Tables must not split across pages when they fit on one page. */
function shouldBreakBeforeTableUnit(
  top: number,
  height: number,
  ctx: PageContext,
  usableBodyPx: number,
): boolean {
  const { pageStart, pageEnd, inGap } = ctx;

  if (inGap) return true;

  const remainingOnPage = pageEnd - top;

  // Fully contained in the current page body.
  if (top >= pageStart - 0.5 && height <= remainingOnPage + 0.5) {
    return false;
  }

  // Fits on one page but not in the space left here — break before the table.
  if (height <= usableBodyPx + 0.5) {
    return true;
  }

  // Taller than one page: only allow starting flush with a page body top.
  return top > pageStart + 0.5;
}

type PageContext = {
  pageIndex: number;
  pageStart: number;
  pageEnd: number;
  inGap: boolean;
};

/** Collect the smallest block-level units we can break on. */
export function getFlowUnits(root: HTMLElement): HTMLElement[] {
  const units: HTMLElement[] = [];

  for (const child of Array.from(root.children)) {
    if (!(child instanceof HTMLElement)) continue;
    if (child.classList.contains("page-flow-spacer-widget")) continue;
    if (child.hasAttribute("data-page-flow-spacer")) continue;

    if (child.tagName === "UL" || child.tagName === "OL") {
      for (const item of Array.from(child.children)) {
        if (!(item instanceof HTMLElement) || item.tagName !== "LI") continue;

        const blocks = Array.from(item.children).filter(
          (node): node is HTMLElement =>
            node instanceof HTMLElement && FLOW_BLOCK_TAGS.has(node.tagName),
        );

        if (blocks.length > 0) {
          units.push(...blocks);
          continue;
        }

        units.push(item);
      }
      continue;
    }

    units.push(child);
  }

  return units;
}

export function flowOffsetTop(unit: HTMLElement, root: HTMLElement): number {
  const unitRect = unit.getBoundingClientRect();
  const rootRect = root.getBoundingClientRect();
  const scale =
    root.offsetWidth > 0 ? rootRect.width / root.offsetWidth : 1;
  return (unitRect.top - rootRect.top) / scale + root.scrollTop;
}

function getPageContext(
  top: number,
  usableBodyPx: number,
  pageStridePx: number,
): PageContext {
  if (top < usableBodyPx) {
    return {
      pageIndex: 0,
      pageStart: 0,
      pageEnd: usableBodyPx,
      inGap: false,
    };
  }

  if (top < pageStridePx) {
    return {
      pageIndex: 0,
      pageStart: 0,
      pageEnd: usableBodyPx,
      inGap: true,
    };
  }

  const pageIndex = 1 + Math.floor((top - pageStridePx) / pageStridePx);
  const pageStart = pageIndex * pageStridePx;
  return {
    pageIndex,
    pageStart,
    pageEnd: pageStart + usableBodyPx,
    inGap: false,
  };
}

export function clearPageFlowLayout(root: HTMLElement): void {
  root.querySelectorAll("[data-page-flow-spacer]").forEach((node) => {
    node.remove();
  });

  root.querySelectorAll(".page-flow-spacer-widget").forEach((node) => {
    node.remove();
  });

  root.querySelectorAll(`[${BREAK_ATTR}]`).forEach((node) => {
    if (node instanceof HTMLElement) {
      node.style.marginTop = "";
      node.style.paddingTop = "";
      node.removeAttribute(BREAK_ATTR);
    }
  });
}

function lineRectsRelativeToRoot(
  unit: HTMLElement,
  root: HTMLElement,
): Array<{ top: number; bottom: number }> {
  const rootRect = root.getBoundingClientRect();
  const scale =
    root.offsetWidth > 0 ? rootRect.width / root.offsetWidth : 1;

  return Array.from(unit.getClientRects())
    .filter((rect) => rect.height > 1)
    .map((rect) => {
      const top = (rect.top - rootRect.top) / scale + root.scrollTop;
      return { top, bottom: top + rect.height / scale };
    });
}

function shouldBreakBeforeUnit(
  top: number,
  height: number,
  ctx: PageContext,
  usableBodyPx: number,
  unit: HTMLElement,
  root: HTMLElement,
): boolean {
  const bottom = top + height;
  const { pageStart, pageEnd, inGap } = ctx;

  if (inGap) return true;
  if (bottom <= pageEnd + 0.5) return false;

  if (isTableFlowUnit(unit)) {
    return shouldBreakBeforeTableUnit(top, height, ctx, usableBodyPx);
  }

  if (height > usableBodyPx && top <= pageStart + 0.5) {
    return false;
  }

  const lines = lineRectsRelativeToRoot(unit, root);
  if (lines.length > 0) {
    const overflowLine = lines.find((line) => line.bottom > pageEnd + 0.5);
    if (overflowLine && overflowLine.top > pageStart + 0.5) {
      return true;
    }
  }

  if (top >= pageStart - 0.5 && bottom > pageEnd + 0.5) {
    return true;
  }

  return top >= pageEnd - 0.5;
}

/**
 * Plan all page breaks in one pass (accounts for cumulative spacer height).
 */
export function planPageFlowBreaks(
  root: HTMLElement,
  usableBodyPx: number,
  spacerPx: number,
  pageStridePx: number,
): PageFlowPlan {
  if (usableBodyPx <= 0 || pageStridePx <= 0) {
    return { breaks: [], pageCount: 1 };
  }

  const units = getFlowUnits(root);
  const breaks: PageFlowBreak[] = [];
  let cumulativeShift = 0;
  let pageCount = 1;

  for (const unit of units) {
    const naturalTop = flowOffsetTop(unit, root);
    const top = naturalTop + cumulativeShift;
    const height = unit.offsetHeight;
    const ctx = getPageContext(top, usableBodyPx, pageStridePx);

    if (!shouldBreakBeforeUnit(top, height, ctx, usableBodyPx, unit, root)) {
      if (height > usableBodyPx && top <= ctx.pageStart + 0.5) {
        pageCount = Math.max(
          pageCount,
          ctx.pageIndex + Math.ceil(height / usableBodyPx),
        );
      }
      continue;
    }

    const targetPageIndex = ctx.inGap
      ? Math.max(1, Math.ceil(top / pageStridePx))
      : ctx.pageIndex + 1;
    const targetTop = targetPageIndex * pageStridePx;
    const spacerHeight = Math.max(spacerPx, Math.ceil(targetTop - top));

    breaks.push({ unit, spacerHeight, targetPageIndex });
    cumulativeShift += spacerHeight;
    pageCount = Math.max(pageCount, targetPageIndex + 1);
  }

  const flowHeight =
    units.reduce((sum, unit) => sum + unit.offsetHeight, 0) + cumulativeShift;
  const pagesFromHeight = Math.max(
    1,
    Math.ceil(flowHeight / pageStridePx),
  );

  return {
    breaks,
    pageCount: Math.max(pageCount, pagesFromHeight),
  };
}

function insertSpacerBefore(unit: HTMLElement, spacerPx: number): void {
  const spacer = document.createElement("div");
  spacer.dataset.pageFlowSpacer = "true";
  spacer.className = "page-flow-spacer-widget";
  spacer.contentEditable = "false";
  spacer.setAttribute("aria-hidden", "true");
  spacer.style.height = `${spacerPx}px`;
  spacer.style.margin = "0";
  spacer.style.padding = "0";
  spacer.style.border = "0";
  spacer.style.pointerEvents = "none";
  spacer.style.userSelect = "none";
  unit.parentElement?.insertBefore(spacer, unit);
}

function isFirstBlockInLi(unit: HTMLElement): boolean {
  const li = unit.parentElement;
  if (!li || li.tagName !== "LI") return false;

  for (const child of li.children) {
    if (!(child instanceof HTMLElement)) continue;
    if (!FLOW_BLOCK_TAGS.has(child.tagName)) continue;
    return child === unit;
  }

  return false;
}

function applyDomBreak(breakPlan: PageFlowBreak): void {
  const { unit, spacerHeight } = breakPlan;
  let host: HTMLElement = unit;

  if (unit.parentElement?.tagName === "LI") {
    host = isFirstBlockInLi(unit) ? unit.parentElement : unit;
  }

  const inList =
    host.tagName === "LI" ||
    unit.parentElement?.tagName === "UL" ||
    unit.parentElement?.tagName === "OL";

  if (inList) {
    host.style.marginTop = "0";
    host.style.paddingTop = `${spacerHeight}px`;
    host.setAttribute(BREAK_ATTR, "true");
    return;
  }

  insertSpacerBefore(unit, spacerHeight);
  unit.setAttribute(BREAK_ATTR, "true");
}

/** Apply breaks via DOM spacers (preview / static HTML). */
export function applyPageFlowLayout(
  root: HTMLElement,
  usableBodyPx: number,
  spacerPx: number,
  pageStridePx: number,
): number {
  clearPageFlowLayout(root);
  const plan = planPageFlowBreaks(root, usableBodyPx, spacerPx, pageStridePx);

  for (const breakPlan of plan.breaks) {
    applyDomBreak(breakPlan);
  }

  return plan.pageCount;
}

export function removePageFlowSpacers(root: HTMLElement): void {
  clearPageFlowLayout(root);
}

/** Measure layout as if page-flow spacers were not present (editor decorations). */
export function withSpacersHiddenForMeasure<T>(
  root: HTMLElement,
  measure: () => T,
): T {
  const spacers = Array.from(
    root.querySelectorAll<HTMLElement>(
      ".page-flow-spacer-widget, [data-page-flow-spacer]",
    ),
  );
  const saved = spacers.map((el) => ({
    el,
    height: el.style.height,
    display: el.style.display,
    margin: el.style.margin,
    padding: el.style.paddingTop,
  }));

  for (const spacer of spacers) {
    spacer.style.height = "0";
    spacer.style.margin = "0";
    spacer.style.paddingTop = "0";
    spacer.style.display = "none";
  }

  try {
    return measure();
  } finally {
    for (const { el, height, display, margin, padding } of saved) {
      el.style.height = height;
      el.style.display = display;
      el.style.margin = margin;
      el.style.paddingTop = padding;
    }
  }
}
