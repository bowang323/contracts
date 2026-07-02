import { useConvexConnectionState } from "convex/react";
import { useEffect, useRef, useState } from "react";

const DISCONNECTED_MS = 10_000;
const FLASH_MS = 600;

export type ReadOnlySyncPhase =
  | "disconnected"
  | "render-flash"
  | "fetch-flash"
  | "live";

export function useReadOnlySyncIndicator({
  enabled,
  serverUpdatedAt,
  renderedMarkdown,
  renderedTitle,
}: {
  enabled: boolean;
  serverUpdatedAt: number | undefined;
  renderedMarkdown: string | null;
  renderedTitle: string | null;
}) {
  const connectionState = useConvexConnectionState();
  const [phase, setPhase] = useState<ReadOnlySyncPhase>("live");
  const prevUpdatedAtRef = useRef<number | undefined>(undefined);
  const prevRenderedRef = useRef<string | null>(null);
  const disconnectedAtRef = useRef<number | null>(null);
  const fetchFlashTimerRef = useRef<number | undefined>(undefined);
  const renderFlashTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      setPhase("live");
      return;
    }

    const tick = () => {
      if (connectionState.isWebSocketConnected) {
        disconnectedAtRef.current = null;
        setPhase((current) =>
          current === "disconnected" ? "live" : current,
        );
        return;
      }

      if (disconnectedAtRef.current === null) {
        disconnectedAtRef.current = Date.now();
      }

      if (Date.now() - disconnectedAtRef.current >= DISCONNECTED_MS) {
        setPhase("disconnected");
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 500);
    return () => window.clearInterval(intervalId);
  }, [connectionState.isWebSocketConnected, enabled]);

  useEffect(() => {
    if (!enabled || serverUpdatedAt === undefined) return;

    if (prevUpdatedAtRef.current === undefined) {
      prevUpdatedAtRef.current = serverUpdatedAt;
      return;
    }

    if (prevUpdatedAtRef.current === serverUpdatedAt) return;

    prevUpdatedAtRef.current = serverUpdatedAt;

    setPhase((current) => (current === "disconnected" ? current : "fetch-flash"));
    if (fetchFlashTimerRef.current) {
      window.clearTimeout(fetchFlashTimerRef.current);
    }
    fetchFlashTimerRef.current = window.setTimeout(() => {
      setPhase((current) =>
        current === "fetch-flash" ? "live" : current,
      );
    }, FLASH_MS);
  }, [enabled, serverUpdatedAt]);

  useEffect(() => {
    if (!enabled || renderedMarkdown === null || renderedTitle === null) {
      return;
    }

    const signature = `${renderedTitle}\0${renderedMarkdown}`;

    if (prevRenderedRef.current === null) {
      prevRenderedRef.current = signature;
      return;
    }

    if (prevRenderedRef.current === signature) return;

    prevRenderedRef.current = signature;

    setPhase((current) => (current === "disconnected" ? current : "render-flash"));
    if (renderFlashTimerRef.current) {
      window.clearTimeout(renderFlashTimerRef.current);
    }
    renderFlashTimerRef.current = window.setTimeout(() => {
      setPhase((current) =>
        current === "render-flash" ? "live" : current,
      );
    }, FLASH_MS);
  }, [enabled, renderedMarkdown, renderedTitle]);

  useEffect(() => {
    return () => {
      if (fetchFlashTimerRef.current) {
        window.clearTimeout(fetchFlashTimerRef.current);
      }
      if (renderFlashTimerRef.current) {
        window.clearTimeout(renderFlashTimerRef.current);
      }
    };
  }, []);

  return phase;
}
