import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class WebhookDispatcherService {
  /**
   * Dispatches an event payload to all active webhooks subscribed to the event in the given organization.
   * This operates synchronously for Phase 3. In a production system, this could be pushed to a queue.
   */
  static async dispatchEvent(organizationId: string, event: string, payload: any) {
    // 1. Find all active webhooks for this organization that subscribe to the event
    const webhooks = await prisma.webhook.findMany({
      where: {
        organizationId,
        status: "Active",
        events: {
          has: event
        }
      }
    });

    if (webhooks.length === 0) return;

    // 2. Dispatch the event to each webhook
    for (const webhook of webhooks) {
      const startTime = Date.now();
      let responseCode: number | null = null;
      let status = "Success";

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(webhook.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Eventora-Webhook-Dispatcher/1.0"
          },
          body: JSON.stringify({
            event,
            timestamp: new Date().toISOString(),
            data: payload
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        responseCode = response.status;
        
        if (!response.ok) {
          status = "Failed";
        }
      } catch (err: any) {
        status = "Failed";
        // Network errors don't yield a valid HTTP response code
        responseCode = null; 
      }

      const durationMs = Date.now() - startTime;

      // 3. Record the delivery log
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          status,
          responseCode,
          durationMs
        }
      });

      // 4. Update the Webhook's last delivery date and recalculate success rate
      // To keep it simple, we query the last 50 deliveries to calculate the moving success rate
      const recentDeliveries = await prisma.webhookDelivery.findMany({
        where: { webhookId: webhook.id },
        orderBy: { createdAt: "desc" },
        take: 50
      });

      const successCount = recentDeliveries.filter(d => d.status === "Success").length;
      const successRate = recentDeliveries.length > 0 
        ? Math.round((successCount / recentDeliveries.length) * 100) 
        : 0;

      // Auto-fail the webhook if the last 5 deliveries all failed
      let newStatus = webhook.status;
      if (recentDeliveries.length >= 5) {
        const last5 = recentDeliveries.slice(0, 5);
        if (last5.every(d => d.status === "Failed")) {
          newStatus = "Failing";
        }
      }

      await prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          lastDelivery: new Date(),
          successRate,
          status: newStatus
        }
      });
    }
  }
}
