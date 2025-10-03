// log-in.js
function initLogin() {
  console.log("Initializing Login Page");

  // Check for active session
  supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
    if (session) {
      console.log("Session found, checking role…");
      const success = await tryRedirectByRole(session.user);
      if (!success) {
        console.warn("Invalid session or role lookup failed, signing out");
        await supabaseClient.auth.signOut();
        document.getElementById("login-message").innerText = "⚠️ Please log in again.";
      }
    }
  });

  // Login button click
  document.addEventListener("click", async e => {
    if (e.target.id === "login-btn") {
      const email = document.getElementById("email").value.trim().toLowerCase();
      const password = document.getElementById("password").value;
      const messageDiv = document.getElementById("login-message");
      messageDiv.innerText = "";

      console.log("Login attempt", email);

      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("Login error", error);
        messageDiv.innerText = error.message;
        return;
      }

      console.log("Login success, redirecting by role");
      await tryRedirectByRole(data.user);
    }
  });

  // Role-based redirect
  async function tryRedirectByRole(user) {
    try {
      const { data: userRow, error } = await supabaseClient
        .from("users")
        .select("role")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (error || !userRow) {
        console.error("Role lookup error", error);
        return false;
      }

      if (userRow.role === "client") {
        window.location.href = "/portal/klant";
      } else if (["staff", "admin"].includes(userRow.role)) {
        window.location.href = "/portal/staff";
      } else {
        console.warn("Unknown role:", userRow.role);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Redirect by role failed", err);
      return false;
    }
  }
}
