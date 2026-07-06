import { useEffect, useState, type FormEvent } from "react";
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
import { useLanguage } from "@/providers/LanguageProvider";

type ImportDocumentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (shareUrl: string) => boolean;
};

export function ImportDocumentDialog({
  open,
  onOpenChange,
  onImport,
}: ImportDocumentDialogProps) {
  const { t } = useLanguage();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setUrl("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    const ok = onImport(trimmed);
    if (!ok) {
      setError(t("importDocumentInvalidUrl"));
      return;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("importDocumentTitle")}</DialogTitle>
            <DialogDescription>{t("importDocumentDescription")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="import-share-url">{t("importDocumentUrlLabel")}</Label>
              <Input
                id="import-share-url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                }}
                placeholder={t("importDocumentUrlPlaceholder")}
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("importDocumentCancel")}
            </Button>
            <Button type="submit" disabled={!url.trim()}>
              {t("importDocumentConfirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
