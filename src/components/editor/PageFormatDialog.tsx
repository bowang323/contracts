import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_PAGE_FORMAT,
  normalizePageFormat,
  type PageFormat,
  type PageSlot,
  type PageSlotMode,
  type PaperSize,
} from "@/lib/page-format";
import { useLanguage } from "@/providers/LanguageProvider";

type PageFormatDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  format: PageFormat;
  onSave: (format: PageFormat) => void;
};

type SlotKey = "left" | "center" | "right";

function SlotFields({
  label,
  textPlaceholder,
  slot,
  disabled,
  onChange,
}: {
  label: string;
  textPlaceholder: string;
  slot: PageSlot;
  disabled?: boolean;
  onChange: (slot: PageSlot) => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={slot.show}
          disabled={disabled}
          onChange={(e) => onChange({ ...slot, show: e.target.checked })}
          className="size-4 rounded border-white/30"
        />
        {label}
      </label>
      <Input
        value={slot.text}
        disabled={disabled || !slot.show}
        onChange={(e) => onChange({ ...slot, text: e.target.value })}
        placeholder={textPlaceholder}
        className="bg-white/10"
      />
    </div>
  );
}

function FooterCenterFields({
  centerLabel,
  customTextLabel,
  pageNumberLabel,
  placeholder,
  slot,
  onChange,
}: {
  centerLabel: string;
  customTextLabel: string;
  pageNumberLabel: string;
  placeholder: string;
  slot: PageSlot;
  onChange: (slot: PageSlot) => void;
}) {
  const mode: PageSlotMode = slot.mode ?? "text";

  return (
    <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={slot.show}
          onChange={(e) => onChange({ ...slot, show: e.target.checked })}
          className="size-4 rounded border-white/30"
        />
        {centerLabel}
      </label>
      <div className="space-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="footer-center-mode"
            checked={mode === "text"}
            disabled={!slot.show}
            onChange={() => onChange({ ...slot, mode: "text" })}
          />
          {customTextLabel}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="footer-center-mode"
            checked={mode === "page-number"}
            disabled={!slot.show}
            onChange={() =>
              onChange({ ...slot, mode: "page-number", text: "" })
            }
          />
          {pageNumberLabel}
        </label>
      </div>
      {mode === "text" && (
        <Input
          value={slot.text}
          disabled={!slot.show}
          onChange={(e) => onChange({ ...slot, text: e.target.value })}
          placeholder={placeholder}
          className="bg-white/10"
        />
      )}
    </div>
  );
}

