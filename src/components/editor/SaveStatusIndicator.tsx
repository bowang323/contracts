import type { SaveStatus } from "@/hooks/useContractAutosave";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

type SaveStatusIndicatorProps = {
  status: SaveStatus;
  flashSave: boolean;
};

function StatusDot({
  colorClass,
  label,
  flash,
}: {
  colorClass: string;
  label: string;
  flash?: boolean;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "size-2 shrink-0 rounded-full transition-colors",
        colorClass,
        flash && "animate-save-flash",
      )}
    />
  );
}

export function SaveStatusIndicator({
  status,
  flashSave,
}: SaveStatusIndicatorProps) {
  const { t } = useLanguage();

  if (status === "unsaved" || status === "error") {
    return (
      <StatusDot colorClass="bg-red-500" label={t("saveUnsaved")} />
    );
  }

  if (status === "saving") {
    return (
      <StatusDot colorClass="bg-green-500/50" label={t("saveSaving")} />
    );
  }

  return (
    <StatusDot
      colorClass="bg-green-500"
      label={t("saveSaved")}
      flash={flashSave}
    />
  );
}
