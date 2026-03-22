/**
 * Storefront Access Token Management
 * Utilities for creating and managing shop-specific Storefront Access Tokens
 */

import { GraphqlQueryError } from "@shopify/shopify-api";
import { authenticate } from "../shopify.server";
import db from "../db.server";

/**
 * Create a Storefront Access Token for a shop via Admin API
 */
export async function createStorefrontAccessToken(
    admin: any,
    shop: string
): Promise<string> {
    const mutation = `
    mutation storefrontAccessTokenCreate($input: StorefrontAccessTokenInput!) {
      storefrontAccessTokenCreate(input: $input) {
        storefrontAccessToken {
          accessToken
          title
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

    try {
        console.log(`[StorefrontToken] Creating token for shop: ${shop}`);

        const response = await admin.graphql(mutation, {
            variables: {
                input: {
                    title: `Selldrawer App - ${new Date().toISOString()}`,
                },
            },
        });

        const data = await response.json();
        console.log(`[StorefrontToken] GraphQL Response:`, JSON.stringify(data, null, 2));

        if (data.data?.storefrontAccessTokenCreate?.userErrors?.length > 0) {
            const errors = data.data.storefrontAccessTokenCreate.userErrors;
            console.error(`[StorefrontToken] User errors:`, errors);
            throw new Error(
                `Failed to create storefront access token: ${errors.map((e: any) => e.message).join(", ")}`
            );
        }

        const accessToken =
            data.data?.storefrontAccessTokenCreate?.storefrontAccessToken?.accessToken;

        if (!accessToken) {
            console.error(`[StorefrontToken] No access token in response. Full response:`, data);
            throw new Error("No access token returned from Shopify");
        }

        console.log(`[StorefrontToken] Token created successfully: ${accessToken.substring(0, 10)}...`);

        // Save token to database
        await saveStorefrontAccessToken(shop, accessToken);

        return accessToken;
    } catch (error) {
        console.error("[StorefrontToken] Error creating storefront access token:", error);
        throw error;
    }
}

/**
 * Save Storefront Access Token to database
 */
export async function saveStorefrontAccessToken(
    shop: string,
    token: string
): Promise<void> {
    try {
        console.log(`[StorefrontToken] Attempting to save token for shop: ${shop}`);

        // First check if session exists
        const existingSession = await db.session.findFirst({
            where: {
                shop,
                isOnline: false,
            },
        });

        if (!existingSession) {
            console.error(`[StorefrontToken] ERROR: No offline session found for shop: ${shop}`);
            throw new Error(`No offline session found for shop: ${shop}. Cannot save token.`);
        }

        console.log(`[StorefrontToken] Found session ID: ${existingSession.id}`);

        // Update the offline session with the storefront token
        const result = await db.session.updateMany({
            where: {
                shop,
                isOnline: false,
            },
            data: {
                storefrontAccessToken: token,
            },
        });

        console.log(`[StorefrontToken] Update result: ${result.count} record(s) updated`);

        if (result.count === 0) {
            throw new Error(`Failed to update session with token for shop: ${shop}`);
        }

        // Verify the token was saved
        const verifySession = await db.session.findFirst({
            where: {
                shop,
                isOnline: false,
            },
            select: {
                storefrontAccessToken: true,
            },
        });

        if (!verifySession?.storefrontAccessToken) {
            throw new Error(`Token verification failed for shop: ${shop}`);
        }

        console.log(`[StorefrontToken] ✅ Successfully saved and verified token for shop: ${shop}`);
    } catch (error) {
        console.error("[StorefrontToken] Error saving storefront access token:", error);
        throw error;
    }
}

/**
 * Get Storefront Access Token from database
 * If token doesn't exist, create a new one
 */
export async function getStorefrontAccessToken(
    shop: string,
    admin?: any
): Promise<string | null> {
    try {
        // Try to get existing token from database
        const session = await db.session.findFirst({
            where: {
                shop,
                isOnline: false,
            },
            select: {
                storefrontAccessToken: true,
            },
        });

        if (session?.storefrontAccessToken) {
            return session.storefrontAccessToken;
        }

        // If no token exists and admin is provided, create one
        if (admin) {
            console.log(`No storefront token found for ${shop}, creating new one...`);
            return await createStorefrontAccessToken(admin, shop);
        }

        // No token and can't create one
        return null;
    } catch (error) {
        console.error("Error getting storefront access token:", error);
        throw error;
    }
}

/**
 * Ensure shop has a Storefront Access Token
 * Call this during app installation or first use
 */
export async function ensureStorefrontAccessToken(
    request: Request
): Promise<string> {
    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;

    // Check if token already exists
    const existingToken = await getStorefrontAccessToken(shop);

    if (existingToken) {
        return existingToken;
    }

    // Create new token
    return await createStorefrontAccessToken(admin, shop);
}
