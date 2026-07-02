import { Table } from "@tiptap/extension-table";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { MarkdownSerializerState } from "prosemirror-markdown";

type TableMarkdownState = MarkdownSerializerState & { inTable?: boolean };

function tableRows(node: ProseMirrorNode): readonly ProseMirrorNode[] {
  return node.content.content;
}

function rowCells(row: ProseMirrorNode): readonly ProseMirrorNode[] {
  return row.content.content;
}

function writeCellContent(state: TableMarkdownState, cell: ProseMirrorNode): void {
  const block = cell.firstChild;
  if (!block?.textContent.trim()) {
    return;
  }
  state.renderInline(block);
}

function serializeTableToMarkdown(
  state: TableMarkdownState,
  node: ProseMirrorNode,
): void {
  const rows = tableRows(node);
  if (rows.length === 0) {
    return;
  }

  state.inTable = true;

  rows.forEach((row, rowIndex) => {
    state.write("| ");
    rowCells(row).forEach((cell, cellIndex) => {
      if (cellIndex > 0) {
        state.write(" | ");
      }
      writeCellContent(state, cell);
    });
    state.write(" |");
    state.ensureNewLine();

    if (rowIndex === 0) {
      const delimiter = rowCells(row)
        .map(() => "---")
        .join(" | ");
      state.write(`| ${delimiter} |`);
      state.ensureNewLine();
    }
  });

  state.closeBlock(node);
  state.inTable = false;
}

/** TipTap Table with GFM markdown serialization for tiptap-markdown. */
export const TableWithMarkdown = Table.extend({
  addStorage() {
    return {
      markdown: {
        serialize: serializeTableToMarkdown,
        parse: {},
      },
    };
  },
});
