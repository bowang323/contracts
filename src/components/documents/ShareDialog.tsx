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
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { buildShareUrl } from "@/lib/share-token";
import { useLanguage } from "@/providers/LanguageProvider";

type ShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  password: string;
};

export function ShareDialog({
  open,
  onOpenChange,
  documentId,
  password,
}: ShareDialogProps) {
  const { t } = useLanguage();
  const shareUrl = buildShareUrl(documentId, password);

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(t("copied", { label }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("shareTitle")}</DialogTitle>
          <DialogDescription>{t("shareDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="share-url">{t("shareLink")}</Label>
            <div className="flex gap-2">
              <Input id="share-url" readOnly value={shareUrl} />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => void copy(shareUrl, t("shareLink"))}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="share-document-id">{t("documentId")}</Label>
            <div className="flex gap-2">
              <Input id="share-document-id" readOnly value={documentId} />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => void copy(documentId, t("documentId"))}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="share-password">{t("password")}</Label>
            <div className="flex gap-2">
              <Input id="share-password" readOnly value={password} />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => void copy(password, t("password"))}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
