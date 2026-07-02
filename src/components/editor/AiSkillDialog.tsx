import { useMemo } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CodePanel } from "@/components/ui/code-panel";
import { Label } from "@/components/ui/label";
import {
  AI_PLATFORM_HINTS,
  buildAiSkillPrompt,
} from "@/lib/markdown-format-guide";
import { useLanguage } from "@/providers/LanguageProvider";

type AiSkillDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AiSkillDialog({ open, onOpenChange }: AiSkillDialogProps) {
  const { locale, t } = useLanguage();
  const prompt = useMemo(() => buildAiSkillPrompt(locale), [locale]);
  const platforms = AI_PLATFORM_HINTS[locale];

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    toast.success(t("copied", { label: t("aiSkillPromptLabel") }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90dvh,48rem)] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-4">
          <DialogTitle>{t("aiSkillTitle")}</DialogTitle>
          <DialogDescription>{t("aiSkillDescription")}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 py-4">
          <div className="shrink-0 space-y-2">
            <Label>{t("aiSkillPlatformsLabel")}</Label>
            <p className="text-sm text-muted-foreground">
              {platforms.join(" · ")}
            </p>
          </div>
          <div className="flex min-h-[min(40vh,20rem)] flex-1 flex-col gap-2">
            <div className="flex shrink-0 items-center justify-between gap-2">
              <Label htmlFor="ai-skill-prompt">{t("aiSkillPromptLabel")}</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void copyPrompt()}
              >
                <Copy className="size-4" />
                {t("aiSkillCopy")}
              </Button>
            </div>
            <CodePanel
              id="ai-skill-prompt"
              value={prompt}
              aria-label={t("aiSkillPromptLabel")}
              className="min-h-[min(40vh,20rem)] flex-1"
            />
          </div>
        </div>

        <DialogFooter className="m-0 shrink-0 rounded-none border-t border-border/60 bg-muted/50 px-6 py-4 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
