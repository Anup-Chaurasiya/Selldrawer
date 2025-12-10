import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { checkOrderLimit } from "../utils/planAccess.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload, topic } = await authenticate.webhook(request);

  // payload is the Order resource
  const order = payload;

  if (!order.line_items) {
    return new Response();
  }

  // Check order limit for the shop
  const orderLimitCheck = await checkOrderLimit(shop);
  if (!orderLimitCheck.withinLimit) {
    // Still process the order but log the limit reached
  }

  // Check line items for _upsell_source property
  const upsellItems = order.line_items.filter((item: any) => {
    return item.properties?.some((prop: any) => prop.name === "_upsell_source");
  });

  if (upsellItems.length > 0) {
    const events = upsellItems.map((item: any) => {
      const sourceProp = item.properties.find((p: any) => p.name === "_upsell_source");
      const component = sourceProp?.value || "unknown";
      
      return {
        shop,
        eventType: "conversion",
        component,
        productId: item.product_id?.toString(),
        variantId: item.variant_id?.toString(),
        value: parseFloat(item.price) * item.quantity,
        currency: order.currency,
        orderId: order.id.toString(),
        metadata: JSON.stringify({
          quantity: item.quantity,
          orderName: order.name,
          totalOrderValue: parseFloat(order.total_price)
        })
      };
    });

    await prisma.analyticsEvent.createMany({
      data: events
    });
  }

  return new Response();
};

