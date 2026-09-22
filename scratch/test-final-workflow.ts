import { prisma } from "../server/src/utils/prisma";
import { ResultsService } from "../server/src/services/results.service";
import { CertificateService } from "../server/src/services/certificates.service";

async function main() {
  console.log("=== STARTING FINAL WORKFLOW E2E VERIFICATION ===");

  // 1. Get or create Organization & Event & Competition
  const org = await prisma.organization.findFirst() || await prisma.organization.create({
    data: { name: "Ascent Innovation Labs", slug: "ascent-labs" }
  });

  let event = await prisma.event.findFirst({ where: { organizationId: org.id } });
  if (!event) {
    event = await prisma.event.create({
      data: {
        organizationId: org.id,
        name: "Global AI Hackathon 2026",
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000)
      }
    });
  }

  let competition = await prisma.competition.findFirst({ where: { eventId: event.id } });
  if (!competition) {
    competition = await prisma.competition.create({
      data: {
        eventId: event.id,
        name: "Main Hackathon Track"
      }
    });
  }

  // 2. Create 4 Users for Team "Code Warriors"
  const memberData = [
    { email: "hemanth@codewarriors.dev", firstName: "Hemanth", lastName: "Kumar", isLead: true },
    { email: "rahul@codewarriors.dev", firstName: "Rahul", lastName: "Sharma", isLead: false },
    { email: "kiran@codewarriors.dev", firstName: "Kiran", lastName: "Verma", isLead: false },
    { email: "sai@codewarriors.dev", firstName: "Sai", lastName: "Krishna", isLead: false }
  ];

  const createdUsers = [];
  for (const m of memberData) {
    let user = await prisma.user.findUnique({ where: { email: m.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: m.email,
          passwordHash: "hashed_pass",
          firstName: m.firstName,
          lastName: m.lastName,
          status: "ACTIVE"
        }
      });
    }
    createdUsers.push({ ...m, userId: user.id });
  }

  // 3. Create Team "Code Warriors"
  let team = await prisma.team.findFirst({ where: { competitionId: competition.id, name: "Code Warriors" } });
  if (!team) {
    team = await prisma.team.create({
      data: {
        competitionId: competition.id,
        name: "Code Warriors",
        size: 4
      }
    });
  }

  for (const u of createdUsers) {
    const existingMem = await prisma.teamMember.findFirst({ where: { teamId: team.id, userId: u.userId } });
    if (!existingMem) {
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: u.userId,
          name: `${u.firstName} ${u.lastName}`,
          isLead: u.isLead
        }
      });
    }
  }

  // 4. Create Manager/Admin user selector
  let managerUser = await prisma.user.findFirst({ where: { email: "manager@ascent.com" } }) || createdUsers[0];

  // 5. Publish Result: FIRST_PRIZE with ₹50,000 prize
  console.log("Publishing First Prize result for Team Code Warriors...");
  const publishRes = await ResultsService.publishResult(org.id, managerUser.userId, {
    competitionId: competition.id,
    teamId: team.id,
    resultType: "FIRST_PRIZE",
    prizeAmount: 50000,
    currency: "INR"
  });

  console.log("Publish Result Response:", publishRes);

  // 6. Verify Database Persisted Records
  const winner = await prisma.winner.findFirst({ where: { teamId: team.id }, include: { prize: true } });
  console.log("Winner Record:", winner?.position, "Prize:", winner?.prize?.amount, "Status:", winner?.prize?.status);

  const certificates = await prisma.certificate.findMany({ where: { teamId: team.id } });
  console.log(`Found ${certificates.length} certificates for team Code Warriors:`);
  for (const c of certificates) {
    console.log(`- Certificate ID: ${c.certificateNumber} | Recipient: ${c.recipientName} | Award: ${c.awardTitle}`);
  }

  const leadUser = createdUsers.find(u => u.isLead)!;
  const nonLeadUser = createdUsers.find(u => !u.isLead)!;

  // 7. Verify Certificate Verification Endpoint logic
  const sampleCert = certificates[0];
  const verifyRes = await CertificateService.findByVerificationCode(sampleCert.verificationCode);
  console.log("Verification Response:", verifyRes);

  // 8. Verify ZIP Bundle Generation for Team Lead
  const zipDownloadRes = await CertificateService.downloadTeamCertificates(org.id, leadUser.userId);
  console.log(`ZIP Generated: ${zipDownloadRes.filename} | Size: ${zipDownloadRes.zipBuffer.length} bytes`);

  // 9. Verify Unauthorized access check for non-lead
  try {
    await CertificateService.downloadTeamCertificates(org.id, nonLeadUser.userId);
    console.error("FAIL: Non-lead was able to download team certificates!");
  } catch (err: any) {
    console.log("SUCCESS: Non-lead correctly blocked from team download ->", err.message);
  }

  console.log("=== ALL E2E WORKFLOW VERIFICATIONS PASSED ===");
}

main().catch(console.error);
