# 📖 Nexgen Employee Management System — User Manual & Operating Guide

Welcome to the **Nexgen Employee Management System (EMS)** user manual. This guide provides detailed, step-by-step instructions for **Administrators**, **Managers**, and **Employees** to navigate and utilize the system effectively.

---

## 📌 Table of Contents
1. [Getting Started & Login](#1-getting-started--login)
2. [Navigating the Workspace](#2-navigating-the-workspace)
3. [Administrator Guide](#3-administrator-guide)
4. [Manager Guide](#4-manager-guide)
5. [Employee Guide](#5-employee-guide)
6. [Settings & Theme Customization](#6-settings--theme-customization)
7. [Frequently Asked Questions (FAQ)](#7-frequently-asked-questions-faq)

---

## 1. Getting Started & Login

### Logging into your Account
1. Open your web browser and navigate to your company's EMS web address (e.g., `http://localhost:5173`).
2. You will be greeted by the **Sign In** page.
3. Enter your official email address (e.g., `admin@nexgen.com` or `alex.rivera@nexgen.com`) and your password.
4. Click **Sign In**.

> 💡 **Note**: Your navigation menu will automatically customize itself based on your assigned role (`Admin`, `Manager`, or `Employee`).

---

## 2. Navigating the Workspace

The application layout consists of three primary regions:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Sidebar (Left)           │ Header (Top Bar)                                 │
│ 📊 Dashboard             │ 📄 Page Title   [🌗 Dark Mode]  👤 Sarah Connor  │
│ 👥 Employees             ├──────────────────────────────────────────────────┤
│ 🏢 Departments           │ Main Canvas                                      │
│ 📁 Projects              │                                                  │
│ 🕒 Attendance            │ [ Feature Content, Tables, Analytics, Forms ]    │
│ 🌴 Leave Management      │                                                  │
│ 💰 Payroll               │                                                  │
│ 📜 Audit Log             │                                                  │
│ ⚙️ Settings               │                                                  │
└──────────────────────────┴──────────────────────────────────────────────────┘
```

---

## 3. Administrator Guide

As an **Administrator**, you have full operational control over the organization.

### 👥 1. Managing Employees
- **View Directory**: Click **Employees** in the left sidebar to view all active, on-leave, or terminated staff members.
- **Add New Employee**:
  1. Click the **+ Add Employee** button in the top right.
  2. Fill in First Name, Last Name, Email, Password, Gender, Hire Date, Job Title, Department, and Role.
  3. Click **Save Employee**.
- **Edit Employee Details**: Click the ✏️ **Edit** button next to an employee's row to modify their title, department, manager, or role.
- **Deactivate / Reactivate**: Use the ⏸️ **Deactivate** button to change an employee's status to `terminated` or ▶️ **Reactivate** to restore their access.
- **Delete Employee**: Click 🗑️ **Delete** to permanently remove an employee record.

### 🏢 2. Managing Departments
- **View Departments**: Navigate to **Departments** to view all company departments, location tags, assigned managers, and total employee headcount.
- **Create Department**: Click **+ Add Department**, specify department name and physical location, and select a Manager.
- **Update Department Manager**: Edit any department to reassign its department lead.

### 📁 3. Managing Projects & Assignments
- **Create Project**: Click **Projects** → **+ Create Project**. Enter project title, target department, project manager, start/end dates, and allocated budget.
- **Assign Team Members**: Click **Assign Team** on a project card to add employees and designate their role (e.g., *Lead Developer*, *UI Designer*).

### 🕒 4. Company-wide Attendance Tracking
- Navigate to **Attendance** to view daily check-in and check-out logs for all employees across departments.
- Filter by date or search by employee name.

### 🌴 5. Leave Request Approvals
- Navigate to **Leave Management**.
- View all employee leave applications categorized by status (`Pending`, `Approved`, `Rejected`).
- Click **Approve** or **Reject** to process requests.

### 💰 6. Payroll Processing
- Navigate to **Payroll**.
- View gross pay, net pay, period start/end dates, and payment status.
- Filter by payment status (`Paid`, `Pending`, `Failed`).

### 📜 7. Inspecting Audit Logs
- Navigate to **Audit Log** to review system event logs.
- Track actor employee ID, target entity, action type (`CREATE`, `UPDATE`, `DELETE`), timestamps, and JSON diffs of modified fields.

---

## 4. Manager Guide

As a **Manager**, your portal is tailored to oversee your assigned department and team members.

### 👥 1. Team Overview
- Navigate to **Employees** to inspect employees within your department.
- Monitor your team's current work status (`Active`, `On Leave`).

### 📁 2. Department Projects
- Navigate to **Projects** to view projects belonging to your department.
- Manage project status (`Active`, `On Hold`, `Completed`, `Cancelled`) and assign team members.

### 🕒 3. Team Attendance
- Navigate to **Attendance** to monitor daily check-in times, hours worked, and absence reports for your direct reports.

### 🌴 4. Reviewing Team Leave Requests
- Navigate to **Leave Management**.
- Review leave applications submitted by members of your department and click **Approve** or **Reject**.

---

## 5. Employee Guide

As an **Employee**, your portal provides a streamlined workspace to manage your daily work log and personal details.

### 📊 1. Personal Dashboard
- View your personalized metrics: hours worked this month, upcoming leave requests, active project assignments, and latest announcements.

### 🕒 2. Daily Attendance Logging
- Navigate to **Attendance**.
- Click **Check In** when you start your workday.
- Click **Check Out** when concluding your workday. The system automatically computes your total hours worked.

### 🌴 3. Submitting Leave Requests
1. Navigate to **Leave Management** → Click **+ Apply for Leave**.
2. Select Leave Type (`Sick`, `Casual`, `Annual`, `Unpaid`).
3. Pick Start Date and End Date.
4. Enter a brief reason for your leave application.
5. Click **Submit Application**. You can track approval progress directly on the page.

### 💰 4. Viewing Payroll & Payslips
- Navigate to **Payroll** to inspect your historical payslips, gross pay, net pay, and payment dates.

---

## 6. Settings & Theme Customization

Every user can personalize their application workspace preferences:

1. Click **Settings** in the left navigation sidebar (or click your profile icon in the top header).
2. **Theme Mode**: Select between **Light Mode** ☀️ or **Dark Mode** 🌙.
3. **Accent Color**: Choose from 6 vibrant accent color themes:
   - 🔴 Red
   - 🔵 Blue
   - 🟢 Green
   - 🟣 Purple
   - 🟠 Orange
   - 🟡 Yellow
4. Your preferences are saved automatically and synchronized across all your devices.

---

## 7. Frequently Asked Questions (FAQ)

#### Q: What should I do if I forget my password?
> **A:** Contact your System Administrator to reset your password or send a password reset link to your registered email address.

#### Q: How is my total daily working time calculated?
> **A:** Total hours are automatically calculated upon clicking **Check Out** based on the interval between your **Check In** and **Check Out** timestamps.

#### Q: Why can't I see the "Departments" or "Audit Log" options in the sidebar?
> **A:** Access to Departments and System Audit Logs is restricted to **Admin** users only. If you believe you require access, request a role update from your organization's administrator.

---

*Nexgen Employee Management System User Guide v1.0*
