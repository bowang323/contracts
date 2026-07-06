import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PageFormat } from "@/lib/page-format";
import {
  BODY_TEXT_GAP_PX,
  estimateChromeHeights,
  getBodyBottomInsetPx,
  getPaperPixels,
  PAGE_GAP_PX,
} from "@/lib/page-format";
import { PageChrome } from "@/components/editor/PageChrome";
import {
  applyPageFlowLayout,
  removePageFlowSpacers,
} from "@/lib/page-flow-spacers";
import { applyContractTableLayout } from "@/lib/contract-table-layout";
import {
  reportPageFlowPageCount,
  setPageFlowPageCountHandler,
  setPageFlowReflowHandler,
  setPageLayoutMetrics,
} from "@/lib/page-flow-layout-store";
import { forceEditorPageFlowReflow } from "@/lib/tiptap-page-flow-extension";
import { loadDocumentFonts } from "@/lib/load-document-fonts";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const DPI = 96;
/** Horizontal inset (both sides) when fitting paper to the viewport width. */
const VIEWPORT_HORIZONTAL_PADDING_PX = 24;
const VIEWPORT_VERTICAL_PADDING_PX = 16;
/** Space for list markers outside the text column (kept inside clip). */
const BULLET_GUTTER_PX = 20;

function offsetWithin(el: HTMLElement, ancestor: HTMLElement): number {
  const ancestorRect = ancestor.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const scale =
    ancestor.offsetWidth > 0
      ? ancestorRect.width / ancestor.offsetWidth
      : 1;
  return (elRect.top - ancestorRect.top) / scale;
}

function distanceWithin(
  from: HTMLElement,
  to: HTMLElement,
  ancestor: HTMLElement,
): number {
  const ancestorRect = ancestor.getBoundingClientRect();
  const fromRect = from.getBoundingClientRect();
  const toRect = to.getBoundingClientRect();
  const scale =
    ancestor.offsetWidth > 0
      ? ancestorRect.width / ancestor.offsetWidth
      : 1;
  return (toRect.top - fromRect.top) / scale;
}

type PaginatedDocumentSurfaceProps = {
  pageFormat: PageFormat;
  contentRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  className?: string;
  /** Bumps layout when document body changes (e.g. read-only live sync). */
  contentRevision?: string | number;
};

