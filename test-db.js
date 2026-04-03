import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const cd = await prisma.cartDrawer.findFirst({
    include: { freeShippingBars: true, milestones: true, freeGifts: true }
  });
  console.log(JSON.stringify(cd, null, 2));
}
main().finally(() => prisma.$disconnect());
