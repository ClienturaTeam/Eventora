

const API_URL = "http://localhost:3000/api/v1";

async function run() {
  console.log("1. Logging in as Admin...");
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@ascent.dev", password: "password123" }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  if (!token) {
    console.error("Login failed", loginData);
    return;
  }
  console.log("Logged in successfully. Token acquired.");

  const orgId = loginData.data?.user?.organizationId || loginData.data?.user?.memberships?.[0]?.organizationId;
  const authHeaders = { 
    Authorization: `Bearer ${token}`,
    "x-organization-id": orgId 
  };

  // Get first user
  console.log("2. Fetching users...");
  const usersRes = await fetch(`${API_URL}/users`, {
    headers: authHeaders
  });
  const usersData = await usersRes.json();
  const someUser = usersData.data[0];

  console.log("3. Fetching events...");
  const eventsRes = await fetch(`${API_URL}/events`, {
    headers: authHeaders
  });
  const eventsData = await eventsRes.json();
  const someEvent = eventsData.data[0];

  // We are going to attempt to issue a certificate for a user/event combo 
  // Let's create a fake user ID just to be absolutely sure they have NO registration.
  const fakeUserId = "00000000-0000-0000-0000-000000000000";

  console.log(`4. Attempting to issue certificate to an unregistered user (fake ID ${fakeUserId}) for Event ${someEvent.id}...`);
  const issueRes = await fetch(`${API_URL}/certificates`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      eventId: someEvent.id,
      userId: fakeUserId,
      type: "PARTICIPATION",
      title: "Hacked Certificate",
    }),
  });

  const issueData = await issueRes.json();
  console.log(`Status: ${issueRes.status}`);
  console.log("Response:", issueData);
  
  if (issueRes.status === 403) {
    console.log("SUCCESS! Security blocked the issuance to an unregistered user.");
  } else {
    console.log("FAILURE! The backend did not block the issuance properly, or failed for the wrong reason.");
  }
}

run().catch(console.error);
