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
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

type CreateDocumentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCreating: boolean;
  onCreate: (title: string) => void | Promise<void>;
};

export function CreateDocumentDialog({
  open,
  onOpenChange,
  isCreating,
  onCreate,
}: CreateDocumentDialogProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
    }
  }, [open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || isCreating) return;
    void onCreate(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("createDocumentTitle")}</DialogTitle>
            <DialogDescription>{t("createDocumentDescription")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="document-name">{t("createDocumentNameLabel")}</Label>
              <Input
                id="document-name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("documentTitlePlaceholder")}
                autoFocus
                disabled={isCreating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              {t("createDocumentCancel")}
            </Button>
            <Button type="submit" disabled={!title.trim() || isCreating}>
              {isCreating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {isCreating ? t("creating") : t("createDocumentConfirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
