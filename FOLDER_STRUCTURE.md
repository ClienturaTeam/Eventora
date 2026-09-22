# Eventora (powered by Clientura) - Folder Structure & Architecture

This document describes the updated file and folder structure of **Eventora powered by Clientura**, an enterprise Multi-Tenant Event Management & Enterprise Role-Based Access Control (RBAC) Platform.

---

## 📁 Repository Root Overview

```
event_management/
├── .agents/                    # Custom AI agent skills and configuration rules
├── .env                        # Local environment configuration file
├── .env.example                # Example environment variables template
├── FOLDER_STRUCTURE.md         # Updated application folder structure documentation (This File)
├── REQUIREMENTS.md             # Complete system & environment setup guide
├── requirements.txt            # System dependencies & npm package manifest
├── package.json                # Node.js project manifest & npm script commands
├── package-lock.json           # Locked npm dependency versions
├── tsconfig.json               # TypeScript compiler configuration
├── vite.config.ts              # Vite frontend build configuration
├── eslint.config.js            # ESLint code style and quality rules
├── PR/                         # Future Enhancements & Architectural Documentation
│   ├── BUG_REPORT.md           # Audit of missing features and bug report
│   ├── ARCHITECTURE.md         # System architecture & RBAC design documentation
│   └── FUTURE_ENHANCEMENTS.md  # Roadmap & future scalability plan
├── prisma/                     # Database ORM Schema & Migrations
│   ├── schema.prisma           # Prisma database schema definition (PostgreSQL)
│   ├── seed.ts                 # Database seed script for roles, perms, & initial users
│   └── migrations/             # SQL migration files
├── public/                     # Static assets served at root URL
│   ├── clientura-logo.png      # Official Clientura branding logo (PNG)
│   ├── favicon.ico             # Clientura favicon icon
│   ├── favicon.png             # Clientura high-res favicon badge
│   └── placeholder.svg         # Media fallback asset
├── server/                     # Express.js REST API Backend
│   ├── check_admin.ts          # Backend diagnostic scripts
│   └── src/                    # Backend source code
│       ├── app.ts              # Express application setup & middleware registration
│       ├── server.ts           # HTTP server launcher (Port 3000)
│       ├── controllers/        # REST endpoint request/response handlers
│       ├── middleware/         # Auth, Tenant isolation, & RBAC enforcement
│       ├── repositories/       # Prisma DB data access layer
│       ├── routes/             # Express API route modules
│       ├── services/           # Business logic service layer
│       ├── utils/              # Shared backend helpers (JWT, encryption, logger)
│       └── validators/         # Zod schemas for payload validation
└── src/                        # React + Vite Frontend
    ├── main.tsx                # Application entry point
    ├── router.tsx              # TanStack Router instance configuration
    ├── routeTree.gen.ts        # Auto-generated TanStack route tree
    ├── styles.css              # Tailwind CSS styles and global variables
    ├── components/             # Reusable UI Components
    │   ├── ds/                 # Design system components
    │   │   └── clientura-logo.tsx  # Clientura brand logo component
    │   ├── layout/             # Layout components (Sidebar, Topbar, Main Container)
    │   └── ui/                 # shadcn/ui primitive components
    ├── hooks/                  # Custom React hooks (Auth, Theme, Permissions)
    ├── lib/                    # Frontend utilities, API clients, and query client
    ├── modules/                # Domain-driven feature modules
    │   ├── analytics/          # Analytics dashboards & reporting
    │   ├── events/             # Event management & registration logic
    │   ├── platform-admin/     # System-wide Admin & RBAC governance tools
    │   └── user-management/    # Organization user & member management
    └── routes/                 # File-based routes (TanStack Router)
        ├── __root.tsx          # Root layout route with SEO meta & favicon links
        ├── index.tsx           # Home / Dashboard landing page
        ├── login.tsx           # Eventora Login screen with Clientura branding
        ├── signup.tsx          # Registration screen with account type selector
        ├── events.tsx          # Events list & discovery route
        ├── users.tsx           # Organization Users management route
        ├── analytics.tsx       # Analytics route
        └── roles.tsx           # Custom Role Creation & Permission Assignment route
```

---

## 🛠️ Detailed Component Directory Breakdown

### 1. `src/` (Frontend React Application)
- **`components/ds/`**: Contains core branding components such as `ClienturaLogo` rendering the official logo and *"powered by Clientura"* tagline.
- **`components/layout/`**:
  - `app-sidebar.tsx`: Dynamic role-filtered navigation sidebar.
  - `topbar.tsx`: Header bar displaying tenant title, notification hub, and user menu.
- **`modules/platform-admin/`**:
  - `pages/roles.tsx`: Administrative interface for viewing and managing custom roles.
  - `components/role-dialog.tsx`: Modal dialog for creating new custom roles and assigning granular module permissions.
- **`routes/`**:
  - `__root.tsx`: Top-level router wrapper containing HTML head metadata, viewport configurations, and favicon declarations.

### 2. `server/` (Backend Node.js API)
- **`src/app.ts`**: Configures Express, CORS, JSON parsing, security headers, and mounts API routers under `/api/v1`.
- **`src/middleware/rbac.middleware.ts`**: Middleware evaluating active user roles and granular action permissions (`read`, `write`, `delete`, `admin`) against requested endpoints.
- **`src/middleware/tenant.middleware.ts`**: Ensures database requests are strictly isolated by `tenantId` / `organizationId`.
- **`src/routes/`**: Route definitions for Auth (`auth.routes.ts`), Roles (`roles.routes.ts`), Permissions (`permissions.routes.ts`), Users (`users.routes.ts`), and Events (`events.routes.ts`).

### 3. `prisma/` (Database Layer)
- **`schema.prisma`**: Defines data models for User, Role, Permission, RolePermission, Tenant, Event, Registration, AuditLog, and Session.
- **`seed.ts`**: Populates default system roles (`ADMIN`, `SUDO_ADMIN`), standard module permissions, and default administrator credentials.

---

## ⚡ Deployment & Execution Architecture

1. **Frontend Server**: Vite dev server on port `8080`.
2. **Backend API Server**: Express server on port `3000`.
3. **Database**: PostgreSQL server on port `5432` (`ascent_db`).

For step-by-step setup and prerequisite installation on any system, refer to [`REQUIREMENTS.md`](file:///e:/projects/event_management/REQUIREMENTS.md) and [`requirements.txt`](file:///e:/projects/event_management/requirements.txt).
