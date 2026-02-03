import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  List,
  Banner,
  Button,
  InlineCode,
  Box,
  Divider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  const url = new URL(request.url);
  const appUrl = `${url.protocol}//${url.host}`;

  return json({ appUrl });
};

export default function Installation() {
  const { appUrl } = useLoaderData<typeof loader>();

  return (
    <Page
      backAction={{ url: "/app/cart-drawer" }}
      title="Installation Instructions"
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Banner tone="info">
              <p>
                The Upsellity Cart Drawer works with any Shopify theme! Follow these simple steps to enable it in your store.
              </p>
            </Banner>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  🚀 Quick Installation (Recommended)
                </Text>

                <Text as="h3" variant="headingMd">
                  Method 1: Using Theme App Extension (Easiest)
                </Text>

                <List type="number">
                  <List.Item>
                    Go to <strong>Online Store → Themes</strong> in your Shopify admin
                  </List.Item>
                  <List.Item>
                    Click <strong>Customize</strong> on your active theme
                  </List.Item>
                  <List.Item>
                    Click the <strong>App embeds</strong> button in the theme editor (left sidebar, bottom)
                  </List.Item>
                  <List.Item>
                    Find <strong>"Upsellity Cart Drawer"</strong> in the list and toggle it ON
                  </List.Item>
                  <List.Item>
                    Enter your app URL in the settings: <InlineCode>{appUrl}</InlineCode>
                  </List.Item>
                  <List.Item>
                    Click <strong>Save</strong> in the top right
                  </List.Item>
                </List>

                <Banner tone="success">
                  <p>That's it! Your cart drawer is now live. Any enabled features will automatically appear in your cart.</p>
                </Banner>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  Method 2: Manual Theme Integration
                </Text>

                <Text as="p" variant="bodyMd" tone="subdued">
                  For advanced users or custom themes
                </Text>

                <Divider />

                <Text as="h4" variant="headingSm">
                  Step 1: Add the Snippet
                </Text>

                <Text as="p" variant="bodyMd" tone="subdued">
                  Note: The cart drawer snippet is already included in your theme extension.
                  You just need to add one line to your theme.
                </Text>

                <Divider />

                <Text as="h4" variant="headingSm">
                  Step 2: Add to Your Theme
                </Text>

                <List type="number">
                  <List.Item>
                    Open <strong>Layout → theme.liquid</strong>
                  </List.Item>
                  <List.Item>
                    Find the closing <InlineCode>{'</body>'}</InlineCode> tag (usually near the bottom)
                  </List.Item>
                  <List.Item>
                    Add this line just before it (replace YOUR_APP_URL with your actual app URL):
                  </List.Item>
                </List>

                <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                  <pre style={{ fontSize: '12px', margin: 0 }}>
                    {`{% render 'cart-drawer-loader', app_url: '${appUrl}' %}`}
                  </pre>
                </Box>

                <List type="number" start={4 as any}>
                  <List.Item>
                    Click <strong>Save</strong>
                  </List.Item>
                </List>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  📱 How It Works
                </Text>

                <Text as="p" variant="bodyMd">
                  Once installed, the cart drawer will:
                </Text>

                <List type="bullet">
                  <List.Item>
                    Automatically intercept "Add to Cart" button clicks
                  </List.Item>
                  <List.Item>
                    Replace the default cart page with a sliding drawer
                  </List.Item>
                  <List.Item>
                    Show all your enabled features (progress bars, banners, recommendations, etc.)
                  </List.Item>
                  <List.Item>
                    Work seamlessly with your existing theme
                  </List.Item>
                  <List.Item>
                    Automatically update when you change settings in this app
                  </List.Item>
                </List>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  🎨 Customization
                </Text>

                <Text as="p" variant="bodyMd">
                  All features can be customized from the Upsellity app dashboard:
                </Text>

                <List type="bullet">
                  <List.Item>
                    Free Shipping Progress Bar - Set thresholds and messages
                  </List.Item>
                  <List.Item>
                    Promotional Banners - Add sales and promotions
                  </List.Item>
                  <List.Item>
                    Product Recommendations - Upsell related products
                  </List.Item>
                  <List.Item>
                    Savings Display - Show how much customers are saving
                  </List.Item>
                  <List.Item>
                    And more!
                  </List.Item>
                </List>

                <Button url="/app/cart-drawer" variant="primary">
                  Configure Features
                </Button>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  ❓ Troubleshooting
                </Text>

                <List type="bullet">
                  <List.Item>
                    <strong>Cart drawer not showing?</strong> Make sure you've saved your theme and cleared your browser cache.
                  </List.Item>
                  <List.Item>
                    <strong>Features not appearing?</strong> Check that they're enabled in the Cart Drawer settings.
                  </List.Item>
                  <List.Item>
                    <strong>Conflicts with existing cart?</strong> The drawer automatically overrides default cart behavior. If you have custom cart code, you may need to adjust it.
                  </List.Item>
                </List>

                <Banner tone="info">
                  <p>
                    Need help? Contact our support team or check our documentation for more detailed guides.
                  </p>
                </Banner>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

