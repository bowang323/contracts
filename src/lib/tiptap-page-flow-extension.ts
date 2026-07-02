import { Extension } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import {
  getPageLayoutMetrics,
  reportPageFlowPageCount,
  setPageLayoutMetricsListener,
} from "@/lib/page-flow-layout-store";
import {
  planPageFlowBreaks,
  withSpacersHiddenForMeasure,
} from "@/lib/page-flow-spacers";

export const pageFlowPluginKey = new PluginKey<DecorationSet>("pageFlow");

const PAGE_FLOW_META = "pageFlowLayout";
const MAX_READY_FRAMES = 120;
const REFLOW_PASSES = 3;
/** Extra reflows after reload so layout can settle (fonts, chrome, page count). */
const POST_LOAD_REFLOW_DELAYS_MS = [0, 150, 400, 800];

function resolveBreakInsertPos(view: EditorView, unit: HTMLElement): number {
  if (unit.classList.contains("tableWrapper")) {
    let tablePos = -1;
    view.state.doc.descendants((node, pos) => {
      if (node.type.name !== "table") return;
      const dom = view.nodeDOM(pos);
      if (dom === unit) {
        tablePos = pos;
        return false;
      }
    });
    if (tablePos >= 0) return tablePos;
  }

  const candidates: HTMLElement[] = [];
  if (unit.classList.contains("tableWrapper")) {
    const table = unit.querySelector("table");
    if (table) candidates.push(table);
  }
  candidates.push(unit);

  for (const target of candidates) {
    try {
      const pos = view.posAtDOM(target, 0, -1);
      if (pos >= 0 && pos <= view.state.doc.content.size) {
        return pos;
      }
    } catch {
      // Try the next DOM anchor for this flow unit.
    }
  }

  return -1;
}

function createSpacerWidget(height: number): HTMLElement {
  const spacer = document.createElement("div");
  spacer.className = "page-flow-spacer-widget";
  spacer.contentEditable = "false";
  spacer.setAttribute("aria-hidden", "true");
  spacer.style.height = `${height}px`;
  spacer.style.margin = "0";
  spacer.style.padding = "0";
  spacer.style.border = "0";
  spacer.style.pointerEvents = "none";
  spacer.style.userSelect = "none";
  return spacer;
}

function buildDecorations(view: EditorView): DecorationSet {
  const metrics = getPageLayoutMetrics();
  if (!metrics) return DecorationSet.empty;

  const root = view.dom;

  const plan = withSpacersHiddenForMeasure(root, () =>
    planPageFlowBreaks(
      root,
      metrics.usableBodyPx,
      metrics.spacerPx,
      metrics.pageStridePx,
    ),
  );

  reportPageFlowPageCount(plan.pageCount);

  const decorations: Decoration[] = [];

  for (const breakPlan of plan.breaks) {
    const pos = resolveBreakInsertPos(view, breakPlan.unit);
    if (pos < 0) continue;

    decorations.push(
      Decoration.widget(
        pos,
        () => createSpacerWidget(breakPlan.spacerHeight),
        {
          side: -1,
          key: `page-flow-${pos}-${breakPlan.spacerHeight}`,
        },
      ),
    );
  }

  return DecorationSet.create(view.state.doc, decorations);
}

let reflowView: EditorView | null = null;
let editReflowQueued = false;
let loadReflowGeneration = 0;
const loadReflowTimers = new Set<ReturnType<typeof setTimeout>>();

function clearPostLoadReflows(): void {
  loadReflowGeneration += 1;
  for (const timer of loadReflowTimers) {
    clearTimeout(timer);
  }
  loadReflowTimers.clear();
}

/** Same reflow path used when the document changes during editing. */
export function runPageFlowReflow(view: EditorView, pass = 0): void {
  if (view.isDestroyed) return;

  const decorations = buildDecorations(view);
  const tr = view.state.tr.setMeta(PAGE_FLOW_META, decorations);
  view.dispatch(tr);

  if (pass + 1 < REFLOW_PASSES) {
    requestAnimationFrame(() => runPageFlowReflow(view, pass + 1));
  }
}

