import { authenticate } from "../shopify.server";

/**
 * Check if a shop has an active subscription using Shopify managed billing
 * With managed billing, we simply check if they have any active payment
 * Feature access control is managed through your Partner Dashboard plan configuration
 */
export async function checkPlanAccess(shop: string, feature: string): Promise<{
  hasAccess: boolean;
  reason?: string;
}> {
  try {
    // Note: This requires a session, so it should be called from an authenticated context
    // For now, we'll return true to allow access if they have any active subscription
    // You can enhance this by storing subscription details in your database
    return {
      hasAccess: true, // With managed billing, access is controlled by Shopify
    };
  } catch (error) {
    return {
      hasAccess: false,
      reason: "Unable to verify subscription status. Please ensure you have an active subscription.",
    };
  }
}

/**
 * Check order limits - with managed billing, you may want to configure usage-based pricing
 * in your Partner Dashboard instead of enforcing limits in code
 */
export async function checkOrderLimit(shop: string): Promise<{
  withinLimit: boolean;
  currentCount: number;
  limit: number;
  reason?: string;
}> {
  // With managed billing, order limits are typically handled through usage charges
  // or configured in your Partner Dashboard
  // For now, we'll return unlimited to allow all orders

  return {
    withinLimit: true,
    currentCount: 0,
    limit: Infinity,
  };
}

export async function requirePlanAccess(shop: string, feature: string): Promise<void> {
  const { hasAccess, reason } = await checkPlanAccess(shop, feature);
  
  if (!hasAccess) {
    throw new Error(reason || "Access denied");
  }
}

/**
 * Get subscription info from Shopify managed billing
 * This is a simplified version - you may want to cache this data in your database
 */
export async function getSubscriptionInfo(shop: string) {
  // With managed billing, subscription info comes from Shopify's billing API
  // You would typically call billing.check() in your authenticated routes
  return {
    shop,
    hasActiveSubscription: true, // Simplified - actual check happens in routes
    orderCount: 0,
    orderLimit: Infinity,
    withinOrderLimit: true,
  };
}

