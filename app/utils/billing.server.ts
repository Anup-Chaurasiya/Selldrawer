/**
 * Check if the shop has an active billing subscription
 * If not, return the plan selection URL for client-side redirect
 * 
 * @param billing - The billing object from authenticate.admin
 * @returns The plan selection URL if no active payment, null otherwise
 */
export async function requireBilling(billing: any): Promise<string | null> {
  // DEVELOPMENT MODE: Disable billing requirement for testing
  // Comment out the line below when you're ready to enforce billing
  return null;
  
  /* Uncomment this block when you want to enforce billing:
  const { hasActivePayment } = await billing.check();
  
  if (!hasActivePayment) {
    return `https://partners.shopify.com`;
  }
  
  return null;
  */
}

/**
 * Get the Shopify managed plan selection URL
 * For now, this points to Partner Dashboard where you can configure billing
 * Once billing is set up, this should point to the actual pricing plans page
 */
export function getPlanSelectionUrl(): string {
  // Return Partner Dashboard URL for now
  // You'll need to set up billing plans in Partner Dashboard first
  return `https://partners.shopify.com/organizations`;
}

