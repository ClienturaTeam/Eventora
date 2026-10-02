import { prisma } from "../utils/prisma";

export class MentorRepository {
  static async findAll(tenantId?: string) {
    const where: any = tenantId ? { organizationId: tenantId } : {};
    return prisma.mentor.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        teamAssignments: {
          include: {
            team: { select: { id: true, name: true, competition: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async findById(tenantId: string, id: string) {
    return prisma.mentor.findFirst({
      where: { id, organizationId: tenantId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        teamAssignments: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                competition: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
  }

  static async create(tenantId: string, data: { userId: string; expertise?: string; bio?: string }) {
    const member = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: data.userId, organizationId: tenantId } },
    });
    if (!member) throw new Error("User is not a member of this organization.");

    return prisma.mentor.create({
      data: { userId: data.userId, organizationId: tenantId, expertise: data.expertise, bio: data.bio },
    });
  }

  static async update(tenantId: string, id: string, data: { expertise?: string; bio?: string }) {
    const mentor = await this.findById(tenantId, id);
    if (!mentor) return null;
    return prisma.mentor.update({ where: { id }, data });
  }

  static async delete(tenantId: string, id: string) {
    const mentor = await this.findById(tenantId, id);
    if (!mentor) return null;
    return prisma.mentor.delete({ where: { id } });
  }

  static async assignTeam(tenantId: string, mentorId: string, teamId: string) {
    const mentor = await this.findById(tenantId, mentorId);
    if (!mentor) throw new Error("Mentor not found.");

    const team = await prisma.team.findFirst({
      where: { id: teamId, competition: { event: { organizationId: tenantId } } },
    });
    if (!team) throw new Error("Team not found in this organization.");

    return prisma.teamMentor.create({ data: { mentorId, teamId } });
  }

  static async removeTeam(tenantId: string, mentorId: string, teamId: string) {
    const mentor = await this.findById(tenantId, mentorId);
    if (!mentor) throw new Error("Mentor not found.");
    return prisma.teamMentor.deleteMany({ where: { mentorId, teamId } });
  }
}
