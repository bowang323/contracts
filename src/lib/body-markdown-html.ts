import MarkdownIt from "markdown-it";
import { configureUnderlineMarkdownIt } from "@/lib/tiptap-underline-markdown";

let renderer: MarkdownIt | null = null;

function getBodyMarkdownRenderer(): MarkdownIt {
  if (!renderer) {
    renderer = new MarkdownIt({ html: false, linkify: false, breaks: false });
    configureUnderlineMarkdownIt(renderer);
  }
  return renderer;
}

/** Render contract body markdown to HTML (preview, print export). */
export function renderBodyMarkdownHtml(body: string): string {
  const html = getBodyMarkdownRenderer().render(body);
  if (typeof DOMParser === "undefined") {
    return html;
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  for (const table of doc.body.querySelectorAll("table")) {
    const wrapper = doc.createElement("div");
    wrapper.className = "tableWrapper";
    table.replaceWith(wrapper);
    wrapper.appendChild(table);
  }
  return doc.body.innerHTML;
}
