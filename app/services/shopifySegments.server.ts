import { authenticate } from '../shopify.server';
import { sessionStorage } from '../shopify.server';

export interface ShopifyCustomerSegment {
  id: string;
  name: string;
  query: string;
}

/**
 * Fetch customer segments from Shopify for a shop
 */
export async function getCustomerSegments(request: Request): Promise<ShopifyCustomerSegment[]> {
  try {
    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(`
            query {
                segments(first: 50, query: "resource_type:CUSTOMER") {
                    edges {
                        node {
                            id
                            name
                            query
                        }
                    }
                }
            }
        `);

    const data = await response.json();

    if (!data?.data?.segments?.edges) {
      return [];
    }

    return data.data.segments.edges.map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.name,
      query: edge.node.query,
    }));
  } catch (error) {
    console.error('Error fetching customer segments:', error);
    return [];
  }
}

/**
 * Check which segments a customer belongs to using shop's offline session
 * This is used for public API endpoints that don't have authenticated requests
 */
export async function checkCustomerSegmentMembershipByShop(
  shop: string,
  customerId: string,
  segmentIds: string[]
): Promise<string[]> {
  try {
    if (!segmentIds || segmentIds.length === 0) {
      return [];
    }

    // Get offline session for shop
    const sessions = await sessionStorage.findSessionsByShop(shop);
    const offlineSession = sessions.find(s => !s.isOnline);

    if (!offlineSession || !offlineSession.accessToken) {
      console.error('[Segments] No offline session with access token found for shop:', shop);
      return [];
    }

    // Make direct fetch request to Shopify GraphQL API
    const graphqlUrl = `https://${shop}/admin/api/2025-01/graphql.json`;

    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': offlineSession.accessToken,
      },
      body: JSON.stringify({
        query: `
          query CheckCustomerSegments($customerId: ID!, $segmentIds: [ID!]!) {
            customerSegmentMembership(customerId: $customerId, segmentIds: $segmentIds) {
              memberships {
                isMember
              }
            }
          }
        `,
        variables: {
          customerId: customerId,
          segmentIds: segmentIds,
        },
      }),
    });

    const result = await response.json();

    if (!result?.data?.customerSegmentMembership?.memberships) {
      console.error('[Segments] Invalid response:', result);
      return [];
    }

    // Filter to get only the segment IDs where isMember is true
    const memberSegments: string[] = [];
    result.data.customerSegmentMembership.memberships.forEach((membership: any, index: number) => {
      if (membership.isMember) {
        memberSegments.push(segmentIds[index]);
      }
    });

    return memberSegments;
  } catch (error) {
    console.error('[Segments] Error checking customer segment membership by shop:', error);
    return [];
  }
}
