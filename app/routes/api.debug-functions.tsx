import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

/**
 * Debug endpoint to check available Shopify Functions
 * URL: /api/debug-functions
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const query = `
    query {
      shopifyFunctions(first: 50) {
        nodes {
          id
          apiType
          title
          appKey
          app {
            handle
            title
          }
        }
      }
    }
  `;

  try {
    const res = await admin.graphql(query);
    const payloadData = await res.json();
    const functions = payloadData?.data?.shopifyFunctions?.nodes || [];

    return json({
      success: true,
      count: functions.length,
      functions: functions.map((f: any) => ({
        id: f.id,
        title: f.title,
        apiType: f.apiType,
        appKey: f.appKey,
        appHandle: f.app?.handle,
        appTitle: f.app?.title
      }))
    });
  } catch (error) {
    // Error fetching functions
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
};
