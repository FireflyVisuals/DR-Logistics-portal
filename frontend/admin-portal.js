// admin-portal.js
function initAdminPortal() {
  console.log("Initializing Admin Portal");

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

    // 🔧 DEV ROLE SWITCHER (localhost / staging / ?dev=1)
    if (
      window.location.hostname.includes("webflow.io") ||
      window.location.hostname === "localhost" ||
      window.location.search.includes("dev=1")
    ) {
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
          loadTables();
        });

        const container = document.getElementById("admin-portal-container") || document.body;
        container.style.position = "relative";
        container.appendChild(switcher);
      }
    }

    // Load all data (admin has full access)
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
      .select("id,email,name,role,client_id");

    if (error) return console.error("Load users failed", error);

    const tbody = document.querySelector("#users-table tbody");
    if (!tbody) return;
    tbody.innerHTML = data.map(r => `
      <tr data-id="${r.id}" data-email="${r.email}">
        <td contenteditable data-column="email">${r.email || ""}</td>
        <td contenteditable data-column="name">${r.name || ""}</td>
        <td contenteditable data-column="role">${r.role || ""}</td>
        <td>${r.client_id || ""}</td>
        <td><button class="portal-button reset-link-btn">🔑 Reset Password</button></td>
      </tr>`).join("");

    makeEditable("users-table", "users", ["email", "name", "role"]);
  }

  /* ============================
     Create New User
     ============================ */
  document.addEventListener("click", async e => {
    if (e.target.id === "create-user-btn") {
      const email = document.getElementById("new-email").value;
      const name = document.getElementById("new-name").value;
      const role = document.getElementById("new-role").value;
      const company = document.getElementById("new-company").value;
      const messageDiv = document.getElementById("create-user-message");
      messageDiv.innerHTML = "";

      try {
        const sessionRes = await supabaseClient.auth.getSession();
        const token = sessionRes.data.session?.access_token;
        if (!token) {
          messageDiv.innerText = "Not authenticated";
          return;
        }

        const res = await fetch(`${supabaseUrl}/functions/v1/create_user`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, name, role, company })
        });

        const result = await res.json();
        if (!res.ok || result.error) {
          messageDiv.innerText = "Error: " + (result.error || "Unknown");
        } else {
          messageDiv.innerHTML = `
            <div style="color:green; font-weight:bold;">✅ User created successfully!</div>
            <div style="margin-top:8px;">
              <label style="font-weight:bold;">Onboarding link:</label><br>
              <input type="text" value="${result.onboardingLink}" readonly style="width:90%; padding:8px;">
            </div>
          `;
          await loadUsers();
        }
      } catch (err) {
        console.error("Create user failed", err);
        messageDiv.innerText = "Error: " + err.message;
      }
    }
  });

  /* ============================
     Reset Password Links
     ============================ */
  document.addEventListener("click", async e => {
    if (e.target.classList.contains("reset-link-btn")) {
      const row = e.target.closest("tr");
      const email = row.dataset.email;
      const messageDiv = document.getElementById("create-user-message");
      messageDiv.innerHTML = "";

      try {
        const sessionRes = await supabaseClient.auth.getSession();
        const token = sessionRes.data.session?.access_token;
        if (!token) {
          messageDiv.innerText = "Not authenticated";
          return;
        }

        const res = await fetch(`${supabaseUrl}/functions/v1/generate_reset_link`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email })
        });

        const result = await res.json();
        if (!res.ok || result.error) {
          messageDiv.innerText = "Error: " + (result.error || "Unknown");
        } else {
          messageDiv.innerHTML = `
            <div style="color:#034e7b; font-weight:bold;">🔑 Reset link for ${email}:</div>
            <input type="text" value="${result.resetLink}" readonly style="width:90%; padding:6px;">
          `;
        }
      } catch (err) {
        console.error("Generate reset link failed", err);
        messageDiv.innerText = "Error: " + err.message;
      }
    }
  });

  /* ============================
     Expand / Collapse Modal
     ============================ */
  const expandBtn = document.getElementById("fullscreen-btn");
  const overlay = document.getElementById("portal-overlay");
  const expanded = document.getElementById("portal-expanded");
  const closeBtn = document.getElementById("close-fullscreen");
  const portalContent = document.querySelector("#admin-portal-container #tab-content");

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
