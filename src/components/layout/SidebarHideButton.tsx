import { PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { tooltipWithShortcut } from "@/lib/format-shortcut";
import { useLanguage } from "@/providers/LanguageProvider";

export function SidebarHideButton() {
  const { t } = useLanguage();
  const { toggleSidebar } = useSidebar();
  const label = tooltipWithShortcut(t("hideSidebar"), "Mod-H");

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={toggleSidebar}
          >
            <PanelLeftClose className="size-4 shrink-0" />
            {t("hideSidebar")}
          </Button>
        }
      />
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
