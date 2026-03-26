import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { verifyShopifyWebhookSignature } from "../utils/verifyWebhook.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const rawBody = await request.clone().arrayBuffer();
  const valid = verifyShopifyWebhookSignature(rawBody, request.headers);

  if (!valid) {
    return new Response("Invalid webhook signature", { status: 401 });
  }

  try {
    const { shop, payload } = await authenticate.webhook(request);

    const shopData = {
      domain: payload?.myshopify_domain ?? null,
      name: payload?.name ?? null,
      email: payload?.email ?? null,
      plan: payload?.plan_display_name ?? null,
      shopOwner: payload?.shop_owner ?? null,
      country: payload?.country ?? null,
      countryCode: payload?.country_code ?? null,
      province: payload?.province ?? null,
      currency: payload?.currency ?? null,
    };

    await db.cartDrawerAnalytics.create({
      data: {
        id: crypto.randomUUID(),
        shop,
        eventType: "shop_update",
        eventData: JSON.stringify(shopData),
      },
    });

    return json({ status: "received" });
  } catch (error) {
    if (error instanceof Response && error.status === 401) {
      return error;
    }

    throw error;
  }
};
