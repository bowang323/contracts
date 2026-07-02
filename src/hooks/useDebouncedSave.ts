import { useEffect, useRef } from "react";

export function useDebouncedSave<T>(
  value: T,
  onSave: (value: T) => void | Promise<void>,
  delayMs = 500,
  resetKey?: string | number,
) {
  const onSaveRef = useRef(onSave);
  const isFirstRun = useRef(true);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    isFirstRun.current = true;
  }, [resetKey]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      void onSaveRef.current(value);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
}