export function PaginatedDocumentSurface({
  pageFormat,
  contentRef,
  children,
  className,
  contentRevision,
}: PaginatedDocumentSurfaceProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const topChromeRef = useRef<HTMLDivElement>(null);
  const bottomChromeRef = useRef<HTMLDivElement>(null);
  const bodySlotRef = useRef<HTMLDivElement>(null);
  const clipId = useId().replace(/:/g, "");
  const [pageCount, setPageCount] = useState(1);
  const [scale, setScale] = useState(1);
  const [chromeHeights, setChromeHeights] = useState(() =>
    estimateChromeHeights(pageFormat),
  );
  const [bodyMetrics, setBodyMetrics] = useState({
    clipTopPx: 96 + 72 + BODY_TEXT_GAP_PX,
    usableBodyPx: 400,
  });
  const measureRaf = useRef<number | null>(null);

  useEffect(() => {
    void loadDocumentFonts();
  }, []);

  const paper = getPaperPixels(pageFormat.page.size);
  const marginIn = pageFormat.page.marginIn;
  const marginPx = marginIn * DPI;

  const pageWidthPx = paper.width;
  const pageHeightPx = paper.height;
  const pageStridePx = pageHeightPx + PAGE_GAP_PX;
  const bodyBottomInsetPx = getBodyBottomInsetPx(pageFormat);

  const { clipTopPx, usableBodyPx } = bodyMetrics;
  const spacerPx = Math.max(0, pageStridePx - usableBodyPx);
  const bodyWidthPx = pageWidthPx - marginPx * 2;

  const stackHeightPx =
    pageCount * pageHeightPx + Math.max(0, pageCount - 1) * PAGE_GAP_PX;

  const layoutKey = useMemo(
    () =>
      [
        pageFormat.page.size,
        marginIn,
        pageFormat.redTitle.show,
        pageFormat.redTitle.text,
        pageFormat.header.left.show,
        pageFormat.footer.left.show,
        pageFormat.footer.center.show,
        pageFormat.footer.right.show,
        bodyBottomInsetPx,
        chromeHeights.top,
        chromeHeights.bottom,
        clipTopPx,
        usableBodyPx,
      ].join("|"),
    [pageFormat, marginIn, chromeHeights, bodyBottomInsetPx, clipTopPx, usableBodyPx],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateScale = () => {
      const availableW = viewport.clientWidth - VIEWPORT_HORIZONTAL_PADDING_PX;
      const next = Math.min(1, availableW / pageWidthPx);
      setScale(next > 0 ? next : 1);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [pageWidthPx]);

  useEffect(() => {
    const measureChrome = () => {
      const fallback = estimateChromeHeights(pageFormat);
      setChromeHeights({
        top: topChromeRef.current?.offsetHeight ?? fallback.top,
        bottom: bottomChromeRef.current?.offsetHeight ?? fallback.bottom,
      });
    };

    const measureBody = () => {
      const canvas = canvasRef.current;
      const bodySlot = bodySlotRef.current;
      const footer = bottomChromeRef.current;
      if (!canvas || !bodySlot || !footer) return;

      const clipTop = offsetWithin(bodySlot, canvas);
      const bodyToFooter = distanceWithin(bodySlot, footer, canvas);
      const usable = Math.floor(bodyToFooter - bodyBottomInsetPx);

      if (usable > 80) {
        setBodyMetrics({ clipTopPx: clipTop, usableBodyPx: usable });
      }
    };

    const measure = () => {
      measureChrome();
      measureBody();
    };

    measure();
    const raf = requestAnimationFrame(measure);

    const observer = new ResizeObserver(measure);
    if (bodySlotRef.current) observer.observe(bodySlotRef.current);
    if (topChromeRef.current) observer.observe(topChromeRef.current);
    if (bottomChromeRef.current) observer.observe(bottomChromeRef.current);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [layoutKey, pageFormat, pageCount, bodyBottomInsetPx]);

  const metricsReady = usableBodyPx > 80;

  useEffect(() => {
    if (!metricsReady) {
      setPageLayoutMetrics(null);
      return;
    }

    setPageLayoutMetrics({
      usableBodyPx,
      pageStridePx,
      spacerPx,
    });

    void forceEditorPageFlowReflow();
  }, [metricsReady, usableBodyPx, pageStridePx, spacerPx]);

  useLayoutEffect(() => {
    setPageFlowPageCountHandler((count) => {
      setPageCount((prev) => {
        if (prev !== count) {
          void forceEditorPageFlowReflow();
        }
        return count;
      });
    });
    return () => setPageFlowPageCountHandler(null);
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el || !metricsReady) return;

    const prose = el.querySelector(".ProseMirror, .contract-prose") as
      | HTMLElement
      | null;
    const flowRoot = prose ?? el;
    const isEditor = flowRoot.classList.contains("ProseMirror");

    const runLayout = () => {
      applyContractTableLayout(flowRoot);

      if (isEditor) {
        forceEditorPageFlowReflow();
        return;
      }

      const pages = applyPageFlowLayout(
        flowRoot,
        usableBodyPx,
        spacerPx,
        pageStridePx,
      );
      reportPageFlowPageCount(pages);
    };

    const scheduleLayout = () => {
      if (measureRaf.current !== null) {
        cancelAnimationFrame(measureRaf.current);
      }
      measureRaf.current = requestAnimationFrame(() => {
        measureRaf.current = null;
        runLayout();
      });
    };

    scheduleLayout();
    setPageFlowReflowHandler(scheduleLayout);

    const resizeObserver = new ResizeObserver(scheduleLayout);
    resizeObserver.observe(flowRoot);

    return () => {
      if (measureRaf.current !== null) {
        cancelAnimationFrame(measureRaf.current);
      }
      resizeObserver.disconnect();
      setPageFlowReflowHandler(null);
      if (!isEditor) {
        removePageFlowSpacers(flowRoot);
      }
    };
  }, [contentRef, usableBodyPx, spacerPx, pageStridePx, layoutKey, metricsReady, contentRevision]);

  const scaledWidth = pageWidthPx * scale;
  const scaledHeight = stackHeightPx * scale;

  return (
    <div ref={viewportRef} className={cn("h-full min-h-0", className)}>
      <ScrollArea className="h-full min-h-0">
        <div
          className="flex justify-center"
          style={{
            padding: `${VIEWPORT_VERTICAL_PADDING_PX}px ${VIEWPORT_HORIZONTAL_PADDING_PX / 2}px`,
          }}
        >
          <div style={{ width: scaledWidth, height: scaledHeight }}>
            <div
              ref={canvasRef}
              className="paginated-paper-canvas relative"
              data-contract-preview-canvas
              style={{
                width: pageWidthPx,
                height: stackHeightPx,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
          <svg
            className="pointer-events-none absolute h-0 w-0"
            aria-hidden="true"
          >
            <defs>
              <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                {Array.from({ length: pageCount }).map((_, pageIndex) => (
                  <rect
                    key={pageIndex}
                    x={marginPx - BULLET_GUTTER_PX}
                    y={clipTopPx + pageIndex * pageStridePx}
                    width={bodyWidthPx + BULLET_GUTTER_PX}
                    height={usableBodyPx}
                  />
                ))}
              </clipPath>
            </defs>
          </svg>

          {Array.from({ length: pageCount }).map((_, pageIndex) => (
            <div
              key={`paper-${pageIndex}`}
              className="contract-paper absolute rounded-sm bg-white shadow-md"
              style={{
                top: pageIndex * pageStridePx,
                left: 0,
                width: pageWidthPx,
                height: pageHeightPx,
                zIndex: 1,
              }}
            />
          ))}

          <div
            className="absolute left-0 top-0"
            data-contract-clip-host
            style={{
              width: pageWidthPx,
              height: stackHeightPx,
              clipPath: `url(#${clipId})`,
              WebkitClipPath: `url(#${clipId})`,
              zIndex: 10,
              pointerEvents: "auto",
            }}
          >
            <div
              ref={contentRef}
              data-contract-content
              className="absolute left-0 text-neutral-900"
              style={{
                top: clipTopPx,
                width: pageWidthPx,
                paddingLeft: marginPx,
                paddingRight: marginPx,
                boxSizing: "border-box",
              }}
            >
              {children}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0" style={{ zIndex: 20 }}>
            {Array.from({ length: pageCount }).map((_, pageIndex) => (
              <article
                key={pageIndex}
                className="absolute flex flex-col"
                style={{
                  top: pageIndex * pageStridePx,
                  left: 0,
                  width: pageWidthPx,
                  height: pageHeightPx,
                  padding: marginPx,
                  boxSizing: "border-box",
                }}
              >
                <div
                  ref={pageIndex === 0 ? topChromeRef : undefined}
                  className="pointer-events-auto shrink-0 bg-white"
                  style={{ marginBottom: BODY_TEXT_GAP_PX }}
                >
                  <PageChrome
                    format={pageFormat}
                    pageNumber={pageIndex + 1}
                    position="top"
                  />
                </div>
                <div
                  ref={pageIndex === 0 ? bodySlotRef : undefined}
                  className="min-h-0 flex-1 shrink-0"
                />
                <div
                  ref={pageIndex === 0 ? bottomChromeRef : undefined}
                  className="pointer-events-auto shrink-0 bg-white"
                  style={{ marginTop: BODY_TEXT_GAP_PX }}
                >
                  <PageChrome
                    format={pageFormat}
                    pageNumber={pageIndex + 1}
                    position="bottom"
                  />
                </div>
              </article>
            ))}
          </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
