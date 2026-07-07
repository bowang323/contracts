import {
  Bot,
  Download,
  FileDown,
  FilePlus,
  LayoutTemplate,
  Link2,
  Loader2,
  PanelLeft,
  PenLine,
  Radio,
  Stamp,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AiSkillDialog } from "@/components/editor/AiSkillDialog";
import { CreateDocumentDialog } from "@/components/documents/CreateDocumentDialog";
import { IntroLanguageBar } from "@/components/layout/IntroLanguageBar";
import { Button, buttonVariants } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useSidebar } from "@/components/ui/sidebar";
import { useCreateDocument } from "@/hooks/useCreateDocument";
import { MACOS_INTEL_DMG_URL } from "@/lib/desktop-download";
import { AI_PLATFORM_HINTS } from "@/lib/markdown-format-guide";
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
  const { open, openMobile, isMobile, setOpen, setOpenMobile } = useSidebar();
  const { createDocument, isCreating } = useCreateDocument();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAiSkill, setShowAiSkill] = useState(false);

  const sidebarIsOpen = isMobile ? openMobile : open;
  const aiPlatforms = AI_PLATFORM_HINTS[locale];

  const handleShowDocuments = () => {
    if (isMobile) {
      setOpenMobile(true);
    } else {
      setOpen(true);
    }
  };

  const handleCreate = async (title: string) => {
    const created = await createDocument(title);
    if (created) {
      setShowCreateDialog(false);
      void navigate(`/d/${created.documentId}`);
    }
  };

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <header className="safari-sticky-blur sticky top-0 z-10 border-b border-white/10 bg-orange-950/20 px-6 py-4 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-3xl justify-center sm:justify-end">
            <IntroLanguageBar />
          </div>
        </header>

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
                {!sidebarIsOpen ? (
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-white/10"
                    onClick={handleShowDocuments}
                  >
                    <PanelLeft className="size-4" />
                    {t("homeBrowseDocuments")}
                  </Button>
                ) : null}
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
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {t("homeDownloadMacHint")}
              </p>
            </GlassPanel>
          </section>
        </div>
      </div>

      <CreateDocumentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        isCreating={isCreating}
        onCreate={handleCreate}
      />
      <AiSkillDialog open={showAiSkill} onOpenChange={setShowAiSkill} />
    </>
  );
}
