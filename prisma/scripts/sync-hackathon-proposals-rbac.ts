import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Hackathon Proposals RBAC sync...");

  const proposalPermissions = [
    { action: 'hackathon_proposals.create', description: 'Allows creating hackathon proposals' },
    { action: 'hackathon_proposals.read', description: 'Allows reading all hackathon proposals' },
    { action: 'hackathon_proposals.read_own', description: 'Allows reading own hackathon proposals' },
    { action: 'hackathon_proposals.update', description: 'Allows updating any hackathon proposal' },
    { action: 'hackathon_proposals.update_own', description: 'Allows updating own hackathon proposals' },
    { action: 'hackathon_proposals.delete', description: 'Allows deleting any hackathon proposal' },
    { action: 'hackathon_proposals.delete_own', description: 'Allows deleting own hackathon proposals' },
    { action: 'hackathon_proposals.submit', description: 'Allows submitting proposals for review' },
    { action: 'hackathon_proposals.review', description: 'Allows manager reviewing hackathon proposals' },
    { action: 'hackathon_proposals.principal_review', description: 'Allows principal reviewing hackathon proposals' },
    { action: 'hackathon_proposals.create_event', description: 'Allows creating event from any approved proposal' },
    { action: 'hackathon_proposals.create_event_own', description: 'Allows creating event from own approved proposals' },
  ];

  // 1. Upsert permissions
  for (const perm of proposalPermissions) {
    await prisma.permission.upsert({
      where: { action: perm.action },
      update: { description: perm.description },
      create: { action: perm.action, description: perm.description },
    });
  }

  const allPerms = await prisma.permission.findMany({
    where: { action: { startsWith: 'hackathon_proposals' } }
  });
  const permMap = new Map(allPerms.map(p => [p.action, p.id]));

  // 2. Assign to Admin & Manager roles
  const adminManagerRoles = await prisma.role.findMany({
    where: { name: { in: ['Platform Admin', 'Organization Admin', 'Manager'] } },
  });

  for (const role of adminManagerRoles) {
    for (const perm of proposalPermissions) {
      const permId = permMap.get(perm.action);
      if (permId) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: permId } },
          update: {},
          create: { roleId: role.id, permissionId: permId },
        });
      }
    }
    console.log(`Assigned all proposal permissions to role: ${role.name} (${role.id})`);
  }

  // 3. Assign to Student Coordinator roles
  const studentCoordinatorRoles = await prisma.role.findMany({
    where: { name: 'Student Coordinator' },
  });

  const coordinatorActions = [
    'hackathon_proposals.create',
    'hackathon_proposals.read_own',
    'hackathon_proposals.update_own',
    'hackathon_proposals.delete_own',
    'hackathon_proposals.submit',
    'hackathon_proposals.create_event_own',
  ];

  for (const role of studentCoordinatorRoles) {
    for (const action of coordinatorActions) {
      const permId = permMap.get(action);
      if (permId) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: permId } },
          update: {},
          create: { roleId: role.id, permissionId: permId },
        });
      }
    }
    console.log(`Assigned coordinator proposal permissions to role: ${role.name} (${role.id})`);
  }

  console.log("Hackathon Proposals RBAC sync completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
