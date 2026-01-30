import { authenticate } from '../shopify.server';

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
 * Check if a customer belongs to specific segments
 */
export async function getCustomerSegmentIds(
  request: Request,
  customerId: string
): Promise<string[]> {
  try {
    const { admin } = await authenticate.admin(request);

    // Query to get the segments a customer belongs to
    const response = await admin.graphql(`
            query getCustomerSegments($customerId: ID!) {
                customer(id: $customerId) {
                    id
                    segmentMemberships(first: 50) {
                        edges {
                            node {
                                segment {
                                    id
                                }
                            }
                        }
                    }
                }
            }
        `, {
      variables: {
        customerId: customerId,
      },
    });

    const data = await response.json();

    if (!data?.data?.customer?.segmentMemberships?.edges) {
      return [];
    }

    return data.data.customer.segmentMemberships.edges.map(
      (edge: any) => edge.node.segment.id
    );
  } catch (error) {
    console.error('Error fetching customer segment memberships:', error);
    return [];
  }
}
