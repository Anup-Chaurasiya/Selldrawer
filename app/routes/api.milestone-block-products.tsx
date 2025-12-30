import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { cors } from "remix-utils/cors";
import prisma from "../db.server";
import {
    fetchProductsByCollection,
    fetchProductsByHandles,
    fetchProductsByTag,
    fetchAllProducts,
    filterProducts,
    rankProductsByPriceDifference,
} from "../utils/storefrontApi.server";
import { getStorefrontAccessToken } from "../utils/storefrontToken.server";

/**
 * Public API endpoint for milestone block product recommendations
 * URL: /api/milestone-block-products?shop=example.myshopify.com&milestoneId=xxx&remaining=500
 */
export async function loader({ request }: LoaderFunctionArgs) {
    // Handle OPTIONS preflight requests
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "86400",
            },
        });
    }

    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const milestoneId = url.searchParams.get("milestoneId");
    const remaining = parseFloat(url.searchParams.get("remaining") || "0");

    if (!shop) return cors(request, json({ error: "Shop parameter is required" }, { status: 400 }));
    if (!milestoneId) return cors(request, json({ error: "Milestone ID is required" }, { status: 400 }));
    if (remaining <= 0) {
        return cors(request, json({ error: "Remaining amount must be greater than 0" }, { status: 400 }));
    }

    try {
        // Fetch milestone configuration from BlockMilestone table
        const milestone = await prisma.blockMilestone.findUnique({
            where: { id: milestoneId },
            select: {
                id: true,
                shop: true,
                isActive: true,
                eligibleCollectionHandle: true,
                eligibleTag: true,
                eligibleProductIds: true,
                upsellHeaderText: true,
                viewAllLinkText: true,
                milestoneBlock: {
                    select: {
                        isActive: true,
                    }
                }
            },
        });

        if (!milestone) return cors(request, json({ error: "Milestone not found" }, { status: 404 }));
        if (!milestone.isActive) return cors(request, json({ error: "Milestone is not active" }, { status: 403 }));
        if (!milestone.milestoneBlock?.isActive) return cors(request, json({ error: "Milestone Block feature is disabled" }, { status: 403 }));
        if (milestone.shop !== shop) return cors(request, json({ error: "Shop mismatch" }, { status: 403 }));

        // Get Storefront Access Token for this shop
        const storefrontAccessToken = await getStorefrontAccessToken(shop);
        if (!storefrontAccessToken) {
            return cors(request, json({ error: "Storefront access token not configured for this shop" }, { status: 500 }));
        }

        // Determine eligibility source (priority: collection > productIds > tag > all products)
        let products: any[] = [];
        let collectionUrl: string | null = null;
        let eligibilitySource: string | null = null;

        if (milestone.eligibleCollectionHandle) {
            // Priority 1: Collection
            eligibilitySource = "collection";
            products = await fetchProductsByCollection(shop, storefrontAccessToken, milestone.eligibleCollectionHandle);
            collectionUrl = `/collections/${milestone.eligibleCollectionHandle}`;
        } else if (milestone.eligibleProductIds && milestone.eligibleProductIds.length > 0) {
            // Priority 2: Product IDs
            eligibilitySource = "productIds";
            products = await fetchProductsByHandles(shop, storefrontAccessToken, milestone.eligibleProductIds);
        } else if (milestone.eligibleTag) {
            // Priority 3: Tag
            eligibilitySource = "tag";
            products = await fetchProductsByTag(shop, storefrontAccessToken, milestone.eligibleTag);
        } else {
            // Priority 4: All Products (no specific eligibility configured)
            eligibilitySource = "all_products";
            products = await fetchAllProducts(shop, storefrontAccessToken);
        }

        if (!products.length) {
            return cors(request, json({
                products: [],
                collectionUrl: null,
                totalCount: 0,
                message: "No products available",
            }));
        }

        // Filter products by variant availability + price
        const availableProducts = filterProducts(products);
        if (!availableProducts.length) {
            return cors(request, json({
                products: [],
                collectionUrl,
                totalCount: 0,
                message: "No eligible items found",
            }));
        }

        // Filter by price >= remaining
        const thresholdMatches = availableProducts.filter((product) => {
            const variant = product.variants.edges[0]?.node;
            if (!variant) return false;
            const price = parseFloat(variant.price.amount);
            return price >= remaining;
        });

        // Fallback if < 5 products match
        const finalPool = thresholdMatches.length >= 5 ? thresholdMatches : availableProducts;

        // Rank products by price relevance
        const ranked = rankProductsByPriceDifference(finalPool, remaining);

        // Limit to max 12 variants
        const limited = ranked.slice(0, 12);

        // Build "Show All" link if using a collection + enough above-threshold
        const filteredCollectionUrl =
            collectionUrl && thresholdMatches.length >= 5
                ? `${collectionUrl}?filter.v.price.gte=${Math.floor(remaining)}`
                : collectionUrl;

        // Transform response
        const responseProducts = limited.map((p) => ({
            id: p.id,
            title: p.title,
            handle: p.handle,
            featuredImage: p.featuredImage,
            price: p.price,
            variantId: p.variantId,
            availableForSale: p.availableForSale,
        }));

        return cors(
            request,
            json({
                products: responseProducts,
                collectionUrl: filteredCollectionUrl,
                totalCount: responseProducts.length,
                eligibilitySource: eligibilitySource,
                remaining,
            })
        );
    } catch (error) {
        console.error("Error fetching milestone block products:", error);
        return cors(
            request,
            json(
                {
                    error: "Failed to fetch products",
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                { status: 500 }
            )
        );
    }
}

export const OPTIONS = async () => {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400",
        },
    });
};
