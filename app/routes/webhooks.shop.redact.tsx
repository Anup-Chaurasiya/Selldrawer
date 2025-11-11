import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { deleteShopData } from "../services/compliance.server";
import { verifyShopifyWebhookSignature } from "../utils/verifyWebhook.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const rawBody = await request.clone().arrayBuffer();
  const valid = verifyShopifyWebhookSignature(rawBody, request.headers);

  if (!valid) {
    return new Response("Invalid webhook signature", { status: 401 });
  }

  try {
    const { shop } = await authenticate.webhook(request);

    // shop/redact is sent 48 hours after app uninstall
    // Delete all shop data as per GDPR requirements
    await deleteShopData(shop);

    return new Response();
  } catch (error) {
    if (error instanceof Response && error.status === 401) {
      return error;
    }

    throw error;
  }
};

