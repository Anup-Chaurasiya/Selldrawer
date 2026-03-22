import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, useNavigation, useActionData, Form } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Box,
  Divider,
  Icon,
  Banner,
  DataTable,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { CheckIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { checkAppEmbedEnabled } from "../utils/appEmbed.server";
import { requireBilling } from "../utils/billing.server";
import { ensureStorefrontAccessToken } from "../utils/storefrontToken.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing, session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  // Check billing - if no active payment, redirect directly to our internal billing page router
  const billingRedirectUrl = await requireBilling(billing);
  if (billingRedirectUrl) {
    return redirect("/app/billing");
  }

  // Get subscription details
  const { appSubscriptions } = await billing.check();

  // Ensure Storefront Access Token exists (create if missing)
  try {
    await ensureStorefrontAccessToken(request);
  } catch (error) {
    console.error("Error ensuring storefront access token:", error);
    // Don't block app loading if token creation fails
  }

  // Check if app embed is enabled
  const appEmbedEnabled = await checkAppEmbedEnabled(admin, session);

  // Analytics Data Fetching
  const now = new Date();
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

  const analyticsEvents = await prisma.analyticsEvent.findMany({
    where: {
      shop,
      createdAt: { gte: thirtyDaysAgo }
    }
  });

  // Aggregate Data
  const aggregatedData = {
    totalRevenue: 0,
    totalOrders: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalAddToCart: 0,
    components: {} as Record<string, any>,
    products: {} as Record<string, any>
  };

  const uniqueOrderIds = new Set();

  analyticsEvents.forEach((event: any) => {
    const component = event.component || 'unknown';

    if (!aggregatedData.components[component]) {
      aggregatedData.components[component] = {
        impressions: 0,
        clicks: 0,
        addToCarts: 0,
        conversions: 0,
        revenue: 0
      };
    }

    if (event.eventType === 'impression') {
      aggregatedData.components[component].impressions++;
      aggregatedData.totalImpressions++;
    }
    if (event.eventType === 'click') {
      aggregatedData.components[component].clicks++;
      aggregatedData.totalClicks++;
    }
    if (event.eventType === 'add_to_cart') {
      aggregatedData.components[component].addToCarts++;
      aggregatedData.totalAddToCart++;
    }
    if (event.eventType === 'conversion') {
      aggregatedData.components[component].conversions++;
      const value = Number(event.value || 0);
      aggregatedData.components[component].revenue += value;
      aggregatedData.totalRevenue += value;
      if (event.orderId) uniqueOrderIds.add(event.orderId);
    }

    // Product Metrics
    if (event.productId) {
      if (!aggregatedData.products[event.productId]) {
        aggregatedData.products[event.productId] = {
          id: event.productId,
          impressions: 0,
          clicks: 0,
          addToCarts: 0,
          revenue: 0
        };
      }
      if (event.eventType === 'impression') aggregatedData.products[event.productId].impressions++;
      if (event.eventType === 'click') aggregatedData.products[event.productId].clicks++;
      if (event.eventType === 'add_to_cart') aggregatedData.products[event.productId].addToCarts++;
      if (event.eventType === 'conversion') aggregatedData.products[event.productId].revenue += Number(event.value || 0);
    }
  });

  aggregatedData.totalOrders = uniqueOrderIds.size;

  // Get current active subscription details
  const currentSubscription = appSubscriptions.length > 0 ? appSubscriptions[0] : null;

  return json({
    currentSubscription,
    shop,
    appEmbedEnabled,
    shopDomain: process.env.SHOPIFY_SHOP_DOMAIN || 'admin.shopify.com',
    apiKey: process.env.SHOPIFY_API_KEY || '',
    analytics: aggregatedData,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // Redirect to billing page for plan selection
  return redirect("/app/billing");
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const { currentSubscription, appEmbedEnabled, shopDomain, apiKey, analytics } = data;

  // User has active subscription (loader redirects if not), show dashboard
  const rows = Object.values(analytics.products).map((product: any) => [
    product.id,
    product.impressions,
    product.clicks,
    product.addToCarts,
    product.revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
  ]);

  return (
    <Page>
      <TitleBar title="Selldrawer AI Dashboard" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingLg">
                      Welcome to Selldrawer AI 🎉
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Your intelligent cart drawer is ready! Get started by customizing your cart features.
                    </Text>
                  </BlockStack>
                  {currentSubscription && (
                    <Badge tone="success">
                      {currentSubscription.name || "Active Plan"}
                    </Badge>
                  )}
                </InlineStack>

                {/* App Embed Status Banner */}
                {!appEmbedEnabled && (
                  <Banner
                    title={"Selldrawer Disabled"}
                    tone={"warning"}
                  >
                    <BlockStack gap="200">
                      <>
                        <Text as="p" variant="bodyMd">
                          Now that you've installed Selldrawer, you need to enable the <strong>Selldrawer Bridge</strong> in your Shopify theme. This will not set your cart live yet.
                        </Text>
                        <BlockStack gap="100">
                          <Text as="p" variant="bodyMd" fontWeight="semibold">
                            1. Click the button below to enable the Selldrawer Bridge from your theme editor.
                          </Text>
                          <Text as="p" variant="bodyMd" fontWeight="semibold">
                            2. Ensure the Selldrawer Bridge is toggled on and click save.
                          </Text>
                        </BlockStack>
                        <Box paddingBlockStart="300">
                          <Button
                            variant="primary"
                            url={`https://${shopDomain}/admin/themes/current/editor?context=apps&activateAppId=${apiKey}/cart-drawer-embed`}
                            target="_blank"
                          >
                            Enable Selldrawer Bridge
                          </Button>
                        </Box>
                      </>
                    </BlockStack>
                  </Banner>
                )}

                <Divider />

                {/* Analytics Dashboard */}
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    Analytics Overview (Last 30 Days)
                  </Text>

                  <InlineStack gap="400" align="start">
                    <div style={{ flex: 1 }}>
                      <Card>
                        <BlockStack gap="200">
                          <Text as="h3" variant="headingSm" tone="subdued">Upsell Revenue</Text>
                          <Text as="p" variant="headingXl">
                            {analytics.totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                          </Text>
                        </BlockStack>
                      </Card>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Card>
                        <BlockStack gap="200">
                          <Text as="h3" variant="headingSm" tone="subdued">Orders with Upsell</Text>
                          <Text as="p" variant="headingXl">
                            {analytics.totalOrders}
                          </Text>
                        </BlockStack>
                      </Card>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Card>
                        <BlockStack gap="200">
                          <Text as="h3" variant="headingSm" tone="subdued">Add to Carts</Text>
                          <Text as="p" variant="headingXl">
                            {analytics.totalAddToCart}
                          </Text>
                        </BlockStack>
                      </Card>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Card>
                        <BlockStack gap="200">
                          <Text as="h3" variant="headingSm" tone="subdued">CTR</Text>
                          <Text as="p" variant="headingXl">
                            {analytics.totalImpressions > 0
                              ? ((analytics.totalClicks / analytics.totalImpressions) * 100).toFixed(1) + '%'
                              : '0%'}
                          </Text>
                        </BlockStack>
                      </Card>
                    </div>
                  </InlineStack>

                  <Divider />

                  <Text as="h3" variant="headingMd">
                    Performance by Component
                  </Text>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e1e3e5' }}>
                          <th style={{ padding: '12px' }}>Component</th>
                          <th style={{ padding: '12px' }}>Impressions</th>
                          <th style={{ padding: '12px' }}>Clicks</th>
                          <th style={{ padding: '12px' }}>CTR</th>
                          <th style={{ padding: '12px' }}>Add to Cart</th>
                          <th style={{ padding: '12px' }}>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(analytics.components).map(([name, data]: [string, any]) => (
                          <tr key={name} style={{ borderBottom: '1px solid #f1f2f3' }}>
                            <td style={{ padding: '12px', textTransform: 'capitalize' }}>{name.replace(/_/g, ' ')}</td>
                            <td style={{ padding: '12px' }}>{data.impressions}</td>
                            <td style={{ padding: '12px' }}>{data.clicks}</td>
                            <td style={{ padding: '12px' }}>
                              {data.impressions > 0 ? ((data.clicks / data.impressions) * 100).toFixed(1) + '%' : '0%'}
                            </td>
                            <td style={{ padding: '12px' }}>{data.addToCarts}</td>
                            <td style={{ padding: '12px' }}>
                              {data.revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                            </td>
                          </tr>
                        ))}
                        {Object.keys(analytics.components).length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#6d7175' }}>
                              No data available yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Divider />

                  <Text as="h3" variant="headingMd">
                    Product Performance
                  </Text>
                  <Card>
                    <DataTable
                      columnContentTypes={[
                        'text',
                        'numeric',
                        'numeric',
                        'numeric',
                        'numeric',
                      ]}
                      headings={[
                        'Product ID',
                        'Impressions',
                        'Clicks',
                        'Add to Cart',
                        'Revenue',
                      ]}
                      rows={rows.length > 0 ? rows : [['No data', 0, 0, 0, '$0.00']]}
                    />
                  </Card>
                </BlockStack>

                <Divider />

                {/* CTA to Cart Drawer */}
                <InlineStack align="center" gap="400">
                  <Button
                    variant="primary"
                    size="large"
                    onClick={() => navigate("/app/cart-drawer")}
                  >
                    Customize Your Cart Drawer
                  </Button>
                  <Button
                    size="large"
                    onClick={() => navigate("/app/billing")}
                  >
                    Manage Billing
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
