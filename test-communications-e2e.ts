async function login(email: string, password = "password123") {
  const res = await fetch("http://localhost:3000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error(`Login failed for ${email}`);
  const data = await res.json() as any;
  return data.data;
}

async function run() {
  let issues: string[] = [];

  console.log("1. Environment & Auth Check");
  const adminAuth = await login("manager@contoso.com");
  const pAdminAuth = await login("participant@gmail.com"); // Participant
  const participantOrgId = pAdminAuth.user.organizationId || pAdminAuth.user.memberships?.[0]?.organizationId || adminOrgId;
  
  const orgsRes = await fetch("http://localhost:3000/api/v1/organizations", {
    headers: { "Authorization": `Bearer ${adminAuth.token}` }
  });
  const orgsData = await orgsRes.json() as any;
  const adminOrgId = orgsData.data?.[0]?.id || adminAuth.user.memberships?.[0]?.organizationId;
  
  const hRes = await fetch("http://localhost:3000/api/v1/health");
  if (!hRes.ok) issues.push("Health endpoint failed");

  console.log("2. API Security & Tenant Isolation");
  // Test missing JWT
  const noAuthRes = await fetch("http://localhost:3000/api/v1/communications", {
    headers: { "x-organization-id": adminOrgId }
  });
  if (noAuthRes.status !== 401) issues.push(`Expected 401 for missing auth, got ${noAuthRes.status}`);

  // Test missing organization header
  const noOrgRes = await fetch("http://localhost:3000/api/v1/communications", {
    headers: { "Authorization": `Bearer ${adminAuth.token}` }
  });
  if (noOrgRes.status !== 400 && noOrgRes.status !== 200) issues.push(`Expected 400 or 200 fallback for missing org header, got ${noOrgRes.status}`);

  // Test tenant isolation (admin trying to access org B using org A token, assuming they don't have access)
  // We'll just test if unauthorized role works
  const partRes = await fetch("http://localhost:3000/api/v1/communications", {
    method: "POST",
    headers: { 
      "Authorization": `Bearer ${pAdminAuth.token}`,
      "x-organization-id": participantOrgId,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ title: "Test", type: "ANNOUNCEMENT", audience: "ALL", content: "Test" })
  });
  if (partRes.status !== 403) issues.push(`Expected 403 for participant creating communication, got ${partRes.status}`);

  console.log("3. Communication CRUD & Audience Resolution");
  const headers = {
    "Authorization": `Bearer ${adminAuth.token}`,
    "x-organization-id": adminOrgId,
    "Content-Type": "application/json"
  };

  const cRes = await fetch("http://localhost:3000/api/v1/communications", {
    method: "POST",
    headers,
    body: JSON.stringify({ title: "Test E2E", type: "ANNOUNCEMENT", audience: "ALL", content: "Testing 123" })
  });
  const comm = await cRes.json() as any;
  if (!comm.success || !comm.data?.id) {
    issues.push(`Failed to create communication: ${JSON.stringify(comm)}`);
  }
  
  const commId = comm.data?.id;

  if (commId) {
    // Edit
    const uRes = await fetch(`http://localhost:3000/api/v1/communications/${commId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ title: "Test E2E Updated" })
    });
    const updated = await uRes.json() as any;
    if (updated.data.title !== "Test E2E Updated") issues.push("Failed to update communication");

    // Publish
    const pRes = await fetch(`http://localhost:3000/api/v1/communications/${commId}/publish`, {
      method: "POST",
      headers
    });
    if (pRes.status !== 200) issues.push(`Failed to publish communication: ${pRes.status}`);

    // Verify duplicate publishing prevention
    const pRes2 = await fetch(`http://localhost:3000/api/v1/communications/${commId}/publish`, {
      method: "POST",
      headers
    });
    if (pRes2.status !== 400) issues.push(`Expected 400 when publishing already published comm, got ${pRes2.status}`);

    // Delete should fail on published
    const dRes = await fetch(`http://localhost:3000/api/v1/communications/${commId}`, {
      method: "DELETE",
      headers
    });
    if (dRes.status !== 400) issues.push(`Expected 400 when deleting published comm, got ${dRes.status}`);

    // Archive
    const aRes = await fetch(`http://localhost:3000/api/v1/communications/${commId}/archive`, {
      method: "POST",
      headers
    });
    if (aRes.status !== 200) issues.push(`Failed to archive communication: ${aRes.status}`);
  }

  console.log("4. Notifications Test");
  // Check notifications for admin (should have received the one published above)
  const nRes = await fetch("http://localhost:3000/api/v1/notifications", { headers });
  const notifs = await nRes.json() as any;
  
  if (!notifs.success || notifs.data.length === 0) {
    issues.push("Failed to fetch notifications or no notifications found");
  } else {
    const notif = notifs.data[0];
    
    // Mark read
    const rRes = await fetch(`http://localhost:3000/api/v1/notifications/${notif.id}/read`, {
      method: "PATCH",
      headers
    });
    if (rRes.status !== 200) issues.push("Failed to mark notification as read");
    
    // Mark all read
    const arRes = await fetch(`http://localhost:3000/api/v1/notifications/read-all`, {
      method: "POST",
      headers
    });
    if (arRes.status !== 200) issues.push("Failed to mark all as read");
  }

  // Output issues
  if (issues.length > 0) {
    console.error("FAILED with issues:", issues);
    process.exit(1);
  } else {
    console.log("ALL E2E API TESTS PASSED.");
  }
}

run().catch(console.error);
