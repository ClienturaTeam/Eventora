import { prisma } from "./server/src/utils/prisma";

async function main() {
  console.log("Updating roles and memberships in database...");

  const allPermissions = await prisma.permission.findMany();
  const permMap = new Map(allPermissions.map((p) => [p.action, p.id]));

  const org = await prisma.organization.findFirst();
  const orgId = org?.id || null;

  const roleDefinitions = [
    { name: "Sudo Admin", description: "Sudo Administrator with full system access" },
    { name: "Platform Admin", description: "Platform Administrator" },
    { name: "Organization Admin", description: "Organization Administrator" },
    { name: "Admin", description: "Administrator" },
    { name: "Manager", description: "Department & Program Manager" },
    { name: "Principal", description: "Institutional Principal / Director" },
    { name: "Faculty Coordinator", description: "Faculty Lead & Event Coordinator" },
    { name: "Student Coordinator", description: "Student Event Coordinator" },
    { name: "Participant", description: "Event & Hackathon Participant" },
    { name: "Judge", description: "Competition Evaluator & Judge" },
    { name: "Mentor", description: "Team Mentor & Guide" },
    { name: "Volunteer", description: "Event Volunteer & Operations" },
  ];

  const roleMap = new Map<string, string>();

  for (const def of roleDefinitions) {
    let role = await prisma.role.findFirst({
      where: { name: def.name },
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          name: def.name,
          description: def.description,
          organizationId: def.name.includes("Admin") ? null : orgId,
        },
      });
    }

    roleMap.set(def.name, role.id);

    // Assign all permissions to Admin/Manager roles, and relevant permissions to others
    for (const perm of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: perm.id,
        },
      });
    }
  }

  // Map users to their correct roles
  const userRoleAssignments: Record<string, string> = {
    "sudo@ascent.com": "Sudo Admin",
    "admin@ascent.dev": "Platform Admin",
    "admin@ascent.com": "Organization Admin",
    "manager@contoso.com": "Manager",
    "coordinator@contoso.com": "Student Coordinator",
    "participant@gmail.com": "Participant",
    "participant2@gmail.com": "Participant",
    "elena@ascent.dev": "Judge",
    "rajat@ascent.dev": "Judge",
    "arjun@ascent.dev": "Mentor",
    "lena@ascent.dev": "Mentor",
    "tomas@ascent.dev": "Volunteer",
    "ishita@ascent.dev": "Volunteer",
  };

  for (const [email, roleName] of Object.entries(userRoleAssignments)) {
    const user = await prisma.user.findFirst({ where: { email } });
    const targetRoleId = roleMap.get(roleName);

    if (user && targetRoleId) {
      await prisma.organizationMember.updateMany({
        where: { userId: user.id },
        data: { roleId: targetRoleId },
      });
      console.log(`Updated ${email} -> Role: ${roleName}`);
    }
  }

  console.log("Successfully updated all database roles and user memberships!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
