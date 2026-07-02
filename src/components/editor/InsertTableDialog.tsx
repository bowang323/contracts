import { useEffect, useState } from "react";
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

export type InsertTableOptions = {
  rows: number;
  cols: number;
};

type InsertTableDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (options: InsertTableOptions) => void;
};

const DEFAULT_ROWS = 3;
const DEFAULT_COLS = 3;
const MIN_SIZE = 1;
const MAX_SIZE = 20;

function clampSize(value: number): number {
  if (!Number.isFinite(value)) return MIN_SIZE;
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.floor(value)));
}

export function InsertTableDialog({
  open,
  onOpenChange,
  onInsert,
}: InsertTableDialogProps) {
  const { t } = useLanguage();
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [cols, setCols] = useState(DEFAULT_COLS);

  useEffect(() => {
    if (open) {
      setRows(DEFAULT_ROWS);
      setCols(DEFAULT_COLS);
    }
  }, [open]);

  const handleInsert = () => {
    onInsert({
      rows: clampSize(rows),
      cols: clampSize(cols),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("insertTableTitle")}</DialogTitle>
          <DialogDescription>{t("insertTableDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="table-rows">{t("insertTableRows")}</Label>
            <Input
              id="table-rows"
              type="number"
              min={MIN_SIZE}
              max={MAX_SIZE}
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
              className="bg-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="table-cols">{t("insertTableColumns")}</Label>
            <Input
              id="table-cols"
              type="number"
              min={MIN_SIZE}
              max={MAX_SIZE}
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
              className="bg-white/10"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("insertTableCancel")}
          </Button>
          <Button type="button" onClick={handleInsert}>
            {t("insertTableConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
