import { useEffect, useState } from "react";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import type { DocumentListEntry } from "@/lib/local-documents";
import { formatModifiedAt } from "@/lib/format-modified";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

type LocalDocumentListProps = {
  documents: DocumentListEntry[];
  onDelete: (documentId: string) => void;
};

export function LocalDocumentList({
  documents,
  onDelete,
}: LocalDocumentListProps) {
  const { documentId: activeId } = useParams();
  const { locale, t } = useLanguage();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <ScrollArea className="h-full flex-1 pr-2">
      <div className="space-y-2">
        {documents.length === 0 && (
          <p className="px-2 py-4 text-sm text-muted-foreground">
            {t("noDocuments")}
          </p>
        )}
        {documents.map((doc) => (
          <GlassPanel
            key={doc.documentId}
            variant="card"
            className={cn(
              "group relative p-3 transition-all duration-300",
              activeId === doc.documentId &&
                "bg-white/20 ring-1 ring-orange-400/40",
            )}
          >
            <Link
              to={`/d/${doc.documentId}`}
              className="flex w-full min-w-0 items-start gap-3"
            >
              <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1 pr-0 transition-[padding] duration-300 group-hover:pr-9">
                <p className="truncate font-medium text-foreground">{doc.title}</p>
                <p className="flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground">
                  <Pencil className="size-3 shrink-0 opacity-70" aria-hidden />
                  <span>
                    {doc.updatedAt > 0
                      ? formatModifiedAt(doc.updatedAt, locale, now)
                      : "—"}
                  </span>
                </p>
              </div>
            </Link>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => {
                e.preventDefault();
                onDelete(doc.documentId);
              }}
              title={t("removeFromDevice")}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </GlassPanel>
        ))}
      </div>
    </ScrollArea>
  );
}
