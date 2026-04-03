import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    removeRest: true,
  },
  useOnlineTokens: true,
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;

/**
 * Utility to save app configuration to Shopify Metafields for zero-latency access in the storefront.
 */
export async function saveConfigToMetafields(admin: any, config: Record<string, any>) {
  // First, get the shop ID
  const shopResponse = await admin.graphql(
    `#graphql
    query getShopId {
      shop {
        id
      }
    }`
  );
  const shopData = await shopResponse.json();
  const shopId = shopData.data.shop.id;

  const query = `#graphql
    mutation CreateMetafield($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          namespace
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `;


  const response = await admin.graphql(query, {
    variables: {
      metafields: [
        {
          namespace: "selldrawer",
          key: "config",
          type: "json",
          value: JSON.stringify(config),
          ownerId: shopId,
        },
      ],
    },
  });

  return response.json();
}


