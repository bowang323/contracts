import Underline from "@tiptap/extension-underline";
import markdownItIns from "markdown-it-ins";
import type MarkdownIt from "markdown-it";

type MarkdownItWithIns = MarkdownIt & { __docFlowIns?: boolean };

function configureUnderlineMarkdownIt(md: MarkdownIt): void {
  const tagged = md as MarkdownItWithIns;
  if (tagged.__docFlowIns) return;
  tagged.__docFlowIns = true;

  md.use(markdownItIns);
  md.renderer.rules.ins_open = () => "<u>";
  md.renderer.rules.ins_close = () => "</u>";
}

/** Underline mark with ++text++ markdown round-trip (fenced-code safe). */
export const UnderlineWithMarkdown = Underline.extend({
  parseHTML() {
    return [
      { tag: "u" },
      { tag: "ins" },
      {
        style: "text-decoration",
        consuming: false,
        getAttrs: (style) =>
          style.includes("underline") ? {} : false,
      },
    ];
  },

  addStorage() {
    return {
      markdown: {
        serialize: {
          open: "++",
          close: "++",
          mixable: true,
          expelEnclosingWhitespace: true,
        },
        parse: {
          setup(md: MarkdownIt) {
            configureUnderlineMarkdownIt(md);
          },
        },
      },
    };
  },
});

export { configureUnderlineMarkdownIt };
