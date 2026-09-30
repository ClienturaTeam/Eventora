import { PrismaClient } from "@prisma/client";
import { SecurityRepository } from "../repositories/security.repository";
import crypto from "crypto";

const prisma = new PrismaClient();

export class IntegrationsService {
  static async getIntegrations(organizationId: string) {
    return prisma.integration.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });
  }

  static async getIntegrationDashboard(organizationId: string) {
    const total = await prisma.integration.count({ where: { organizationId } });
    const connected = await prisma.integration.count({ where: { organizationId, status: "Connected" } });
    const errors = await prisma.integration.count({ where: { organizationId, status: "Error" } });
    
    // In a real scenario, this would aggregate usage logs.
    const apiCalls30d = 12450;
    const webhookEvents30d = 3840;

    return {
      totalIntegrations: total,
      connected,
      disconnected: total - connected - errors,
      errors,
      apiCalls30d,
      webhookEvents30d,
    };
  }

  static async getApiKeys(organizationId: string) {
    return prisma.apiKey.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createApiKey(organizationId: string, name: string, environment: string, createdById: string, expiresInDays?: number) {
    const rawKey = `sk_${environment.toLowerCase()}_${crypto.randomBytes(32).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const maskedKey = `${rawKey.slice(0, 12)}••••••••••••${rawKey.slice(-4)}`;

    let expiry: Date | null = null;
    if (expiresInDays) {
      expiry = new Date();
      expiry.setDate(expiry.getDate() + expiresInDays);
    }

    const apiKey = await prisma.apiKey.create({
      data: {
        organizationId,
        name,
        environment,
        keyHash,
        maskedKey,
        createdById,
        expiry,
      }
    });

    await SecurityRepository.logSecurityEvent(
      organizationId,
      createdById,
      "api_key_created",
      "Medium",
      null,
      "System"
    );

    return { ...apiKey, rawKey };
  }

  static async revokeApiKey(organizationId: string, apiKeyId: string, revokedById: string) {
    const apiKey = await prisma.apiKey.updateMany({
      where: { id: apiKeyId, organizationId },
      data: { status: "Revoked", expiry: new Date() },
    });

    if (apiKey.count > 0) {
      await SecurityRepository.logSecurityEvent(
        organizationId,
        revokedById,
        "api_key_revoked",
        "High",
        null,
        "System"
      );
    }

    return apiKey.count > 0;
  }

  static async getWebhooks(organizationId: string) {
    return prisma.webhook.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createWebhook(organizationId: string, name: string, endpoint: string, events: string[], createdById: string) {
    const webhook = await prisma.webhook.create({
      data: {
        organizationId,
        name,
        endpoint,
        events,
      }
    });

    await SecurityRepository.logSecurityEvent(
      organizationId,
      createdById,
      "webhook_created",
      "Medium",
      null,
      "System"
    );

    return webhook;
  }

  static async updateWebhook(organizationId: string, webhookId: string, data: { name?: string; endpoint?: string; events?: string[]; status?: string; }, updatedById: string) {
    const webhook = await prisma.webhook.findFirst({
      where: { id: webhookId, organizationId }
    });
    if (!webhook) throw new Error("Webhook not found");

    const updated = await prisma.webhook.update({
      where: { id: webhookId },
      data,
    });

    await SecurityRepository.logSecurityEvent(
      organizationId,
      updatedById,
      "webhook_updated",
      "Medium",
      null,
      "System"
    );

    return updated;
  }

  static async deleteWebhook(organizationId: string, webhookId: string, deletedById: string) {
    const webhook = await prisma.webhook.findFirst({
      where: { id: webhookId, organizationId }
    });
    if (!webhook) return false;

    await prisma.webhook.delete({
      where: { id: webhookId }
    });

    await SecurityRepository.logSecurityEvent(
      organizationId,
      deletedById,
      "webhook_deleted",
      "High",
      null,
      "System"
    );

    return true;
  }

  static async getWebhookDeliveries(organizationId: string, webhookId: string) {
    // Verify webhook belongs to organization
    const webhook = await prisma.webhook.findFirst({
      where: { id: webhookId, organizationId }
    });
    if (!webhook) throw new Error("Webhook not found");

    return prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: "desc" },
      take: 50
    });
  }

  static async pingWebhook(organizationId: string, webhookId: string, userId: string) {
    const webhook = await prisma.webhook.findFirst({
      where: { id: webhookId, organizationId }
    });
    if (!webhook) throw new Error("Webhook not found");

    const startTime = Date.now();
    let responseCode: number | null = null;
    let status = "Success";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(webhook.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Eventora-Webhook-Dispatcher/1.0"
        },
        body: JSON.stringify({
          event: "ping",
          timestamp: new Date().toISOString(),
          data: { message: "Test ping from Eventora Developer Platform" }
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
      responseCode = null; 
    }

    const durationMs = Date.now() - startTime;

    const delivery = await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event: "ping",
        status,
        responseCode,
        durationMs
      }
    });

    return delivery;
  }
}

