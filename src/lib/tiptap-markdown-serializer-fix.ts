import { Extension } from "@tiptap/core";
import { MarkdownSerializerState } from "prosemirror-markdown";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

type SerializerState = MarkdownSerializerState & {
  renderContent: (node: ProseMirrorNode) => void;
  out: string;
};

type MarkdownSerializerLike = {
  nodes: Record<string, unknown>;
  marks: Record<string, unknown>;
  serialize: (content: ProseMirrorNode) => string;
};

/**
 * tiptap-markdown wraps MarkdownSerializerState with trimInline logic that
 * corrupts nested bold + underline (and partial overlaps). Use the base
 * prosemirror-markdown serializer instead.
 */
export const MarkdownSerializerFix = Extension.create({
  name: "markdownSerializerFix",
  priority: 1000,
  onCreate() {
    const storage = this.editor.storage as {
      markdown?: { serializer: MarkdownSerializerLike };
    };

    const serializer = storage.markdown?.serializer;
    if (!serializer) return;

    const { nodes, marks } = serializer;

    serializer.serialize = (content) => {
      const StateCtor = MarkdownSerializerState as unknown as new (
        nodes: Record<string, unknown>,
        marks: Record<string, unknown>,
        options: { hardBreakNodeName: string },
      ) => SerializerState;

      const state = new StateCtor(nodes, marks, {
        hardBreakNodeName: "hardBreak",
      });
      state.renderContent(content);
      return state.out;
    };
  },
});
