document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing Admin Portal");

  async function loadTables() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      console.log("No active session, redirecting to login");
      setTimeout(() => { window.location.href = "/portal/log-in"; }, 500);
      return;
    }

    await loadShipments();
    await loadClients();
    await loadUsers();
    initShipmentSorting();
  }

  // Tab switching
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

  // Expand / Collapse
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

  // Delegated actions (reset + create user)
  document.addEventListener("click", async e => {
    if (e.target.id === "create-user-btn") {
      await handleCreateUser();
    }
    if (e.target.classList.contains("reset-link-btn")) {
      const row = e.target.closest("tr");
      if (row) await handleResetLink(row.dataset.email);
    }
  });

  // Logout
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "/portal/log-in";
    });
  }

  loadTables();
});
