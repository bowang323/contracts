import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PaginatedDocumentSurface } from "@/components/editor/PaginatedDocumentSurface";
import { parseDocumentMarkdown } from "@/lib/page-format";
import { requestPageFlowReflow } from "@/lib/page-flow-layout-store";

type ContractPreviewProps = {
  markdown: string;
  contentRevision?: number;
};

function schedulePreviewReflow(): () => void {
  const timers: number[] = [];
  const run = () => requestPageFlowReflow();
  run();
  timers.push(window.setTimeout(run, 0));
  timers.push(window.setTimeout(run, 150));
  timers.push(window.setTimeout(run, 400));
  return () => {
    for (const id of timers) window.clearTimeout(id);
  };
}

export function ContractPreview({
  markdown,
  contentRevision,
}: ContractPreviewProps) {
  const { pageFormat, body } = parseDocumentMarkdown(markdown);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return schedulePreviewReflow();
  }, [markdown, pageFormat]);

  return (
    <GlassPanel
      variant="frame"
      className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <PaginatedDocumentSurface
          pageFormat={pageFormat}
          contentRef={contentRef}
          contentRevision={contentRevision ?? markdown.length}
          className="h-full min-h-0"
        >
          <div className="contract-prose contract-prose-preview">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ children, ...props }) => (
                  <div className="tableWrapper">
                    <table {...props}>{children}</table>
                  </div>
                ),
              }}
            >
              {body}
            </ReactMarkdown>
          </div>
        </PaginatedDocumentSurface>
      </div>
    </GlassPanel>
  );
}
