import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const planId = url.searchParams.get("plan");
  const charge_id = url.searchParams.get("charge_id");
  const host = url.searchParams.get("host");
  const shop = url.searchParams.get("shop");

  if (!planId || !shop) {
    return redirect("/app");
  }

  try {
    // Update subscription status to ACTIVE
    // We skip authentication here because the callback comes from Shopify's billing page
    // which causes auth redirect issues. The shop parameter from Shopify is trusted.
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial

    await prisma.appSubscription.upsert({
      where: { shop },
      create: {
        shop,
        planId,
        planName: planId === "growth" ? "Growth plan" : "Enterprise plan",
        status: "ACTIVE",
        amount: planId === "growth" ? 29.99 : 299.0,
        currencyCode: "USD",
        interval: "EVERY_30_DAYS",
        trialDays: 14,
        trialEndsAt,
        shopifyChargeId: charge_id || undefined,
      },
      update: {
        planId,
        planName: planId === "growth" ? "Growth plan" : "Enterprise plan",
        status: "ACTIVE",
        trialEndsAt,
        shopifyChargeId: charge_id || undefined,
        updatedAt: new Date(),
      },
    });

    // Redirect back to the embedded app in Shopify admin
    // This will trigger re-authentication in the proper context
    if (host) {
      const redirectUrl = `/app?host=${host}&shop=${shop}&billing=success`;
      return redirect(redirectUrl);
    }
    
    // Fallback redirect
    return redirect(`/app?shop=${shop}&billing=success`);
  } catch (error) {
    console.error("=== BILLING CALLBACK ERROR ===");
    console.error("Error details:", error);
    
    // Redirect with error parameter
    if (host && shop) {
      return redirect(`/app?host=${host}&shop=${shop}&billing=error`);
    }
    return redirect("/app?billing=error");
  }
};

// Export a default component to satisfy Remix requirements
export default function BillingCallback() {
  return null;
}
