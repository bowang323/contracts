import { marked } from "marked";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  getPaperCssSize,
  hasRedTitle,
  hasVisibleFooter,
  parseDocumentMarkdown,
  renderPageFormatHtml,
} from "./lib/pageFormat";

function buildPrintStyles(pageSize: string, marginIn: number): string {
  return `
  @page { size: ${pageSize}; margin: ${marginIn}in; }
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    font-family: "Source Serif 4", Georgia, serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #171717;
    margin: 0;
    padding: 0;
  }
  .page-red-title p {
    margin: 0;
    color: #dc2626 !important;
    font-size: 22pt;
    font-weight: 700;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.04em;
  }
  .page-red-title-line {
    border-bottom: 2pt solid #dc2626;
    margin-top: 4pt;
  }
  .page-header {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12pt;
    font-size: 9pt;
    color: #525252;
    margin-top: 6pt;
  }
  .page-footer {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12pt;
    font-size: 9pt;
    color: #525252;
    border-top: 1px solid #e5e5e5;
    padding-top: 6pt;
    padding-bottom: 6pt;
  }
  .page-slot-left { text-align: left; }
  .page-slot-center { text-align: center; }
  .page-slot-right { text-align: right; }
  .page-number-auto::after {
    content: counter(page);
  }
  .document-body {
    padding-top: 48pt;
    padding-bottom: 48pt;
  }
  .document-body.has-red-title { padding-top: 108pt; }
  .document-body.has-header { padding-top: 72pt; }
  .document-body.has-footer { padding-bottom: 56pt; }
  h1 { font-size: 20pt; margin-bottom: 16pt; }
  h2 { font-size: 14pt; margin-top: 18pt; margin-bottom: 10pt; }
  p { margin-bottom: 10pt; }
  ul, ol { margin-bottom: 10pt; padding-left: 24pt; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
  th, td { border: 1px solid #d4d4d4; padding: 6pt 8pt; text-align: left; }
  th { background: #f5f5f5; font-weight: 600; }
  hr { border: none; border-top: 1px solid #d4d4d4; margin: 18pt 0; }
  strong { font-weight: 600; }
  @media print {
    .page-format-top {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1;
      padding: 0 ${marginIn}in;
    }
    .page-format-bottom {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1;
      padding: 0 ${marginIn}in;
    }
  }
`;
}

export const exportPdf = action({
  args: {
    documentId: v.string(),
    password: v.string(),
  },
  returns: v.object({
    html: v.string(),
    title: v.string(),
  }),
  handler: async (ctx, args): Promise<{ html: string; title: string }> => {
    const contract = await ctx.runQuery(internal.contracts.getInternal, {
      documentId: args.documentId,
      password: args.password,
    });

    if (!contract) {
      throw new Error("Document not found");
    }

    const { pageFormat, body } = parseDocumentMarkdown(contract.markdown);
    const chromeHtml = renderPageFormatHtml(pageFormat);
    const bodyHtml = await marked.parse(body);
    const printStyles = buildPrintStyles(
      getPaperCssSize(pageFormat.page.size),
      pageFormat.page.marginIn,
    );

    const bodyClasses = [
      "document-body",
      hasRedTitle(pageFormat) ? "has-red-title" : "",
      !hasRedTitle(pageFormat) &&
      (pageFormat.header.left.show ||
        pageFormat.header.center.show ||
        pageFormat.header.right.show)
        ? "has-header"
        : "",
      hasVisibleFooter(pageFormat) ? "has-footer" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${contract.title}</title>
  <style>${printStyles}</style>
</head>
<body>
  ${chromeHtml}
  <div class="${bodyClasses}">${bodyHtml}</div>
</body>
</html>`;

    return { html, title: contract.title };
  },
});
