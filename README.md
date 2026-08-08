# 🏢 Nexgen Employee Management System (EMS)

An enterprise-grade, full-stack Employee Management System built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Supabase**. Designed with role-based security, reactive data fetching, customizable themes, and comprehensive HR workflow management.

---

## 🚀 Quick Links

- 📖 **[Technical Project Documentation](file:///home/mubashir/Internships/Nexgen/Nexgen-Employee-Management-System/docs/PROJECT_DOCUMENTATION.md)** — Architecture, Database ERD, Component Hierarchy, & Security Policies
- 📘 **[User Manual & Role Guides](file:///home/mubashir/Internships/Nexgen/Nexgen-Employee-Management-System/docs/USER_MANUAL.md)** — Step-by-step feature guides for Admins, Managers, and Employees
- 🗄️ **[Supabase Seed SQL File](file:///home/mubashir/Internships/Nexgen/Nexgen-Employee-Management-System/supabase_seed.sql)** — Database tables, RLS policies, and realistic seed data

---

## ✨ Features at a Glance

- 🔐 **Role-Based Access Control (RBAC)**: Strict navigation & API route guarding for `Admin`, `Manager`, and `Employee` roles.
- 👥 **Employee Management**: Create, update, soft-deactivate, or delete employee profiles with department and reporting manager hierarchy.
- 🏢 **Department Management**: Organize company departments, assign department managers, and track headcount.
- 📁 **Project & Assignment Tracking**: Manage project lifecycles, budgets, start/end dates, and assign multi-disciplinary teams.
- 🕒 **Attendance & Time Tracking**: Daily check-in/check-out recording, status tracking (`present`, `late`, `half_day`, `absent`), and auto hours computation.
- 🌴 **Leave Management**: Submit leave requests (`sick`, `casual`, `annual`, `unpaid`), view leave status, and manage manager approval workflows.
- 💰 **Payroll Management**: Process monthly payroll records, calculate gross vs net pay, filter payment status, and export reports.
- 📜 **System Audit Log**: Full activity auditing recording actor, entity, action type, timestamps, and JSON delta values.
- 🎨 **User Preference Engine**: Dark/Light mode toggle and 6 dynamic accent color themes (`red`, `blue`, `green`, `purple`, `orange`, `yellow`), persisted in Supabase.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend UI** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| **State & Data Fetching** | TanStack React Query v5, React Context API |
| **Backend & Database** | Supabase (PostgreSQL), Supabase Auth, Row Level Security (RLS) |
| **Node Backend Service** | Node.js, Express 5, `@supabase/supabase-js`, PostgreSQL Driver (`pg`) |
| **Tooling & Code Quality** | Oxlint, TypeScript, PostCSS |

---

## 🔐 Role Access Matrix

| Feature / Page | Admin | Manager | Employee |
|---|:---:|:---:|:---:|
| **Dashboard** | ✅ (Company-wide stats) | ✅ (Dept stats) | ✅ (Personal stats) |
| **Employees** | ✅ (Full CRUD) | ✅ (View dept team) | ❌ (Hidden) |
| **Departments** | ✅ (Full CRUD) | ❌ (Hidden) | ❌ (Hidden) |
| **Projects** | ✅ (Full CRUD) | ✅ (Dept projects) | ✅ (Assigned projects) |
| **Attendance** | ✅ (Company-wide) | ✅ (Dept attendance) | ✅ (Personal history) |
| **Leave Management** | ✅ (Approve all) | ✅ (Approve dept) | ✅ (Apply & track) |
| **Payroll** | ✅ (Full processing) | ✅ (Dept payroll) | ✅ (Personal paystubs) |
| **Audit Log** | ✅ (Full access) | ❌ (Hidden) | ❌ (Hidden) |
| **Settings** | ✅ (Profile & Theme) | ✅ (Profile & Theme) | ✅ (Profile & Theme) |

---

## ⚙️ Getting Started & Local Development

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Supabase Project**: Active account and project on [Supabase](https://supabase.com)

---

### 2. Database Setup & Seeding

1. Go to your **[Supabase Dashboard](https://database.new)** → Select your project → Open **SQL Editor**.
2. Open [supabase_seed.sql](file:///home/mubashir/Internships/Nexgen/Nexgen-Employee-Management-System/supabase_seed.sql), copy its entire contents, paste it into the SQL Editor, and click **Run**.
3. Create your initial Admin user in **Supabase Dashboard → Authentication → Users** using `admin@nexgen.com`.
4. Run the following query in the SQL Editor to link your Auth user to the seeded Admin profile:

```sql
UPDATE public.employee 
SET auth_user_id = '<YOUR_SUPABASE_AUTH_USER_UUID>' 
WHERE email = 'admin@nexgen.com';
```

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

Edit `frontend/.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

### 4. Backend Service Setup (Optional)

```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

Run the backend server:

```bash
npm start
```

---

## 📂 Project Repository Structure

```
Nexgen-Employee-Management-System/
├── docs/
│   ├── PROJECT_DOCUMENTATION.md   # Comprehensive Technical Architecture & ERD
│   └── USER_MANUAL.md            # Comprehensive End-User Guide by Role
├── frontend/
│   ├── src/
│   │   ├── app/                  # Router & Layout wrappers
│   │   ├── auth/                 # AuthProvider & ProtectedRoute guard
│   │   ├── components/           # UI Layout, Header, Sidebar
│   │   ├── features/             # Feature Modules (Employees, Projects, etc.)
│   │   ├── lib/                  # Supabase client & React Query hooks
│   │   ├── theme/                # Dynamic ThemeProvider & Accent colors
│   │   └── types/                # Supabase Database TypeScript definitions
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── server.js                 # Express server & API endpoints
│   └── package.json
├── supabase_seed.sql             # SQL Schema, RLS Policies, & Seed Data
├── README.md                     # Main Repository Readme
└── vercel.json                   # Vercel Deployment Configuration
```

---

## 📄 License

Distributed under the ISC License. See `LICENSE` for more details.
