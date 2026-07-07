import {
  Bot,
  Download,
  FileDown,
  FilePlus,
  LayoutTemplate,
  Link2,
  Loader2,
  PenLine,
  Radio,
  Stamp,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AiSkillDialog } from "@/components/editor/AiSkillDialog";
import { CreateDocumentDialog } from "@/components/documents/CreateDocumentDialog";
import { ImportDocumentDialog } from "@/components/documents/ImportDocumentDialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useCreateDocument } from "@/hooks/useCreateDocument";
import { upsertLocalDocument } from "@/lib/local-documents";
import { MACOS_INTEL_DMG_URL } from "@/lib/desktop-download";
import { AI_PLATFORM_HINTS } from "@/lib/markdown-format-guide";
import { isElectronApp, parseShareUrl } from "@/lib/share-token";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

const features = [
  {
    icon: LayoutTemplate,
    titleKey: "homeFeaturePaginationTitle" as const,
    bodyKey: "homeFeaturePaginationBody" as const,
  },
  {
    icon: PenLine,
    titleKey: "homeFeatureMarkdownTitle" as const,
    bodyKey: "homeFeatureMarkdownBody" as const,
  },
  {
    icon: Stamp,
    titleKey: "homeFeatureFormalTitle" as const,
    bodyKey: "homeFeatureFormalBody" as const,
  },
  {
    icon: Radio,
    titleKey: "homeFeatureSyncTitle" as const,
    bodyKey: "homeFeatureSyncBody" as const,
  },
  {
    icon: Link2,
    titleKey: "homeFeatureSharingTitle" as const,
    bodyKey: "homeFeatureSharingBody" as const,
  },
  {
    icon: FileDown,
    titleKey: "homeFeatureExportTitle" as const,
    bodyKey: "homeFeatureExportBody" as const,
  },
];

export function DashboardPage() {
  const { locale, t } = useLanguage();
  const navigate = useNavigate();
  const { createDocument, isCreating } = useCreateDocument();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showAiSkill, setShowAiSkill] = useState(false);
  const showImportFromUrl = isElectronApp();

  const aiPlatforms = AI_PLATFORM_HINTS[locale];

  const handleCreate = async (title: string) => {
    const created = await createDocument(title);
    if (created) {
      setShowCreateDialog(false);
      void navigate(`/d/${created.documentId}`);
    }
  };

  const handleImportFromUrl = (shareUrl: string): boolean => {
    const shared = parseShareUrl(shareUrl);
    if (!shared) return false;
    upsertLocalDocument({
      documentId: shared.documentId,
      password: shared.password,
    });
    toast.success(t("importDocumentSuccess"));
    void navigate(`/d/${shared.documentId}`);
    return true;
  };

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-10 pb-16">
          <section className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
              {t("appTitle")}
            </p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {t("homeHeroTitle")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
              {t("homeHeroDescription")}
            </p>
          </section>

          <section>
            <div className="mb-6 text-center">
              <h2 className="text-xl font-semibold text-foreground">
                {t("homeFeaturesTitle")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("homeFeaturesDescription")}
              </p>
            </div>

            <div className="responsive-2-col-grid grid gap-4 sm:grid-cols-2">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <GlassPanel
                    key={feature.titleKey}
                    variant="card"
                    className="flex h-full flex-col gap-3 p-5 text-left"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Icon className="size-5" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-foreground">
                        {t(feature.titleKey)}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {t(feature.bodyKey)}
                      </p>
                    </div>
                  </GlassPanel>
                );
              })}

              <GlassPanel
                variant="card"
                className="flex h-full flex-col gap-3 p-5 text-left sm:col-span-2"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Bot className="size-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground">
                    {t("homeFeatureAiTitle")}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t("homeFeatureAiBody")}
                  </p>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {t("aiSkillPlatformsLabel")}: {aiPlatforms.join(" · ")}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 bg-white/10"
                    onClick={() => setShowAiSkill(true)}
                  >
                    {t("homeViewAiSkill")}
                  </Button>
                </div>
              </GlassPanel>
            </div>
          </section>

          <section className="text-center">
            <GlassPanel variant="floating" className="p-8">
              <h2 className="text-xl font-semibold text-foreground">
                {t("homeGetStarted")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("homeGetStartedHint")}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button
                  size="lg"
                  disabled={isCreating}
                  onClick={() => setShowCreateDialog(true)}
                >
                  {isCreating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <FilePlus className="size-4" />
                  )}
                  {isCreating ? t("creating") : t("newDocument")}
                </Button>
                {showImportFromUrl ? (
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-white/10"
                    onClick={() => setShowImportDialog(true)}
                  >
                    <Link2 className="size-4" />
                    {t("importFromUrl")}
                  </Button>
                ) : null}
                {!isElectronApp() ? (
                  <a
                    href={MACOS_INTEL_DMG_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "bg-white/10",
                    )}
                  >
                    <Download className="size-4" />
                    {t("homeDownloadMac")}
                  </a>
                ) : null}
              </div>
              {!isElectronApp() ? (
                <p className="mt-4 text-xs text-muted-foreground">
                  {t("homeDownloadMacHint")}
                </p>
              ) : null}
            </GlassPanel>
          </section>

          <footer className="text-center text-xs leading-relaxed text-muted-foreground">
            <p>{t("homeFontAttribution")}</p>
            <p className="mt-1">
              <a
                href="https://github.com/bowang323/contracts/blob/main/FONTS.md"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                {t("homeFontAttributionLink")}
              </a>
            </p>
          </footer>
        </div>
      </div>

      <CreateDocumentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        isCreating={isCreating}
        onCreate={handleCreate}
      />
      {showImportFromUrl ? (
        <ImportDocumentDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          onImport={handleImportFromUrl}
        />
      ) : null}
      <AiSkillDialog open={showAiSkill} onOpenChange={setShowAiSkill} />
    </>
  );
}
