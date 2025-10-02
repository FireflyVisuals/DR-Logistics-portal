console.log("Loading Common Portal Helpers");

// ============================
// Supabase Init
// ============================
const supabaseUrl = "https://nfegizbnvxttxpinqlcz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZWdpemJudnh0dHhwaW5xbGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNTU2ODQsImV4cCI6MjA3NDczMTY4NH0.3f_LruJauLb8vYNmmP3PCd5WNO5U4JLiSjLg0YCtVYA";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

// ============================
// Editable Helpers
// ============================
function makeEditable(tableId, tableName, allowedColumns = null) {
  document.querySelectorAll(`#${tableId} td[contenteditable]`).forEach(td => {
    td.addEventListener("blur", async () => {
      const row = td.closest("tr");
      const id = row.dataset.id;
      const column = td.dataset.column;
      const value = td.innerText.trim();

      if (allowedColumns && !allowedColumns.includes(column)) return;

      const { error } = await supabaseClient.from(tableName).update({ [column]: value }).eq("id", id);
      td.style.backgroundColor = error ? "#ffcccc" : "#ccffcc";
      if (!error) setTimeout(() => (td.style.backgroundColor = ""), 800);
    });
  });
}

function makeDropdownEditable(tableId, tableName) {
  document.querySelectorAll(`#${tableId} select[data-column]`).forEach(select => {
    select.addEventListener("change", async () => {
      const row = select.closest("tr");
      const id = row.dataset.id;
      const column = select.dataset.column;
      const value = select.value === "true";

      const { error } = await supabaseClient.from(tableName).update({ [column]: value }).eq("id", id);
      select.style.backgroundColor = error ? "#ffcccc" : "#ccffcc";
      if (!error) setTimeout(() => (select.style.backgroundColor = ""), 800);
    });
  });
}

function booleanSelect(column, value) {
  return `
    <select data-column="${column}">
      <option value="true" ${value ? "selected" : ""}>✔</option>
      <option value="false" ${!value ? "selected" : ""}>✘</option>
    </select>`;
}

// ============================
// Shipment Sorting
// ============================
let shipmentSort = { index: null, dir: "none" };
const shipmentColumns = [
  { key: "shipment_ref", type: "text" },
  { key: "container_no", type: "text" },
  { key: "bl_number", type: "text" },
  { key: "eta_date", type: "date" },
  { key: "vessel_name", type: "text" },
  { key: "doc_invoice", type: "bool" },
  { key: "doc_packing_list", type: "bool" },
  { key: "doc_bl", type: "bool" },
  { key: "notes", type: "text" }
];

function initShipmentSorting() {
  const thead = document.querySelector("#shipments-table thead");
  if (!thead) return;
  const ths = Array.from(thead.querySelectorAll("th"));

  ths.forEach((th, i) => {
    th.style.cursor = "pointer";
    if (!th.querySelector(".sort-indicator")) {
      const span = document.createElement("span");
      span.className = "sort-indicator";
      span.style.marginLeft = "6px";
      span.textContent = "↕";
      th.appendChild(span);
    }
    th.dataset.sort = "none";
    th.onclick = () => onShipmentHeaderClick(i, th);
  });
}

function onShipmentHeaderClick(colIndex, thEl) {
  if (!shipmentColumns[colIndex]) return;

  let state = thEl.dataset.sort || "none";
  const newState = state === "none" ? "asc" : state === "asc" ? "desc" : "none";

  document.querySelectorAll("#shipments-table thead th").forEach(th => {
    th.dataset.sort = "none";
    const ind = th.querySelector(".sort-indicator");
    if (ind) ind.textContent = "↕";
  });

  thEl.dataset.sort = newState;
  const ind = thEl.querySelector(".sort-indicator");
  if (ind) ind.textContent = newState === "asc" ? "↑" : newState === "desc" ? "↓" : "↕";

  shipmentSort.index = (newState === "none") ? null : colIndex;
  shipmentSort.dir = newState;

  if (newState === "none") {
    restoreShipmentOriginalOrder();
  } else {
    sortShipmentsBy(colIndex, shipmentColumns[colIndex].type, newState);
  }
}

function restoreShipmentOriginalOrder() {
  const tbody = document.querySelector("#shipments-table tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));
  rows.sort((a, b) => {
    const ai = parseInt(a.dataset.originalIndex || "0", 10);
    const bi = parseInt(b.dataset.originalIndex || "0", 10);
    return ai - bi;
  });
  rows.forEach(r => tbody.appendChild(r));
}

function sortShipmentsBy(colIndex, type, dir) {
  const tbody = document.querySelector("#shipments-table tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));

  const getVal = (row) => {
    const cell = row.cells[colIndex];
    if (!cell) return "";
    if (type === "bool") {
      const sel = cell.querySelector("select");
      return sel ? (sel.value === "true") : false;
    }
    const txt = cell.innerText.trim();
    if (type === "date") {
      const t = Date.parse(txt);
      return isNaN(t) ? -Infinity : t;
    }
    return txt.toLowerCase();
  };

  rows.sort((a, b) => {
    const av = getVal(a);
    const bv = getVal(b);

    let cmp = 0;
    if (type === "date") {
      cmp = (av === bv) ? 0 : (av < bv ? -1 : 1);
    } else if (type === "bool") {
      cmp = (av === bv) ? 0 : (av ? 1 : -1);
    } else {
      cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
    }

    return dir === "asc" ? cmp : -cmp;
  });

  rows.forEach(r => tbody.appendChild(r));
}
