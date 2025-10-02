document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing Set Password Page");

  const statusDiv = document.getElementById("status-message");
  const form = document.getElementById("set-password-form");

  const token = new URLSearchParams(window.location.search).get("token");
  if (!token) {
    statusDiv.innerText = "⚠️ Ongeldige of verlopen link.";
    return;
  }

  statusDiv.innerText = "Account gevonden. Stel uw wachtwoord in.";
  form.style.display = "block";

  document.getElementById("set-password-btn").addEventListener("click", async () => {
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (!newPassword || !confirmPassword) {
      statusDiv.innerText = "⚠️ Vul beide velden in";
      return;
    }
    if (newPassword !== confirmPassword) {
      statusDiv.innerText = "⚠️ Wachtwoorden komen niet overeen";
      return;
    }
    if (newPassword.length < 8) {
      statusDiv.innerText = "⚠️ Het wachtwoord moet minstens 8 tekens bevatten";
      return;
    }

    try {
      const res = await fetch("https://nfegizbnvxttxpinqlcz.supabase.co/functions/v1/set_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: newPassword })
      });

      const result = await res.json();
      console.log("Set password result:", result);

      if (!res.ok || result.error) {
        statusDiv.innerText = "❌ " + (result.error || "Server error");
      } else {
        statusDiv.innerHTML = `
          ✅ Wachtwoord succesvol ingesteld!<br><br>
          <button id="go-login-btn" class="portal-button">Ga naar de inlogpagina</button>
        `;
        document.getElementById("go-login-btn").addEventListener("click", () => {
          window.location.href = "/portal/log-in";
        });
      }
    } catch (err) {
      console.error("❌ Request failed:", err);
      statusDiv.innerText = "❌ " + err.message;
    }
  });
});
