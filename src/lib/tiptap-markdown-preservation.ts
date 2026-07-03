import { Extension } from "@tiptap/core";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import type MarkdownIt from "markdown-it";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { MarkdownSerializerState } from "prosemirror-markdown";

const NBSP = "\u00A0";

function escapeHTML(value: string): string {
  return value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Keep spaces that CommonMark/HTML would collapse or treat as indented code. */
export function preserveSpacesInText(text: string): string {
  let result = text.replace(/^ +/g, (spaces) => NBSP.repeat(spaces.length));
  result = result.replace(/ +$/g, (spaces) => NBSP.repeat(spaces.length));
  result = result.replace(/ {2,}/g, (spaces) => ` ${NBSP.repeat(spaces.length - 1)}`);
  return result;
}

function serializeParagraph(
  state: MarkdownSerializerState,
  node: ProseMirrorNode,
): void {
  if (node.content.size === 0) {
    state.write(NBSP);
    state.closeBlock(node);
    return;
  }

  const text = node.textContent;
  if (text.length > 0 && text.trim().length === 0) {
    state.write(preserveSpacesInText(text));
    state.closeBlock(node);
    return;
  }

  state.renderInline(node);
  state.closeBlock(node);
}

/** Paragraph serialization that keeps blank lines and intentional spacing. */
export const ParagraphWithMarkdownWhitespace = Paragraph.extend({
  addStorage() {
    return {
      markdown: {
        serialize: serializeParagraph,
        parse: {},
      },
    };
  },
});

/** Text serialization that preserves runs of spaces across markdown round-trips. */
export const TextWithMarkdownWhitespace = Text.extend({
  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
          state.text(escapeHTML(preserveSpacesInText(node.text ?? "")));
        },
        parse: {},
      },
    };
  },
});

/** Only fenced (```) and inline (`) code — not 4-space indented blocks. */
export const MarkdownIndentedCodeDisabled = Extension.create({
  name: "markdownIndentedCodeDisabled",
  addStorage() {
    return {
      markdown: {
        parse: {
          setup(md: MarkdownIt) {
            md.disable("code");
          },
        },
      },
    };
  },
});
