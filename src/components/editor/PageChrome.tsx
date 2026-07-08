import type { PageFormat } from "@/lib/page-format";
import {
  hasRedTitle,
  normalizePageFormat,
  resolveSlotText,
  slotVisible,
} from "@/lib/page-format";
import { cn } from "@/lib/utils";

type PageChromeProps = {
  format: PageFormat;
  pageNumber: number;
  position: "top" | "bottom";
};

function SlotCell({
  slot,
  align,
  pageNumber,
}: {
  slot: PageFormat["footer"]["left"];
  align: "left" | "center" | "right";
  pageNumber: number;
}) {
  return (
    <div
      className={cn(
        "page-slot min-w-0 truncate",
        align === "left" && "text-left",
        align === "center" && "text-center",
        align === "right" && "text-right",
      )}
    >
      {slotVisible(slot) ? resolveSlotText(slot, pageNumber) : null}
    </div>
  );
}

export function PageChrome({ format, pageNumber, position }: PageChromeProps) {
  const normalized = normalizePageFormat(format);
  const showRedTitle = position === "top" && hasRedTitle(normalized);
  const showHeader =
    position === "top" &&
    !normalized.redTitle.show &&
    (slotVisible(normalized.header.left) ||
      slotVisible(normalized.header.center) ||
      slotVisible(normalized.header.right));
  const showFooter =
    position === "bottom" &&
    (slotVisible(normalized.footer.left) ||
      slotVisible(normalized.footer.center) ||
      slotVisible(normalized.footer.right));

  if (!showRedTitle && !showHeader && !showFooter) {
    return null;
  }

  if (showRedTitle) {
    return (
      <div className="page-red-title shrink-0 pb-1">
        <p className="page-red-title-text">
          {normalized.redTitle.text}
        </p>
        <div className="page-red-title-line" />
      </div>
    );
  }

  if (showHeader) {
    return (
      <div className="page-header mb-2 grid shrink-0 grid-cols-3 gap-2 page-chrome-grid">
        <SlotCell slot={normalized.header.left} align="left" pageNumber={pageNumber} />
        <SlotCell
          slot={normalized.header.center}
          align="center"
          pageNumber={pageNumber}
        />
        <SlotCell slot={normalized.header.right} align="right" pageNumber={pageNumber} />
      </div>
    );
  }

  return (
    <div className="page-footer mt-auto grid shrink-0 grid-cols-3 gap-2 border-t border-neutral-200 pt-2 page-chrome-grid">
      <SlotCell slot={normalized.footer.left} align="left" pageNumber={pageNumber} />
      <SlotCell
        slot={normalized.footer.center}
        align="center"
        pageNumber={pageNumber}
      />
      <SlotCell slot={normalized.footer.right} align="right" pageNumber={pageNumber} />
    </div>
  );
}
