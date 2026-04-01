import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import prisma from "../db.server";

function stripShopifyGid(
  gid: string | null | undefined,
  resource: "Product" | "ProductVariant",
): string | null {
  if (!gid) return null;
  const prefix = `gid://shopify/${resource}/`;
  return gid.startsWith(prefix) ? gid.slice(prefix.length) : gid;
}

function toNumberPrice(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * API endpoint to fetch products for free shipping upsell
 * Returns products that match the remaining amount needed for free shipping
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const remaining = parseFloat(url.searchParams.get("remaining") || "0");

  if (!shop) {
    const response = json({ error: "Shop parameter is required" }, { status: 400 });
    return cors(request, response);
  }

  try {
    // Get free shipping bar configuration
    const cartDrawer = await prisma.cartDrawer.findUnique({
      where: { shop },
      include: {
        freeShippingBars: {
          where: { isActive: true },
          include: {
            upsellProducts: {
              orderBy: { position: 'asc' },
            },
          },
          take: 1,
        },
      },
    });

    if (!cartDrawer || !cartDrawer.freeShippingBars[0]) {
      const response = json({ products: [] });
      return cors(request, response);
    }

    const bar = cartDrawer.freeShippingBars[0];

    // Check if product upsell is enabled
    if (!bar.showProductUpsell) {
      const response = json({ products: [] });
      return cors(request, response);
    }

    // Get products based on eligibility source
    let products: any[] = [];

    const mapUpsellRow = (p: (typeof bar.upsellProducts)[number]) => {
      const price = toNumberPrice(p.price);
      const compareAt = p.compareAtPrice != null ? toNumberPrice(p.compareAtPrice) : null;
      const productId =
        stripShopifyGid(p.shopifyProductId, "Product") || String(p.shopifyProductId);
      const variantId =
        stripShopifyGid(p.shopifyVariantId ?? null, "ProductVariant") ||
        (p.shopifyVariantId ? String(p.shopifyVariantId) : "");

      return {
        id: productId,
        variantId,
        title: p.title,
        handle: p.handle,
        price,
        compareAtPrice: compareAt,
        imageUrl: p.imageUrl,
      };
    };

    const allUpsellProducts = bar.upsellProducts.map(mapUpsellRow);

    if (bar.eligibilitySource === "collection" || bar.eligibilitySource === "all_products") {
      // First priority: Products that meet or exceed the remaining amount
      products = allUpsellProducts.filter((p) => p.price >= remaining);

      // Fallback: If no products meet the threshold, show products below the threshold
      if (products.length === 0) {
        products = allUpsellProducts.filter((p) => p.price <= remaining);
      }
    }

    products = products.filter((p) => p.variantId && /^\d+$/.test(String(p.variantId)));

    // Sort by price descending (show highest priced products first)
    products.sort((a, b) => b.price - a.price);

    const response = json({ products: products.slice(0, 10) }); // Return up to 10 products for carousel
    return cors(request, response);
  } catch (error) {
    console.error("Error fetching free shipping products:", error);
    const response = json({ products: [] });
    return cors(request, response);
  }
};

export const OPTIONS = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma",
      "Access-Control-Max-Age": "86400",
    },
  });
};
