import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";

// Get CORS headers based on request origin
function getCorsHeaders(request: Request) {
  const origin = request.headers.get("Origin") || "*";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Allow-Credentials": "true",
  };
}

// Handle OPTIONS preflight request
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const corsHeaders = getCorsHeaders(request);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Return 405 for GET requests
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const corsHeaders = getCorsHeaders(request);

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }

  try {
    const body = await request.json();
    const { events, shop } = body;

    if (!shop || !events || !Array.isArray(events)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Validate and prepare events
    const validEvents = events.map((event: any) => ({
      id: `${shop}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      shop,
      eventType: event.eventType,
      component: event.component,
      productId: event.productId ? String(event.productId) : null,
      variantId: event.variantId ? String(event.variantId) : null,
      value: event.value ? parseFloat(event.value) : null,
      currency: event.currency || "USD",
      url: event.url || null,
      sessionId: event.sessionId || null,
      metadata: event.metadata ? JSON.stringify(event.metadata) : null,
    }));

    if (validEvents.length > 0) {
      await prisma.analyticsEvent.createMany({
        data: validEvents,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Analytics API Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }
};

