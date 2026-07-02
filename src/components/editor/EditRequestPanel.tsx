import { BellRing } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useLanguage } from "@/providers/LanguageProvider";

type EditRequestPanelProps = {
  documentId: string;
  password: string;
  sessionId: string;
};

export function EditRequestPanel({
  documentId,
  password,
  sessionId,
}: EditRequestPanelProps) {
  const { t } = useLanguage();
  const status = useQuery(api.contracts.getEditRequestStatus, {
    documentId,
    password,
    sessionId,
  });
  const approveEditRequest = useMutation(api.contracts.approveEditRequest);
  const dismissEditRequest = useMutation(api.contracts.dismissEditRequest);
  const muteEditRequests = useMutation(api.contracts.muteEditRequests);

  if (!status?.showEditorPrompt) {
    return null;
  }

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
    } catch {
      // Lock may have changed; query will hide the prompt.
    }
  };

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex max-w-sm flex-col gap-2">
      <GlassPanel
        variant="notification"
        className="pointer-events-auto p-4"
      >
        <div className="flex items-start gap-3">
          <BellRing className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold">{t("editRequestTitle")}</p>
              <p className="mt-1 text-sm text-foreground/85">
                {t("editRequestBody")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  void run(() =>
                    approveEditRequest({ documentId, password, sessionId }),
                  )
                }
              >
                {t("editRequestApprove")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  void run(() =>
                    dismissEditRequest({ documentId, password, sessionId }),
                  )
                }
              >
                {t("editRequestDismiss")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() =>
                  void run(() =>
                    muteEditRequests({ documentId, password, sessionId }),
                  )
                }
              >
                {t("editRequestMute")}
              </Button>
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
