import { prisma } from "../utils/prisma";
import { Prisma } from "@prisma/client";

export class EventRepository {
  static async findAll(tenantId: string, onlyAssignedUserId?: string) {
    const whereClause: any = { organizationId: tenantId };
    
    if (onlyAssignedUserId) {
      whereClause.OR = [
        { teamMembers: { some: { userId: onlyAssignedUserId } } }
      ];
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        teamMembers: { include: { user: true } },
        rounds: { orderBy: { roundNumber: 'asc' } },
        problemStatements: true,
        competitions: true,
        payments: {
          where: {
            status: 'SUCCEEDED',
            type: 'EVENT_REGISTRATION',
            user: {
              memberships: {
                none: {
                  role: { name: { in: ["Sudo Admin", "Platform Admin", "Admin", "Organization Admin"] } }
                }
              }
            }
          },
          select: { amount: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return events.map(e => {
      const { payments, ...rest } = e;
      const calculatedPayments = payments.reduce((sum, p) => sum + p.amount, 0);
      const effectivePrice = typeof rest.price === "number" && rest.price > 0 ? rest.price : (rest.revenue || 0);
      const effectiveRevenue = typeof rest.revenue === "number" && rest.revenue > 0 ? rest.revenue : (rest.price || calculatedPayments);
      return {
        ...rest,
        price: effectivePrice,
        revenue: effectiveRevenue
      };
    });
  }

  static async findById(tenantId: string, id: string, onlyAssignedUserId?: string) {
    const whereClause: any = { id, organizationId: tenantId };
    
    if (onlyAssignedUserId) {
      whereClause.OR = [
        { teamMembers: { some: { userId: onlyAssignedUserId } } }
      ];
    }

    const event = await prisma.event.findFirst({
      where: whereClause,
      include: {
        teamMembers: { include: { user: true } },
        rounds: { orderBy: { roundNumber: 'asc' } },
        problemStatements: true
      }
    });

    if (!event) return null;
    const effectivePrice = typeof event.price === "number" && event.price > 0 ? event.price : (event.revenue || 0);
    const effectiveRevenue = typeof event.revenue === "number" && event.revenue > 0 ? event.revenue : (event.price || 0);

    return {
      ...event,
      price: effectivePrice,
      revenue: effectiveRevenue
    };
  }

  static async create(tenantId: string, data: Prisma.EventUncheckedCreateInput) {
    return prisma.event.create({
      data: {
        ...data,
        organizationId: tenantId
      }
    });
  }

  static async update(tenantId: string, id: string, data: Prisma.EventUncheckedUpdateInput) {
    // Ensuring the event belongs to the tenant
    const event = await this.findById(tenantId, id);
    if (!event) return null;

    return prisma.event.update({
      where: { id },
      data
    });
  }

  static async delete(tenantId: string, id: string) {
    const event = await this.findById(tenantId, id);
    if (!event) return null;

    return prisma.event.delete({
      where: { id }
    });
  }
}
