/** Turn TipTap-style shortcuts (e.g. Mod-Shift-Z) into platform labels. */
export function formatShortcut(shortcut: string): string {
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent);

  const parts = shortcut.split("-").map((part) => {
    switch (part) {
      case "Mod":
        return isMac ? "⌘" : "Ctrl";
      case "Shift":
        return isMac ? "⇧" : "Shift";
      case "Alt":
        return isMac ? "⌥" : "Alt";
      default:
        return part;
    }
  });

  return isMac ? parts.join("") : parts.join("+");
}

export function tooltipWithShortcut(label: string, shortcut?: string): string {
  if (!shortcut) return label;
  return `${label} (${formatShortcut(shortcut)})`;
}
