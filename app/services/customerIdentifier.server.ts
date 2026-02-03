import { createHash } from 'crypto';

/**
 * Helper function to get or generate a customer identifier
 * - If customerId is provided (logged-in user), use it
 * - Otherwise, generate a session-based identifier from request metadata
 * 
 * @param customerId - Optional Shopify customer ID (e.g., "gid://shopify/Customer/123456")
 * @param request - Request object to extract session data from
 * @param shop - Shop domain for session uniqueness
 * @returns Customer identifier string
 */
export function getOrGenerateCustomerId(
  customerId: string | null,
  request: Request,
  shop: string
): string {
  if (customerId) {
    // Use actual customer ID for logged-in users
    console.log(`[Customer ID] Using customer ID: ${customerId}`);
    return customerId;
  }

  // Generate session-based identifier for guest users
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const sessionId = createHash('md5').update(`${ip}-${userAgent}-${shop}`).digest('hex');

  const sessionIdentifier = `session:${sessionId}`;
  console.log(`[Customer ID] Generated session ID: ${sessionIdentifier.substring(0, 20)}...`);

  return sessionIdentifier;
}