function queueEditPageFlowReflow(view: EditorView): void {
  reflowView = view;
  if (editReflowQueued) return;
  editReflowQueued = true;

  requestAnimationFrame(() => {
    editReflowQueued = false;
    const activeView = reflowView;
    if (!activeView || activeView.isDestroyed) return;
    runPageFlowReflow(activeView);
  });
}

function isLayoutReady(view: EditorView): boolean {
  const metrics = getPageLayoutMetrics();
  return Boolean(
    metrics &&
      view.dom.isConnected &&
      view.dom.childElementCount > 0 &&
      view.dom.scrollHeight > 0,
  );
}

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

/** Wait until fonts and editor layout height have settled. */
export async function waitForEditorStableLayout(
  view: EditorView,
): Promise<boolean> {
  return waitForStableLayout(view);
}

/** Run several pagination reflow passes with delays between them. */
export async function runPageFlowReflowSequence(
  view: EditorView,
  delaysMs: number[] = POST_LOAD_REFLOW_DELAYS_MS,
): Promise<void> {
  for (const delayMs of delaysMs) {
    if (view.isDestroyed) return;
    if (delayMs > 0) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, delayMs);
      });
    }
    if (!isLayoutReady(view)) continue;
    runPageFlowReflow(view);
  }
}

async function waitForStableLayout(view: EditorView): Promise<boolean> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready.catch(() => undefined);
  }

  let lastHeight = -1;
  let stableFrames = 0;

  for (let frame = 0; frame < MAX_READY_FRAMES; frame += 1) {
    if (view.isDestroyed) return false;

    if (!isLayoutReady(view)) {
      stableFrames = 0;
      await waitForNextFrame();
      continue;
    }

    const height = view.dom.scrollHeight;
    if (height === lastHeight) {
      stableFrames += 1;
      if (stableFrames >= 2) return true;
    } else {
      lastHeight = height;
      stableFrames = 0;
    }

    await waitForNextFrame();
  }

  return isLayoutReady(view);
}

/**
 * After reload: wait for fonts + stable layout, then reflow several times
 * with delays so the canvas can grow before later passes run.
 */
export async function schedulePostLoadPageFlowReflow(
  view?: EditorView,
): Promise<void> {
  const target = view ?? reflowView;
  if (!target || target.isDestroyed) return;

  clearPostLoadReflows();
  const generation = loadReflowGeneration;

  const ready = await waitForStableLayout(target);
  if (!ready || generation !== loadReflowGeneration || target.isDestroyed) {
    return;
  }

  await runPageFlowReflowSequence(target, POST_LOAD_REFLOW_DELAYS_MS);
}

export const PageFlowExtension = Extension.create({
  name: "pageFlow",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: pageFlowPluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply: (tr, set) => {
            const next = tr.getMeta(PAGE_FLOW_META) as
              | DecorationSet
              | undefined;
            if (next) return next;
            if (tr.docChanged) return set.map(tr.mapping, tr.doc);
            return set;
          },
        },
        props: {
          decorations: (state) => pageFlowPluginKey.getState(state),
        },
        view: (view) => {
          reflowView = view;

          const resizeObserver = new ResizeObserver(() => {
            if (!isLayoutReady(view)) return;
            queueEditPageFlowReflow(view);
          });
          resizeObserver.observe(view.dom);

          setPageLayoutMetricsListener(() => {
            void schedulePostLoadPageFlowReflow(view);
          });

          return {
            update: (updatedView, prevState) => {
              if (!prevState.doc.eq(updatedView.state.doc)) {
                queueEditPageFlowReflow(updatedView);
              }
            },
            destroy: () => {
              clearPostLoadReflows();
              resizeObserver.disconnect();
              if (reflowView === view) reflowView = null;
              setPageLayoutMetricsListener(null);
            },
          };
        },
      }),
    ];
  },

  onDestroy() {
    clearPostLoadReflows();
    reflowView = null;
  },
});

export function forceEditorPageFlowReflow(): void {
  void schedulePostLoadPageFlowReflow();
}
