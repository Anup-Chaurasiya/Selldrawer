import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

/**
 * API endpoint to fetch Shopify's product recommendations
 * URL: /api/shopify-recommendations?shop=example.myshopify.com&productId=123456&intent=related
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const productId = url.searchParams.get("productId");
  const intent = url.searchParams.get("intent") || "related";

  if (!shop || !productId) {
    return json(
      { error: "Shop and productId parameters are required" },
      { status: 400 }
    );
  }

  try {
    // Use Shopify's product recommendations API
    const shopifyUrl = `https://${shop}/recommendations/products.json?product_id=${productId}&intent=${intent}&limit=10`;
    
    const response = await fetch(shopifyUrl, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Format the recommendations
    const recommendations = data.products?.map((product: any) => ({
      id: product.id,
      title: product.title,
      handle: product.handle,
      price: product.variants?.[0]?.price ? parseFloat(product.variants[0].price) / 100 : 0,
      compareAtPrice: product.variants?.[0]?.compare_at_price 
        ? parseFloat(product.variants[0].compare_at_price) / 100 
        : null,
      imageUrl: product.featured_image,
      variantId: product.variants?.[0]?.id,
    })) || [];

    return json({
      success: true,
      recommendations,
      intent
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  } catch (error) {
    console.error("Error fetching Shopify recommendations:", error);
    return json(
      {
        success: false,
        error: "Failed to fetch recommendations from Shopify",
        recommendations: []
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        }
      }
    );
  }
};

export const OPTIONS = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

