import { Router } from "express";
import { PaymentsController } from "../controllers/payments.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireTenant } from "../middleware/tenant.middleware";
import { requirePermission } from "../middleware/rbac.middleware";
import express from "express";

const router = Router();

// ---------------------------------------------------------
// Webhook endpoint is mounted in app.ts before express.json()

// ---------------------------------------------------------
// Protected API endpoints
// ---------------------------------------------------------
router.use(requireAuth, requireTenant);

// Subscription Plans
router.get("/plans", requirePermission("payments.read"), PaymentsController.getPlans);

// Current Subscription & Billing
router.get("/subscription", requirePermission("payments.read"), PaymentsController.getSubscription);
router.put("/billing-profile", requirePermission("payments.manage"), PaymentsController.updateBillingProfile);

// Checkout (Subscriptions)
router.post("/checkout", requirePermission("payments.manage"), PaymentsController.createCheckoutSession);

// Event Registration Checkout (Participant)
// No explicit 'payments.manage' needed since participants are paying for themselves.
router.post("/event-registration/checkout", PaymentsController.createEventRegistrationCheckout);
router.post("/event-registration/verify", PaymentsController.verifyEventRegistrationPayment);

// Participant's own transactions
router.get("/my-transactions", PaymentsController.getMyTransactions);

// Transactions / Payments
router.get("/transactions", requirePermission("payments.read"), PaymentsController.getTransactions);
router.get("/export", requirePermission("payments.export"), PaymentsController.exportPayments);
router.post("/refund", requirePermission("payments.refund"), PaymentsController.refundPayment);

// Coupons
router.get("/coupons/validate", requirePermission("payments.manage"), PaymentsController.validateCoupon);

// Invoices
router.get("/invoices", requirePermission("payments.read"), PaymentsController.getInvoices);

// Dashboard stats
router.get("/dashboard", requirePermission("payments.read"), PaymentsController.getDashboard);

// Manager specific payment routes
router.get("/manager/events/:eventId/revenue", requirePermission("events.manage"), PaymentsController.getManagerEventRevenue);
router.get("/manager/transactions", requirePermission("payments.read"), PaymentsController.getManagerTransactions);
router.post("/manager/payments/:id/refund", requirePermission("payments.refund"), PaymentsController.refundEventPayment);

export default router;
