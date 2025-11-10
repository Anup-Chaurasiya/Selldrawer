import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { deleteCustomerData } from "../services/compliance.server";
import { verifyShopifyWebhookSignature } from "../utils/verifyWebhook.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const rawBody = await request.clone().arrayBuffer();
  const valid = verifyShopifyWebhookSignature(rawBody, request.headers);

  if (!valid) {
    return new Response("Invalid webhook signature", { status: 401 });
  }

  try {
    const { shop, payload } = await authenticate.webhook(request);

    const customerId = payload?.customer?.id?.toString() ?? null;

    await deleteCustomerData(shop, customerId);

    return json({
      status: "completed",
      customerId,
      shop,
    });
  } catch (error) {
    if (error instanceof Response && error.status === 401) {
      return error;
    }

    throw error;
  }
};
