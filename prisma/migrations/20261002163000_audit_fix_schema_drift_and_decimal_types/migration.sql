-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- DropForeignKey
ALTER TABLE "AIInsightsReport" DROP CONSTRAINT IF EXISTS "AIInsightsReport_eventId_fkey";

-- DropForeignKey
ALTER TABLE "AIInsightsReport" DROP CONSTRAINT IF EXISTS "AIInsightsReport_generatedById_fkey";

-- DropForeignKey
ALTER TABLE "AIInsightsReport" DROP CONSTRAINT IF EXISTS "AIInsightsReport_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_actorId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Coupon" DROP CONSTRAINT IF EXISTS "Coupon_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationBillingProfile" DROP CONSTRAINT IF EXISTS "OrganizationBillingProfile_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Refund" DROP CONSTRAINT IF EXISTS "Refund_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Refund" DROP CONSTRAINT IF EXISTS "Refund_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "SecurityEvent" DROP CONSTRAINT IF EXISTS "SecurityEvent_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "SecurityEvent" DROP CONSTRAINT IF EXISTS "SecurityEvent_userId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_organizationId_fkey";

-- AlterTable
ALTER TABLE "Coupon" DROP COLUMN IF EXISTS "type",
ADD COLUMN     "type" "CouponType" NOT NULL DEFAULT 'PERCENTAGE',
ALTER COLUMN "value" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS "revenue" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "HackathonProposal" ALTER COLUMN "estimatedBudget" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "taxAmount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "discountAmount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Prize" ALTER COLUMN "value" SET DATA TYPE DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS "amount" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Refund" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Sponsor" ALTER COLUMN "committedValue" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "SubscriptionPlan" ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AIInsightsReport_organizationId_idx" ON "AIInsightsReport"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AIInsightsReport_eventId_idx" ON "AIInsightsReport"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AIInsightsReport_generatedById_idx" ON "AIInsightsReport"("generatedById");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AttendanceRecord_userId_idx" ON "AttendanceRecord"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BadgeAward_organizationId_idx" ON "BadgeAward"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BadgeAward_recipientUserId_idx" ON "BadgeAward"("recipientUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Certificate_organizationId_idx" ON "Certificate"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Certificate_userId_idx" ON "Certificate"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Certificate_eventId_idx" ON "Certificate"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Certificate_competitionId_idx" ON "Certificate"("competitionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Coupon_organizationId_idx" ON "Coupon"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CourseEnrollment_userId_idx" ON "CourseEnrollment"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GroupMembership_userId_idx" ON "GroupMembership"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Invoice_organizationId_idx" ON "Invoice"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JudgeCompetition_competitionId_idx" ON "JudgeCompetition"("competitionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Payment_organizationId_idx" ON "Payment"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Payment_eventId_idx" ON "Payment"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Refund_organizationId_idx" ON "Refund"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Refund_paymentId_idx" ON "Refund"("paymentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SecurityEvent_userId_idx" ON "SecurityEvent"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Sponsor_organizationId_idx" ON "Sponsor"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Subscription_planId_idx" ON "Subscription"("planId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TeamMentor_teamId_idx" ON "TeamMentor"("teamId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserRecoveryCode_userId_idx" ON "UserRecoveryCode"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserSession_tokenIdentifier_expiresAt_idx" ON "UserSession"("tokenIdentifier", "expiresAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserSession_active_token_idx" ON "UserSession"("tokenIdentifier", "expiresAt") WHERE "revokedAt" IS NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VolunteerEvent_eventId_idx" ON "VolunteerEvent"("eventId");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationBillingProfile" ADD CONSTRAINT "OrganizationBillingProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIInsightsReport" ADD CONSTRAINT "AIInsightsReport_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIInsightsReport" ADD CONSTRAINT "AIInsightsReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIInsightsReport" ADD CONSTRAINT "AIInsightsReport_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
