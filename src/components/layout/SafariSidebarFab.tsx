import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { tooltipWithShortcut } from "@/lib/format-shortcut";
import { useLanguage } from "@/providers/LanguageProvider";

/** Fixed fallback toggle for Safari when sidebar is collapsed. */
export function SafariSidebarFab() {
  const { t } = useLanguage();
  const { open, toggleSidebar } = useSidebar();

  if (open) return null;

  const label = tooltipWithShortcut(t("showSidebar"), "Mod-H");

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className="safari-sidebar-fab bg-white/15 shadow-md backdrop-blur-md"
      onClick={toggleSidebar}
      aria-label={t("showSidebar")}
      title={label}
    >
      <PanelLeft className="size-4" aria-hidden />
    </Button>
  );
}
