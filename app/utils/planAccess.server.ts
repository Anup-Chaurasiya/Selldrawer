import prisma from "../db.server";
import { canAccessFeature, getOrderLimit } from "./billingPlans";

export async function checkPlanAccess(shop: string, feature: string): Promise<{
  hasAccess: boolean;
  reason?: string;
}> {
  const subscription = await prisma.appSubscription.findUnique({
    where: { shop },
  });

  if (!subscription || subscription.status !== "ACTIVE") {
    return {
      hasAccess: false,
      reason: "No active subscription found. Please subscribe to a plan.",
    };
  }

  const hasAccess = canAccessFeature(subscription.planId, feature);
  
  if (!hasAccess) {
    return {
      hasAccess: false,
      reason: `This feature is not available in your current plan (${subscription.planName}). Please upgrade to access this feature.`,
    };
  }

  return { hasAccess: true };
}

export async function checkOrderLimit(shop: string): Promise<{
  withinLimit: boolean;
  currentCount: number;
  limit: number;
  reason?: string;
}> {
  const subscription = await prisma.appSubscription.findUnique({
    where: { shop },
  });

  if (!subscription || subscription.status !== "ACTIVE") {
    return {
      withinLimit: false,
      currentCount: 0,
      limit: 0,
      reason: "No active subscription found.",
    };
  }

  const limit = getOrderLimit(subscription.planId);
  
  // Get order count for current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const currentCount = await prisma.analyticsEvent.count({
    where: {
      shop,
      eventType: 'conversion',
      createdAt: { gte: startOfMonth }
    }
  });

  const withinLimit = currentCount < limit;

  return {
    withinLimit,
    currentCount,
    limit,
    reason: withinLimit 
      ? undefined 
      : `You have reached your monthly order limit (${limit}). Please upgrade your plan to continue.`,
  };
}

export async function requirePlanAccess(shop: string, feature: string): Promise<void> {
  const { hasAccess, reason } = await checkPlanAccess(shop, feature);
  
  if (!hasAccess) {
    throw new Error(reason || "Access denied");
  }
}

export async function getSubscriptionInfo(shop: string) {
  const subscription = await prisma.appSubscription.findUnique({
    where: { shop },
  });

  if (!subscription) {
    return null;
  }

  const orderLimitInfo = await checkOrderLimit(shop);

  return {
    ...subscription,
    orderCount: orderLimitInfo.currentCount,
    orderLimit: orderLimitInfo.limit,
    withinOrderLimit: orderLimitInfo.withinLimit,
  };
}

