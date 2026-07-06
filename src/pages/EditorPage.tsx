import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { Download, Code2, Share2, ChevronDown, Printer } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { ContractEditor } from "@/components/editor/ContractEditor";
import { MarkdownSourceEditor } from "@/components/editor/MarkdownSourceEditor";
import { ContractPreview } from "@/components/preview/ContractPreview";
import { ShareDialog } from "@/components/documents/ShareDialog";
import { EditRequestPanel } from "@/components/editor/EditRequestPanel";
import { useContractAutosave } from "@/hooks/useContractAutosave";
import { useEditLock } from "@/hooks/useEditLock";
import { useReadOnlySyncIndicator } from "@/hooks/useReadOnlySyncIndicator";
import { SaveStatusIndicator } from "@/components/editor/SaveStatusIndicator";
import { ReadOnlySyncIndicator } from "@/components/editor/ReadOnlySyncIndicator";
import { SidebarShowButton } from "@/components/layout/SidebarShowButton";
import { getEditorSessionId } from "@/lib/editor-session";
import { getLocalDocument, upsertLocalDocument } from "@/lib/local-documents";
import { parseShareFromLocation } from "@/lib/share-token";
import {
  parseDocumentMarkdown,
  serializeDocumentMarkdown,
  type PageFormat,
} from "@/lib/page-format";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguage } from "@/providers/LanguageProvider";
import { interpolate } from "@/lib/i18n";
import {
  findPreviewCanvas,
  openPreviewPrintWindow,
} from "@/lib/export-preview-html";
import { downloadPreviewPdf } from "@/lib/export-preview-pdf";
import { forceEditorPageFlowReflow } from "@/lib/tiptap-page-flow-extension";

