async function run() {
  const API_URL = "http://localhost:3000/api/v1";

  // 1. LOGIN
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@ascent.dev", password: "password123" }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  if (!token) throw new Error("Login failed");

  console.log("Logged in");

  const orgId = loginData.data?.user?.organizationId || loginData.data?.user?.memberships?.[0]?.organizationId;
  const headers = { 
    Authorization: `Bearer ${token}`,
    "x-organization-id": orgId 
  };

  const eventsRes = await fetch(`${API_URL}/events`, { headers });
  const eventsData = await eventsRes.json();
  const event = Array.isArray(eventsData) ? eventsData[0] : eventsData.data?.[0];
  if (!event) throw new Error("No event found: " + JSON.stringify(eventsData));

  console.log("Starting security tests...");
  const errors: string[] = [];

  // A. Valid user, not registered for the event
  // Let's create a dummy user
  const fakeUserId = "00000000-0000-0000-0000-000000000000";
  const issueFailRes = await fetch(`${API_URL}/certificates`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ eventId: event.id, userId: fakeUserId, type: "PARTICIPATION", title: "Test" })
  });
  if (issueFailRes.status !== 403) errors.push(`Expected 403 for unregistered user, got ${issueFailRes.status}`);

  // B. Duplicate certificate
  // We need a real registration.
  const regsRes = await fetch(`${API_URL}/registrations`, { headers });
  const regsData = await regsRes.json();
  // find a registration for event.id
  const regList = Array.isArray(regsData) ? regsData : regsData.data || [];
  const reg = regList.find((r: any) => r.eventId === event.id);

  if (reg) {
    const certType = "PARTICIPATION";
    // First, let's see if one exists
    let existingCertsRes = await fetch(`${API_URL}/certificates`, { headers });
    let existingCerts = await existingCertsRes.json();
    let hasCert = existingCerts.some((c: any) => c.userId === reg.userId && c.eventId === reg.eventId && c.type === certType);
    
    let createdId: string | null = null;
    if (!hasCert) {
      // Create first one
      const res = await fetch(`${API_URL}/certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ eventId: reg.eventId, userId: reg.userId, type: certType, title: "Valid Cert" })
      });
      const resData = await res.json();
      if (res.status === 201) {
        console.log("Created valid certificate for testing duplicate");
        createdId = resData.id;
      }
    }

    // Attempt to create duplicate
    const dupRes = await fetch(`${API_URL}/certificates`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ eventId: reg.eventId, userId: reg.userId, type: certType, title: "Valid Cert 2" })
    });
    
    if (dupRes.status !== 400) errors.push(`Expected 400 for duplicate cert, got ${dupRes.status}`);

    if (createdId) {
       await fetch(`${API_URL}/certificates/${createdId}`, { method: "DELETE", headers });
    }
  }

  if (errors.length > 0) {
    console.error("Security tests failed:", errors);
    process.exit(1);
  } else {
    console.log("Security tests passed!");
  }
}

run();
