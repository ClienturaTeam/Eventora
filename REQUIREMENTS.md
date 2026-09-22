# REQUIREMENTS & SYSTEM SETUP GUIDE

## 🚀 Eventora powered by Clientura

This document provides step-by-step setup instructions to run **Eventora powered by Clientura** on any new desktop, laptop, server, or operating system (Windows, macOS, Linux).

---

## 📋 System Prerequisites

Before starting, ensure your system has the following installed:

1. **Node.js** (v18.0.0 or higher, v20/v22 LTS recommended)
   - Verify installation: `node -v`
2. **npm** (v9.0.0 or higher) or **pnpm** / **bun**
   - Verify installation: `npm -v`
3. **PostgreSQL Database** (v14.0 or higher)
   - Ensure PostgreSQL service is running on your system (Default Port: `5432`).
   - Create a target database named `ascent_db` (or custom name of your choice).

---

## 🛠️ Step-by-Step Installation Instructions

### Step 1: Clone or Copy Repository
Extract or clone the project repository onto your desktop:
```bash
git clone <repository-url> event_management
cd event_management
```

### Step 2: Install Node.js Dependencies
Run `npm install` to install all runtime and development packages specified in `package.json` and `requirements.txt`:
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env` in the root folder:
```bash
cp .env.example .env
```

Ensure your `.env` file contains your database connection details and secret keys:
```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ascent_db?schema=public"

# Backend REST API Server Port
PORT=3000

# Authentication JWT Secret
JWT_SECRET="your-super-secret-jwt-key-here"

# Frontend API URL
VITE_API_BASE_URL="http://localhost:3000/api/v1"
```

### Step 4: Setup Database & Run Migrations
Generate Prisma client code, sync database schema, and seed initial roles & permissions:

```bash
# 1. Generate Prisma Client
npm run db:generate

# 2. Push Schema to Database
npx prisma db push

# 3. Seed Default Roles (SUDO_ADMIN, ADMIN, etc.) and Seed Data
npm run db:seed
```

---

## 🏃 Running the Application

To run the application locally on any machine:

### Option A: Concurrent Development Mode (Recommended)
Open two terminal windows:

**Terminal 1 (Backend REST API Server - Port 3000):**
```bash
npm run dev:server
```

**Terminal 2 (Frontend React + Vite App - Port 8080):**
```bash
npm run dev
```

### Option B: Accessing the App
Once both servers are started:
- **Frontend Web App**: `http://localhost:8080`
- **Backend API Endpoints**: `http://localhost:3000/api/v1`

---

## 🔒 Default Admin Credentials

When the database is seeded (`npm run db:seed`), use these default credentials to log in:

- **SUDO ADMIN**:
  - Email: `sudo@ascent.com`
  - Password: `Password123!`
- **ADMIN**:
  - Email: `admin@ascent.com`
  - Password: `Password123!`

---

## 🧪 Verification & Build Checks

To verify that the application compiles without TypeScript errors:
```bash
# Run TypeScript compilation check
npx tsc --noEmit

# Build production bundle
npm run build
```
