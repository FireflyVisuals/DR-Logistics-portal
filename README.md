📦 DR Logistics Portal

This repo contains all frontend logic (JS), HTML embed templates, and styles (CSS) for the DR Logistics customer/staff/admin portal, built on Supabase + Webflow.

📂 Structure
DR-Logistics-portal/
│
├─ frontend/              # All JavaScript logic
│   ├─ common.js          # Shared helpers (supabase init, sorting, editing)
│   ├─ client-portal.js   # Client portal logic (read-only view)
│   ├─ staff-portal.js    # Staff portal logic (shipments + clients)
│   ├─ admin-portal.js    # Admin portal logic (staff + user management)
│   ├─ log-in.js          # Login page logic
│   └─ set-password.js    # Secure password reset page logic
│
├─ embeds/                # HTML embed blocks for Webflow
│   ├─ client.html
│   ├─ staff.html
│   ├─ admin.html
│   ├─ login.html
│   └─ set-password.html
│
└─ frontend/portal.css    # Shared portal styles

🔄 Workflow

Edit files locally in this repo.

Commit & push changes to GitHub (main branch).

Updates are instantly available via jsDelivr CDN
.

Example URL format:

https://cdn.jsdelivr.net/gh/FireflyVisuals/DR-Logistics-portal@main/frontend/staff-portal.js


You can also pin to a commit for stable versions:

https://cdn.jsdelivr.net/gh/FireflyVisuals/DR-Logistics-portal@<commit_hash>/frontend/staff-portal.js

🌐 Webflow Integration

Each Webflow page includes:

HTML embed (from embeds/*.html)

CSS (portal.css)

Supabase SDK

common.js (shared helpers)

role-specific JS

Client Portal Page (/portal/klant)
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/FireflyVisuals/DR-Logistics-portal@main/frontend/portal.css">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="https://cdn.jsdelivr.net/gh/FireflyVisuals/DR-Logistics-portal@main/frontend/common.js"></script>
<script src="https://cdn.jsdelivr.net/gh/FireflyVisuals/DR-Logistics-portal@main/frontend/client-portal.js"></script>

Staff Portal Page (/portal/staff)
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/FireflyVisuals/DR-Logistics-portal@main/frontend/portal.css">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="https://cdn.jsdelivr.net/gh/FireflyVisuals/DR-Logistics-portal@main/frontend/common.js"></script>
<script src="https://cdn.jsdelivr.net/gh/FireflyVisuals/DR-Logistics-portal@main/frontend/staff-portal.js"></script>

Admin Portal Page (/portal/admin)
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/FireflyVisuals/DR-Logistics-portal@main/frontend/portal.css">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="https://cdn.jsdelivr.net/gh/FireflyVisuals/DR-Logistics-portal@main/frontend/common.js"></script>
<script src="https://cdn.jsdelivr.net/gh/FireflyVisuals/DR-Logistics-portal@main/frontend/admin-portal.js"></script>

Login Page (/portal/log-in)
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/FireflyVisuals/DR-Logistics-portal@main/frontend/portal.css">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="https://cdn.jsdelivr.net/gh/FireflyVisuals/DR-Logistics-portal@main/frontend/log-in.js"></script>

Set Password Page (/portal/set-password)
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/FireflyVisuals/DR-Logistics-portal@main/frontend/portal.css">
<script src="https://cdn.jsdelivr.net/gh/FireflyVisuals/DR-Logistics-portal@main/frontend/set-password.js"></script>

🔐 Notes

Supabase Anon Key is embedded in common.js, log-in.js, and set-password.js.

All password reset flows use secure tokens stored in the password_tokens table (never email reset links).

Staff/Admin portals allow inline editing, sorting, filtering; Client portal is read-only.

🚀 Deployment

Every push to main is instantly available on Webflow via jsDelivr.
If caching delays occur:

Use a specific commit hash in the CDN URL

Or append ?v=timestamp to force refresh in Webflow
