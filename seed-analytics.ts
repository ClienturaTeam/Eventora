import { prisma } from "./server/src/utils/prisma";

async function run() {
  const org = await prisma.organization.findFirst({
    where: { name: { contains: "Contoso" } }
  });

  if (!org) {
    console.error("Organization not found.");
    return;
  }

  const tenantId = org.id;

  // Generate 6 months of historical data
  const now = new Date();
  
  const payments = [];
  
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 15);
    
    // Create random amount of payments for each month
    const numPayments = Math.floor(Math.random() * 20) + 10;
    
    for (let j = 0; j < numPayments; j++) {
      let amount = 0;
      const type = Math.random();
      if (type < 0.6) amount = 99; // Subscription
      else if (type < 0.9) amount = 250; // Registration
      else amount = 1000; // Sponsorship
      
      payments.push({
        organizationId: tenantId,
        amount: amount,
        currency: "INR",
        status: "SUCCEEDED",
        provider: "STRIPE",
        description: "Generated Payment",
        createdAt: new Date(monthDate.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000), // Random day in month
        updatedAt: new Date(),
      });
    }
  }

  await prisma.payment.createMany({
    data: payments
  });
  
  console.log(`Created ${payments.length} mock payments for analytics.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
