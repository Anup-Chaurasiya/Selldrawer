import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const cartTotal = parseFloat(url.searchParams.get("cartTotal") || "0");
  const cartItemsJson = url.searchParams.get("cartItems");

  if (!shop) {
    return json({ error: "Shop parameter is required" }, { status: 400 });
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
        milestones: {
          where: { isActive: true },
          include: {
            targets: true,
          },
          orderBy: { priority: 'asc' },
        },
      },
    });

    if (!cartDrawer || !cartDrawer.milestonesEnabled) {
      return json({ milestones: [] });
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
        icon: milestone.icon,
        status,
        progress,
        remaining,
        message,
        showProgressBar: milestone.showProgressBar,
        backgroundColor: milestone.backgroundColor,
        textColor: milestone.textColor,
        progressBarColor: milestone.progressBarColor,
        unlockedColor: milestone.unlockedColor,
        lockedColor: milestone.lockedColor,
      };
    });

    return json({
      milestones: milestonesWithStatus,
      cartTotal,
    });
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return json({ error: "Failed to fetch milestones" }, { status: 500 });
  }
}

