import { Extension } from "@tiptap/core";

/** Extra keyboard shortcuts for the contract editor toolbar. */
export const EditorShortcuts = Extension.create({
  name: "editorShortcuts",

  addKeyboardShortcuts() {
    return {
      "Mod-Alt-1": () =>
        this.editor.chain().focus().toggleHeading({ level: 1 }).run(),
      "Mod-Alt-2": () =>
        this.editor.chain().focus().toggleHeading({ level: 2 }).run(),
    };
  },
});
