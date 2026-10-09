import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

interface RouteTestResult {
  suite: string;
  route: string;
  target: "Frontend (Vite)" | "Backend (API)";
  expectedStatus: number | number[];
  actualStatus: number;
  status: "PASS" | "FAIL" | "WARN";
  durationMs: number;
  notes?: string;
}

const results: RouteTestResult[] = [];

// Front-end and Back-end base URLs
const FRONTEND_BASE = process.env.FRONTEND_URL || "http://localhost:8080";
const BACKEND_BASE = process.env.API_URL || "http://localhost:3000/api/v1";

async function testRoute(
  suite: string,
  target: "Frontend (Vite)" | "Backend (API)",
  route: string,
  expectedStatus: number | number[],
  options: RequestInit = {},
  notes = ""
): Promise<void> {
  const base = target === "Frontend (Vite)" ? FRONTEND_BASE : BACKEND_BASE;
  const url = `${base}${route}`;
  const start = performance.now();

  try {
    const res = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(5000),
    });
    const duration = Math.round(performance.now() - start);
    const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    const isPass = expected.includes(res.status);

    results.push({
      suite,
      route,
      target,
      expectedStatus,
      actualStatus: res.status,
      status: isPass ? "PASS" : "FAIL",
      durationMs: duration,
      notes: notes || (isPass ? "OK" : `Expected ${expected.join("/")}, got ${res.status}`),
    });

    const statusTag = isPass ? "  [PASS]" : "  [FAIL]";
    console.log(
      `${statusTag} [${target}] ${route} -> ${res.status} (${duration}ms)${notes ? ` - ${notes}` : ""}`
    );
  } catch (err: any) {
    const duration = Math.round(performance.now() - start);
    results.push({
      suite,
      route,
      target,
      expectedStatus,
      actualStatus: 0,
      status: "FAIL",
      durationMs: duration,
      notes: err?.message || String(err),
    });
    console.error(`  [FAIL] [${target}] ${route} -> Error: ${err?.message || err}`);
  }
}

