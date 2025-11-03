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
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { CheckIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing, session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  // Check if shop has active subscription
  const subscription = await prisma.appSubscription.findUnique({
    where: { shop },
  });

  // Check if app embed is enabled
  let appEmbedEnabled = false;
  try {
    const response = await admin.graphql(
      `#graphql
        query {
          app {
            installation {
              activeSubscriptions {
                id
                name
                status
                trialDays
                currentPeriodEnd
              }
            }
          }
        }
      `
    );
    const data = await response.json();
    
    // Check theme app extensions status
    const themeResponse = await admin.graphql(
      `#graphql
        query {
          app {
            installation {
              launchUrl
            }
          }
        }
      `
    );
    
    // For now, we'll assume app embed is disabled by default
    // In production, you'd query the theme to check if the app embed block is enabled
    appEmbedEnabled = false;
  } catch (error) {
    console.error("Error checking app embed status:", error);
  }

  // Get available plans from billing configuration
  const plans = [
    {
      id: "growth",
      name: "Growth plan",
      price: "$29.99",
      interval: "month",
      trial: "14 days",
      features: [
        "High converting cart",
        "Customizable design",
        "Countdown and announcements",
        "Motivator bar for free shipping and discounts",
        "Upsells and add-ons",
        "Discount codes",
        "Notes",
        "Recommended for most stores",
      ],
      isPopular: true,
      maxPrice: "$199.99",
      scalingNote: "Charges increase based on store orders up to a maximum of $199.99/month.",
    },
    {
      id: "enterprise",
      name: "Enterprise plan",
      price: "$299.00",
      interval: "month",
      trial: "14 days",
      features: [
        "High converting cart",
        "Customizable design",
        "Countdown and announcements",
        "Motivator bar for free shipping and discounts",
        "Upsells and add-ons",
        "Discount codes",
        "Notes",
        "Priority support in-app and via email",
      ],
      isPopular: false,
      scalingNote: "Fixed price of $299.00/month. Charges do not scale with orders. This should only be considered by larger stores.",
    },
  ];

  return json({ 
    subscription, 
    hasActiveSubscription: !!subscription && subscription.status === "ACTIVE",
    shop,
    plans,
    appEmbedEnabled,
    shopDomain: process.env.SHOPIFY_SHOP_DOMAIN || 'admin.shopify.com',
    apiKey: process.env.SHOPIFY_API_KEY || '',
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const planId = formData.get("planId") as string;

  console.log("Billing action - planId:", planId, "shop:", shop);

  if (!planId) {
    return json({ error: "Plan ID is required" }, { status: 400 });
  }

  try {
    // Check if already has subscription
    const existingSubscription = await prisma.appSubscription.findUnique({
      where: { shop },
    });

    if (existingSubscription && existingSubscription.status === "ACTIVE") {
      console.log("Already has active subscription, redirecting to cart-drawer");
      return redirect("/app/cart-drawer");
    }

    // Get the host parameter for proper embedding
    const url = new URL(request.url);
    const host = url.searchParams.get("host") || request.headers.get("shopify-app-host");
    
    // Create proper return URL that will redirect back to the embedded app
    const appUrl = process.env.SHOPIFY_APP_URL;
    const returnUrl = `${appUrl}/app/billing/callback?shop=${shop}&plan=${planId}${host ? `&host=${host}` : ''}`;
    
    console.log("Billing action - returnUrl:", returnUrl);
    console.log("Billing action - host:", host);
    
    // Create a subscription charge
    let confirmationUrl: string;
    
    try {
      const billingResult = await billing.request({
        plan: planId,
        isTest: true, // Set to false in production
        returnUrl,
      });
      
      confirmationUrl = billingResult.confirmationUrl;
      console.log("Billing request successful, confirmationUrl:", confirmationUrl);
    } catch (billingError: any) {
      console.error("Billing request error:", billingError);
      
      // Handle 302 redirect response (normal for embedded apps)
      if (billingError.status === 302 && billingError.headers) {
        const location = billingError.headers.get?.('Location') || billingError.headers.get?.('location');
        console.log("Got 302 redirect, Location header:", location);
        
        if (location) {
          // If it's an exit-iframe URL, extract the exitIframe parameter
          if (location.includes('/auth/exit-iframe')) {
            const exitIframeMatch = location.match(/exitIframe=([^&]+)/);
            if (exitIframeMatch) {
              confirmationUrl = decodeURIComponent(exitIframeMatch[1]);
              console.log("Extracted confirmation URL from exitIframe:", confirmationUrl);
            } else {
              // Use the full location URL as-is
              confirmationUrl = `${appUrl}${location}`;
              console.log("Using full exit-iframe URL:", confirmationUrl);
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
          console.log("Got reauthorize URL:", confirmationUrl);
        } else {
          throw billingError;
        }
      } else {
        throw billingError;
      }
    }

    // Store pending subscription in database
    await prisma.appSubscription.upsert({
      where: { shop },
      create: {
        shop,
        planId,
        planName: planId === "growth" ? "Growth plan" : "Enterprise plan",
        status: "PENDING",
        amount: planId === "growth" ? 29.99 : 299.0,
        currencyCode: "USD",
        interval: "EVERY_30_DAYS",
        trialDays: 14,
        shopifyConfirmationUrl: confirmationUrl,
      },
      update: {
        planId,
        planName: planId === "growth" ? "Growth plan" : "Enterprise plan",
        status: "PENDING",
        amount: planId === "growth" ? 29.99 : 299.0,
        shopifyConfirmationUrl: confirmationUrl,
        updatedAt: new Date(),
      },
    });
    
    console.log("Subscription stored in DB as PENDING");
    
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
  const { hasActiveSubscription, plans, appEmbedEnabled, shopDomain, apiKey } = useLoaderData<typeof loader>();
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
      console.log("Billing was cancelled");
      shopify.toast.show("Subscription was cancelled. Please try again if you'd like to continue.", {
        isError: false,
      });
    }
  }, [shopify]);

  // Handle billing confirmation redirect
  useEffect(() => {
    if (actionData && 'requiresRedirect' in actionData && actionData.requiresRedirect && 'confirmationUrl' in actionData && actionData.confirmationUrl) {
      console.log("Redirecting to confirmation URL:", actionData.confirmationUrl);
      // Use window.top to break out of iframe and redirect to Shopify billing page
      if (window.top) {
        window.top.location.href = actionData.confirmationUrl;
      } else {
        window.location.href = actionData.confirmationUrl;
      }
    }
  }, [actionData]);

  // If user has active subscription, show dashboard instead of pricing
  if (hasActiveSubscription) {
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
                  <Banner
                    title={appEmbedEnabled ? "Upsellity Enabled" : "Upsellity Disabled"}
                    tone={appEmbedEnabled ? "success" : "warning"}
                  >
                    <BlockStack gap="200">
                      {appEmbedEnabled ? (
                        <Text as="p" variant="bodyMd">
                          Your Upsellity app embed is active and running on your store.
                        </Text>
                      ) : (
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
                      )}
                    </BlockStack>
                  </Banner>

                  <Divider />

                  {/* Quick Stats - Placeholder for analytics */}
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">
                      Analytics Overview
                    </Text>
                    <div style={{ 
                      padding: '40px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '12px',
                      color: 'white',
                      textAlign: 'center'
                    }}>
                      <Text as="p" variant="headingLg" tone="inherit">
                        📊 Analytics Coming Soon
                      </Text>
                      <Box paddingBlockStart="200">
                        <Text as="p" variant="bodyMd" tone="inherit">
                          Track your cart performance, conversion rates, and revenue impact here.
                        </Text>
                      </Box>
                    </div>
                  </BlockStack>

                  <Divider />

                  {/* CTA to Cart Drawer */}
                  <InlineStack align="center">
                    <Button
                      variant="primary"
                      size="large"
                      onClick={() => navigate("/app/cart-drawer")}
                    >
                      Customize Your Cart Drawer
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
            <Layout.Section key={plan.id} variant={plan.id === "growth" ? "oneHalf" : "oneHalf"}>
              <Card>
                <BlockStack gap="400">
                  {/* Plan Header */}
                  <InlineStack align="space-between" blockAlign="start">
                    <Text as="h2" variant="headingLg">
                      {plan.name}
                    </Text>
                    {plan.isPopular && (
                      <Badge tone="info">Most popular</Badge>
                    )}
                  </InlineStack>

                  <Divider />

                  {/* Pricing */}
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">
                      Pricing
                    </Text>
                    <Text as="p" variant="bodyMd">
                      Starting from <strong>{plan.price}/month</strong>.{" "}
                      {plan.id === "growth" && "maxPrice" in plan && (
                        <>
                          Charges{" "}
                          <a
                            href="#"
                            style={{ color: "#005bd3", textDecoration: "underline" }}
                          >
                            increase based on store orders
                          </a>{" "}
                          up to a maximum of {plan.maxPrice}/month.
                        </>
                      )}
                      {plan.id === "enterprise" && (
                        <>
                          Fixed price of {plan.price}/month. Charges do not scale with orders. This should only be considered by larger stores.
                        </>
                      )}
                    </Text>
                  </BlockStack>

                  <Divider />

                  {/* Features */}
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">
                      Features
                    </Text>
                    <BlockStack gap="200">
                      {plan.features.map((feature, index) => (
                        <InlineStack key={index} gap="200" blockAlign="start">
                          <Box>
                            <Icon source={CheckIcon} tone="success" />
                          </Box>
                          <Text as="p" variant="bodyMd">
                            {feature}
                          </Text>
                        </InlineStack>
                      ))}
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
