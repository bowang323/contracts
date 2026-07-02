import { useCallback, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const HEARTBEAT_MS = 10_000;
const READ_POLL_MS = 5_000;
const FAST_READ_POLL_MS = 2_000;

export function useEditLock({
  documentId,
  password,
  sessionId,
  enabled,
  fastPoll = false,
}: {
  documentId: string;
  password: string;
  sessionId: string;
  enabled: boolean;
  fastPoll?: boolean;
}) {
  const [mode, setMode] = useState<"edit" | "read" | "pending">("pending");
  const acquireEditLock = useMutation(api.contracts.acquireEditLock);
  const heartbeatEditLock = useMutation(api.contracts.heartbeatEditLock);
  const releaseEditLock = useMutation(api.contracts.releaseEditLock);

  const release = useCallback(() => {
    void releaseEditLock({ documentId, password, sessionId });
  }, [documentId, password, releaseEditLock, sessionId]);

  const tryAcquire = useCallback(async () => {
    try {
      const result = await acquireEditLock({ documentId, password, sessionId });
      setMode(result.mode);
      return result.mode;
    } catch {
      setMode("read");
      return "read" as const;
    }
  }, [acquireEditLock, documentId, password, sessionId]);

  useEffect(() => {
    if (!enabled || !documentId || !password) {
      setMode("pending");
      return;
    }

    void tryAcquire();

    window.addEventListener("beforeunload", release);
    window.addEventListener("pagehide", release);

    return () => {
      window.removeEventListener("beforeunload", release);
      window.removeEventListener("pagehide", release);
      release();
    };
  }, [documentId, enabled, password, release, tryAcquire]);

  useEffect(() => {
    if (!enabled || mode !== "edit") {
      return;
    }

    const intervalId = window.setInterval(() => {
      void heartbeatEditLock({ documentId, password, sessionId }).then(
        (result) => {
          setMode(result.mode);
        },
      );
    }, HEARTBEAT_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [documentId, enabled, heartbeatEditLock, mode, password, sessionId]);

  useEffect(() => {
    if (!enabled || mode !== "read") {
      return;
    }

    const pollMs = fastPoll ? FAST_READ_POLL_MS : READ_POLL_MS;
    const intervalId = window.setInterval(() => {
      void tryAcquire();
    }, pollMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, fastPoll, mode, tryAcquire]);

  return { mode, tryAcquire };
}
