import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getCustomerData, deleteCustomerData, deleteShopData } from "../services/compliance.server";
import { verifyShopifyWebhookSignature } from "../utils/verifyWebhook.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const rawBody = await request.clone().arrayBuffer();
  const valid = verifyShopifyWebhookSignature(rawBody, request.headers);

  if (!valid) {
    return new Response("Invalid webhook signature", { status: 401 });
  }

  try {
    const { shop, payload } = await authenticate.webhook(request);
    
    // Get topic from header (X-Shopify-Topic)
    const topic = request.headers.get("x-shopify-topic") || "";

    // Route based on compliance webhook topic
    switch (topic) {
      case "customers/data_request": {
        const customerId = payload?.customer?.id?.toString() ?? null;
        const customerEmail = payload?.customer?.email ?? null;
        const requestedOrders = Array.isArray(payload?.orders_requested)
          ? payload.orders_requested
          : [];

        const records = await getCustomerData(shop, customerId);

        return json({
          status: "accepted",
          requestedOrders,
          customerId,
          customerEmail,
          records,
        });
      }

      case "customers/redact": {
        const customerId = payload?.customer?.id?.toString() ?? null;

        await deleteCustomerData(shop, customerId);

        return json({
          status: "completed",
          customerId,
          shop,
        });
      }

      case "shop/redact": {
        // shop/redact is sent 48 hours after app uninstall
        await deleteShopData(shop);

        return new Response();
      }

      default:
        return new Response(`Unknown compliance topic: ${topic}`, { status: 400 });
    }
  } catch (error) {
    if (error instanceof Response && error.status === 401) {
      return error;
    }

    throw error;
  }
};

