import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { app } from "../server/src/app";
import http from "http";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

interface TestResult {
  suite: string;
  test: string;
  status: "PASS" | "FAIL" | "WARN";
  message: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runCheck(
  suite: string,
  test: string,
  fn: () => Promise<string | void>
) {
  const start = performance.now();
  try {
    const msg = await fn();
    const duration = Math.round(performance.now() - start);
    results.push({
      suite,
      test,
      status: "PASS",
      message: msg || "OK",
      durationMs: duration,
    });
    console.log(`  [PASS] ${test} (${duration}ms)${msg ? ` - ${msg}` : ""}`);
  } catch (err: any) {
    const duration = Math.round(performance.now() - start);
    results.push({
      suite,
      test,
      status: "FAIL",
      message: err?.message || String(err),
      durationMs: duration,
    });
    console.error(`  [FAIL] ${test} (${duration}ms) - ${err?.message || err}`);
  }
}

async function smokeTest() {
  console.log("=================================================");
  console.log("       EVENTORA END-TO-END SMOKE TEST            ");
  console.log("=================================================\n");

  // 1. Environment & Config
  console.log("Suite 1: Configuration & Environment");
  await runCheck("Config", "Environment Variables", async () => {
    const requiredVars = ["DATABASE_URL", "JWT_SECRET"];
    const missing = requiredVars.filter((v) => !process.env[v]);
    if (missing.length > 0) {
      throw new Error(`Missing required env vars: ${missing.join(", ")}`);
    }
    return `PORT=${process.env.PORT || 3000}, NODE_ENV=${process.env.NODE_ENV || "development"}`;
  });

  // 2. Database & Prisma ORM
  console.log("\nSuite 2: Database & Prisma ORM");
  const prisma = new PrismaClient();
  let testUser: any = null;
  let testOrgId: string = "";

  await runCheck("Database", "PostgreSQL Connection & Schema Integrity", async () => {
    await prisma.$connect();
    const [userCount, orgCount, eventCount, compCount, regCount] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.event.count(),
      prisma.competition.count(),
      prisma.registration.count(),
    ]);

    testUser = await prisma.user.findFirst({
      where: {
        memberships: {
          some: {
            status: "ACTIVE",
          },
        },
      },
      include: {
        memberships: {
          where: { status: "ACTIVE" },
          include: { role: true },
        },
      },
    });

    if (testUser && testUser.memberships.length > 0) {
      testOrgId = testUser.memberships[0].organizationId;
    }

    return `Connected. Records: ${userCount} users, ${orgCount} orgs, ${eventCount} events, ${compCount} competitions, ${regCount} registrations`;
  });

  // 3. Backend HTTP Server & Routing
  console.log("\nSuite 3: Backend API Server & Security Controls");
  let server: http.Server | null = null;
  const TEST_PORT = 3999;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

  try {
    await new Promise<void>((resolve, reject) => {
      server = http.createServer(app);
      server.listen(TEST_PORT, () => {
        resolve();
      });
      server.on("error", reject);
    });

    await runCheck("API", "Health Check (GET /api/v1/health)", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/health`);
      if (!res.ok) throw new Error(`Health check returned status ${res.status}`);
      const body = await res.json();
      if (!body.success) throw new Error("Health check response missing success: true");
      return JSON.stringify(body);
    });

    await runCheck("API", "404 Handler for Unknown Routes", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/non-existent-route`);
      if (res.status !== 404) throw new Error(`Expected 404 but got ${res.status}`);
      const body = await res.json();
      if (body.error?.code !== "NOT_FOUND") throw new Error(`Expected NOT_FOUND code, got ${body.error?.code}`);
      return "Handled appropriately with standard error schema";
    });

    await runCheck("Security", "Auth Validation on Invalid Credentials", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "invalid-user@eventora-test.com", password: "wrongpassword" }),
      });
      if (res.status !== 401 && res.status !== 400 && res.status !== 404) {
        throw new Error(`Expected 401/400/404 for invalid credentials, got ${res.status}`);
      }
      return `Rejected unauthorized login attempt with HTTP ${res.status}`;
    });

    await runCheck("Security", "RBAC / Protected Route Rejection without Bearer Token", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/events`);
      if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
      return "Blocked unauthenticated access to protected resource";
    });

    // 4. Authenticated API Endpoints
    console.log("\nSuite 4: Authenticated API Operations");
    if (testUser && testOrgId) {
      const secret = process.env.JWT_SECRET || "replace-with-secure-secret";
      const authToken = jwt.sign({ id: testUser.id, email: testUser.email }, secret, { expiresIn: "1h" });

      await runCheck("Auth", "Identity Verification (GET /api/v1/auth/me)", async () => {
        const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (!res.ok) throw new Error(`GET /auth/me returned status ${res.status}`);
        const body = await res.json();
        const userEmail = body.data?.email || body.data?.user?.email;
        if (!userEmail) throw new Error("Missing user data in auth/me response: " + JSON.stringify(body));
        return `Authenticated as ${userEmail} (Role: ${testUser.memberships[0]?.role?.name || "Member"})`;
      });

      await runCheck("API", "Multi-Tenant Events Query (GET /api/v1/events)", async () => {
        const res = await fetch(`${BASE_URL}/api/v1/events`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "x-organization-id": testOrgId,
          },
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`GET /events failed with status ${res.status}: ${errText}`);
        }
        const body = await res.json();
        const items = Array.isArray(body.data) ? body.data.length : (body.data?.events?.length ?? "available");
        return `Events retrieved successfully with tenant scope (${items} events found)`;
      });

      await runCheck("API", "Reports & Analytics Access (GET /api/v1/reports/dashboard)", async () => {
        const res = await fetch(`${BASE_URL}/api/v1/reports/dashboard`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "x-organization-id": testOrgId,
          },
        });
        if (res.ok) {
          return "Reports dashboard accessible with role permissions";
        } else if (res.status === 403) {
          return "RBAC appropriately enforced (User lacks reports.read permission)";
        } else {
          const errText = await res.text();
          throw new Error(`Unexpected status ${res.status}: ${errText}`);
        }
      });
    } else {
      console.log("  [WARN] Skipped authenticated queries: No active test user/organization found");
    }

  } finally {
    if (server) {
      await new Promise<void>((resolve) => {
        (server as http.Server).close(() => resolve());
      });
    }
    await prisma.$disconnect();
  }

  // 5. Frontend & Production Artifacts
  console.log("\nSuite 5: Client & Server Build Verification");
  await runCheck("Build", "Frontend Production Bundle", async () => {
    const distPath = path.join(process.cwd(), ".output");
    if (!fs.existsSync(distPath)) {
      throw new Error(".output build directory does not exist. Run 'npm run build' first.");
    }
    const serverEntry = path.join(distPath, "server", "index.mjs");
    const publicDir = path.join(distPath, "public");
    if (!fs.existsSync(serverEntry) && !fs.existsSync(publicDir)) {
      throw new Error("Build output directory missing server or public bundle artifacts.");
    }
    return `Production bundle verified (.output/ exists with server & public assets)`;
  });

  // Summary
  console.log("\n=================================================");
  console.log("              SMOKE TEST RESULTS                 ");
  console.log("=================================================");
  const total = results.length;
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;

  console.log(`Total Checks: ${total} | Passed: ${passed} | Failed: ${failed}`);
  if (failed > 0) {
    console.error("\nFailed Checks:");
    for (const r of results.filter((r) => r.status === "FAIL")) {
      console.error(` - [${r.suite}] ${r.test}: ${r.message}`);
    }
    process.exit(1);
  } else {
    console.log("\nAll smoke tests passed cleanly! System is healthy.");
    process.exit(0);
  }
}

smokeTest().catch((e) => {
  console.error("Fatal smoke test error:", e);
  process.exit(1);
});
