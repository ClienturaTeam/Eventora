import Stripe from "stripe";
import { Request } from "express";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY environment variable is missing.");
}
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-12-18.acacia" as any, // Using latest or fallback
});

export class StripeService {
  /**
   * Create a new Stripe Customer
   */
  static async createCustomer(email: string, name: string, metadata: Record<string, string>) {
    return stripe.customers.create({
      email,
      name,
      metadata,
    });
  }

  /**
   * Create a Stripe Checkout Session for Subscription
   */
  static async createSubscriptionCheckout(
    customerId: string,
    priceId: string,
    organizationId: string,
    successUrl: string,
    cancelUrl: string,
    stripeCouponId?: string
  ) {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        organizationId,
        type: "subscription_checkout",
      },
    };

    if (stripeCouponId) {
      sessionParams.discounts = [{ coupon: stripeCouponId }];
    }

    return stripe.checkout.sessions.create(sessionParams);
  }

  /**
   * Create a Stripe Checkout Session for Event Registration (One-time payment)
   */
  static async createEventRegistrationCheckout(
    eventName: string,
    amount: number,
    currency: string,
    organizationId: string,
    eventId: string,
    registrationId: string,
    userId: string,
    successUrl: string,
    cancelUrl: string
  ) {
    return stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: eventName,
            },
            unit_amount: Math.round(amount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: "event_registration",
        organizationId,
        eventId,
        registrationId,
        userId,
      },
    });
  }

  /**
   * Create or Retrieve a Stripe Coupon
   */
  static async getOrCreateCoupon(code: string, type: string, value: number) {
    try {
      // Check if it exists
      const existing = await stripe.coupons.retrieve(code);
      return existing;
    } catch (err: any) {
      // Create if it doesn't exist
      const couponParams: Stripe.CouponCreateParams = {
        id: code,
        name: code,
        duration: "once",
      };
      
      if (type === "PERCENTAGE") {
        couponParams.percent_off = value;
      } else {
        couponParams.amount_off = Math.round(value * 100);
        couponParams.currency = "inr";
      }

      return stripe.coupons.create(couponParams);
    }
  }

  /**
   * Issue a refund
   */
  static async createRefund(paymentIntentId: string, amount?: number, reason?: string) {
    const refundData: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };
    
    if (amount) {
      refundData.amount = amount; // in cents
    }
    
    if (reason && ["duplicate", "fraudulent", "requested_by_customer"].includes(reason)) {
      refundData.reason = reason as Stripe.RefundCreateParams.Reason;
    }
    
    return stripe.refunds.create(refundData);
  }

  /**
   * Verify Stripe Webhook Signature
   */
  static verifyWebhookSignature(payload: string | Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new Error("Missing STRIPE_WEBHOOK_SECRET");
    }

    try {
      return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      throw new Error(`Webhook Error: ${err.message}`);
    }
  }

  /**
   * Map Stripe Sub Status to our Prisma enum
   */
  static mapStripeStatus(status: Stripe.Subscription.Status) {
    switch (status) {
      case "active":
        return "ACTIVE";
      case "canceled":
        return "CANCELLED";
      case "past_due":
        return "PAST_DUE";
      case "trialing":
        return "TRIALING";
      case "unpaid":
      case "incomplete":
      case "incomplete_expired":
        return "INACTIVE";
      case "paused":
        return "INACTIVE";
      default:
        return "INACTIVE";
    }
  }
}
