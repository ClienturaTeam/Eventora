import { Request, Response } from "express";
import { PaymentsService } from "../services/payments.service";
import { AuditService } from "../services/audit.service";
import { AuthRequest } from "../middleware/auth.middleware";

export class PaymentsController {
  static async getPlans(req: AuthRequest, res: Response) {
    try {
      const plans = await PaymentsService.getPlans();
      res.json({ success: true, data: plans });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  static async getSubscription(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const data = await PaymentsService.getSubscription(tenantId);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  static async updateBillingProfile(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const profile = await PaymentsService.updateBillingProfile(tenantId, req.body);
      
      await AuditService.log({
        userId: req.user!.id,
        organizationId: tenantId,
        action: "BILLING_PROFILE_UPDATED",
        details: "Updated organization billing profile",
      });

      res.json({ success: true, data: profile });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  static async createCheckoutSession(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { planId, successUrl, cancelUrl, couponCode } = req.body;
      
      if (!planId || !successUrl || !cancelUrl) {
        return res.status(400).json({ success: false, error: { message: "Missing required fields" } });
      }

      const session = await PaymentsService.createCheckoutSession(
        tenantId,
        planId,
        successUrl,
        cancelUrl,
        couponCode
      );

      await AuditService.log({
        userId: req.user!.id,
        organizationId: tenantId,
        action: "CHECKOUT_CREATED",
        details: `Created checkout session for plan ${planId}`,
      });

      res.json({ success: true, data: session });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ success: false, error: { message: error.message, code: error.code } });
    }
  }

  static async getTransactions(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const type = req.query.type as any;
      const filter = type ? { type } : undefined;
      const transactions = await PaymentsService.getPayments(tenantId, filter);
      res.json({ success: true, data: transactions });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  static async getInvoices(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const invoices = await PaymentsService.getInvoices(tenantId);
      res.json({ success: true, data: invoices });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  static async getDashboard(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const stats = await PaymentsService.getDashboardStats(tenantId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  static async handleWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers["stripe-signature"];
      if (!signature) {
        return res.status(400).send("Missing stripe-signature header");
      }
      
      // req.body must be raw buffer here!
      const result = await PaymentsService.handleWebhook(signature as string, req.body);
      res.json(result);
    } catch (error: any) {
      console.error("Webhook error:", error.message);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }

  static async validateCoupon(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { code } = req.query;
      if (!code || typeof code !== "string") {
        return res.status(400).json({ success: false, error: { message: "Missing coupon code" } });
      }

      const result = await PaymentsService.validateCoupon(tenantId, code);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  static async refundPayment(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { paymentId, amount, reason } = req.body;

      if (!paymentId) {
        return res.status(400).json({ success: false, error: { message: "Missing paymentId" } });
      }

      const result = await PaymentsService.refundPayment(tenantId, paymentId, amount, reason);

      await AuditService.log({
        userId: req.user!.id,
        organizationId: tenantId,
        action: "PAYMENT_REFUNDED",
        details: `Initiated refund for payment ${paymentId} (${amount ? `Amount: ${amount}` : 'Full'})`,
      });

      res.json({ success: true, data: result });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ success: false, error: { message: error.message, code: error.code } });
    }
  }

  static async exportPayments(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const format = req.query.format;
      
      if (format !== "csv") {
        return res.status(400).json({ success: false, error: { message: "Unsupported format" } });
      }

      const csvData = await PaymentsService.exportPaymentsCSV(tenantId);

      await AuditService.log({
        userId: req.user!.id,
        organizationId: tenantId,
        action: "PAYMENTS_EXPORTED",
        details: "Exported payment history to CSV",
      });

      res.header("Content-Type", "text/csv");
      res.attachment(`payments_${tenantId}_${Date.now()}.csv`);
      return res.send(csvData);
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  // --- Event Registration Payments ---

  static async createEventRegistrationCheckout(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const { eventId, successUrl, cancelUrl } = req.body;

      if (!eventId || !successUrl || !cancelUrl) {
        return res.status(400).json({ success: false, error: { message: "Missing required fields" } });
      }

      const session = await PaymentsService.createEventRegistrationCheckout(
        tenantId,
        userId,
        eventId,
        successUrl,
        cancelUrl
      );

      res.json({ success: true, data: session });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ success: false, error: { message: error.message, code: error.code } });
    }
  }

  static async verifyEventRegistrationPayment(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const { eventId } = req.body;

      if (!eventId) {
        return res.status(400).json({ success: false, error: { message: "Missing eventId" } });
      }

      const result = await PaymentsService.verifyEventRegistrationPayment(tenantId, userId, eventId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }

  static async getMyTransactions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const transactions = await PaymentsService.getUserTransactions(userId);
      res.json({ success: true, data: transactions });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  static async getManagerEventRevenue(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const eventId = req.params.eventId;
      const revenue = await PaymentsService.getManagerEventRevenue(tenantId, eventId);
      res.json({ success: true, data: revenue });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  static async getManagerTransactions(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const eventId = req.query.eventId as string;
      const transactions = await PaymentsService.getManagerTransactions(tenantId, eventId);
      res.json({ success: true, data: transactions });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  static async refundEventPayment(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const paymentId = req.params.id;
      const { amount, reason } = req.body;

      const result = await PaymentsService.refundEventPayment(tenantId, paymentId, amount, reason);

      await AuditService.logAction({
        actorId: req.user!.id,
        organizationId: tenantId,
        action: "EVENT_PAYMENT_REFUNDED",
        metadata: { details: `Initiated refund for event payment ${paymentId}` },
      });

      res.json({ success: true, data: result });
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ success: false, error: { message: error.message, code: error.code } });
    }
  }
}
