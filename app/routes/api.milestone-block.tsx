import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import prisma from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  // Handle POST for data fetching
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    if (!shop) {
      const response = json({ error: "Shop parameter is required" }, { status: 400 });
      return cors(request, response);
    }

    const body = await request.json();
    // No specific cartItems usage in the business logic yet, but prepared for consistency
    // The current loader implementation mostly just returns config

    return await getMilestoneBlockResponse(request, shop);
  } catch (error) {
    console.error("Error in milestone block action:", error);
    const response = json({ error: "Internal server error" }, { status: 500 });
    return cors(request, response);
  }
}

/**
 * Public API endpoint for milestone block data
 * This is called from the theme extension to get configuration
 * URL: /api/milestone-block?shop=example.myshopify.com
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Handle OPTIONS preflight requests immediately
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Added POST
        "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    const response = json({ error: "Shop parameter is required" }, { status: 400 });
    return cors(request, response);
  }

  return await getMilestoneBlockResponse(request, shop);
};

// Handle CORS preflight requests (backup - also handled in loader)
export const OPTIONS = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Added POST
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

async function getMilestoneBlockResponse(request: Request, shop: string) {
  try {
    // Get milestone block configuration
    const milestoneBlock = await prisma.milestoneBlock.findUnique({
      where: { shop },
      include: {
        milestones: {
          where: { isActive: true },
          include: {
            targets: true,
            giftProducts: {
              orderBy: { position: 'asc' },
            },
          },
          orderBy: { priority: 'asc' },
        },
      },
    });

    if (!milestoneBlock) {
      const response = json({
        enabled: false,
        milestones: [],
        progressBarColor: "#3b82f6",
        allUnlockedMessage: "🎉 Congratulations! All rewards unlocked!",
      });

      return cors(request, response);
    }

    // Transform milestones data for frontend consumption
    const transformedMilestones = milestoneBlock.milestones.map((milestone: any) => ({
      id: milestone.id,
      title: milestone.title,
      description: milestone.description,
      targetAmount: parseFloat(milestone.targetAmount.toString()),
      currency: milestone.currency,
      rewardType: milestone.rewardType,
      rewardValue: milestone.rewardValue ? parseFloat(milestone.rewardValue.toString()) : null,
      discountCode: milestone.discountCode,
      shopifyDiscountId: milestone.shopifyDiscountId,
      targetType: milestone.targetType,
      priority: milestone.priority,
      icon: milestone.icon,
      unlockedMessage: milestone.unlockedMessage,
      inProgressMessage: milestone.inProgressMessage,
      lockedMessage: milestone.lockedMessage,
      iconColor: milestone.iconColor,
      titleColor: milestone.titleColor,
      unlockButtonColor: milestone.unlockButtonColor,
      showProgressBar: milestone.showProgressBar,
      // Eligibility fields for upsell products
      eligibleCollectionHandle: milestone.eligibleCollectionHandle,
      eligibleTag: milestone.eligibleTag,
      eligibleProductIds: milestone.eligibleProductIds,
      upsellHeaderText: milestone.upsellHeaderText,
      viewAllLinkText: milestone.viewAllLinkText,
      unlockButtonText: milestone.unlockButtonText,
      // Show upsell based on eligibilitySource field
      // "none" = no upsell, all others show upsell
      canShowUpsell: milestone.eligibilitySource !== 'none',
      targets: milestone.targets || [],
      giftProducts: (milestone.giftProducts || []).map((product: any) => ({
        id: product.id,
        shopifyProductId: product.shopifyProductId,
        shopifyVariantId: product.shopifyVariantId,
        title: product.title,
        price: parseFloat(product.price.toString()),
        compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice.toString()) : null,
        imageUrl: product.imageUrl,
        handle: product.handle,
        position: product.position,
      })),
    }));

    const response = json({
      enabled: milestoneBlock.isActive,
      milestones: transformedMilestones,
      progressBarColor: milestoneBlock.milestonesProgressBarColor,
      allUnlockedMessage: milestoneBlock.milestonesAllUnlockedMessage,
    }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
      }
    });

    return cors(request, response);
  } catch (error) {
    console.error("Error fetching milestone block config:", error);
    const response = json({ error: "Internal server error" }, { status: 500 });
    return cors(request, response);
  }
}
