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
): Promise<string | null> {
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
        const response = await admin.graphql(mutation, {
            variables: {
                input: {
                    title: `Selldrawer App - ${new Date().toISOString()}`,
                },
            },
        });

        const data = await response.json();

        if (data.data?.storefrontAccessTokenCreate?.userErrors?.length > 0) {
            const errors = data.data.storefrontAccessTokenCreate.userErrors;
            console.warn(
                `[createStorefrontAccessToken] Failed to create token: ${errors.map((e: any) => e.message).join(", ")}`
            );
            return null;
        }

        const accessToken =
            data.data?.storefrontAccessTokenCreate?.storefrontAccessToken?.accessToken;

        if (!accessToken) {
            console.warn("[createStorefrontAccessToken] No access token returned from Shopify");
            return null;
        }

        // Save token to database
        await saveStorefrontAccessToken(shop, accessToken);

        return accessToken;
    } catch (error) {
        // Handle permission errors gracefully
        if (error instanceof GraphqlQueryError) {
            const errorMessage = error.message || '';
            if (errorMessage.includes('Access denied') || errorMessage.includes('storefrontAccessTokenCreate')) {
                console.warn(`[createStorefrontAccessToken] Permission denied for shop ${shop}. Storefront API features will be limited.`);
                return null;
            }
        }
        console.error(`[createStorefrontAccessToken] Unexpected error:`, error);
        return null;
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
        // First check if session exists
        const existingSession = await db.session.findFirst({
            where: {
                shop,
                isOnline: false,
            },
        });

        if (!existingSession) {
            throw new Error(`No offline session found for shop: ${shop}. Cannot save token.`);
        }

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
    } catch (error) {
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
            return await createStorefrontAccessToken(admin, shop);
        }

        // No token and can't create one
        return null;
    } catch (error) {
        throw error;
    }
}

/**
 * Ensure shop has a Storefront Access Token
 * Call this during app installation or first use
 * Returns null if token cannot be created (e.g., missing permissions)
 */
export async function ensureStorefrontAccessToken(
    request: Request
): Promise<string | null> {
    try {
        const { admin, session } = await authenticate.admin(request);
        const shop = session.shop;

        // Check if token already exists
        const existingToken = await getStorefrontAccessToken(shop);

        if (existingToken) {
            return existingToken;
        }

        // Create new token (may return null if permissions are missing)
        return await createStorefrontAccessToken(admin, shop);
    } catch (error) {
        console.error('[ensureStorefrontAccessToken] Error:', error);
        return null;
    }
}
