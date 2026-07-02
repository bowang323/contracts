import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { tooltipWithShortcut } from "@/lib/format-shortcut";
import { useLanguage } from "@/providers/LanguageProvider";

type SidebarShowButtonProps = {
  className?: string;
};

export function SidebarShowButton({ className }: SidebarShowButtonProps) {
  const { t } = useLanguage();
  const { open, toggleSidebar } = useSidebar();

  if (open) return null;

  const label = tooltipWithShortcut(t("showSidebar"), "Mod-H");

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className={className ?? "shrink-0 bg-white/10"}
      onClick={toggleSidebar}
      aria-label={t("showSidebar")}
      title={label}
    >
      <PanelLeft className="size-4" aria-hidden />
    </Button>
  );
}
