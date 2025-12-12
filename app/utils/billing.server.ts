/**
 * Check if the shop has an active billing subscription
 * If not, return the plan selection URL for client-side redirect
 * 
 * @param billing - The billing object from authenticate.admin
 * @returns The plan selection URL if no active payment, null otherwise
 */
export async function requireBilling(billing: any): Promise<string | null> {
  const { hasActivePayment } = await billing.check();
  
  if (!hasActivePayment) {
    const isDev = process.env.NODE_ENV === "development";
    const appHandle = isDev ? "upsellity-ai-dev" : "upsellity-ai";
    return `https://admin.shopify.com/charges/${appHandle}/pricing_plans`;
  }
  
  return null;
}

/**
 * Get the Shopify managed plan selection URL
 */
export function getPlanSelectionUrl(): string {
  const isDev = process.env.NODE_ENV === "development";
  const appHandle = isDev ? "upsellity-ai-dev" : "upsellity-ai";
  return `https://admin.shopify.com/charges/${appHandle}/pricing_plans`;
}

