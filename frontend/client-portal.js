console.log("Initializing Client Portal");

const supabaseUrl = "https://nfegizbnvxttxpinqlcz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZWdpemJudnh0dHhwaW5xbGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNTU2ODQsImV4cCI6MjA3NDczMTY4NH0.3f_LruJauLb8vYNmmP3PCd5WNO5U4JLiSjLg0YCtVYA";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

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

  console.log("Logged in as client");

  await loadShipments();
  await loadClients();
}

/* ============================
   Shipments (Read-only)
   ============================ */
async function loadShipments() {
  const { data, error } = await supabaseClient
    .from("shipments")
    .select("*")
    .order("eta_date");

  if (error) return console.error("Load shipments failed:", error.message);

  const tbody = document.querySelector("#shipments-table tbody");
  tbody.innerHTML = data.map((r, i) => `
    <tr data-id="${r.id}">
      <td>${r.shipment_ref||""}</td>
      <td>${r.container_no||""}</td>
      <td>${r.bl_number||""}</td>
      <td>${r.eta_date||""}</td>
      <td>${r.doc_invoice ? "✔" : "✘"}</td>
      <td>${r.doc_packing_list ? "✔" : "✘"}</td>
      <td>${r.doc_bl ? "✔" : "✘"}</td>
      <td>${r.notes||""}</td>
      <td><a href="${r.tracking_link||"#"}" target="_blank">🔗 Track</a></td>
    </tr>`).join("");
}

/* ============================
   Clients (Read-only)
   ============================ */
async function loadClients() {
  const { data, error } = await supabaseClient
    .from("clients")
    .select("*");

  if (error) return console.error("Load clients failed:", error.message);

  const tbody = document.querySelector("#clients-table tbody");
  tbody.innerHTML = data.map(r => `
    <tr data-id="${r.id}">
      <td>${r.name||""}</td>
      <td>${r.email||""}</td>
    </tr>`).join("");
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
