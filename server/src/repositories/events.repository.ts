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
        teamMembers: true,
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
      return {
        ...rest,
        revenue: payments.reduce((sum, p) => sum + p.amount, 0)
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

    return prisma.event.findFirst({
      where: whereClause,
      include: { teamMembers: true }
    });
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
