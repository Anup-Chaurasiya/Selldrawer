import db from "../db.server";

export async function deleteShopData(shop: string) {
  await db.$transaction([
    db.session.deleteMany({ where: { shop } }),
    db.cartConfiguration.deleteMany({ where: { shop } }),
    db.cartDrawer.deleteMany({ where: { shop } }),
    db.couponCodeField.deleteMany({ where: { shop } }),
    db.cartDrawerAnalytics.deleteMany({ where: { shop } }),
    db.appSubscription.deleteMany({ where: { shop } }),
    db.frequentlyBoughtTogether.deleteMany({ where: { shop } }),
    db.milestoneBlock.deleteMany({ where: { shop } }),
    db.promotionalBannerBlock.deleteMany({ where: { shop } }),
  ]);
}

export async function getCustomerData(shop: string, customerId?: string | null) {
  if (!customerId) {
    return [];
  }

  return db.cartDrawerAnalytics.findMany({
    where: {
      shop,
      customerId: customerId.toString(),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteCustomerData(shop: string, customerId?: string | null) {
  if (!customerId) {
    return;
  }

  await db.cartDrawerAnalytics.deleteMany({
    where: {
      shop,
      customerId: customerId.toString(),
    },
  });
}
