/**
 * Utility to check if the app embed is enabled in the merchant's active theme
 * 
 * This function performs the following steps:
 * 1. Fetches the active theme ID using GraphQL
 * 2. Retrieves the theme's settings_data.json using REST API
 * 3. Checks if the app embed block is enabled in the theme settings
 * 
 * @param admin - The authenticated admin API context
 * @param session - The current session with shop and access token
 * @returns Promise<boolean> - True if app embed is enabled, false otherwise
 */
export async function checkAppEmbedEnabled(
  admin: { graphql: (query: string) => Promise<Response> },
  session: { shop: string; accessToken?: string }
): Promise<boolean> {
  try {
    // STEP 1: Get the active theme ID
    const themeResponse = await admin.graphql(
      `#graphql
        query {
          themes(first: 1, roles: MAIN) {
            nodes {
              id
              name
            }
          }
        }
      `
    );
    
    const themeData = await themeResponse.json();
    const activeTheme = themeData?.data?.themes?.nodes?.[0];
    
    if (!activeTheme) {
      return false;
    }

    // Extract numeric theme ID from the GraphQL ID (e.g., "gid://shopify/Theme/123456789" -> "123456789")
    const themeId = activeTheme.id.split('/').pop();
    
    if (!themeId) {
      return false;
    }
    
    // STEP 2: Fetch config/settings_data.json using REST API
    const settingsUrl = `https://${session.shop}/admin/api/2024-10/themes/${themeId}/assets.json?asset[key]=config/settings_data.json`;
    const settingsResponse = await fetch(settingsUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': session.accessToken || '',
        'Content-Type': 'application/json',
      },
    });
    
    if (!settingsResponse.ok) {
      return false;
    }

    const settingsData = await settingsResponse.json();
    
    // STEP 3: Check if app embed is enabled in settings_data.json
    if (!settingsData?.asset?.value) {
      return false;
    }

    const settings = JSON.parse(settingsData.asset.value);
    const appEmbeds = settings?.current?.blocks || {};
    
    // Check if any app embed with our extension is enabled
    // The type should match your extension name (e.g., "apps/selldrawer-dev/cart-drawer-embed" or "apps/selldrawer-ai/cart-drawer-embed")
    // We check for both "selldrawer" and "cart-drawer-embed" to be flexible across different app handles
    const isEnabled = Object.values(appEmbeds).some((embed: any) => 
      embed?.type?.toLowerCase().includes('selldrawer') && 
      embed?.type?.includes('cart-drawer-embed') && 
      embed?.disabled !== true
    );

    return isEnabled;
  } catch (error) {
    return false;
  }
}

