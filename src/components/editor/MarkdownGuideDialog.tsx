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
import { getMarkdownGuideSections } from "@/lib/markdown-format-guide";
import { useLanguage } from "@/providers/LanguageProvider";

type MarkdownGuideDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MarkdownGuideDialog({
  open,
  onOpenChange,
}: MarkdownGuideDialogProps) {
  const { locale, t } = useLanguage();
  const sections = getMarkdownGuideSections(locale);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90dvh,48rem)] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-4">
          <DialogTitle>{t("markdownGuideTitle")}</DialogTitle>
          <DialogDescription>{t("markdownGuideDescription")}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
          <div className="space-y-6">
            {sections.map((section) => (
              <section key={section.title} className="space-y-2">
                <h3 className="text-sm font-semibold">{section.title}</h3>
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-sm leading-relaxed text-muted-foreground"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {section.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.code && (
                  <CodePanel value={section.code} aria-label={section.title} />
                )}
              </section>
            ))}
          </div>
        </div>

        <DialogFooter className="m-0 shrink-0 rounded-none border-t border-border/60 bg-muted/50 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
