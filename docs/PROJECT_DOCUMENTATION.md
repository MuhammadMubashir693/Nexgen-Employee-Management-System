# 🏗️ Nexgen Employee Management System — Technical Project Documentation

This document provides a comprehensive technical overview of the architecture, database schema, security model, component hierarchy, state management, and deployment strategy for the **Nexgen Employee Management System (EMS)**.

---

## 📌 Table of Contents
1. [System Architecture Overview](#1-system-architecture-overview)
2. [Database Schema & ER Diagram](#2-database-schema--er-diagram)
3. [Security & Access Control (RBAC & RLS)](#3-security--access-control-rbac--rls)
4. [Frontend Application Architecture](#4-frontend-application-architecture)
5. [Backend & Supabase Integration](#5-backend--supabase-integration)
6. [State Management & Data Layer](#6-state-management--data-layer)
7. [Theme Engine & Styling System](#7-theme-engine--styling-system)
8. [Deployment & DevOps](#8-deployment--devops)

---

## 1. System Architecture Overview

The Nexgen Employee Management System uses a modern **Jamstack architecture with a Serverless/BaaS backend powered by Supabase**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              React 19 SPA                                   │
│  (React Router v7, TanStack React Query v5, Tailwind CSS, Theme Engine)     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                        HTTPS / WebSockets (Realtime)
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                            Supabase Platform                                │
│ ┌──────────────────────┐ ┌────────────────────────┐ ┌─────────────────────┐ │
│ │    Supabase Auth     │ │ PostgreSQL Database    │ │   Edge Functions    │ │
│ │ (JWT / Session Mgmt)  │ │ (RLS, Constraints, FK) │ │ (Admin Privileges)  │ │
│ └──────────────────────┘ └────────────────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Characteristics
- **Client-Side SPA**: Built using React 19, TypeScript, and Vite for fast client rendering.
- **Backend as a Service (BaaS)**: Database, Auth, Storage, and Edge Functions hosted on Supabase PostgreSQL.
- **Serverless API / Node Service**: Lightweight Express.js middleware server for administrative operations requiring elevated privileges.
- **Declarative Data Fetching**: TanStack React Query handles caching, optimistic updates, and background revalidation.

---

## 2. Database Schema & ER Diagram

The PostgreSQL database consists of 9 core tables designed with relational integrity, cascading foreign keys, and timestamp tracking.

### 📊 Entity Relationship Diagram

```mermaid
erDiagram
    DEPARTMENT ||--o{ EMPLOYEE : "employs"
    EMPLOYEE ||--o{ EMPLOYEE : "manages"
    DEPARTMENT ||--o| EMPLOYEE : "managed by"
    DEPARTMENT ||--o{ PROJECT : "owns"
    EMPLOYEE ||--o{ PROJECT : "manages"
    EMPLOYEE ||--o{ ASSIGNMENT : "assigned to"
    PROJECT ||--o{ ASSIGNMENT : "has team"
    EMPLOYEE ||--o{ ATTENDANCE : "logs"
    EMPLOYEE ||--o{ LEAVES : "requests"
    EMPLOYEE ||--o{ LEAVES : "approves"
    EMPLOYEE ||--o{ PAYROLL : "receives"
    EMPLOYEE ||--o{ AUDIT_LOG : "triggers"
    EMPLOYEE ||--o| USER_PREFERENCES : "customizes"

    DEPARTMENT {
        bigint department_id PK
        text name
        text location
        bigint manager_id FK
    }

    EMPLOYEE {
        bigint employee_id PK
        uuid auth_user_id FK
        bigint department_id FK
        bigint manager_employee_id FK
        text first_name
        text last_name
        text gender
        text email UK
        date hire_date
        text job_title
        text status
        text role
        timestamptz created_at
    }

    PROJECT {
        bigint project_id PK
        bigint department_id FK
        bigint manager_id FK
        text project_name
        date start_date
        date end_date
        numeric budget
        text status
    }

    ASSIGNMENT {
        bigint employee_id PK_FK
        bigint project_id PK_FK
        text assigned_role
        timestamptz assigned_at
    }

    ATTENDANCE {
        bigint attendance_id PK
        bigint employee_id FK
        date attendance_date
        time check_in
        time check_out
        text status
        numeric hours_worked
    }

    LEAVES {
        bigint leave_id PK
        bigint employee_id FK
        text leave_type
        date start_date
        date end_date
        text reason
        text approval_status
        bigint approved_by FK
        timestamptz requested_at
    }

    PAYROLL {
        bigint payroll_id PK
        bigint employee_id FK
        date period_start
        date period_end
        numeric gross_pay
        numeric net_pay
        date pay_date
        text payment_status
    }

    AUDIT_LOG {
        bigint audit_log_id PK
        bigint actor_employee_id FK
        text entity_type
        bigint entity_id
        text action
        timestamptz changed_at
        jsonb old_values
        jsonb new_values
    }

    USER_PREFERENCES {
        bigint employee_id PK_FK
        text theme_mode
        text accent_color
    }
```

---

## 3. Security & Access Control (RBAC & RLS)

The application enforces a multi-layer security model spanning database policies, API guards, and frontend UI routing.

### 🛡️ Role Matrix & Permissions

| Role | Access Level | Description |
|---|---|---|
| **Admin** | System Wide (`*`) | Full access to create, update, delete employees, departments, projects, view audit logs, process payroll, and manage system preferences. |
| **Manager** | Department Scoped | Can view team employees, manage department projects, approve/reject leave requests, view attendance, and manage assigned team members. |
| **Employee** | Self Scoped | Can view personal dashboard, clock attendance, apply for leaves, view personal payroll/paystubs, view assigned projects, and update preferences. |

### 🔒 Database Row Level Security (RLS)
Every table has Row Level Security enabled in PostgreSQL:
```sql
ALTER TABLE public.employee ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
```

---

## 4. Frontend Application Architecture

### 📂 Directory Structure

```
frontend/src/
├── app/
│   └── router.tsx             # React Router v7 configuration with route guards
├── auth/
│   ├── AuthProvider.tsx       # Supabase session context & user profile fetcher
│   └── ProtectedRoute.tsx     # Guard component evaluating role permissions
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx      # Main application frame (Sidebar + Header + Canvas)
│   │   ├── Header.tsx         # User profile menu, theme toggle, and page title
│   │   └── Sidebar.tsx        # Role-aware navigation menu
│   └── ui/                    # Reusable UI primitives (Buttons, Modals, Badges)
├── features/
│   ├── attendance/            # Attendance logging & monthly time history
│   ├── auditLog/              # System audit log viewer (Admin only)
│   ├── auth/                  # Login page & Unauthorized warning page
│   ├── dashboard/             # Role-specific analytics metrics
│   ├── departments/           # Department CRUD & manager assignment
│   ├── employees/             # Employee directory, creation, edit modal
│   ├── leaves/                # Leave application & approval workflow
│   ├── payroll/               # Monthly payroll calculation & status filters
│   ├── projects/              # Project tracking & team assignment modal
│   └── settings/              # Profile view & theme customization
├── lib/
│   ├── queries/               # TanStack Query custom hooks
│   └── supabaseClient.ts      # Typed Supabase client singleton
├── theme/
│   └── ThemeProvider.tsx      # Dynamic dark/light mode & 6 accent color presets
└── types/
    └── database.types.ts      # Generated TypeScript interfaces for database schema
```

---

## 5. Backend & Supabase Integration

### Supabase Edge Functions / Admin API
For operations requiring elevated permissions (e.g. creating user accounts in `auth.users` without exposing the Supabase service role key to the browser SPA):
- `create-employee`: Creates a Supabase auth identity and inserts an employee record.
- `deactivate-employee`: Disables auth login and updates `status` to `terminated`.
- `reactivate-employee`: Re-enables auth login and sets `status` to `active`.

---

## 6. State Management & Data Layer

Data management relies on **TanStack React Query v5**:
- **Automatic Background Refetching**: Stale time configuration ensures data stays up to date across browser tabs.
- **Cache Invalidation**: Mutations automatically invalidate affected query keys (e.g., creating an employee invalidates `['employees']` and `['departments']`).
- **Optimistic UI Updates**: Instant visual feedback when modifying user preferences or updating attendance logs.

---

## 7. Theme Engine & Styling System

The application features a custom theme engine supporting **Dark/Light Mode** and **6 Dynamic Accent Colors**:

```typescript
export type AccentColor = 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'yellow'
```

### Dynamic CSS Variable injection
```css
:root {
  --color-accent-primary: #3b82f6;
  --color-accent-hover: #2563eb;
  --color-accent-ring: rgba(59, 130, 246, 0.4);
}
```

Themes are automatically synced to the `user_preferences` PostgreSQL table upon selection, maintaining state across user sessions and devices.

---

## 8. Deployment & DevOps

### Production Build & Deployment Checklist
1. **Database Migration**: Execute `supabase_seed.sql` in the Supabase SQL Editor.
2. **Vercel Configuration**: `vercel.json` configured for Single Page Application client-side routing.
3. **Environment Variables**:
   - `VITE_SUPABASE_URL`: Supabase project API URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase anon/publishable key

---

*Documentation maintained by Nexgen Systems Engineering.*
