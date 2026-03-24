import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log('[APP LOADER] Starting authentication...');
  console.log('[APP LOADER] Request URL:', request.url);
  
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const host = url.searchParams.get("host");
  const idToken = url.searchParams.get("id_token");
  
  console.log('[APP LOADER] Request headers:', {
    host: request.headers.get('host'),
    authorization: request.headers.get('authorization') ? 'Present' : 'Missing',
    cookie: request.headers.get('cookie') ? 'Present' : 'Missing',
  });
  
  console.log('[APP LOADER] URL params:', {
    shop: shop ? 'Present' : 'Missing',
    host: host ? 'Present' : 'Missing',
    idToken: idToken ? 'Present' : 'Missing',
  });
  
  try {
    const auth = await authenticate.admin(request);
    console.log('[APP LOADER] Authentication successful!', { shop: auth.session.shop });
    return { 
      apiKey: process.env.SHOPIFY_API_KEY || "",
      shop: auth.session.shop,
      host: host || "",
    };
  } catch (error) {
    console.error('[APP LOADER] Authentication failed:', error);
    
    // If we have shop and host but auth failed, it might be a navigation without id_token
    // In this case, redirect to the app with proper params to re-authenticate
    if (shop && host) {
      console.log('[APP LOADER] Redirecting to re-authenticate with shop and host');
      throw redirect(`/app?shop=${shop}&host=${host}`);
    }
    
    throw error;
  }
};

export default function App() {
  const { apiKey, shop, host } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to={`/app?shop=${shop}&host=${host}`} rel="home">
          Home
        </Link>
        <Link to={`/app/cart-drawer?shop=${shop}&host=${host}`}>Cart Drawer</Link>
        <Link to={`/app/promotional-banner-block?shop=${shop}&host=${host}`}>Promotional Banner Block</Link>
        <Link to={`/app/fbt?shop=${shop}&host=${host}`}>Frequently Bought Together</Link>
        <Link to={`/app/billing?shop=${shop}&host=${host}`}>Billing & Plans</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