export function EditorPage() {
  const { t } = useLanguage();
  const { documentId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const sessionId = getEditorSessionId();

  const [password, setPassword] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showSourceCode, setShowSourceCode] = useState(false);
  const [title, setTitle] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [awaitingEditTransfer, setAwaitingEditTransfer] = useState(false);
  const [requestingEdit, setRequestingEdit] = useState(false);
  const [editorPreviewReady, setEditorPreviewReady] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const hydratedDocumentIdRef = useRef<string | null>(null);
  const prevLockModeRef = useRef<"edit" | "read" | "pending">("pending");

  useEffect(() => {
    hydratedDocumentIdRef.current = null;
    prevLockModeRef.current = "pending";
    setMarkdown(null);
    setTitle(null);
    setEditorPreviewReady(false);
  }, [documentId]);

  useEffect(() => {
    const shared = parseShareFromLocation(documentId, location.search);
    if (shared) {
      upsertLocalDocument({
        documentId: shared.documentId,
        password: shared.password,
      });
      setPassword(shared.password);
      void navigate(`/d/${documentId}`, { replace: true });
      return;
    }

    const local = getLocalDocument(documentId);
    if (local) {
      setPassword(local.password);
    }
  }, [documentId, location.search, navigate]);

  const resolvedPassword = password ?? "";
  const contract = useQuery(
    api.contracts.get,
    resolvedPassword
      ? { documentId, password: resolvedPassword }
      : "skip",
  );

  const activeContract =
    contract && contract.documentId === documentId ? contract : null;
  const isContentHydrated = title !== null && markdown !== null;

  const updateContract = useMutation(api.contracts.update);
  const requestEditAccess = useMutation(api.contracts.requestEditAccess);
  const editRequestStatus = useQuery(
    api.contracts.getEditRequestStatus,
    resolvedPassword
      ? { documentId, password: resolvedPassword, sessionId }
      : "skip",
  );

  const { mode: lockMode } = useEditLock({
    documentId,
    password: resolvedPassword,
    sessionId,
    enabled: Boolean(resolvedPassword && activeContract),
    fastPoll: awaitingEditTransfer || Boolean(editRequestStatus?.requestPending),
  });

  const canEdit = lockMode === "edit";

  const readOnlySyncPhase = useReadOnlySyncIndicator({
    enabled: !canEdit && lockMode === "read" && isContentHydrated,
    serverUpdatedAt: activeContract?.updatedAt,
    renderedMarkdown: markdown,
    renderedTitle: title,
  });

  useEffect(() => {
    if (canEdit && awaitingEditTransfer) {
      setAwaitingEditTransfer(false);
      toast.success(t("editRequestGranted"));
    }
  }, [awaitingEditTransfer, canEdit, t]);

  const handleRequestEdit = async () => {
    if (!resolvedPassword || requestingEdit) return;
    setRequestingEdit(true);
    try {
      const result = await requestEditAccess({
        documentId,
        password: resolvedPassword,
        sessionId,
      });
      if (result.mode === "edit") {
        setAwaitingEditTransfer(false);
        toast.success(t("editRequestGranted"));
      } else {
        setAwaitingEditTransfer(true);
        toast.success(t("editRequestSent"));
      }
    } catch {
      toast.error(t("editRequestFailed"));
    } finally {
      setRequestingEdit(false);
    }
  };

  const resolvedTitle = title ?? activeContract?.title ?? "";
  const resolvedMarkdown = markdown ?? activeContract?.markdown ?? "";
  const { pageFormat, body: bodyMarkdown } = useMemo(
    () => parseDocumentMarkdown(resolvedMarkdown),
    [resolvedMarkdown],
  );

  const handleBodyMarkdownChange = (nextBody: string) => {
    setMarkdown(serializeDocumentMarkdown(pageFormat, nextBody));
  };

  const handlePageFormatChange = (nextFormat: PageFormat) => {
    setMarkdown(serializeDocumentMarkdown(nextFormat, bodyMarkdown));
  };

  useEffect(() => {
    if (!activeContract || lockMode === "pending") return;

    if (lockMode === "read") {
      setMarkdown(activeContract.markdown);
      setTitle(activeContract.title);
      hydratedDocumentIdRef.current = documentId;
      prevLockModeRef.current = "read";
      return;
    }

    const gainedEditFromRead =
      prevLockModeRef.current === "read" && lockMode === "edit";
    prevLockModeRef.current = "edit";

    if (hydratedDocumentIdRef.current === documentId && !gainedEditFromRead) {
      return;
    }
    hydratedDocumentIdRef.current = documentId;

    // Fresh open: database is source of truth.
    setMarkdown(activeContract.markdown);
    setTitle(activeContract.title);
  }, [activeContract, documentId, lockMode]);

  const { status: saveStatus, flashSave } = useContractAutosave({
    documentId,
    password: resolvedPassword,
    sessionId,
    title: resolvedTitle,
    markdown: resolvedMarkdown,
    updateContract,
    canEdit,
    contentReady: isContentHydrated && (!canEdit || editorPreviewReady),
  });

  const prepareExportCanvas = async (): Promise<HTMLElement | null> => {
    if (showSourceCode) {
      toast.error(t("exportNoPreview"));
      return null;
    }

    forceEditorPageFlowReflow();
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    await new Promise((resolve) => setTimeout(resolve, 150));

    const canvas = findPreviewCanvas();
    if (!canvas) {
      toast.error(t("exportNoPreview"));
      return null;
    }

    return canvas;
  };

  const handleDownloadPdf = async () => {
    if (isExportingPdf) return;

    const canvas = await prepareExportCanvas();
    if (!canvas) return;

    setIsExportingPdf(true);
    const toastId = toast.loading(t("exportPdfPreparing"));

    try {
      await downloadPreviewPdf(canvas, resolvedTitle, pageFormat, {
        onProgress: ({ current, total }) => {
          if (current === 0) {
            toast.loading(t("exportPdfRendering"), { id: toastId });
            return;
          }
          toast.loading(
            interpolate(t("exportPdfProgress"), { current, total }),
            { id: toastId },
          );
        },
      });
      toast.success(t("exportPdfSuccess"), { id: toastId });
    } catch (error) {
      console.error("PDF export failed:", error);
      const detail =
        error instanceof Error ? error.message : t("exportFailed");
      toast.error(detail, { id: toastId });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrintExport = async () => {
    const canvas = await prepareExportCanvas();
    if (!canvas) return;

    try {
      const printWindow = openPreviewPrintWindow(
        canvas,
        resolvedTitle,
        pageFormat,
      );
      if (!printWindow) {
        toast.error(t("exportPopupBlocked"));
        return;
      }
      printWindow.print();
      toast.success(t("exportPrintHint"));
    } catch {
      toast.error(t("exportFailed"));
    }
  };

  const statusBadge = useMemo(() => {
    if (lockMode === "pending") return t("statusConnecting");
    return canEdit ? t("statusEditing") : t("statusReadOnly");
  }, [canEdit, lockMode, t]);

  if (!resolvedPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <GlassPanel className="p-8 text-center">
          <p className="text-lg font-medium">{t("documentAccessRequired")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("documentAccessHint")}
          </p>
        </GlassPanel>
      </div>
    );
  }

  if (contract === null) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <GlassPanel className="p-8 text-center">
          <p className="text-lg font-medium">{t("documentNotFound")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("documentNotFoundHint")}
          </p>
        </GlassPanel>
      </div>
    );
  }

  if (
    !activeContract ||
    contract === undefined ||
    (contract !== null && contract.documentId !== documentId) ||
    lockMode === "pending" ||
    !isContentHydrated
  ) {
    return (
      <div className="flex min-h-screen flex-col gap-4 p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[70vh] w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 md:p-4">
        <GlassPanel
          variant="toolbar"
          className="no-print flex shrink-0 flex-nowrap items-center gap-2 p-3"
        >
          <SidebarShowButton />
          <Input
            value={resolvedTitle}
            onChange={(e) => setTitle(e.target.value)}
            readOnly={!canEdit}
            className="h-8 w-44 shrink-0 bg-white/10 text-base font-semibold"
            placeholder={t("documentTitlePlaceholder")}
          />
          <div className="flex shrink-0 items-center gap-1.5">
            {!canEdit ? (
              <>
                <ReadOnlySyncIndicator phase={readOnlySyncPhase} />
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="secondary">{statusBadge}</Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {t("readOnlyHint")}
                  </TooltipContent>
                </Tooltip>
                {lockMode === "read" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={requestingEdit || editRequestStatus?.requestPending}
                    onClick={() => void handleRequestEdit()}
                  >
                    {editRequestStatus?.requestPending
                      ? t("editRequestSent")
                      : t("requestEdit")}
                  </Button>
                )}
              </>
            ) : (
              <Badge variant="default">{statusBadge}</Badge>
            )}
            {canEdit && (
              <SaveStatusIndicator
                status={saveStatus}
                flashSave={flashSave}
              />
            )}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShare(true)}
            >
              <Share2 className="size-4" />
              {t("share")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSourceCode((v) => !v)}
            >
              <Code2 className="size-4" />
              {showSourceCode ? t("visual") : t("source")}
            </Button>
            <div className="flex items-center">
              <Button
                size="sm"
                className="rounded-r-none"
                disabled={isExportingPdf}
                onClick={() => void handleDownloadPdf()}
              >
                <Download className="size-4" />
                {t("exportDownload")}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      className="rounded-l-none border-l border-primary-foreground/25 px-1.5"
                      disabled={isExportingPdf}
                      aria-label={t("exportAdvanced")}
                    >
                      <ChevronDown className="size-3.5" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="min-w-40">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>{t("exportAdvanced")}</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => void handlePrintExport()}>
                      <Printer className="size-4" />
                      {t("exportPrint")}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </GlassPanel>

        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-3 overflow-hidden">
          {canEdit ? (
            <ContractEditor
              documentId={documentId}
              bodyMarkdown={bodyMarkdown}
              pageFormat={pageFormat}
              fullMarkdown={resolvedMarkdown}
              contentReady={isContentHydrated}
              showSourceCode={showSourceCode}
              onPreviewReadyChange={setEditorPreviewReady}
              onBodyMarkdownChange={handleBodyMarkdownChange}
              onFullMarkdownChange={setMarkdown}
              onPageFormatChange={handlePageFormatChange}
            />
          ) : showSourceCode ? (
            <GlassPanel
              variant="frame"
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <MarkdownSourceEditor
                value={resolvedMarkdown}
                readOnly
                aria-label={t("markdownSourceAria")}
              />
            </GlassPanel>
          ) : (
            <ContractPreview
              markdown={resolvedMarkdown}
              contentRevision={activeContract.updatedAt}
            />
          )}
        </div>
      </div>

      <ShareDialog
        open={showShare}
        onOpenChange={setShowShare}
        documentId={documentId}
        password={resolvedPassword}
      />

      {canEdit && resolvedPassword && (
        <EditRequestPanel
          documentId={documentId}
          password={resolvedPassword}
          sessionId={sessionId}
        />
      )}
    </>
  );
}
