import type { ReadOnlySyncPhase } from "@/hooks/useReadOnlySyncIndicator";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ReadOnlySyncIndicatorProps = {
  phase: ReadOnlySyncPhase;
};

function phaseLabel(phase: ReadOnlySyncPhase, t: (key: TranslationKey) => string): string {
  switch (phase) {
    case "disconnected":
      return t("readOnlySyncDisconnected");
    case "fetch-flash":
      return t("readOnlySyncFetched");
    case "render-flash":
      return t("readOnlySyncRendered");
    default:
      return t("readOnlySyncLive");
  }
}

export function ReadOnlySyncIndicator({ phase }: ReadOnlySyncIndicatorProps) {
  const { t } = useLanguage();
  const label = phaseLabel(phase, t);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            role="status"
            aria-label={label}
            className={cn(
              "readonly-sync-light size-2 shrink-0 rounded-full",
              phase === "disconnected" && "readonly-sync-light--disconnected",
              phase === "fetch-flash" && "readonly-sync-light--fetch",
              phase === "render-flash" && "readonly-sync-light--render",
              phase === "live" && "readonly-sync-light--live",
            )}
          />
        }
      />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
