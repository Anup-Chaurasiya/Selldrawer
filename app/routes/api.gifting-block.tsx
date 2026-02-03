import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import prisma from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
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
        const cartTotal = parseFloat(body.cartTotal || "0");
        const cartItems = body.cartItems || [];

        return await getGiftingBlockResponse(request, shop, cartTotal, cartItems);
    } catch (error) {
        console.error("Error in gifting-block action:", error);
        const response = json({ error: "Failed to fetch gifts" }, { status: 500 });
        return cors(request, response);
    }
}

/**
 * Public API endpoint for gifting block data
 * Called from theme extension to get gift configuration
 * URL: /api/gifting-block?shop=example.myshopify.com&cartTotal=1000&cartItems=[...]
 */
export async function loader({ request }: LoaderFunctionArgs) {
    // Handle OPTIONS preflight requests
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma",
                "Access-Control-Max-Age": "86400",
            },
        });
    }

    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const cartTotal = parseFloat(url.searchParams.get("cartTotal") || "0");
    const cartItemsJson = url.searchParams.get("cartItems");

    if (!shop) {
        const response = json({ error: "Shop parameter is required" }, { status: 400 });
        return cors(request, response);
    }

    let cartItems: any[] = [];
    if (cartItemsJson) {
        try {
            cartItems = JSON.parse(cartItemsJson);
        } catch (e) {
            console.error("Failed to parse cart items:", e);
        }
    }

    return await getGiftingBlockResponse(request, shop, cartTotal, cartItems);
}

// Handle CORS preflight requests
export const OPTIONS = async () => {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
};

async function getGiftingBlockResponse(request: Request, shop: string, cartTotal: number, cartItems: any[]) {
    try {
        // Get gifting block configuration
        const giftingBlock = await prisma.giftingBlock.findUnique({
            where: { shop },
            include: {
                gifts: {
                    where: { isActive: true },
                    include: {
                        giftProducts: {
                            orderBy: { position: 'asc' },
                        },
                        targets: true,
                    },
                    orderBy: { priority: 'asc' },
                },
            },
        });

        if (!giftingBlock || !giftingBlock.isActive) {
            const response = json({
                enabled: false,
                gifts: []
            });
            return cors(request, response);
        }

        // Filter gifts based on trigger conditions
        const applicableGifts = giftingBlock.gifts.filter((gift) => {
            const triggerValue = parseFloat(gift.triggerValue.toString());

            switch (gift.triggerType) {
                case "spend":
                    // Check if cart total meets the spend threshold
                    return cartTotal >= triggerValue;

                case "quantity":
                    // Check if total quantity meets threshold
                    const totalQuantity = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
                    return totalQuantity >= triggerValue;

                case "products":
                    // Check if cart has required quantity of specific products
                    if (gift.targets.length === 0) return false;
                    const targetProductIds = gift.targets
                        .filter(t => t.type === "product")
                        .map((t) => t.shopifyId);

                    // Calculate total quantity of target products in cart
                    const targetProductQuantity = cartItems.reduce((sum, item: any) => {
                        if (!item.product_id) return sum;
                        const productId = item.product_id.toString();
                        const isTargetProduct = targetProductIds.some(targetId =>
                            productId === targetId ||
                            productId === targetId.replace('gid://shopify/Product/', '') ||
                            `gid://shopify/Product/${productId}` === targetId
                        );
                        return isTargetProduct ? sum + (item.quantity || 0) : sum;
                    }, 0);

                    // Check if quantity meets or exceeds trigger value
                    return targetProductQuantity >= triggerValue;

                case "collections":
                    // Check if cart has required quantity from specific collections
                    if (gift.targets.length === 0) return false;
                    const targetCollectionIds = gift.targets
                        .filter(t => t.type === "collection")
                        .map((t) => t.shopifyId);

                    // For collections: Check if cart has at least triggerValue items
                    // Note: We can't verify exact collection membership without additional API calls
                    // The Shopify discount at checkout will do the final validation
                    // For now, we check if total cart quantity meets the requirement
                    const cartQuantity = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
                    return cartQuantity >= triggerValue;

                default:
                    return false;
            }
        });

        // Format the response
        const giftsWithStatus = applicableGifts.map((gift) => {
            const triggerValue = parseFloat(gift.triggerValue.toString());

            return {
                id: gift.id,
                name: gift.name,
                triggerType: gift.triggerType,
                triggerValue: triggerValue,
                customerLimit: gift.customerLimit,
                discountCode: gift.discountCode,
                giftProducts: gift.giftProducts.map(p => ({
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
            enabled: giftingBlock.isActive,
            gifts: giftsWithStatus,
        }, {
            headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
                "Pragma": "no-cache",
                "Expires": "0",
            }
        });

        return cors(request, response);
    } catch (error) {
        console.error("Error fetching gifting block data:", error);
        const response = json({ error: "Failed to fetch gifts" }, { status: 500 });
        return cors(request, response);
    }
}
