import { prisma } from "./server/src/utils/prisma";

async function main() {
  const allPermissions = await prisma.permission.findMany();
  const adminRoles = await prisma.role.findMany({
    where: {
      name: { in: ["Sudo Admin", "Platform Admin", "Admin", "Organization Admin", "Manager"] },
    },
  });

  console.log(`Found ${allPermissions.length} total permissions and ${adminRoles.length} admin roles.`);

  for (const role of adminRoles) {
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

  console.log("Successfully granted all permissions to admin roles!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
