/**
 * Storefront API Utilities
 * Helper functions for querying Shopify Storefront API v2024-07
 */

export interface StorefrontProduct {
  id: string;
  title: string;
  handle: string;
  featuredImage: {
    url: string;
    altText?: string;
  } | null;
  availableForSale: boolean;
  variants: {
    edges: Array<{
      node: {
        id: string;
        price: {
          amount: string;
          currencyCode: string;
        };
        availableForSale: boolean;
      };
    }>;
  };
}

export interface ProductRecommendation {
  id: string;
  title: string;
  handle: string;
  featuredImage: {
    url: string;
    altText?: string;
  } | null;
  price: number;
  variantId: string;
  availableForSale: boolean;
  priceDifference: number;
}

/**
 * Fetch products from a collection via Storefront API
 */
export async function fetchProductsByCollection(
  shop: string,
  storefrontAccessToken: string,
  collectionHandle: string,
  minPrice?: number,
  limit: number = 12
): Promise<StorefrontProduct[]> {
  if (!storefrontAccessToken) {
    throw new Error('Storefront access token not found for this shop');
  }

  const query = `
    query getCollectionProducts($handle: String!, $first: Int!) {
      collection(handle: $handle) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              featuredImage {
                url
                altText
              }
              availableForSale
              variants(first: 1) {
                edges {
                  node {
                    id
                    price {
                      amount
                      currencyCode
                    }
                    availableForSale
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(`https://${shop}/api/2024-07/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
    },
    body: JSON.stringify({
      query,
      variables: { handle: collectionHandle, first: 250 }, // Fetch more to filter
    }),
  });

  if (!response.ok) {
    throw new Error(`Storefront API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  const products = data.data?.collection?.products?.edges?.map((edge: any) => edge.node) || [];

  // Filter by minPrice if specified
  if (minPrice !== undefined) {
    return products.filter((product: StorefrontProduct) => {
      const variant = product.variants.edges[0]?.node;
      if (!variant) return false;
      const price = parseFloat(variant.price.amount);
      return price >= minPrice;
    });
  }

  return products;
}

/**
 * Fetch specific products by handles via Storefront API
 * Used when product handles are stored (e.g., "the-minimal-snowboard")
 */
export async function fetchProductsByHandles(
  shop: string,
  storefrontAccessToken: string,
  productHandles: string[],
  minPrice?: number,
  limit: number = 12
): Promise<StorefrontProduct[]> {
  if (!storefrontAccessToken) {
    throw new Error('Storefront access token not found for this shop');
  }

  // Build individual product queries using handles
  const productQueries = productHandles.slice(0, limit).map((handle, index) => {
    return `
      product${index}: product(handle: "${handle}") {
        id
        title
        handle
        featuredImage {
          url
          altText
        }
        availableForSale
        variants(first: 1) {
          edges {
            node {
              id
              price {
                amount
                currencyCode
              }
              availableForSale
            }
          }
        }
      }
    `;
  }).join('\n');

  const query = `
    query getProductsByHandles {
      ${productQueries}
    }
  `;

  const response = await fetch(`https://${shop}/api/2024-07/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Storefront API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  const products = Object.values(data.data || {}).filter(Boolean) as StorefrontProduct[];

  // Filter by minPrice if specified
  if (minPrice !== undefined) {
    return products.filter((product: StorefrontProduct) => {
      const variant = product.variants.edges[0]?.node;
      if (!variant) return false;
      const price = parseFloat(variant.price.amount);
      return price >= minPrice;
    });
  }

  return products;
}

/**
 * Fetch specific products by IDs via Storefront API
 */
export async function fetchProductsByIds(
  shop: string,
  storefrontAccessToken: string,
  productIds: string[],
  minPrice?: number,
  limit: number = 12
): Promise<StorefrontProduct[]> {
  if (!storefrontAccessToken) {
    throw new Error('Storefront access token not found for this shop');
  }

  // Build individual product queries
  const productQueries = productIds.slice(0, limit).map((id, index) => {
    // Ensure ID is in GID format
    const gid = id.startsWith('gid://') ? id : `gid://shopify/Product/${id}`;
    return `
      product${index}: product(id: "${gid}") {
        id
        title
        handle
        featuredImage {
          url
          altText
        }
        availableForSale
        variants(first: 1) {
          edges {
            node {
              id
              price {
                amount
                currencyCode
              }
              availableForSale
            }
          }
        }
      }
    `;
  }).join('\n');

  const query = `
    query getProducts {
      ${productQueries}
    }
  `;

  const response = await fetch(`https://${shop}/api/2024-07/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Storefront API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  const products = Object.values(data.data || {}).filter(Boolean) as StorefrontProduct[];

  // Filter by minPrice if specified
  if (minPrice !== undefined) {
    return products.filter((product: StorefrontProduct) => {
      const variant = product.variants.edges[0]?.node;
      if (!variant) return false;
      const price = parseFloat(variant.price.amount);
      return price >= minPrice;
    });
  }

  return products;
}

/**
 * Fetch products by tag via Storefront API
 */
export async function fetchProductsByTag(
  shop: string,
  storefrontAccessToken: string,
  tag: string,
  minPrice?: number,
  limit: number = 12
): Promise<StorefrontProduct[]> {
  if (!storefrontAccessToken) {
    throw new Error('Storefront access token not found for this shop');
  }

  const query = `
    query getProductsByTag($query: String!, $first: Int!) {
      products(first: $first, query: $query) {
        edges {
          node {
            id
            title
            handle
            featuredImage {
              url
              altText
            }
            availableForSale
            variants(first: 1) {
              edges {
                node {
                  id
                  price {
                    amount
                    currencyCode
                  }
                  availableForSale
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(`https://${shop}/api/2024-07/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
    },
    body: JSON.stringify({
      query,
      variables: {
        query: `tag:${tag}`,
        first: 250 // Fetch more to filter
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Storefront API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  const products = data.data?.products?.edges?.map((edge: any) => edge.node) || [];

  // Filter by minPrice if specified
  if (minPrice !== undefined) {
    return products.filter((product: StorefrontProduct) => {
      const variant = product.variants.edges[0]?.node;
      if (!variant) return false;
      const price = parseFloat(variant.price.amount);
      return price >= minPrice;
    });
  }

  return products;
}

/**
 * Rank products by price difference to target price (ascending)
 */
export function rankProductsByPriceDifference(
  products: StorefrontProduct[],
  targetPrice: number
): ProductRecommendation[] {
  const recommendations: ProductRecommendation[] = products
    .map((product) => {
      const variant = product.variants.edges[0]?.node;
      if (!variant || !variant.availableForSale) return null;

      const price = parseFloat(variant.price.amount);
      const priceDifference = Math.abs(price - targetPrice);

      return {
        id: product.id,
        title: product.title,
        handle: product.handle,
        featuredImage: product.featuredImage,
        price,
        variantId: variant.id,
        availableForSale: product.availableForSale && variant.availableForSale,
        priceDifference,
      };
    })
    .filter((p): p is ProductRecommendation => p !== null && p.priceDifference !== undefined);

  // Sort by price difference (ascending) - closest to target first
  recommendations.sort((a, b) => a.priceDifference! - b.priceDifference!);

  return recommendations;
}

/**
 * Fetch all products from the store via Storefront API
 * Used for "All Products" eligibility option
 */
export async function fetchAllProducts(
  shop: string,
  storefrontAccessToken: string,
  minPrice?: number,
  limit: number = 12
): Promise<StorefrontProduct[]> {
  if (!storefrontAccessToken) {
    throw new Error('Storefront access token not found for this shop');
  }

  const query = `
    query getAllProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            handle
            featuredImage {
              url
              altText
            }
            availableForSale
            variants(first: 1) {
              edges {
                node {
                  id
                  price {
                    amount
                    currencyCode
                  }
                  availableForSale
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(`https://${shop}/api/2024-07/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
    },
    body: JSON.stringify({
      query,
      variables: { first: 250 }, // Fetch up to 250 products
    }),
  });

  if (!response.ok) {
    throw new Error(`Storefront API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  const products = data.data?.products?.edges?.map((edge: any) => edge.node) || [];

  // Filter by minPrice if specified
  if (minPrice !== undefined) {
    return products.filter((product: StorefrontProduct) => {
      const variant = product.variants.edges[0]?.node;
      if (!variant) return false;
      const price = parseFloat(variant.price.amount);
      return price >= minPrice;
    });
  }

  return products;
}

/**
 * Filter products by availability and price
 */
export function filterProducts(
  products: StorefrontProduct[],
  minPrice?: number
): StorefrontProduct[] {
  return products.filter((product) => {
    // Must be available for sale
    if (!product.availableForSale) return false;

    // Must have at least one variant
    const variant = product.variants.edges[0]?.node;
    if (!variant || !variant.availableForSale) return false;

    // Check minimum price if specified
    if (minPrice !== undefined) {
      const price = parseFloat(variant.price.amount);
      if (price < minPrice) return false;
    }

    return true;
  });
}
