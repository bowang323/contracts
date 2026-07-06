let loadPromise: Promise<void> | null = null;

/** Lazy-load document fonts (Noto SC, LXGW WenKai) before layout/pagination. */
export function loadDocumentFonts(): Promise<void> {
  if (!loadPromise) {
    loadPromise = import("@/styles/fonts-document.css").then(async () => {
      if (typeof document !== "undefined" && document.fonts?.ready) {
        await document.fonts.ready;
      }
    });
  }
  return loadPromise;
}
