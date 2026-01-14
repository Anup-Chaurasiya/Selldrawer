import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import prisma from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const cartTotal = parseFloat(url.searchParams.get("cartTotal") || "0");
  const cartItemsJson = url.searchParams.get("cartItems");

  if (!shop) {
    const response = json({ error: "Shop parameter is required" }, { status: 400 });
    return cors(request, response);
  }

  try {
    // Parse cart items if provided
    let cartItems: any[] = [];
    if (cartItemsJson) {
      try {
        cartItems = JSON.parse(cartItemsJson);
      } catch (e) {
        console.error("Failed to parse cart items:", e);
      }
    }

    // Get cart drawer configuration
    const cartDrawer = await prisma.cartDrawer.findUnique({
      where: { shop },
      select: {
        milestonesEnabled: true,
        milestonesProgressBarColor: true,
        milestonesAllUnlockedMessage: true,
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

    if (!cartDrawer || !cartDrawer.milestonesEnabled) {
      const response = json({ milestones: [] });
      return cors(request, response);
    }

    // Filter milestones based on targeting
    const applicableMilestones = cartDrawer.milestones.filter((milestone) => {
      // Store-wide milestones always apply
      if (milestone.targetType === "store_wide") {
        return true;
      }

      // If no cart items, only show store-wide
      if (cartItems.length === 0) {
        return false;
      }

      // Check if cart items match the targeting
      if (milestone.targetType === "products") {
        const targetProductIds = milestone.targets.map((t) => t.shopifyId);
        return cartItems.some((item: any) => {
          if (!item.product_id) return false;
          const productId = item.product_id.toString();
          return (
            targetProductIds.includes(productId) ||
            targetProductIds.includes(`gid://shopify/Product/${productId}`)
          );
        });
      }

      if (milestone.targetType === "collections") {
        // For collections, we'd need additional product data
        // For now, we'll return true and let the frontend handle it
        return true;
      }

      return false;
    });

    // Calculate milestone status
    const milestonesWithStatus = applicableMilestones.map((milestone) => {
      const targetAmount = parseFloat(milestone.targetAmount.toString());
      const progress = Math.min((cartTotal / targetAmount) * 100, 100);
      const remaining = Math.max(targetAmount - cartTotal, 0);

      let status: "unlocked" | "in_progress" | "locked";
      if (cartTotal >= targetAmount) {
        status = "unlocked";
      } else if (cartTotal > 0) {
        status = "in_progress";
      } else {
        status = "locked";
      }

      // Format messages with placeholders
      const rewardText = milestone.title;
      const remainingFormatted = `₹${remaining.toFixed(2)}`;
      const targetFormatted = `₹${targetAmount.toFixed(2)}`;

      const message =
        status === "unlocked"
          ? milestone.unlockedMessage?.replace("{reward}", rewardText) || `🎉 You've unlocked ${rewardText}!`
          : status === "in_progress"
            ? milestone.inProgressMessage
              ?.replace("{remaining}", remainingFormatted)
              .replace("{reward}", rewardText) || `Only ${remainingFormatted} away from ${rewardText}!`
            : milestone.lockedMessage
              ?.replace("{remaining}", remainingFormatted)
              .replace("{reward}", rewardText) || `Add ${remainingFormatted} to unlock ${rewardText}`;

      return {
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        targetAmount: targetAmount,
        rewardType: milestone.rewardType,
        rewardValue: milestone.rewardValue ? parseFloat(milestone.rewardValue.toString()) : null,
        discountCode: milestone.discountCode,
        icon: milestone.icon,
        status,
        progress,
        remaining,
        message,
        showProgressBar: milestone.showProgressBar,
        iconColor: milestone.iconColor,
        titleColor: milestone.titleColor,
        unlockButtonColor: milestone.unlockButtonColor,
        giftProducts: (milestone as any).giftProducts || [],
        // Product eligibility for upsell
        eligibleCollectionHandle: (milestone as any).eligibleCollectionHandle || null,
        eligibleTag: (milestone as any).eligibleTag || null,
        eligibleProductIds: (milestone as any).eligibleProductIds || [],
        eligibilitySource: (milestone as any).eligibilitySource || 'none',
        canShowUpsell: (milestone as any).eligibilitySource !== 'none' && (status === "locked" || status === "in_progress"),
        // Upsell text customization
        upsellHeaderText: (milestone as any).upsellHeaderText || "Unlock Your Reward",
        viewAllLinkText: (milestone as any).viewAllLinkText || "View All",
        unlockButtonText: (milestone as any).unlockButtonText || "Unlock Reward",
      };
    });

    const response = json({
      milestones: milestonesWithStatus,
      cartTotal,
      progressBarColor: cartDrawer.milestonesProgressBarColor || "#3b82f6",
      allUnlockedMessage: cartDrawer.milestonesAllUnlockedMessage || "🎉 Congratulations! All rewards unlocked!",
    });
    return cors(request, response);
  } catch (error) {
    console.error("Error fetching milestones:", error);
    const response = json({ error: "Failed to fetch milestones" }, { status: 500 });
    return cors(request, response);
  }
}

