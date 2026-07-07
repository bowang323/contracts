let loadPromise: Promise<void> | null = null;

/** Wait for document fonts (Tinos, Noto CJK SC, Zhuque Fangsong) before layout/pagination. */
export function loadDocumentFonts(): Promise<void> {
  if (!loadPromise) {
    loadPromise =
      typeof document !== "undefined" && document.fonts?.ready
        ? document.fonts.ready.then(() => undefined)
        : Promise.resolve();
  }
  return loadPromise;
}
