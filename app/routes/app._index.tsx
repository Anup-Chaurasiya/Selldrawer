import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, useNavigation, useActionData, Form, useSubmit } from "@remix-run/react";
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
import { CheckIcon, AlertCircleIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { checkAppEmbedEnabled } from "../utils/appEmbed.server";
import { requireBilling } from "../utils/billing.server";
import { ensureStorefrontAccessToken } from "../utils/storefrontToken.server";
import { createFBTFunctionDiscount, getFBTFunctionId, verifyDiscountExists } from "../utils/fbt-discount.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing, session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  // Get URL params to preserve them in redirects
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();

  // Check billing - if no active payment, redirect directly to our internal billing page router
  const billingRedirectUrl = await requireBilling(billing);
  if (billingRedirectUrl) {
    // Preserve URL parameters in the redirect
    return redirect(`/app/billing${searchParams ? `?${searchParams}` : ''}`);
  }

  // Get subscription details
  const { appSubscriptions } = await billing.check();

  // Ensure Storefront Access Token exists (create if missing)
  try {
    await ensureStorefrontAccessToken(request);
  } catch (error) {
    // Don't block app loading if token creation fails
  }

  // Check if app embed is enabled
  const appEmbedEnabled = await checkAppEmbedEnabled(admin, session);

  // Check discount function activation status
  let appSettings = await prisma.appSettings.findUnique({
    where: { shop }
  });

  if (!appSettings) {
    appSettings = await prisma.appSettings.create({
      data: { 
        id: shop, // Use shop as id for consistency
        shop,
        updatedAt: new Date()
      }
    });
  }

  // Verify the discount actually exists in Shopify
  let discountFunctionActivated = appSettings.discountFunctionActivated;
  if (discountFunctionActivated && appSettings.discountId) {
    const discountExists = await verifyDiscountExists(admin, appSettings.discountId);
    if (!discountExists) {
      // Discount was deleted in Shopify, update our database
      console.log("[app._index] Discount no longer exists, updating database");
      await prisma.appSettings.update({
        where: { shop },
        data: {
          discountFunctionActivated: false,
          discountId: null,
          updatedAt: new Date()
        }
      });
      discountFunctionActivated = false;
    }
  }

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
    discountFunctionActivated,
    shopDomain: process.env.SHOPIFY_SHOP_DOMAIN || 'admin.shopify.com',
    apiKey: process.env.SHOPIFY_API_KEY || '',
    analytics: aggregatedData,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "activate-discount") {
    try {
      // Check if function exists
      const functionId = await getFBTFunctionId(admin);

      if (!functionId) {
        return json({
          success: false,
          error: "Discount function not found. The function was just deployed and may take a few minutes to become available. Please wait 2-3 minutes and try again, or check the server logs for available functions."
        });
      }

      // Create the automatic discount
      const discountId = await createFBTFunctionDiscount(admin, shop);

      if (!discountId) {
        return json({
          success: false,
          error: "Failed to create automatic discount. Check server logs for details."
        });
      }

      // Update app settings
      await prisma.appSettings.upsert({
        where: { shop },
        create: {
          id: shop, // Use shop as the id since it's unique
          shop,
          discountFunctionActivated: true,
          discountFunctionId: functionId,
          discountId: discountId,
          updatedAt: new Date()
        },
        update: {
          discountFunctionActivated: true,
          discountFunctionId: functionId,
          discountId: discountId,
          updatedAt: new Date()
        }
      });

      return json({
        success: true,
        message: "Discount function activated successfully!"
      });
    } catch (error) {
      console.error("Error activating discount:", error);
      return json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  }

  // Redirect to billing page for plan selection
  return redirect("/app/billing");
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();

  const { currentSubscription, appEmbedEnabled, discountFunctionActivated, shopDomain, apiKey, analytics } = data;

  const isActivatingDiscount = navigation.state === "submitting" && navigation.formData?.get("intent") === "activate-discount";

  const handleActivateDiscount = () => {
    const formData = new FormData();
    formData.append("intent", "activate-discount");
    submit(formData, { method: "post" });
  };

  const openThemeEditor = () => {
    window.open(`https://${shopDomain}/admin/themes/current/editor?context=apps&activateAppId=${apiKey}/cart-drawer-embed`, '_blank', 'noopener,noreferrer');
  };

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
                            onClick={openThemeEditor}
                          >
                            Enable Selldrawer Bridge
                          </Button>
                        </Box>
                      </>
                    </BlockStack>
                  </Banner>
                )}

                {/* Discount Function Activation Banner */}
                {!discountFunctionActivated && (
                  <Banner
                    title="Activate Automatic Discounts"
                    tone="info"
                  >
                    <BlockStack gap="300">
                      <Text as="p" variant="bodyMd">
                        Enable automatic discounts for FBT bundles, milestones, and gift rewards. This is a one-time setup that creates a single discount in your Shopify admin called <strong>"Selldrawer Automatic Discounts"</strong>.
                      </Text>
                      {actionData && !actionData.success && (
                        <Banner tone="critical">
                          <Text as="p" variant="bodyMd">
                            {actionData.error}
                          </Text>
                        </Banner>
                      )}
                      {actionData && actionData.success && (
                        <Banner tone="success">
                          <Text as="p" variant="bodyMd">
                            {actionData.message}
                          </Text>
                        </Banner>
                      )}
                      <Box>
                        <Button
                          variant="primary"
                          onClick={handleActivateDiscount}
                          loading={isActivatingDiscount}
                        >
                          Activate Automatic Discounts
                        </Button>
                      </Box>
                    </BlockStack>
                  </Banner>
                )}

                {discountFunctionActivated && (
                  <Banner tone="success">
                    <InlineStack gap="200" blockAlign="center">
                      <Icon source={CheckIcon} tone="success" />
                      <Text as="p" variant="bodyMd">
                        Automatic discounts are active. Your FBT bundles, milestones, and gift rewards will automatically apply discounts at checkout.
                      </Text>
                    </InlineStack>
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
