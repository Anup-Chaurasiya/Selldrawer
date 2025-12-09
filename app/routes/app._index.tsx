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
import { BILLING_PLANS } from "../utils/billingPlans";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing, session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  // Check if shop has active subscription
  const subscription = await prisma.appSubscription.findUnique({
    where: { shop },
  });

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

  // Get available plans from billing configuration
  const plans = BILLING_PLANS;

  return json({ 
    subscription, 
    hasActiveSubscription: !!subscription && subscription.status === "ACTIVE",
    shop,
    plans: plans.filter(p => p.id !== 'trial'), // Don't show trial plan in selection
    appEmbedEnabled,
    shopDomain: process.env.SHOPIFY_SHOP_DOMAIN || 'admin.shopify.com',
    apiKey: process.env.SHOPIFY_API_KEY || '',
    analytics: aggregatedData,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const planId = formData.get("planId") as string;


  if (!planId) {
    return json({ error: "Plan ID is required" }, { status: 400 });
  }

  try {
    // Check if already has subscription
    const existingSubscription = await prisma.appSubscription.findUnique({
      where: { shop },
    });

    if (existingSubscription && existingSubscription.status === "ACTIVE") {
      return redirect("/app/cart-drawer");
    }

    // Get the host parameter for proper embedding
    const url = new URL(request.url);
    const host = url.searchParams.get("host") || request.headers.get("shopify-app-host");
    
    // Create proper return URL that will redirect back to the embedded app
    const appUrl = process.env.SHOPIFY_APP_URL;
    const returnUrl = `${appUrl}/app/billing/callback?shop=${shop}&plan=${planId}${host ? `&host=${host}` : ''}`;
    
    
    // Create a subscription charge
    let confirmationUrl: string;
    
    try {
      const billingResult = await billing.request({
        plan: planId,
        isTest: true, // Set to false in production
        returnUrl,
      });
      
      confirmationUrl = billingResult.confirmationUrl;
    } catch (billingError: any) {
      console.error("Billing request error:", billingError);
      
      // Handle 302 redirect response (normal for embedded apps)
      if (billingError.status === 302 && billingError.headers) {
        const location = billingError.headers.get?.('Location') || billingError.headers.get?.('location');
        
        if (location) {
          // If it's an exit-iframe URL, extract the exitIframe parameter
          if (location.includes('/auth/exit-iframe')) {
            const exitIframeMatch = location.match(/exitIframe=([^&]+)/);
            if (exitIframeMatch) {
              confirmationUrl = decodeURIComponent(exitIframeMatch[1]);
            } else {
              // Use the full location URL as-is
              confirmationUrl = `${appUrl}${location}`;
            }
          } else {
            confirmationUrl = location;
          }
        } else {
          throw new Error("No Location header found in 302 response");
        }
      }
      // Shopify billing API may also return 401 with the confirmation URL in headers
      else if (billingError.status === 401 && billingError.headers) {
        const reauthorizeUrl = billingError.headers.get?.('X-Shopify-API-Request-Failure-Reauthorize-Url');
        
        if (reauthorizeUrl) {
          confirmationUrl = reauthorizeUrl;
        } else {
          throw billingError;
        }
      } else {
        throw billingError;
      }
    }

      // Store pending subscription in database
      const selectedPlan = BILLING_PLANS.find(p => p.id === planId);
      await prisma.appSubscription.upsert({
        where: { shop },
        create: {
          shop,
          planId,
          planName: selectedPlan?.name || planId,
          status: "PENDING",
          amount: selectedPlan?.monthlyPrice || 0,
          currencyCode: "USD",
          interval: "EVERY_30_DAYS",
          trialDays: 14,
          shopifyConfirmationUrl: confirmationUrl,
        },
        update: {
          planId,
          planName: selectedPlan?.name || planId,
          status: "PENDING",
          amount: selectedPlan?.monthlyPrice || 0,
          shopifyConfirmationUrl: confirmationUrl,
          updatedAt: new Date(),
        },
      });
    
    
    // Return confirmation URL for frontend redirect
    return json({ 
      confirmationUrl,
      requiresRedirect: true 
    }, {
      headers: {
        'X-Shopify-API-Request-Failure-Reauthorize': '1',
        'X-Shopify-API-Request-Failure-Reauthorize-Url': confirmationUrl,
      }
    });
  } catch (error: any) {
    console.error("Billing error:", error);
    return json({ error: error.message || "Failed to process billing" }, { status: 500 });
  }
};

export default function Index() {
  const { hasActiveSubscription, plans, appEmbedEnabled, shopDomain, apiKey, analytics } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const shopify = useAppBridge();

  const isSubmitting = navigation.state === "submitting";

  // Check for billing success/error in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billingStatus = params.get("billing");
    
    if (billingStatus === "success") {
      setShowSuccessBanner(true);
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      // Reload to get updated subscription status
      window.location.reload();
    } else if (billingStatus === "error") {
      console.error("Billing error occurred");
      shopify.toast.show("There was an error processing your subscription. Please try again.", {
        isError: true,
      });
    } else if (billingStatus === "cancelled") {
      shopify.toast.show("Subscription was cancelled. Please try again if you'd like to continue.", {
        isError: false,
      });
    }
  }, [shopify]);

  // Handle billing confirmation redirect
  useEffect(() => {
    if (actionData && 'requiresRedirect' in actionData && actionData.requiresRedirect) {
      const data = actionData as { confirmationUrl?: string };
      if (data.confirmationUrl) {
        // Use window.top to break out of iframe and redirect to Shopify billing page
        if (window.top) {
          window.top.location.href = data.confirmationUrl;
        } else {
          window.location.href = data.confirmationUrl;
        }
      }
    }
  }, [actionData]);

  // If user has active subscription, show dashboard instead of pricing
  if (hasActiveSubscription) {
    const rows = Object.values(analytics.products).map((product: any) => [
      product.id,
      product.impressions,
      product.clicks,
      product.addToCarts,
      product.revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    ]);

    return (
      <Page>
        <TitleBar title="Upsellity AI Dashboard" />
        <BlockStack gap="500">
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingLg">
                    Welcome to Upsellity AI 🎉
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Your intelligent cart drawer is ready! Get started by customizing your cart features.
                  </Text>
                  
                  {/* App Embed Status Banner */}
                  {!appEmbedEnabled && (
                    <Banner
                      title={"Upsellity Disabled"}
                      tone={"warning"}
                    >
                      <BlockStack gap="200">
                          <>
                            <Text as="p" variant="bodyMd">
                              Now that you've installed Upsellity, you need to enable the <strong>Upsellity Bridge</strong> in your Shopify theme. This will not set your cart live yet.
                            </Text>
                            <BlockStack gap="100">
                              <Text as="p" variant="bodyMd" fontWeight="semibold">
                                1. Click the button below to enable the Upsellity Bridge from your theme editor.
                              </Text>
                              <Text as="p" variant="bodyMd" fontWeight="semibold">
                                2. Ensure the Upsellity Bridge is toggled on and click save.
                              </Text>
                            </BlockStack>
                            <Box paddingBlockStart="300">
                              <Button
                                variant="primary"
                                url={`https://${shopDomain}/admin/themes/current/editor?context=apps&activateAppId=${apiKey}/cart-drawer-embed`}
                                target="_blank"
                              >
                                Enable Upsellity Bridge
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

  // Show pricing page if no active subscription
  return (
    <Page>
      <BlockStack gap="500">
        {/* Header */}
        <Box paddingBlockStart="400">
          <BlockStack gap="200" inlineAlign="center">
            <Text as="h1" variant="heading2xl" alignment="center">
              Welcome to Upsellity
            </Text>
          </BlockStack>
        </Box>

        {/* Info Banner */}
        <Box paddingInline="400">
          <Banner tone="info">
            To get started, you must select a pricing plan. All plans include a 14-day free trial and are shown in USD. Uninstalling within the first 14 days avoids all charges.
          </Banner>
        </Box>

        {/* Pricing Cards */}
        <Layout>
          {plans.map((plan) => (
            <Layout.Section key={plan.id} variant="oneThird">
              <Card>
                <BlockStack gap="400">
                  {/* Plan Header */}
                  <InlineStack align="space-between" blockAlign="start">
                    <BlockStack gap="100">
                      <Text as="h2" variant="headingLg">
                        {plan.name}
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {plan.tagline}
                      </Text>
                    </BlockStack>
                    {plan.isPopular && (
                      <Badge tone="info">Most popular</Badge>
                    )}
                  </InlineStack>

                  <Divider />

                  {/* Pricing */}
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingLg">
                      ${plan.monthlyPrice}
                      <Text as="span" variant="bodyMd" tone="subdued">
                        /month
                      </Text>
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      ${plan.annualPrice}/year
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {plan.orderCap}
                    </Text>
                  </BlockStack>

                  <Divider />

                  {/* Features */}
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">
                      Features
                    </Text>
                    <BlockStack gap="200">
                      {plan.features.slice(0, 6).map((feature, index) => (
                        <InlineStack key={index} gap="200" blockAlign="start">
                          <Box>
                            <Icon source={CheckIcon} tone="success" />
                          </Box>
                          <Text as="p" variant="bodySm">
                            {feature}
                          </Text>
                        </InlineStack>
                      ))}
                      {plan.features.length > 6 && (
                        <Text as="p" variant="bodySm" tone="subdued">
                          +{plan.features.length - 6} more features
                        </Text>
                      )}
                    </BlockStack>
                  </BlockStack>

                  <Box paddingBlockStart="400">
                    <Form method="POST" onSubmit={() => setSelectedPlan(plan.id)}>
                      <input type="hidden" name="planId" value={plan.id} />
                      <Button
                        variant={plan.isPopular ? "primary" : "secondary"}
                        size="large"
                        fullWidth
                        loading={isSubmitting && selectedPlan === plan.id}
                        disabled={isSubmitting && selectedPlan !== plan.id}
                        submit
                      >
                        Start 14-day free trial
                      </Button>
                    </Form>
                  </Box>
                </BlockStack>
              </Card>
            </Layout.Section>
          ))}
        </Layout>
      </BlockStack>
    </Page>
  );
}
