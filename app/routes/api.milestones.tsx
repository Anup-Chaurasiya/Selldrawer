import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";
import { formatMoney } from "../utils/money.server";

/**
 * Public API endpoint for milestone data
 * Called from the theme extension to get milestone config + progress for the current cart.
 * URL: POST /api/milestones?shop=example.myshopify.com
 * Body: { cartTotal: number (in store currency, e.g. 749.95), cartItems: [...] }
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

// ─── CORS pre-flight + fallback GET ──────────────────────────────────────────
export async function loader({ request }: LoaderFunctionArgs) {
  // Handle OPTIONS pre-flight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // GET: return empty list (the extension uses POST)
  return jsonResponse({ milestones: [] });
}

// ─── OPTIONS export (Remix convention) ───────────────────────────────────────
export async function options() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// ─── Main handler (POST) ──────────────────────────────────────────────────────
export async function action({ request }: ActionFunctionArgs) {
  // OPTIONS via action path (belt-and-suspenders)
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return jsonResponse({ error: "Shop parameter is required" }, 400);
  }

  // Parse request body
  let cartTotal = 0;
  let cartItems: any[] = [];
  try {
    const body = await request.json();
    cartTotal = typeof body.cartTotal === "number" ? body.cartTotal : parseFloat(body.cartTotal ?? "0") || 0;
    cartItems = Array.isArray(body.cartItems) ? body.cartItems : [];
  } catch {
    // Empty / malformed body → proceed with cartTotal = 0
  }

  try {
    // 1. Get cart drawer global milestone settings
    const cartDrawer = await prisma.cartDrawer.findUnique({
      where: { shop },
      select: {
        milestonesEnabled: true,
        milestonesProgressBarColor: true,
        milestonesBackgroundColor: true,
        milestonesAllUnlockedMessage: true,
      },
    });

    if (!cartDrawer?.milestonesEnabled) {
      return jsonResponse({ milestones: [], milestonesEnabled: false });
    }

    // 2. Fetch active milestones (max 3, ordered by priority)
    const dbMilestones = await prisma.cartMilestone.findMany({
      where: { shop, isActive: true },
      orderBy: { priority: "asc" },
      take: 3,
      include: {
        giftProducts: { orderBy: { position: "asc" } },
      },
    });

    if (dbMilestones.length === 0) {
      return jsonResponse({
        milestones: [],
        progressBarColor: cartDrawer.milestonesProgressBarColor,
        allUnlockedMessage: cartDrawer.milestonesAllUnlockedMessage,
      });
    }

    const session = await prisma.session.findFirst({
      where: { shop, isOnline: false },
      select: { accessToken: true },
    });
    const adminToken = session?.accessToken ?? null;

    // 4. Fetch shop currency
    let currencyCode = 'USD';
    if (adminToken) {
      try {
        const shopResp = await fetch(`https://${shop}/admin/api/2024-10/shop.json`, {
          headers: { 'X-Shopify-Access-Token': adminToken }
        });
        const shopData = await shopResp.json() as any;
        currencyCode = shopData?.shop?.currency ?? 'USD';
      } catch (err) {
        console.error("Error fetching shop currency:", err);
      }
    }

    // 5. Compute per-milestone status, progress, messages, and fetch products
    const milestones = await Promise.all(dbMilestones.map(async (m) => {
      const target = parseFloat(m.targetAmount.toString());
      const isUnlocked = Math.round(cartTotal) >= Math.round(target);
      const remaining = Math.max(0, target - cartTotal);
      const progress = target > 0 ? Math.min((cartTotal / target) * 100, 100) : 100;

      let status: "unlocked" | "in_progress" | "locked";
      if (isUnlocked) {
        status = "unlocked";
      } else if (cartTotal > 0) {
        status = "in_progress";
      } else {
        status = "locked";
      }

      const rewardLabel = getRewardLabel(m.rewardType, m.rewardValue, currencyCode);

      let message: string;
      if (isUnlocked) {
        message = m.unlockedMessage
          ? m.unlockedMessage.replace("{reward}", rewardLabel)
          : `🎉 You've unlocked ${rewardLabel}!`;
      } else {
        const remainingFormatted = formatAmount(remaining, currencyCode);
        message = m.inProgressMessage
          ? m.inProgressMessage
              .replace("{remaining}", remainingFormatted)
              .replace("{reward}", rewardLabel)
          : `Add ${remainingFormatted} more to unlock ${rewardLabel}!`;
      }

      // Fetch upsell products using Admin REST API — no Storefront token needed
      let upsellProducts: any[] = [];
      const eligibilitySource = m.eligibilitySource;

      // Only fetch products if milestone is NOT yet unlocked and we have admin token
      if (adminToken && !isUnlocked && eligibilitySource && eligibilitySource !== 'none') {
        try {
          let apiUrl = `https://${shop}/admin/api/2024-10/products.json?limit=12&status=active`;

          if (eligibilitySource === 'collection' && m.eligibleCollectionHandle) {
            // First get collection ID from handle
            const colResp = await fetch(
              `https://${shop}/admin/api/2024-10/custom_collections.json?handle=${m.eligibleCollectionHandle}&fields=id`,
              { headers: { 'X-Shopify-Access-Token': adminToken } }
            );
            const colData = await colResp.json() as any;
            const collectionId = colData?.custom_collections?.[0]?.id;
            if (collectionId) {
              apiUrl = `https://${shop}/admin/api/2024-10/products.json?collection_id=${collectionId}&limit=12&status=active`;
            }
          } else if (eligibilitySource === 'products' && m.eligibleProductIds && m.eligibleProductIds.length > 0) {
            // Fetch specific products by IDs (extract numeric part from GID if needed)
            const ids = m.eligibleProductIds.map((id: string) =>
              id.startsWith('gid://') ? id.split('/').pop() : id
            ).join(',');
            apiUrl = `https://${shop}/admin/api/2024-10/products.json?ids=${ids}&limit=12&status=active`;
          }
          // else: all_products → use default apiUrl (all active products, limit 12)

          const productsResp = await fetch(apiUrl, {
            headers: { 'X-Shopify-Access-Token': adminToken }
          });
          const productsData = await productsResp.json() as any;
          const rawProducts = productsData?.products ?? [];

          upsellProducts = rawProducts.map((p: any) => {
            const variant = p.variants?.[0];
            return {
              id: `gid://shopify/Product/${p.id}`,
              title: p.title,
              price: variant ? Math.round(parseFloat(variant.price) * 100) : 0,
              imageUrl: p.image?.src ?? p.images?.[0]?.src,
              handle: p.handle,
              variantId: variant?.id?.toString(),
            };
          }).filter((p: any) => p.price > 0);
        } catch (err) {
          console.error(`Milestones: Error fetching products for milestone ${m.id}:`, err);
        }
      }

      // Fallback to legacy giftProducts if dynamic fetch yields no results
      if (upsellProducts.length === 0 && m.giftProducts && m.giftProducts.length > 0) {
        upsellProducts = m.giftProducts.map((gp) => ({
          id: gp.shopifyProductId,
          title: gp.title,
          price: Math.round(parseFloat(gp.price.toString()) * 100),
          imageUrl: gp.imageUrl ?? undefined,
          handle: gp.handle,
        }));
      }

      return {
        id: m.id,
        title: m.title,
        description: m.description ?? undefined,
        targetAmount: target,
        rewardType: m.rewardType,
        rewardValue: m.rewardValue ? parseFloat(m.rewardValue.toString()) : null,
        discountCode: m.discountCode ?? null,
        icon: m.icon ?? null,
        status,
        progress,
        remaining,
        message,
        showProgressBar: m.showProgressBar,
        iconColor: m.iconColor,
        titleColor: m.titleColor,
        unlockButtonColor: m.unlockButtonColor,
        upsellProducts,
      };
    }));

    return jsonResponse({
      milestones,
      progressBarColor: cartDrawer.milestonesProgressBarColor,
      backgroundColor: cartDrawer.milestonesBackgroundColor,
      allUnlockedMessage: cartDrawer.milestonesAllUnlockedMessage,
    });
  } catch (error) {
    console.error("Selldrawer /api/milestones error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatAmount(amount: number, currencyCode: string = 'USD'): string {
  return formatMoney(Math.round(amount * 100), currencyCode);
}

function getRewardLabel(rewardType: string, rewardValue: any, currencyCode: string = 'USD'): string {
  const val = rewardValue ? parseFloat(rewardValue.toString()) : null;
  switch (rewardType) {
    case "free_shipping":
      return "Free Shipping";
    case "discount_percentage":
      return val ? `${val}% Off` : "a discount";
    case "discount_fixed":
      return val ? `${formatAmount(val, currencyCode)} Off` : "a discount";
    case "gift_wrapping":
      return "a free gift";
    default:
      return "a reward";
  }
}
