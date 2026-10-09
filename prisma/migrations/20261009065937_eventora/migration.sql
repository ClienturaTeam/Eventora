/*
  Warnings:

  - A unique constraint covering the columns `[userId,eventId,type]` on the table `Certificate` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RegistrationType" AS ENUM ('INDIVIDUAL', 'TEAM');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'AI_GENERATED', 'SUBMITTED_TO_FACULTY', 'CHANGES_REQUESTED_BY_FACULTY', 'SUBMITTED_TO_MANAGER', 'CHANGES_REQUESTED_BY_MANAGER', 'APPROVED', 'FINALIZED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CertificateType" ADD VALUE 'FIRST_PRIZE';
ALTER TYPE "CertificateType" ADD VALUE 'SECOND_PRIZE';
ALTER TYPE "CertificateType" ADD VALUE 'THIRD_PRIZE';
ALTER TYPE "CertificateType" ADD VALUE 'SPECIAL_AWARD';

-- AlterEnum
ALTER TYPE "EvaluationStatus" ADD VALUE 'CORRECTION_REQUESTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MemberStatus" ADD VALUE 'PENDING';
ALTER TYPE "MemberStatus" ADD VALUE 'REJECTED';

-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_judgeId_fkey";

-- DropIndex
DROP INDEX "Judge_userId_organizationId_key";

-- DropIndex
DROP INDEX "TeamMember_teamId_userId_key";

-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "awardTitle" TEXT,
ADD COLUMN     "recipientName" TEXT,
ADD COLUMN     "teamId" TEXT,
ADD COLUMN     "teamName" TEXT;

-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN     "correctionReason" TEXT,
ADD COLUMN     "criteriaScores" JSONB,
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "recommendation" TEXT,
ADD COLUMN     "roundId" TEXT,
ADD COLUMN     "roundNumber" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "maxTeamSize" INTEGER,
ADD COLUMN     "minTeamSize" INTEGER,
ADD COLUMN     "registrationConfig" JSONB,
ADD COLUMN     "registrationEnd" TIMESTAMP(3),
ADD COLUMN     "registrationStart" TIMESTAMP(3),
ADD COLUMN     "registrationType" "RegistrationType" NOT NULL DEFAULT 'INDIVIDUAL',
ALTER COLUMN "currency" SET DEFAULT 'INR';

-- AlterTable
ALTER TABLE "Judge" ADD COLUMN     "email" TEXT NOT NULL DEFAULT 'unknown@example.com',
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Unknown Judge',
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "currency" SET DEFAULT 'INR';

-- AlterTable
ALTER TABLE "Prize" ADD COLUMN     "resultType" TEXT,
ADD COLUMN     "teamId" TEXT;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "eventId" TEXT,
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "problemStatementId" TEXT,
ADD COLUMN     "roundId" TEXT,
ADD COLUMN     "roundNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "submittedById" TEXT;

-- AlterTable
ALTER TABLE "SubscriptionPlan" ALTER COLUMN "currency" SET DEFAULT 'INR';

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "currentRound" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "problemStatementId" TEXT,
ADD COLUMN     "problemStatementLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "problemStatementSelectedAt" TIMESTAMP(3),
ADD COLUMN     "round1Status" TEXT DEFAULT 'PENDING',
ADD COLUMN     "round2Status" TEXT DEFAULT 'LOCKED',
ADD COLUMN     "round3Status" TEXT DEFAULT 'LOCKED',
ADD COLUMN     "size" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "college" TEXT,
ADD COLUMN     "contactNumber" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "year" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ProblemStatement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "isReleased" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProblemStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamInvitation" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionFile" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTeamMember" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "responsibility" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventFinalReport" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "coordinatorId" TEXT NOT NULL,
    "executiveSummary" TEXT,
    "eventOutcome" TEXT,
    "keyHighlights" TEXT,
    "challenges" TEXT,
    "recommendations" TEXT,
    "additionalRemarks" TEXT,
    "supportingDocuments" JSONB,
    "aiGeneratedContent" TEXT,
    "finalizedContent" TEXT,
    "facultyId" TEXT,
    "facultyComment" TEXT,
    "facultyReviewedAt" TIMESTAMP(3),
    "managerId" TEXT,
    "managerComment" TEXT,
    "managerReviewedAt" TIMESTAMP(3),
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventFinalReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRound" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxMarks" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "submissionStart" TIMESTAMP(3),
    "submissionDeadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "instructions" TEXT,
    "submissionType" TEXT DEFAULT 'FILE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionJudgeAssignment" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "judgeId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionJudgeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorQuestion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "roundId" TEXT,
    "participantId" TEXT NOT NULL,
    "mentorId" TEXT,
    "subject" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionReply" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EventRoundToProblemStatement" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvitation_teamId_email_key" ON "TeamInvitation"("teamId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "EventTeamMember_eventId_userId_key" ON "EventTeamMember"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventFinalReport_eventId_key" ON "EventFinalReport"("eventId");

-- CreateIndex
CREATE INDEX "EventFinalReport_organizationId_idx" ON "EventFinalReport"("organizationId");

-- CreateIndex
CREATE INDEX "EventFinalReport_eventId_idx" ON "EventFinalReport"("eventId");

-- CreateIndex
CREATE INDEX "EventFinalReport_coordinatorId_idx" ON "EventFinalReport"("coordinatorId");

-- CreateIndex
CREATE INDEX "EventFinalReport_facultyId_idx" ON "EventFinalReport"("facultyId");

-- CreateIndex
CREATE INDEX "EventFinalReport_managerId_idx" ON "EventFinalReport"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRound_eventId_roundNumber_key" ON "EventRound"("eventId", "roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionJudgeAssignment_submissionId_judgeId_key" ON "SubmissionJudgeAssignment"("submissionId", "judgeId");

-- CreateIndex
CREATE UNIQUE INDEX "_EventRoundToProblemStatement_AB_unique" ON "_EventRoundToProblemStatement"("A", "B");

-- CreateIndex
CREATE INDEX "_EventRoundToProblemStatement_B_index" ON "_EventRoundToProblemStatement"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_userId_eventId_type_key" ON "Certificate"("userId", "eventId", "type");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_problemStatementId_fkey" FOREIGN KEY ("problemStatementId") REFERENCES "ProblemStatement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemStatement" ADD CONSTRAINT "ProblemStatement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemStatement" ADD CONSTRAINT "ProblemStatement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvitation" ADD CONSTRAINT "TeamInvitation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "EventRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_problemStatementId_fkey" FOREIGN KEY ("problemStatementId") REFERENCES "ProblemStatement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionFile" ADD CONSTRAINT "SubmissionFile_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Judge" ADD CONSTRAINT "Judge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "Judge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "EventRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTeamMember" ADD CONSTRAINT "EventTeamMember_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTeamMember" ADD CONSTRAINT "EventTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFinalReport" ADD CONSTRAINT "EventFinalReport_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFinalReport" ADD CONSTRAINT "EventFinalReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFinalReport" ADD CONSTRAINT "EventFinalReport_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFinalReport" ADD CONSTRAINT "EventFinalReport_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFinalReport" ADD CONSTRAINT "EventFinalReport_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRound" ADD CONSTRAINT "EventRound_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionJudgeAssignment" ADD CONSTRAINT "SubmissionJudgeAssignment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionJudgeAssignment" ADD CONSTRAINT "SubmissionJudgeAssignment_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorQuestion" ADD CONSTRAINT "MentorQuestion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorQuestion" ADD CONSTRAINT "MentorQuestion_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorQuestion" ADD CONSTRAINT "MentorQuestion_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "EventRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorQuestion" ADD CONSTRAINT "MentorQuestion_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorQuestion" ADD CONSTRAINT "MentorQuestion_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionReply" ADD CONSTRAINT "QuestionReply_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "MentorQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionReply" ADD CONSTRAINT "QuestionReply_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventRoundToProblemStatement" ADD CONSTRAINT "_EventRoundToProblemStatement_A_fkey" FOREIGN KEY ("A") REFERENCES "EventRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventRoundToProblemStatement" ADD CONSTRAINT "_EventRoundToProblemStatement_B_fkey" FOREIGN KEY ("B") REFERENCES "ProblemStatement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
