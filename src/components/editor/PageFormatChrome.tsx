import type { PageFormat, PageSlot } from "@/lib/page-format";
import { normalizePageFormat } from "@/lib/page-format";
import { cn } from "@/lib/utils";

type PageFormatChromeProps = {
  format: PageFormat;
  className?: string;
  position?: "top" | "bottom" | "all";
};

function slotVisible(slot: PageSlot): boolean {
  return slot.show && slot.text.trim().length > 0;
}

function PageSlotView({
  slot,
  align,
}: {
  slot: PageSlot;
  align: "left" | "center" | "right";
}) {
  if (!slotVisible(slot)) return null;
  return (
    <div
      className={cn(
        "page-slot min-w-0 truncate",
        align === "left" && "text-left",
        align === "center" && "text-center",
        align === "right" && "text-right",
      )}
    >
      {slot.text}
    </div>
  );
}

export function PageFormatChrome({
  format,
  className,
  position = "all",
}: PageFormatChromeProps) {
  const normalized = normalizePageFormat(format);
  const showHeader =
    !normalized.redTitle.show &&
    (slotVisible(normalized.header.left) ||
      slotVisible(normalized.header.center) ||
      slotVisible(normalized.header.right));
  const showFooter =
    slotVisible(normalized.footer.left) ||
    slotVisible(normalized.footer.center) ||
    slotVisible(normalized.footer.right);
  const showRedTitle =
    normalized.redTitle.show && normalized.redTitle.text.trim().length > 0;

  const showTop =
    position !== "bottom" && (showRedTitle || showHeader);
  const showBottom = position !== "top" && showFooter;

  if (!showTop && !showBottom) {
    return null;
  }

  return (
    <div className={cn("page-format-chrome", className)}>
      {showTop && showRedTitle && (
        <div className="page-red-title mb-4">
          <p className="page-red-title-text">
            {normalized.redTitle.text}
          </p>
          <div className="page-red-title-line" />
        </div>
      )}
      {showTop && showHeader && (
        <div className="page-header mb-4 grid grid-cols-3 gap-2 page-chrome-grid">
          <PageSlotView slot={normalized.header.left} align="left" />
          <PageSlotView slot={normalized.header.center} align="center" />
          <PageSlotView slot={normalized.header.right} align="right" />
        </div>
      )}
      {showBottom && (
        <div className="page-footer mt-auto grid grid-cols-3 gap-2 border-t border-neutral-200 pt-2 page-chrome-grid">
          <PageSlotView slot={normalized.footer.left} align="left" />
          <PageSlotView slot={normalized.footer.center} align="center" />
          <PageSlotView slot={normalized.footer.right} align="right" />
        </div>
      )}
    </div>
  );
}
