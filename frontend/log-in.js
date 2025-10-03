// log-in.js
function initLogin() {
  console.log("Initializing Login Page");

  // Redirect logged-in users if they already have a session
  supabaseClient.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      console.log("Already logged in, redirecting by role");
      redirectByRole(session.user);
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
      redirectByRole(data.user);
    }
  });

  // Role-based redirect
  async function redirectByRole(user) {
    console.log("Determining role for user", user.email);

    const { data: userRow, error } = await supabaseClient
      .from("users")
      .select("role")
      .eq("auth_id", user.id)
      .single();

    if (error || !userRow) {
      console.error("Role lookup error", error);
      document.getElementById("login-message").innerText = "Unable to determine role.";
      return;
    }

    if (userRow.role === "client") {
      window.location.href = "/portal/klant";
    } else if (["staff", "admin"].includes(userRow.role)) {
      window.location.href = "/portal/staff";
    } else {
      document.getElementById("login-message").innerText = "Unknown role.";
    }
  }
}
