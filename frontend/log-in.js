console.log("Initializing Login Page");

const supabaseUrl = 'https://nfegizbnvxttxpinqlcz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZWdpemJudnh0dHhwaW5xbGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNTU2ODQsImV4cCI6MjA3NDczMTY4NH0.3f_LruJauLb8vYNmmP3PCd5WNO5U4JLiSjLg0YCtVYA';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

// Redirect logged-in users if they already have a session
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    console.log("Already logged in, redirecting by role");
    redirectByRole(session.user);
  }
});

// Login button click
document.addEventListener("click", async e => {
  if (e.target.id === "login-btn") {
    const email = document.getElementById("email").value.trim().toLowerCase(); // normalize email
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
