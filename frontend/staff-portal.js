// staff-portal.js
function initStaffPortal() {
  console.log("Initializing Staff Portal");

  let currentRole = null;

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

    // Preserve manually switched role if set
    if (!currentRole || currentRole === "client") {
    currentRole = roleRow?.role || "client";
    }
    console.log("Logged in as", currentRole);

    // Hide admin-only UI
    if (currentRole !== "admin") {
      const usersTab = document.getElementById("users-tab");
      if (usersTab) usersTab.style.display = "none";
      const createForm = document.getElementById("create-user-form");
      if (createForm) createForm.style.display = "none";
    }

    // 🔧 DEV ROLE SWITCHER (localhost / webflow staging only)
    if (window.location.hostname.includes("webflow.io") || window.location.hostname === "localhost") {
      if (!document.getElementById("dev-role-switcher")) {
        const switcher = document.createElement("select");
        switcher.id = "dev-role-switcher";
        switcher.style.position = "absolute";
        switcher.style.bottom = "20px";
        switcher.style.right = "20px";
        switcher.style.zIndex = "3000";
        switcher.style.padding = "6px";
        switcher.style.borderRadius = "6px";
        switcher.style.border = "1px solid #ccc";
        switcher.style.background = "#fff";

        ["admin", "staff", "client"].forEach(r => {
          const opt = document.createElement("option");
          opt.value = r;
          opt.textContent = "Switch to " + r;
          if (r === currentRole) opt.selected = true;
          switcher.appendChild(opt);
        });

        switcher.addEventListener("change", e => {
          currentRole = e.target.value;
          console.warn("🔄 Role manually switched to", currentRole);
          loadTables(); // reload UI with new role
        });

        const container = document.getElementById("staff-portal-container") || document.body;
container.appendChild(switcher);
;
      }
    }

    // Load data
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
    if (!tbody) return;
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
    if (!tbody) return;
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
    if (!tbody) return;
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
     Tab Switching
     ============================ */
  document.addEventListener("click", e => {
    if (e.target.classList.contains("tab-btn")) {
      document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
      e.target.classList.add("active");

      document.querySelectorAll(".tab-panel").forEach(panel => panel.style.display = "none");
      const selected = e.target.dataset.tab;
      const panel = document.getElementById(`${selected}-panel`);
      if (panel) panel.style.display = "block";
    }
  });

  /* ============================
     Expand / Collapse Modal
     ============================ */
  const expandBtn = document.getElementById("fullscreen-btn");
  const overlay = document.getElementById("portal-overlay");
  const expanded = document.getElementById("portal-expanded");
  const closeBtn = document.getElementById("close-fullscreen");
  const portalContent = document.querySelector("#staff-portal-container #tab-content");

  if (expandBtn && overlay && expanded && closeBtn && portalContent) {
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
  }

  /* ============================
     Logout
     ============================ */
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "/portal/log-in";
    });
  }

  /* ============================
     Init
     ============================ */
  loadTables();
}
