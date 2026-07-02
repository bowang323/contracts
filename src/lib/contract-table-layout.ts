const EQUAL_CLASS = "contract-table-equal";

function getColumnCount(table: HTMLTableElement): number {
  let max = 0;
  for (const row of Array.from(table.rows)) {
    max = Math.max(max, row.cells.length);
  }
  return Math.max(1, max);
}

function syncColgroup(table: HTMLTableElement, colCount: number): void {
  let colgroup = table.querySelector("colgroup");
  if (!colgroup) {
    colgroup = document.createElement("colgroup");
    table.insertBefore(colgroup, table.firstChild);
  }
  colgroup.replaceChildren();
  const share = `${100 / colCount}%`;
  for (let i = 0; i < colCount; i += 1) {
    const col = document.createElement("col");
    col.style.width = share;
    colgroup.appendChild(col);
  }
}

/** Tables span the full text column with equal column widths. */
export function applyContractTableLayout(root: HTMLElement): void {
  const tables = root.querySelectorAll("table");
  for (const node of tables) {
    if (!(node instanceof HTMLTableElement)) continue;

    const wrapper = node.closest(".tableWrapper");
    if (wrapper instanceof HTMLElement) {
      wrapper.style.width = "100%";
      wrapper.style.maxWidth = "100%";
    }

    const colCount = getColumnCount(node);
    node.style.setProperty("--table-cols", String(colCount));
    node.style.width = "100%";
    node.style.maxWidth = "100%";
    node.style.minWidth = "0";
    node.classList.add(EQUAL_CLASS);
    syncColgroup(node, colCount);
  }
}
