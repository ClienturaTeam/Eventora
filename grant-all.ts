import { prisma } from "./server/src/utils/prisma";

async function run() {
  const actions = ["reports.read", "reports.export", "organization.read", "organization.manage"];
  
  for (const action of actions) {
    await prisma.permission.upsert({
      where: { action },
      update: {},
      create: { action, description: `Permission for ${action}` },
    });
  }
  
  const perms = await prisma.permission.findMany({
    where: { action: { in: actions } },
  });

  const allRoles = await prisma.role.findMany();

  for (const role of allRoles) {
    for (const perm of perms) {
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
  console.log(`Granted ${actions.join(', ')} to ${allRoles.length} roles.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
