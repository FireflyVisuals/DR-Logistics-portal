console.log("Initializing Staff Portal");

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
  const { data: roleRow, error: roleError } = await supabaseClient
    .from("users")
    .select("role")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (roleError) {
    console.error("Role lookup failed", roleError.message);
    return;
  }

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
  if (error) return console.error("Load shipments failed:", error.message);

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
  if (error) return console.error("Load clients failed:", error.message);

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

  if (error) return console.error("Load users failed:", error.message);

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

function initExpandedView(clone) {
  makeEditable("shipments-table", "shipments");
  makeDropdownEditable("shipments-table", "shipments");
  makeEditable("clients-table", "clients");
  makeEditable("users-table", "users", ["email", "name", "role"]);

  clone.querySelectorAll(".reset-link-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const row = e.target.closest("tr");
      const email = row.dataset.email;
      alert("Reset link for: " + email); // TODO: replace with Supabase function call
    });
  });

  if (currentRole !== "client") initShipmentSorting();
}

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
