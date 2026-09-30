import { prisma } from "./server/src/utils/prisma";

async function main() {
  const users = await prisma.user.findMany({
    include: {
      memberships: {
        include: {
          role: true,
        },
      },
    },
  });

  console.log(
    JSON.stringify(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        roleName: u.memberships[0]?.role?.name || "None",
      })),
      null,
      2
    )
  );
}

main().catch(console.error).finally(() => prisma.$disconnect());
