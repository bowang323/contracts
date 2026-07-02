import type { Editor } from "@tiptap/react";
import {
  runPageFlowReflowSequence,
  waitForEditorStableLayout,
} from "@/lib/tiptap-page-flow-extension";

async function loadBodyIntoEditor(
  editor: Editor,
  bodyMarkdown: string,
): Promise<void> {
  const view = editor.view;
  if (!view || view.isDestroyed) return;

  editor.commands.setContent(bodyMarkdown, { emitUpdate: false });
  await waitForEditorStableLayout(view);
  await runPageFlowReflowSequence(view, [0, 150, 400]);
}

/** Build the visual preview from markdown and paginate before enabling editing. */
export async function initializeEditorPreviewFromMarkdown(
  editor: Editor,
  bodyMarkdown: string,
): Promise<void> {
  const view = editor.view;
  if (!view || view.isDestroyed) return;

  await loadBodyIntoEditor(editor, bodyMarkdown);

  if (view.isDestroyed) return;

  await runPageFlowReflowSequence(view, [0, 150, 400, 800]);
  await waitForEditorStableLayout(view);
}
