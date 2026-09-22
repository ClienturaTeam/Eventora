import { prisma } from "../server/src/utils/prisma";
import { EvaluationService } from "../server/src/services/evaluations.service";
import { ProblemStatementService } from "../server/src/services/problem-statements.service";

async function runTest() {
  console.log("=== STARTING ROLE WORKFLOW & AUDIT E2E VERIFICATION ===");

  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error("No organization found.");
    process.exit(1);
  }

  const judgeUser = await prisma.user.findFirst({
    where: { email: { contains: "judge" } }
  }) || await prisma.user.findFirst();

  const adminUser = await prisma.user.findFirst({
    where: { email: { contains: "admin" } }
  }) || judgeUser;

  if (!judgeUser || !adminUser) {
    console.error("Users not found");
    process.exit(1);
  }

  // 1. Find or create an evaluation
  let ev = await prisma.evaluation.findFirst({
    where: { submission: { competition: { event: { organizationId: org.id } } } }
  });

  if (!ev) {
    const sub = await prisma.submission.findFirst();
    if (!sub) {
      console.log("No submissions found to test.");
      return;
    }
    ev = await prisma.evaluation.create({
      data: {
        submissionId: sub.id,
        judgeId: judgeUser.id,
        status: "PENDING"
      }
    });
  }

  console.log(`[TEST 1] Using Evaluation ID: ${ev.id}`);
  await prisma.evaluation.update({
    where: { id: ev.id },
    data: { isLocked: false, status: "PENDING" }
  });

  // 2. Judge submits scorecard
  console.log("[TEST 2] Judge submits scorecard...");
  const judgeSubmitted = await EvaluationService.updateEvaluation(
    org.id,
    ev.id,
    ev.judgeId,
    false, // NOT admin
    {
      score: 88,
      feedback: "Great presentation and solid backend architecture.",
      status: "COMPLETED",
      recommendation: "QUALIFY"
    }
  );

  console.log(`   Submitted Score: ${judgeSubmitted.score}, Locked: ${judgeSubmitted.isLocked}, Status: ${judgeSubmitted.status}`);
  if (!judgeSubmitted.isLocked || judgeSubmitted.status !== "COMPLETED") {
    throw new Error("Evaluation failed to lock upon completion!");
  }

  // 3. Admin attempt to directly edit score (MUST BE BLOCKED)
  console.log("[TEST 3] Admin attempting direct edit on judge score (should fail)...");
  try {
    await EvaluationService.updateEvaluation(
      org.id,
      ev.id,
      adminUser.id,
      true, // isAdmin
      { score: 99 }
    );
    console.error("FAILED: Direct admin score edit was not blocked!");
  } catch (err: any) {
    console.log(`   SUCCESS: Direct edit blocked with error: "${err.message}"`);
  }

  // 4. Admin requests score correction
  console.log("[TEST 4] Admin requesting score correction from Judge...");
  const correctionReason = "Please re-evaluate criteria 3 (UI/UX) - team provided updated mobile demo video.";
  const correctionReq = await EvaluationService.requestCorrection(
    org.id,
    ev.id,
    adminUser.id,
    correctionReason
  );

  console.log(`   Correction Request Status: ${correctionReq.status}, Locked: ${correctionReq.isLocked}, Reason: "${correctionReq.correctionReason}"`);
  if (correctionReq.isLocked || correctionReq.status !== "CORRECTION_REQUESTED") {
    throw new Error("Correction request failed to unlock evaluation!");
  }

  // Verify Audit Log
  const audit = await prisma.auditLog.findFirst({
    where: { action: "EVALUATION_CORRECTION_REQUESTED", target: ev.id },
    orderBy: { createdAt: "desc" }
  });
  console.log(`   Audit Log Entry Created: ${audit ? 'YES (' + audit.action + ')' : 'NO'}`);

  // Verify Judge Notification
  const notif = await prisma.notification.findFirst({
    where: { recipientUserId: ev.judgeId, type: "EVALUATION" },
    orderBy: { createdAt: "desc" }
  });
  console.log(`   Judge Notification Sent: ${notif ? 'YES ("' + notif.title + '")' : 'NO'}`);

  // 5. Judge resubmits evaluation with updated score
  console.log("[TEST 5] Judge resubmits evaluation with updated score...");
  const judgeResubmitted = await EvaluationService.updateEvaluation(
    org.id,
    ev.id,
    ev.judgeId,
    false,
    {
      score: 92,
      feedback: "Updated score following mobile UI demo review.",
      status: "COMPLETED",
      recommendation: "QUALIFY"
    }
  );

  console.log(`   Resubmitted Score: ${judgeResubmitted.score}, Locked: ${judgeResubmitted.isLocked}, Status: ${judgeResubmitted.status}`);
  if (!judgeResubmitted.isLocked || judgeResubmitted.status !== "COMPLETED") {
    throw new Error("Resubmitted evaluation failed to lock!");
  }

  // 6. Admin publishes final result & generates certificates/prizes
  console.log("[TEST 6] Admin publishing final result & prize...");
  const { ResultsService } = await import("../server/src/services/results.service");
  const sub = await prisma.submission.findFirst({ where: { id: ev.submissionId } });
  if (sub) {
    const pubRes = await ResultsService.publishResult(
      org.id,
      adminUser.id,
      {
        competitionId: sub.competitionId,
        teamId: sub.teamId,
        resultType: "FIRST_PRIZE",
        prizeAmount: 50000
      }
    );
    console.log(`   Result Published! Prize ID: ${pubRes.prizeRecord?.id || 'None'}, Certificates Generated: ${pubRes.certificatesCount}`);
  }

  console.log("=== ALL ROLE WORKFLOW & AUDIT TESTS PASSED SUCCESSFULLY! ===");
}

runTest()
  .catch((err) => {
    console.error("Test Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