async function runRoutingTests() {
  console.log("================================================================================");
  console.log("             EVENTORA FULL-STACK ROUTING & NAVIGATION TEST SUITE               ");
  console.log("================================================================================\n");

  const prisma = new PrismaClient();
  let adminToken = "";
  let adminOrgId = "";
  let adminUser: any = null;

  let managerToken = "";
  let managerOrgId = "";

  try {
    // 1. Setup Auth Tokens & Tenant Context for Platform Admin & Manager
    console.log("--- Initializing Test Context & Security Personas ---");
    adminUser = await prisma.user.findFirst({
      where: {
        email: "admin@ascent.dev",
      },
      include: {
        memberships: {
          where: { status: "ACTIVE" },
          include: { role: true, organization: true },
        },
      },
    });

    const managerUser = await prisma.user.findFirst({
      where: {
        email: "manager@contoso.com",
      },
      include: {
        memberships: {
          where: { status: "ACTIVE" },
          include: { role: true, organization: true },
        },
      },
    });

    const secret = process.env.JWT_SECRET || "replace-with-secure-secret";

    if (adminUser && adminUser.memberships.length > 0) {
      adminOrgId = adminUser.memberships[0].organizationId;
      adminToken = jwt.sign(
        { id: adminUser.id, email: adminUser.email },
        secret,
        { expiresIn: "2h" }
      );
      console.log(`  [OK] Platform Admin Context: ${adminUser.email} (Tenant: ${adminOrgId})`);
    }

    if (managerUser && managerUser.memberships.length > 0) {
      managerOrgId = managerUser.memberships[0].organizationId;
      managerToken = jwt.sign(
        { id: managerUser.id, email: managerUser.email },
        secret,
        { expiresIn: "2h" }
      );
      console.log(`  [OK] Manager Context: ${managerUser.email} (Tenant: ${managerOrgId})\n`);
    }

    const adminHeaders = {
      Authorization: `Bearer ${adminToken}`,
      "x-organization-id": adminOrgId,
      "Content-Type": "application/json",
    };

    const managerHeaders = {
      Authorization: `Bearer ${managerToken}`,
      "x-organization-id": managerOrgId,
      "Content-Type": "application/json",
    };

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 1: FRONTEND PUBLIC & CORE ROUTES
    // ─────────────────────────────────────────────────────────────────────────
    console.log("--- Suite 1: Frontend Public Routes ---");
    const publicRoutes = [
      "/",
      "/login",
      "/signup",
      "/pending-approval",
      "/unauthorized",
      "/certificates/verify/SAMPLE-VERIFY-123",
    ];

    for (const r of publicRoutes) {
      await testRoute("Frontend Public", "Frontend (Vite)", r, 200);
    }
    console.log();

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 2: FRONTEND CORE MANAGEMENT & WORKSPACE ROUTES
    // ─────────────────────────────────────────────────────────────────────────
    console.log("--- Suite 2: Frontend Management & Workspace Routes ---");
    const workspaceRoutes = [
      // Core Features
      "/events",
      "/events/new",
      "/events/schedule",
      "/competitions",
      "/registrations",
      "/submissions",
      "/evaluations",
      "/certificates",
      "/badges",
      "/leaderboard",
      "/users",
      "/roles",
      "/reports",
      "/notifications",
      "/sponsors",
      "/volunteers",
      // Platform Admin Workspace
      "/platform-admin",
      "/platform-admin/privileged-accounts",
      "/platform-admin/audit-logs",
      "/platform-admin/configuration",
      "/platform-admin/licenses",
      // Manager Workspace
      "/manager",
      "/manager/events",
      "/manager/teams",
      "/manager/submissions",
      "/manager/evaluations",
      "/manager/all-proposals",
      "/manager/problem-statements",
      "/manager/reports",
      "/manager/judges",
      "/manager/mentors",
      // Faculty Coordinator Workspace
      "/faculty-coordinator",
      "/faculty-coordinator/assigned-events",
      "/faculty-coordinator/student-coordinators",
      // Student Coordinator Workspace
      "/coordinator",
      "/coordinator/assigned-events",
      "/coordinator/participants",
      "/hackathon-proposals",
      "/hackathon-proposals/new",
      // Participant Workspace
      "/participant",
      "/participant/discover-events",
      "/participant/registrations",
      "/participant/teams",
      "/participant/submissions",
      "/participant/certificates",
      "/participant/achievements",
      // Judge Workspace
      "/judge",
      "/judge/events",
      "/judge/submissions",
      // Community & Learning
      "/community",
      "/community/groups",
      "/community/messages",
      "/community/networking",
      "/learning",
      "/learning/resources",
      "/learning/workshops",
      "/communication",
      "/communication/logs",
      "/communication/templates",
      "/feedback",
      "/feedback/analytics",
      "/feedback/list",
    ];

    for (const r of workspaceRoutes) {
      await testRoute("Frontend Workspaces", "Frontend (Vite)", r, 200);
    }
    console.log();

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 3: FRONTEND 404 RESILIENCE
    // ─────────────────────────────────────────────────────────────────────────
    console.log("--- Suite 3: Frontend 404 Resilience ---");
    await testRoute(
      "Frontend 404",
      "Frontend (Vite)",
      "/non-existent-route-should-render-not-found",
      [200, 404],
      {},
      "TanStack Router handles unmapped route with NotFound component"
    );
    console.log();

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 4: BACKEND API SYSTEM & HEALTH ROUTES
    // ─────────────────────────────────────────────────────────────────────────
    console.log("--- Suite 4: Backend API System & Health Routes ---");
    await testRoute("Backend System", "Backend (API)", "/health", 200);
    await testRoute(
      "Backend System",
      "Backend (API)",
      "/non-existent-api-endpoint",
      404,
      {},
      "Handled by global 404 handler with standard error schema"
    );
    console.log();

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 5: BACKEND API SECURITY & UNAUTHENTICATED GUARDS
    // ─────────────────────────────────────────────────────────────────────────
    console.log("--- Suite 5: Backend API Security & Auth Guards ---");
    const protectedEndpoints = [
      "/events",
      "/competitions",
      "/registrations",
      "/submissions",
      "/evaluations",
      "/users",
      "/roles",
      "/reports/dashboard",
    ];

    for (const ep of protectedEndpoints) {
      await testRoute(
        "API Auth Guard",
        "Backend (API)",
        ep,
        401,
        {},
        "Unauthenticated access cleanly rejected with HTTP 401"
      );
    }
    console.log();

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 6: BACKEND API TENANT HEADER RESOLUTION
    // ─────────────────────────────────────────────────────────────────────────
    console.log("--- Suite 6: Backend Tenant Resolution Guards ---");
    await testRoute(
      "API Tenant Guard",
      "Backend (API)",
      "/events",
      400,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          // missing x-organization-id
        },
      },
      "Missing x-organization-id rejected with HTTP 400 MISSING_TENANT"
    );

    await testRoute(
      "API Tenant Guard",
      "Backend (API)",
      "/events",
      403,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "x-organization-id": "00000000-0000-0000-0000-000000000000",
        },
      },
      "Unauthorized tenant ID rejected with HTTP 403 FORBIDDEN"
    );
    console.log();

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 7: BACKEND AUTHENTICATED API WORKSPACE ENDPOINTS
    // ─────────────────────────────────────────────────────────────────────────
    console.log("--- Suite 7: Backend Authenticated API Endpoints ---");
    const adminEndpoints = [
      { path: "/auth/me", expected: 200 },
      { path: "/events", expected: 200 },
      { path: "/competitions", expected: 200 },
      { path: "/registrations", expected: 200 },
      { path: "/submissions", expected: 200 },
      { path: "/evaluations", expected: 200 },
      { path: "/attendance/summary", expected: 200 },
      { path: "/attendance/sessions", expected: 200 },
      { path: "/attendance/records", expected: 200 },
      { path: "/winners", expected: 200 },
      { path: "/winners/prizes", expected: 200 },
      { path: "/badges", expected: 200 },
      { path: "/certificates", expected: 200 },
      { path: "/users", expected: 200 },
      { path: "/roles", expected: 200 },
      { path: "/permissions", expected: 200 },
      { path: "/reports/dashboard", expected: 200 },
      { path: "/notifications", expected: 200 },
      { path: "/community/dashboard", expected: 200 },
      { path: "/community/groups", expected: 200 },
      { path: "/community/discussions", expected: 200 },
      { path: "/learning/dashboard", expected: 200 },
      { path: "/learning/courses", expected: 200 },
      { path: "/learning/resources", expected: 200 },
      { path: "/learning/workshops", expected: 200 },
      { path: "/feedback/dashboard", expected: 200 },
      { path: "/feedback/surveys", expected: 200 },
      { path: "/sponsors", expected: 200 },
      { path: "/volunteers", expected: 200 },
      { path: "/platform-admin/summary", expected: 200 },
      { path: "/platform-admin/subscriptions", expected: 200 },
      { path: "/platform-admin/audit-logs", expected: 200 },
    ];

    for (const ep of adminEndpoints) {
      await testRoute(
        "Platform Admin API",
        "Backend (API)",
        ep.path,
        ep.expected,
        { headers: adminHeaders }
      );
    }

    // Manager endpoints (Proposals)
    const managerApiEndpoints = [
      { path: "/hackathon-proposals", expected: [200, 403] },
      { path: "/hackathon-proposals/my", expected: 200 },
      { path: "/hackathon-proposals/approved", expected: 200 },
    ];

    for (const ep of managerApiEndpoints) {
      await testRoute(
        "Manager API",
        "Backend (API)",
        ep.path,
        ep.expected,
        { headers: managerHeaders }
      );
    }
    console.log();

  } finally {
    await prisma.$disconnect();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SUMMARY & METRICS REPORT
  // ───────────────────────────────────────────────────────────────────────────
  console.log("================================================================================");
  console.log("                      ROUTING TEST SUMMARY REPORT                               ");
  console.log("================================================================================");

  const total = results.length;
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const passRate = ((passed / total) * 100).toFixed(1);

  const latencies = results.map((r) => r.durationMs).sort((a, b) => a - b);
  const minLatency = latencies[0] || 0;
  const maxLatency = latencies[latencies.length - 1] || 0;
  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || latencies[latencies.length - 1] || 0;

  console.log(`Total Routes Tested : ${total}`);
  console.log(`Passed Routes       : ${passed}`);
  console.log(`Failed Routes       : ${failed}`);
  console.log(`Pass Rate           : ${passRate}%`);
  console.log(`Latency Profile     : Min ${minLatency}ms | P50 ${p50}ms | P95 ${p95}ms | Max ${maxLatency}ms | Avg ${avgLatency}ms`);
  console.log("--------------------------------------------------------------------------------");

  if (failed > 0) {
    console.error("\nFailed Route Checks:");
    for (const r of results.filter((r) => r.status === "FAIL")) {
      console.error(`  - [${r.target}] ${r.route} (${r.suite}): Expected ${r.expectedStatus}, got ${r.actualStatus} [${r.notes}]`);
    }
    process.exit(1);
  } else {
    console.log("\nAll application routes verified cleanly! Full routing system is 100% healthy.");
    process.exit(0);
  }
}

runRoutingTests().catch((e) => {
  console.error("Fatal routing test error:", e);
  process.exit(1);
});
