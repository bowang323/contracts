export type PageLayoutMetrics = {
  usableBodyPx: number;
  pageStridePx: number;
  spacerPx: number;
};

let metrics: PageLayoutMetrics | null = null;
let reflowHandler: (() => void) | null = null;
let pageCountHandler: ((count: number) => void) | null = null;
let metricsListener: (() => void) | null = null;

export function setPageLayoutMetrics(next: PageLayoutMetrics | null): void {
  metrics = next;
  metricsListener?.();
}

export function getPageLayoutMetrics(): PageLayoutMetrics | null {
  return metrics;
}

export function setPageFlowReflowHandler(handler: (() => void) | null): void {
  reflowHandler = handler;
}

export function requestPageFlowReflow(): void {
  reflowHandler?.();
}

export function setPageFlowPageCountHandler(
  handler: ((count: number) => void) | null,
): void {
  pageCountHandler = handler;
}

export function reportPageFlowPageCount(count: number): void {
  pageCountHandler?.(count);
}

export function setPageLayoutMetricsListener(listener: (() => void) | null): void {
  metricsListener = listener;
}
