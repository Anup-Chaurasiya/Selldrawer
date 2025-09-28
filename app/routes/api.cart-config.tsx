import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "../db.server";
import type { CartConfiguration, CartConfigurationTarget, ShopifyCartItem, CartAnalysis, ConfigurationResponse } from "./types";

interface ApiResponse {
  configurations: ConfigurationResponse[];
  cartAnalysis: CartAnalysis;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const cartItems = url.searchParams.get("cartItems");

  if (!shop) {
    return json({ error: "Shop parameter is required" }, { status: 400 });
  }

  try {
    // Parse cart items if provided
    let parsedCartItems: ShopifyCartItem[] = [];
    if (cartItems) {
      try {
        parsedCartItems = JSON.parse(cartItems);
      } catch (e) {
        console.error("Error parsing cart items:", e);
      }
    }

    // Get all active configurations for the shop
    const configurations = await (prisma as any).cartConfiguration.findMany({
      where: { 
        shop: shop.endsWith('.myshopify.com') ? shop : `${shop}.myshopify.com`,
        isActive: true 
      },
      include: { targets: true },
      orderBy: { createdAt: "desc" },
    });

    // Filter configurations based on cart contents and targeting
    const applicableConfigs = configurations.filter((config: CartConfiguration) => {
      // If store-wide, always applicable
      if (config.targetType === "store_wide") {
        return true;
      }

      // If no cart items provided, can't evaluate targeted rules
      if (parsedCartItems.length === 0) {
        return config.targetType === "store_wide";
      }

      // Check if any cart items match the targeting
      if (config.targetType === "products") {
        const targetProductIds = config.targets.map((t: CartConfigurationTarget) => t.shopifyId);
        return parsedCartItems.some(item => {
          if (!item.product_id) return false;
          const productId = item.product_id.toString();
          return targetProductIds.includes(productId) ||
                 targetProductIds.includes(`gid://shopify/Product/${productId}`);
        });
      }

      if (config.targetType === "collections") {
        // This would require additional product data to check collections
        // For now, we'll return true and let the frontend handle collection checking
        return true;
      }

      return false;
    });

    // Calculate cart totals for condition evaluation
    const cartTotal = parsedCartItems.reduce((total, item) => {
      return total + (parseFloat(item.price || "0") * parseInt(item.quantity || "1"));
    }, 0);

    const cartItemCount = parsedCartItems.reduce((total, item) => {
      return total + parseInt(item.quantity || "1");
    }, 0);

    // Evaluate conditions and return matching configurations
    const matchingConfigs = applicableConfigs.filter((config: CartConfiguration) => {
      let conditionValue = 0;
      
      switch (config.conditionType) {
        case "cart_value":
          conditionValue = cartTotal;
          break;
        case "product_count":
          conditionValue = cartItemCount;
          break;
        case "category_value":
          // This would require more complex calculation based on categories
          conditionValue = cartTotal;
          break;
        default:
          return false;
      }

      const targetValue = parseFloat(config.conditionValue.toString());
      
      switch (config.conditionOperator) {
        case "greater_than":
          return conditionValue > targetValue;
        case "less_than":
          return conditionValue < targetValue;
        case "equals":
          return Math.abs(conditionValue - targetValue) < 0.01;
        default:
          return false;
      }
    });

    // Return configurations with additional context
    const response: ApiResponse = {
      configurations: matchingConfigs.map((config: CartConfiguration): ConfigurationResponse => ({
        id: config.id,
        name: config.name,
        conditionType: config.conditionType,
        conditionOperator: config.conditionOperator,
        conditionValue: config.conditionValue,
        actionType: config.actionType,
        actionValue: config.actionValue,
        actionMessage: config.actionMessage,
        targetType: config.targetType,
        targets: config.targets,
      })),
      cartAnalysis: {
        total: cartTotal,
        itemCount: cartItemCount,
        currency: "USD", // This should be dynamic based on shop currency
      }
    };

    // Add CORS headers for cross-origin requests
    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });

  } catch (error) {
    console.error("Error fetching cart configurations:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

// Handle CORS preflight requests
export async function options() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
