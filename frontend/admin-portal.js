console.log("Initializing Admin Portal");

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

  console.log("Logged in as admin");

  await loadShipments();
  await loadClients();
  await loadUsers();

  initShipmentSorting();
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