export function PageFormatDialog({
  open,
  onOpenChange,
  format,
  onSave,
}: PageFormatDialogProps) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState<PageFormat>(format);

  useEffect(() => {
    if (open) {
      setDraft(format);
    }
  }, [open, format]);

  const updateHeader = (key: SlotKey, slot: PageSlot) => {
    setDraft((current) => ({
      ...current,
      header: { ...current.header, [key]: slot },
    }));
  };

  const updateFooter = (key: SlotKey, slot: PageSlot) => {
    setDraft((current) => ({
      ...current,
      footer: { ...current.footer, [key]: slot },
    }));
  };

  const headerDisabled = draft.redTitle.show;
  const slotPlaceholder = (label: string) =>
    t("slotTextPlaceholder", { label });

  const paperSizeOptions = useMemo(
    () => [
      { value: "letter", label: t("paperLetter") },
      { value: "a4", label: t("paperA4") },
    ],
    [t],
  );

  const handleSave = () => {
    onSave(normalizePageFormat(draft));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90dvh,48rem)] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-4">
          <DialogTitle>{t("pageFormatTitle")}</DialogTitle>
          <DialogDescription>{t("pageFormatDescription")}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
          <div className="space-y-6 pb-2">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">{t("sectionPaper")}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paper-size">{t("paperSize")}</Label>
                <Select
                  value={draft.page.size}
                  items={paperSizeOptions}
                  onValueChange={(value) => {
                    if (!value) return;
                    setDraft((current) => ({
                      ...current,
                      page: {
                        ...current.page,
                        size: value as PaperSize,
                      },
                    }));
                  }}
                >
                  <SelectTrigger id="paper-size" className="w-full bg-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="letter">{t("paperLetter")}</SelectItem>
                    <SelectItem value="a4">{t("paperA4")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paper-margin">{t("marginInches")}</Label>
                <Input
                  id="paper-margin"
                  type="number"
                  min={0}
                  step={0.1}
                  value={draft.page.marginIn}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      page: {
                        ...current.page,
                        marginIn: Number(e.target.value),
                      },
                    }))
                  }
                  className="bg-white/10"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="body-bottom-inset">{t("bodyBottomInset")}</Label>
                <Input
                  id="body-bottom-inset"
                  type="number"
                  min={0}
                  max={200}
                  step={4}
                  value={draft.page.bodyBottomInsetPx ?? 24}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      page: {
                        ...current.page,
                        bodyBottomInsetPx: Number(e.target.value),
                      },
                    }))
                  }
                  className="bg-white/10"
                />
                <p className="text-xs text-muted-foreground">
                  {t("bodyBottomInsetHint")}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">{t("sectionRedTitle")}</h3>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.redTitle.show}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    redTitle: { ...current.redTitle, show: e.target.checked },
                  }))
                }
                className="size-4 rounded border-white/30"
              />
              {t("showRedTitle")}
            </label>
            <div className="space-y-2">
              <Label htmlFor="red-title-text">{t("redTitleText")}</Label>
              <Input
                id="red-title-text"
                value={draft.redTitle.text}
                disabled={!draft.redTitle.show}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    redTitle: { ...current.redTitle, text: e.target.value },
                  }))
                }
                placeholder={t("redTitlePlaceholder")}
                className="bg-white/10"
              />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">{t("sectionHeader")}</h3>
            {headerDisabled && (
              <p className="text-xs text-muted-foreground">
                {t("headerDisabledHint")}
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <SlotFields
                label={t("slotLeft")}
                textPlaceholder={slotPlaceholder(t("slotLeft"))}
                slot={draft.header.left}
                disabled={headerDisabled}
                onChange={(slot) => updateHeader("left", slot)}
              />
              <SlotFields
                label={t("slotCenter")}
                textPlaceholder={slotPlaceholder(t("slotCenter"))}
                slot={draft.header.center}
                disabled={headerDisabled}
                onChange={(slot) => updateHeader("center", slot)}
              />
              <SlotFields
                label={t("slotRight")}
                textPlaceholder={slotPlaceholder(t("slotRight"))}
                slot={draft.header.right}
                disabled={headerDisabled}
                onChange={(slot) => updateHeader("right", slot)}
              />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">{t("sectionFooter")}</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <SlotFields
                label={t("slotLeft")}
                textPlaceholder={slotPlaceholder(t("slotLeft"))}
                slot={draft.footer.left}
                onChange={(slot) => updateFooter("left", slot)}
              />
              <FooterCenterFields
                centerLabel={t("slotCenter")}
                customTextLabel={t("footerCustomText")}
                pageNumberLabel={t("footerPageNumber")}
                placeholder={t("centerFooterPlaceholder")}
                slot={draft.footer.center}
                onChange={(slot) => updateFooter("center", slot)}
              />
              <SlotFields
                label={t("slotRight")}
                textPlaceholder={slotPlaceholder(t("slotRight"))}
                slot={draft.footer.right}
                onChange={(slot) => updateFooter("right", slot)}
              />
            </div>
          </section>
          </div>
        </div>

        <DialogFooter className="m-0 shrink-0 gap-2 rounded-none border-t border-border/60 bg-muted/50 px-6 py-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDraft(DEFAULT_PAGE_FORMAT);
            }}
          >
            {t("reset")}
          </Button>
          <Button type="button" onClick={handleSave}>
            {t("saveFormatting")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
