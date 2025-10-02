<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
console.log("Initializing Staff/Admin Portal");

const supabaseUrl = 'https://nfegizbnvxttxpinqlcz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZWdpemJudnh0dHhwaW5xbGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNTU2ODQsImV4cCI6MjA3NDczMTY4NH0.3f_LruJauLb8vYNmmP3PCd5WNO5U4JLiSjLg0YCtVYA';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

let currentRole = null;

/* ============================
   Tab Switching
   ============================ */
document.addEventListener("click", e => {
  if (e.target.classList.contains("tab-btn")) {
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    e.target.classList.add("active");

    document.querySelectorAll(".tab-panel").forEach(panel => panel.style.display = "none");
    const selected = e.target.dataset.tab;
    document.getElementById(`${selected}-panel`).style.display = "block";
  }
});

/* ============================
   Load Tables
   ============================ */
async function loadTables() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    console.log("No active session, redirecting to login");
    setTimeout(() => { window.location.href = "/portal/log-in"; }, 500);
    return;
  }

  const user = session.user;
  const { data: roleRow } = await supabaseClient
    .from("users")
    .select("role")
    .eq("auth_id", user.id)
    .maybeSingle();

  currentRole = roleRow?.role || "client";
  console.log("Logged in as", currentRole);

  if (currentRole !== "admin") {
    document.getElementById("users-tab").style.display = "none";
    document.getElementById("create-user-form").style.display = "none";
  }

  await loadShipments();
  await loadClients();
  if (currentRole === "admin") await loadUsers();

  if (currentRole !== "client") initShipmentSorting();
}

/* ============================
   Shipments
   ============================ */
async function loadShipments() {
  const { data, error } = await supabaseClient.from("shipments").select("*").order("eta_date");
  if (error) return console.error(error);

  const tbody = document.querySelector("#shipments-table tbody");
  tbody.innerHTML = data.map((r, i) => `
    <tr data-id="${r.id}" data-original-index="${i}">
      <td contenteditable data-column="shipment_ref">${r.shipment_ref||""}</td>
      <td contenteditable data-column="container_no">${r.container_no||""}</td>
      <td contenteditable data-column="bl_number">${r.bl_number||""}</td>
      <td contenteditable data-column="eta_date">${r.eta_date||""}</td>
      <td contenteditable data-column="vessel_name">${r.vessel_name||""}</td>
      <td>${booleanSelect("doc_invoice", r.doc_invoice)}</td>
      <td>${booleanSelect("doc_packing_list", r.doc_packing_list)}</td>
      <td>${booleanSelect("doc_bl", r.doc_bl)}</td>
      <td contenteditable data-column="notes">${r.notes||""}</td>
    </tr>`).join("");

  makeEditable("shipments-table", "shipments");
  makeDropdownEditable("shipments-table", "shipments");
}

/* ============================
   Clients
   ============================ */
async function loadClients() {
  const { data, error } = await supabaseClient.from("clients").select("*");
  if (error) return console.error(error);

  const tbody = document.querySelector("#clients-table tbody");
  tbody.innerHTML = data.map(r => `
    <tr data-id="${r.id}">
      <td contenteditable data-column="name">${r.name||""}</td>
      <td contenteditable data-column="email">${r.email||""}</td>
    </tr>`).join("");

  makeEditable("clients-table", "clients");
}

/* ============================
   Users
   ============================ */
async function loadUsers() {
  const { data, error } = await supabaseClient
    .from("users")
    .select(`id,email,name,role,clients ( name )`);

  if (error) return console.error("Load users failed", error);

  const tbody = document.querySelector("#users-table tbody");
  tbody.innerHTML = data.map(r => `
  <tr data-id="${r.id}" data-email="${r.email}">
    <td contenteditable data-column="email">${r.email || ""}</td>
    <td contenteditable data-column="name">${r.name || ""}</td>
    <td contenteditable data-column="role">${r.role || ""}</td>
    <td>${r.clients?.name || ""}</td>
    <td><button class="portal-button reset-link-btn">🔑 Reset Password</button></td>
  </tr>`).join("");

  makeEditable("users-table", "users", ["email", "name", "role"]);
}

/* ============================
   Editable Helpers
   ============================ */
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

/* ============================
   Expanded View Init
   ============================ */
function initExpandedView(clone) {
  // Re-bind inline edits and dropdowns inside clone
  makeEditable("shipments-table", "shipments");
  makeDropdownEditable("shipments-table", "shipments");
  makeEditable("clients-table", "clients");
  makeEditable("users-table", "users", ["email", "name", "role"]);

  // Rebind reset-link buttons in expanded view
  clone.querySelectorAll(".reset-link-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const row = e.target.closest("tr");
      const email = row.dataset.email;
      alert("Reset link for: " + email); // (replace with real reset-link flow)
    });
  });

  if (currentRole !== "client") initShipmentSorting();
}

/* ============================
   Expand / Collapse
   ============================ */
document.addEventListener("DOMContentLoaded", () => {
  const expandBtn = document.getElementById("fullscreen-btn");
  const overlay = document.getElementById("portal-overlay");
  const expanded = document.getElementById("portal-expanded");
  const closeBtn = document.getElementById("close-fullscreen");
  const portalContent = document.querySelector("#staff-portal-container #tab-content");

  expandBtn.addEventListener("click", () => {
    const clone = portalContent.cloneNode(true);
    clone.id = "tab-content-clone";

    expanded.querySelectorAll("#tab-content-clone").forEach(n => n.remove());
    expanded.appendChild(clone);

    overlay.style.display = "flex";
    expandBtn.style.display = "none";
    document.body.style.overflow = "hidden";
    expanded.scrollTop = 0;

    initExpandedView(clone);
  });

  closeBtn.addEventListener("click", () => {
    overlay.style.display = "none";
    expanded.querySelectorAll("#tab-content-clone").forEach(n => n.remove());
    expandBtn.style.display = "inline-block";
    document.body.style.overflow = "";
  });
});

/* ============================
   Logout
   ============================ */
document.getElementById("logout-btn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "/portal/log-in";
});

/* ============================
   Init
   ============================ */
document.addEventListener("DOMContentLoaded", loadTables);
</script>
