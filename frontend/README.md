# EMS Frontend — Setup Instructions

## 1. Install dependencies
```bash
npm install
```

## 2. Configure Supabase connection
```bash
cp .env.example .env
```
Then open `.env` and fill in:
- `VITE_SUPABASE_URL` — from Supabase Dashboard → Project Settings → API
- `VITE_SUPABASE_PUBLISHABLE_KEY` — the **publishable** key (NOT the secret key — never put the secret key in this file, it ships to the browser)

## 3. Run the dev server
```bash
npm run dev
```
Visit the URL it prints (usually `http://localhost:5173`).

## 4. Log in
Use the admin account you created manually in Supabase Auth (see Phase 1 instructions). You should land on the Dashboard and see only the nav items an admin is allowed to see.

## What's implemented in this phase
- ✅ Supabase client + session handling (`AuthProvider`)
- ✅ Role fetched from the `employee` table on login (admin / manager / employee)
- ✅ Route guarding: unauthorized pages redirect, and **nav links for disallowed
  sections don't render at all** (see `Sidebar.tsx` → `NAV_ITEMS.roles`)
- ✅ Dark/light mode + 6 preset accent colors, persisted per-user to `user_preferences`
- ✅ Login form with live (on-keystroke) validation — invalid fields turn red/greyed and
  the submit button stays disabled until the form is valid
- ⏳ Employees, Departments, Projects, Attendance, Leaves, Payroll, Audit Log — placeholder
  pages for now, real CRUD + data coming in the next phases

## Role → visible nav (already enforced)
| Link | Admin | Manager | Employee |
|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ |
| Employees | ✅ | ✅ | ❌ (hidden) |
| Departments | ✅ | ❌ (hidden) | ❌ (hidden) |
| Projects | ✅ | ✅ | ✅ |
| Attendance | ✅ | ✅ | ✅ |
| Leave Management | ✅ | ✅ | ✅ |
| Payroll | ✅ | ✅ | ✅ |
| Audit Log | ✅ | ❌ (hidden) | ❌ (hidden) |
| Settings | ✅ | ✅ | ✅ |

Note: page *content* inside each module (e.g. who you can edit/approve) will be
scoped further in each feature's build phase — the sidebar filtering above handles
which sections a role can even navigate to.
