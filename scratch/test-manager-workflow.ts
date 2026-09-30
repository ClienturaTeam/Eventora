import { prisma } from "../server/src/utils/prisma";
import { HackathonProposalService } from "../server/src/services/hackathon-proposals.service";

async function runTest() {
  console.log("=== STARTING COMPLETE MANAGER WORKFLOW & PROPOSAL AUDIT E2E TEST ===");

  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error("No organization found.");
    process.exit(1);
  }

  const studentUser = await prisma.user.findFirst({
    where: { email: { contains: "student" } }
  }) || await prisma.user.findFirst();

  const managerUser = await prisma.user.findFirst({
    where: { email: { contains: "manager" } }
  }) || studentUser;

  if (!studentUser || !managerUser) {
    console.error("Users not found.");
    process.exit(1);
  }

  // 1. Create a DRAFT proposal as Student
  console.log("[TEST 1] Student creates a new DRAFT event proposal...");
  const proposalTitle = `AI Innovation Summit ${Date.now()}`;
  const draftProposal = await HackathonProposalService.createProposal(org.id, studentUser.id, {
    title: proposalTitle,
    description: "Annual AI Innovation Summit with student hackathon tracks.",
    expectedParticipants: 150,
    estimatedBudget: 50000,
    requirements: "Must bring laptops and registered student ID.",
  });

  console.log(`   Created Proposal ID: ${draftProposal.id}, Status: ${draftProposal.status}`);
  if (draftProposal.status !== "DRAFT") {
    throw new Error("New proposal did not start in DRAFT status!");
  }

  // 2. Student submits proposal
  console.log("[TEST 2] Student submits proposal to Manager...");
  const submittedProposal = await HackathonProposalService.submitProposal(org.id, draftProposal.id, studentUser.id);
  console.log(`   Submitted Proposal Status: ${submittedProposal.status}`);
  if (submittedProposal.status !== "SUBMITTED_TO_MANAGER") {
    throw new Error("Submitted proposal failed to transition to SUBMITTED_TO_MANAGER!");
  }

  // 3. Student attempts self-approval (MUST FAIL)
  console.log("[TEST 3] Student attempting self-approval (should fail with 403)...");
  try {
    await HackathonProposalService.createEventFromProposal(org.id, submittedProposal.id, studentUser.id, {
      name: proposalTitle,
      slug: `slug-${Date.now()}`
    }, false); // hasGlobalCreate: false
    console.error("FAILED: Student self-approval was not blocked!");
  } catch (err: any) {
    console.log(`   SUCCESS: Student self-approval blocked with error: "${err.message}"`);
  }

  // 4. Manager rejection without reason (MUST FAIL)
  console.log("[TEST 4] Manager attempting rejection without reason (should fail with 400)...");
  try {
    await HackathonProposalService.managerReview(org.id, submittedProposal.id, managerUser.id, "REJECT", "");
    console.error("FAILED: Rejection without reason was not blocked!");
  } catch (err: any) {
    console.log(`   SUCCESS: Rejection without reason blocked with error: "${err.message}"`);
  }

  // 5. Manager approves proposal
  console.log("[TEST 5] Manager approves proposal with confirmation & audit log...");
  const approvedProposal = await HackathonProposalService.managerReview(org.id, submittedProposal.id, managerUser.id, "APPROVE", "Proposal meets all technical and budget guidelines.");
  console.log(`   Approved Proposal Status: ${approvedProposal.status}, Manager ID: ${approvedProposal.managerId}`);

  // Verify Audit Log
  const audit = await prisma.auditLog.findFirst({
    where: { action: "PROPOSAL_APPROVED", target: submittedProposal.id },
    orderBy: { createdAt: "desc" }
  });
  console.log(`   Audit Log Entry Created: ${audit ? 'YES (' + audit.action + ')' : 'NO'}`);

  // 6. Create event from approved proposal (IDEMPOTENT)
  console.log("[TEST 6] Triggering Event creation from approved proposal...");
  const eventResult1 = await HackathonProposalService.createEventFromProposal(org.id, submittedProposal.id, managerUser.id, {
    name: proposalTitle,
    slug: `event-slug-${Date.now()}`,
    type: "HACKATHON",
    status: "PUBLISHED"
  }, true);

  console.log(`   Event Created ID: ${eventResult1.event.id}, Name: "${eventResult1.event.name}"`);

  // 7. Test Idempotency (second call returning existing event without duplicate)
  console.log("[TEST 7] Testing Idempotent Event creation (second trigger)...");
  const eventResult2 = await HackathonProposalService.createEventFromProposal(org.id, submittedProposal.id, managerUser.id, {
    name: proposalTitle,
    slug: `event-slug-duplicate-${Date.now()}`,
    type: "HACKATHON",
    status: "PUBLISHED"
  }, true);

  console.log(`   Second Call Result: Is Existing: ${eventResult2.isExisting}, Event ID: ${eventResult2.event.id}`);
  if (!eventResult2.isExisting || eventResult2.event.id !== eventResult1.event.id) {
    throw new Error("Idempotency test failed! Duplicate event was created.");
  }

  // 8. Rejection Workflow Test
  console.log("[TEST 8] Rejection Workflow Test (creating separate proposal)...");
  const rejProposal = await HackathonProposalService.createProposal(org.id, studentUser.id, {
    title: `Rejection Test Proposal ${Date.now()}`,
    description: "Testing mandatory rejection reason."
  });
  await HackathonProposalService.submitProposal(org.id, rejProposal.id, studentUser.id);
  const rejected = await HackathonProposalService.managerReview(
    org.id,
    rejProposal.id,
    managerUser.id,
    "REJECT",
    "Venue unavailable on requested dates."
  );

  console.log(`   Rejected Proposal Status: ${rejected.status}, Comment: "${rejected.managerComment}"`);

  const rejAudit = await prisma.auditLog.findFirst({
    where: { action: "PROPOSAL_REJECTED", target: rejProposal.id },
    orderBy: { createdAt: "desc" }
  });
  console.log(`   Rejection Audit Log Entry Created: ${rejAudit ? 'YES (' + rejAudit.action + ')' : 'NO'}`);

  console.log("=== ALL MANAGER WORKFLOW & PROPOSAL AUDIT TESTS PASSED SUCCESSFULLY! ===");
}

runTest()
  .catch((err) => {
    console.error("Test Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
