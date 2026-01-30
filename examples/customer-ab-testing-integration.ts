/**
 * Example: How to integrate customer-based A/B testing in your cart drawer
 * 
 * This shows how to pass customer information to the version selection logic
 */

import { getShopCartDrawerVersion } from '~/services/cartDrawerVersions.server';
import { getCustomerSegmentIds } from '~/services/shopifySegments.server';
import { getTemplateForVersion, copyTemplateToShop } from '~/services/cartDrawerTemplate.server';

/**
 * Example loader function for cart drawer API
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  // STEP 1: Get customer information from the request
  // This could come from:
  // - Query parameter: ?customerId=gid://shopify/Customer/123
  // - Cart data: cart.customer.id
  // - Session: session.customer_id
  const url = new URL(request.url);
  const customerId = url.searchParams.get('customerId');

  // STEP 2: Fetch customer segments (optional but recommended)
  let customerSegments: string[] = [];
  if (customerId) {
    try {
      customerSegments = await getCustomerSegmentIds(request, customerId);
    } catch (error) {
      console.error('Error fetching customer segments:', error);
      // Continue without segments - will fall back to percentage targeting
    }
  }

  // STEP 3: Get the version for this customer
  const version = await getShopCartDrawerVersion(
    shop,
    customerId || undefined,  // Use customer ID if available
    customerSegments.length > 0 ? customerSegments : undefined
  );

  console.log('[A/B Test] Customer:', customerId || 'guest', 'Version:', version);

  // STEP 4: Load or create cart drawer for this version
  let cartDrawer = await prisma.cartDrawer.findUnique({
    where: {
      shop_version: {
        shop,
        version,
      },
    },
    include: {
      // ... your includes
    },
  });

  // If cart drawer doesn't exist for this version, copy from template
  if (!cartDrawer) {
    cartDrawer = await copyTemplateToShop(shop, version);
  }

  return json({ cartDrawer, version, customerId });
}

/**
 * Example: Getting customer ID from Shopify cart (storefront)
 */
async function getCustomerIdFromCart() {
  // In your storefront code (theme extension or app block)
  const response = await fetch('/cart.js');
  const cart = await response.json();

  // Shopify cart object contains customer ID if logged in
  const customerId = cart.customer?.id;

  // Pass this to your cart drawer API
  const cartDrawerResponse = await fetch(
    `/apps/your-app/cart-drawer?customerId=${customerId}`
  );

  return cartDrawerResponse.json();
}

/**
 * Example: Getting customer ID from Shopify session (admin context)
 */
async function getCustomerIdFromSession(admin: any, shop: string) {
  // Query current customer from Shopify
  const response = await admin.graphql(`
        query {
            shop {
                name
            }
        }
    `);

  // Note: In storefront context, you'd use the Customer API
  // to get the currently logged-in customer
}

/**
 * Example: Tracking analytics with version information
 */
async function trackVersionAnalytics(
  shop: string,
  version: string,
  customerId: string | null,
  eventType: string
) {
  await prisma.analyticsEvent.create({
    data: {
      shop,
      version,  // This field already exists in your schema
      eventType,
      component: 'cart-drawer',
      sessionId: customerId || 'guest',
      createdAt: new Date(),
    },
  });
}

/**
 * IMPORTANT: For Shopify theme extensions
 * 
 * If you're loading the cart drawer from a theme extension/app block,
 * you'll need to:
 * 
 * 1. Access customer data via Liquid/App Bridge:
 */
// In your liquid template:
/*
<script>
  window.shopifyCustomer = {
    id: "{{ customer.id }}",
    email: "{{ customer.email }}"
  };
</script>
*/

// In your JavaScript:
/*
const customerId = window.shopifyCustomer?.id;
if (customerId) {
    const cartDrawerData = await fetch(
        `/apps/upsellity/api/cart-drawer?customerId=gid://shopify/Customer/${customerId}`
    );
}
*/

/**
 * Example: Fallback behavior for guest users
 */
export async function getVersionForUser(
  shop: string,
  customerId: string | null,
  request: Request
) {
  if (!customerId) {
    // Guest user - use shop-based deterministic selection
    // Or always use default version for guests
    console.log('[A/B Test] Guest user, using default version');
    return 'default';
  }

  // Logged-in user - full A/B testing
  const segments = await getCustomerSegmentIds(request, customerId);
  return await getShopCartDrawerVersion(shop, customerId, segments);
}

/**
 * Example: Testing segment targeting
 * 
 * To test if a customer is in the right segment:
 */
async function debugCustomerSegments(request: Request, customerId: string) {
  const segments = await getCustomerSegmentIds(request, customerId);
  console.log('Customer segments:', segments);

  // Get all versions and their segment targeting
  const versions = await prisma.cartDrawerVersion.findMany();

  for (const version of versions) {
    if (version.targetingMode === 'segment') {
      const isInSegment = segments.some(s => version.segmentIds.includes(s));
      console.log(
        `Version ${version.key}:`,
        isInSegment ? 'MATCH' : 'no match',
        '(targeting:', version.segmentIds, ')'
      );
    }
  }
}
