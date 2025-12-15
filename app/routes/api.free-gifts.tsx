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
        freeGiftsEnabled: true,
        milestonesEnabled: true,
        freeGifts: {
          where: { isActive: true },
          include: {
            giftProducts: {
              orderBy: { position: 'asc' },
            },
            targets: true,
          },
          orderBy: { priority: 'asc' },
        },
        milestones: {
          where: { isActive: true },
          orderBy: { priority: 'asc' },
        },
      },
    });

    if (!cartDrawer || !cartDrawer.freeGiftsEnabled) {
      const response = json({ freeGifts: [] });
      return cors(request, response);
    }

    // Check if milestones with gift rewards are active and unlocked
    // Priority: Higher threshold wins (milestone vs free gift)
    if (cartDrawer.milestonesEnabled && cartDrawer.milestones && cartDrawer.milestones.length > 0) {
      // Find the highest unlocked milestone with gift reward
      const unlockedMilestonesWithGift = cartDrawer.milestones
        .filter((milestone: any) => {
          const targetAmount = parseFloat(milestone.targetAmount.toString());
          const isUnlocked = cartTotal >= targetAmount;
          const hasGiftReward = milestone.rewardType === 'gift_wrapping';
          return isUnlocked && hasGiftReward;
        })
        .sort((a: any, b: any) => parseFloat(b.targetAmount.toString()) - parseFloat(a.targetAmount.toString()));
      
      const highestMilestoneWithGift = unlockedMilestonesWithGift[0];
      
      if (highestMilestoneWithGift) {
        const milestoneThreshold = parseFloat(highestMilestoneWithGift.targetAmount.toString());
        
        // Check if there's a free gift with a higher threshold
        const applicableFreeGiftsTemp = cartDrawer.freeGifts.filter((freeGift: any) => {
          const triggerValue = parseFloat(freeGift.triggerValue.toString());
          return freeGift.isActive && cartTotal >= triggerValue;
        });
        
        if (applicableFreeGiftsTemp.length > 0) {
          const highestFreeGiftThreshold = Math.max(
            ...applicableFreeGiftsTemp.map((fg: any) => parseFloat(fg.triggerValue.toString()))
          );
          
          // If free gift has higher threshold, let it take priority
          if (highestFreeGiftThreshold > milestoneThreshold) {
            console.log('Free Gifts: Free gift has higher threshold, taking priority over milestone');
            // Continue to show free gifts
          } else {
            // Milestone has higher or equal threshold, it takes priority
            console.log('Free Gifts: Milestone has higher threshold, skipping free gifts');
            const response = json({ freeGifts: [] });
            return cors(request, response);
          }
        } else {
          // No applicable free gifts, milestone takes priority
          console.log('Free Gifts: Skipping because milestone with gift reward is unlocked');
          const response = json({ freeGifts: [] });
          return cors(request, response);
        }
      }
    }

    // Filter free gifts based on trigger conditions
    const applicableFreeGifts = cartDrawer.freeGifts.filter((freeGift) => {
      const triggerValue = parseFloat(freeGift.triggerValue.toString());
      
      switch (freeGift.triggerType) {
        case "spend":
          // Check if cart total meets the spend threshold
          return cartTotal >= triggerValue;
          
        case "quantity":
          // Check if total quantity meets threshold
          const totalQuantity = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
          return totalQuantity >= triggerValue;
          
        case "products":
          // Check if specific products are in cart
          if (freeGift.targets.length === 0) return false;
          const targetProductIds = freeGift.targets
            .filter(t => t.type === "product")
            .map((t) => t.shopifyId);
          return cartItems.some((item: any) => {
            if (!item.product_id) return false;
            const productId = item.product_id.toString();
            return (
              targetProductIds.includes(productId) ||
              targetProductIds.includes(`gid://shopify/Product/${productId}`)
            );
          });
          
        case "collections":
          // Check if products from specific collections are in cart
          if (freeGift.targets.length === 0) return false;
          // For collections, we'd need additional product data
          // For now, return true if cart has items (merchant should configure properly)
          return cartItems.length > 0;
          
        default:
          return false;
      }
    });

    // Format the response
    const freeGiftsWithStatus = applicableFreeGifts.map((freeGift) => {
      const triggerValue = parseFloat(freeGift.triggerValue.toString());
      
      return {
        id: freeGift.id,
        name: freeGift.name,
        triggerType: freeGift.triggerType,
        triggerValue: triggerValue,
        customerLimit: freeGift.customerLimit,
        discountCode: freeGift.discountCode,
        giftProducts: freeGift.giftProducts.map(p => ({
          id: p.id,
          shopifyProductId: p.shopifyProductId,
          shopifyVariantId: p.shopifyVariantId,
          title: p.title,
          price: 0, // Free gifts are always price 0 (discount applies at checkout)
          compareAtPrice: p.compareAtPrice ? parseFloat(p.compareAtPrice.toString()) : parseFloat(p.price.toString()),
          imageUrl: p.imageUrl,
          handle: p.handle,
        })),
        qualified: true, // Already filtered above
      };
    });

    const response = json({
      freeGifts: freeGiftsWithStatus,
    });
    return cors(request, response);
  } catch (error) {
    console.error("Error fetching free gifts:", error);
    const response = json({ error: "Failed to fetch free gifts" }, { status: 500 });
    return cors(request, response);
  }
}

