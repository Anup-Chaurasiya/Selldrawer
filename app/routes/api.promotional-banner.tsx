import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return json({ error: "Shop parameter is required" }, { status: 400 });
  }

  try {
    // Normalize shop domain
    const normalizedShop = shop.endsWith('.myshopify.com') ? shop : `${shop}.myshopify.com`;

    // Get promotional banner block configuration (standalone block)
    const promotionalBannerBlock = await prisma.promotionalBannerBlock.findUnique({
      where: { shop: normalizedShop },
      include: {
        images: { orderBy: { order: 'asc' } },
        carouselSettings: true,
      },
    });

    // If block exists, return block data
    if (promotionalBannerBlock) {
      const response = {
        enabled: promotionalBannerBlock.isActive,
        slides: promotionalBannerBlock.images || [],
        carouselSettings: promotionalBannerBlock.carouselSettings || {
          autoRotate: true,
          rotationSpeed: 5000,
          showDots: true,
          showArrows: true,
        }
      };

      return new Response(JSON.stringify(response), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Fallback: Get cart drawer configuration with promotional banner
    const cartDrawer = await prisma.cartDrawer.findUnique({
      where: { shop: normalizedShop },
      include: {
        promotionalBanners: {
          where: { isActive: true },
          include: {
            images: { orderBy: { order: 'asc' } },
            carouselSettings: true,
          }
        },
      },
    });

    if (!cartDrawer) {
      return new Response(JSON.stringify({ 
        error: "Configuration not found",
        enabled: false,
        slides: [],
        carouselSettings: {}
      }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    const promotionalBanner = cartDrawer.promotionalBanners[0] || null;

    // Format response
    const response = {
      enabled: cartDrawer.promotionalBannerEnabled,
      slides: promotionalBanner?.images || [],
      carouselSettings: promotionalBanner?.carouselSettings || {
        autoRotate: true,
        rotationSpeed: 5000,
        showDots: true,
        showArrows: true,
      }
    };

    // Return with CORS headers
    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });

  } catch (error) {
    console.error("Error fetching promotional banner:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      enabled: false,
      slides: [],
      carouselSettings: {}
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }
}

// Handle CORS preflight requests
export async function options() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

