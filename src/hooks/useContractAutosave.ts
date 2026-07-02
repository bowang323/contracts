import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedSave } from "@/hooks/useDebouncedSave";
import { isDocumentSavedLocally } from "@/lib/local-documents";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

const UNSAVED_WARNING_MS = 10_000;
const SAVE_FLASH_MS = 600;
const CLOUD_SAVE_DEBOUNCE_MS = 3_000;

export function useContractAutosave({
  documentId,
  password,
  sessionId,
  title,
  markdown,
  updateContract,
  canEdit,
  contentReady = true,
}: {
  documentId: string;
  password: string;
  sessionId: string;
  title: string;
  markdown: string;
  canEdit: boolean;
  contentReady?: boolean;
  updateContract: (args: {
    documentId: string;
    password: string;
    sessionId: string;
    title?: string;
    markdown?: string;
  }) => Promise<null>;
}) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [flashSave, setFlashSave] = useState(false);
  const lastSavedRef = useRef({ title, markdown });
  const lastChangeAtRef = useRef<number | null>(null);
  const prevContentRef = useRef({ title, markdown });
  const contentBaselineSyncedRef = useRef(false);
  const flashTimerRef = useRef<number | undefined>(undefined);

  const isDirty =
    canEdit &&
    (title !== lastSavedRef.current.title ||
      markdown !== lastSavedRef.current.markdown);

  useEffect(() => {
    if (!canEdit || !isDirty) {
      if (!isDirty) {
        lastChangeAtRef.current = null;
      }
      prevContentRef.current = { title, markdown };
      return;
    }

    const contentChanged =
      title !== prevContentRef.current.title ||
      markdown !== prevContentRef.current.markdown;

    prevContentRef.current = { title, markdown };

    if (!contentChanged || !isDocumentSavedLocally(documentId)) {
      return;
    }

    lastChangeAtRef.current = Date.now();
  }, [canEdit, documentId, isDirty, title, markdown]);

  useEffect(() => {
    if (!contentReady || contentBaselineSyncedRef.current) return;
    contentBaselineSyncedRef.current = true;
    lastSavedRef.current = { title, markdown };
    prevContentRef.current = { title, markdown };
    lastChangeAtRef.current = null;
  }, [contentReady, documentId, title, markdown]);

  useEffect(() => {
    if (!canEdit || !isDirty) return;

    const interval = window.setInterval(() => {
      const changedAt = lastChangeAtRef.current;
      if (
        changedAt !== null &&
        Date.now() - changedAt >= UNSAVED_WARNING_MS &&
        status !== "saving"
      ) {
        setStatus("unsaved");
      }
    }, 500);

    return () => window.clearInterval(interval);
  }, [canEdit, isDirty, status]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) {
        window.clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  const save = useCallback(
    async (payload: { title: string; markdown: string }) => {
      if (!canEdit) return;

      if (
        payload.title === lastSavedRef.current.title &&
        payload.markdown === lastSavedRef.current.markdown
      ) {
        return;
      }

      if (lastChangeAtRef.current === null) {
        return;
      }

      setStatus("saving");
      try {
        await updateContract({
          documentId,
          password,
          sessionId,
          title: payload.title,
          markdown: payload.markdown,
        });
        lastSavedRef.current = payload;
        lastChangeAtRef.current = null;
        setStatus("saved");
        setFlashSave(true);
        if (flashTimerRef.current) {
          window.clearTimeout(flashTimerRef.current);
        }
        flashTimerRef.current = window.setTimeout(() => {
          setFlashSave(false);
        }, SAVE_FLASH_MS);
      } catch {
        setStatus("error");
      }
    },
    [canEdit, documentId, password, sessionId, updateContract],
  );

  useEffect(() => {
    contentBaselineSyncedRef.current = false;
    lastSavedRef.current = { title, markdown };
    prevContentRef.current = { title, markdown };
    lastChangeAtRef.current = null;
    setStatus("saved");
    setFlashSave(false);
  }, [documentId]);

  useDebouncedSave(
    { title, markdown },
    (payload) => {
      void save(payload);
    },
    CLOUD_SAVE_DEBOUNCE_MS,
    documentId,
  );

  return { status, flashSave, isDirty };
}
