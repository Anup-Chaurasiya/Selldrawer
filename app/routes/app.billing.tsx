import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, useSubmit, useNavigation } from "@remix-run/react";
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
  Modal,
  ProgressBar,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { CheckIcon, XIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { getPlanSelectionUrl } from "../utils/billing.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing, session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  
  const url = new URL(request.url);
  const billingStatus = url.searchParams.get("billing");

  // Check active subscriptions from Shopify
  const { hasActivePayment, appSubscriptions } = await billing.check();
  
  // Get the plan selection URL
  const planSelectionUrl = getPlanSelectionUrl();

  // Fetch available plans from Shopify
  const graphqlQuery = `
    query {
      currentAppInstallation {
        activeSubscriptions {
          id
          name
          status
          test
          trialDays
          currentPeriodEnd
          lineItems {
            plan {
              pricingDetails {
                ... on AppRecurringPricing {
                  price {
                    amount
                    currencyCode
                  }
                  interval
                }
              }
            }
          }
        }
        allSubscriptions(first: 20) {
          edges {
            node {
              id
              name
              status
              test
              trialDays
              lineItems {
                plan {
                  pricingDetails {
                    ... on AppRecurringPricing {
                      price {
                        amount
                        currencyCode
                      }
                      interval
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  let availablePlans: any[] = [];
  try {
    const response = await admin.graphql(graphqlQuery);
    const data = await response.json();
    
    // Extract available plans from Shopify
    if (data?.data?.currentAppInstallation?.allSubscriptions?.edges) {
      availablePlans = data.data.currentAppInstallation.allSubscriptions.edges.map((edge: any) => edge.node);
    }
  } catch (error) {
    console.error("Error fetching plans from Shopify:", error);
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const orderCount = await prisma.analyticsEvent.count({
    where: {
      shop,
      eventType: 'conversion',
      createdAt: { gte: startOfMonth }
    }
  });

  const currentSubscription = appSubscriptions.length > 0 ? appSubscriptions[0] : null;

  return json({ 
    hasActivePayment,
    currentSubscription,
    availablePlans,
    orderCount,
    billingStatus,
    planSelectionUrl,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing, session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;
  const planName = formData.get("planName") as string;

  try {
    if (actionType === "cancel") {
      // Cancel subscription via Shopify GraphQL
      const { appSubscriptions } = await billing.check();
      
      if (appSubscriptions.length > 0) {
        const subscriptionId = appSubscriptions[0].id;
        
        const mutation = `
          mutation {
            appSubscriptionCancel(id: "${subscriptionId}") {
              appSubscription {
                id
                status
              }
              userErrors {
                field
                message
              }
            }
          }
        `;
        
        const response = await admin.graphql(mutation);
        const data = await response.json();
        
        if (data?.data?.appSubscriptionCancel?.userErrors?.length > 0) {
          return json({ error: data.data.appSubscriptionCancel.userErrors[0].message }, { status: 400 });
        }
      }

      return json({ success: true, message: "Subscription cancelled successfully" });
    }

    if (actionType === "subscribe" || actionType === "upgrade" || actionType === "downgrade") {
      if (!planName) {
        return json({ error: "Plan name is required" }, { status: 400 });
      }

      // Note: With managed billing, you'll need to redirect users to Shopify's billing page
      // The actual plan creation happens in your Partner Dashboard
      return json({ 
        error: "Please configure your billing plans in the Shopify Partner Dashboard. Managed billing requires plans to be set up there first.",
        needsConfiguration: true
      }, { status: 400 });
    }

    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Billing error:", error);
    return json({ error: error.message || "Failed to process billing" }, { status: 500 });
  }
};

export default function Billing() {
  const { hasActivePayment, currentSubscription, availablePlans, orderCount, billingStatus, planSelectionUrl } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const shopify = useAppBridge();
  const [showCancelModal, setShowCancelModal] = useState(false);

  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (billingStatus === "success") {
      shopify.toast.show("Subscription updated successfully!");
      window.history.replaceState({}, "", "/app/billing");
    } else if (billingStatus === "error") {
      shopify.toast.show("There was an error processing your subscription", { isError: true });
    }
  }, [billingStatus, shopify]);

  useEffect(() => {
    if (actionData) {
      if ('success' in actionData && actionData.success) {
        if ('message' in actionData) {
          shopify.toast.show((actionData as any).message || "Action completed successfully");
        }
      } else if ('error' in actionData) {
        shopify.toast.show((actionData as any).error, { isError: true });
      }
    }
  }, [actionData, shopify]);

  const handleCancel = () => {
    const formData = new FormData();
    formData.append("actionType", "cancel");
    submit(formData, { method: "post" });
    setShowCancelModal(false);
  };

  return (
    <Page>
      <TitleBar title="Billing & Plans" />
      <BlockStack gap="500">
        {!hasActivePayment && (
          <Banner tone="warning">
            <BlockStack gap="200">
              <Text as="p" variant="bodyMd">
                You don't have an active subscription. Please subscribe to a plan to use Upsellity.
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Click the button below to view and select a pricing plan.
              </Text>
              <Box paddingBlockStart="200">
                <Button
                  variant="primary"
                  url={planSelectionUrl}
                  external
                >
                  View Pricing Plans
                </Button>
              </Box>
            </BlockStack>
          </Banner>
        )}

        {hasActivePayment && currentSubscription && (
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingLg">Current Subscription</Text>
                    <Badge tone="success">Active</Badge>
                  </InlineStack>

                  <Divider />

                  <Layout>
                    <Layout.Section variant="oneHalf">
                      <BlockStack gap="200">
                        <Text as="p" variant="bodyMd" tone="subdued">Plan</Text>
                        <Text as="h3" variant="headingMd">{currentSubscription.name || "Active Plan"}</Text>
                        {currentSubscription.test && (
                          <Badge tone="info">Test Mode</Badge>
                        )}
                      </BlockStack>
                    </Layout.Section>
                    
                    <Layout.Section variant="oneHalf">
                      <BlockStack gap="200">
                        <Text as="p" variant="bodyMd" tone="subdued">Order Usage This Month</Text>
                        <Text as="h3" variant="headingMd">{orderCount}</Text>
                      </BlockStack>
                    </Layout.Section>
                  </Layout>

                  {currentSubscription.trialDays && (
                    <Banner tone="info">
                      This subscription includes a {currentSubscription.trialDays}-day free trial.
                    </Banner>
                  )}

                  <InlineStack align="start">
                    <Button tone="critical" onClick={() => setShowCancelModal(true)}>
                      Cancel Subscription
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        )}

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  Available Plans
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Billing plans are managed through your Shopify Partner Dashboard. To add or modify plans, go to your Partner Dashboard → Apps → Your App → Pricing.
                </Text>
                
                {availablePlans.length === 0 ? (
                  <Banner tone="info">
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        No plans configured yet
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Set up your pricing plans in the Shopify Partner Dashboard to allow merchants to subscribe.
                      </Text>
                      <Box paddingBlockStart="200">
                        <Button
                          url="https://partners.shopify.com"
                          target="_blank"
                        >
                          Go to Partner Dashboard
                        </Button>
                      </Box>
                    </BlockStack>
                  </Banner>
                ) : (
                  <BlockStack gap="300">
                    {availablePlans.map((plan: any, index: number) => (
                      <Card key={plan.id || index}>
                        <BlockStack gap="200">
                          <InlineStack align="space-between" blockAlign="center">
                            <Text as="h3" variant="headingMd">{plan.name || `Plan ${index + 1}`}</Text>
                            <Badge tone={plan.status === "ACTIVE" ? "success" : "info"}>
                              {plan.status || "Available"}
                            </Badge>
                          </InlineStack>
                          {plan.lineItems && plan.lineItems.length > 0 && (
                            <Text as="p" variant="bodyMd">
                              {plan.lineItems[0].plan?.pricingDetails?.price?.amount} {plan.lineItems[0].plan?.pricingDetails?.price?.currencyCode || "USD"}
                              {plan.lineItems[0].plan?.pricingDetails?.interval && ` / ${plan.lineItems[0].plan.pricingDetails.interval}`}
                            </Text>
                          )}
                          {plan.trialDays && (
                            <Text as="p" variant="bodySm" tone="subdued">
                              Includes {plan.trialDays}-day free trial
                            </Text>
                          )}
                        </BlockStack>
                      </Card>
                    ))}
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>

      <Modal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Subscription"
        primaryAction={{
          content: "Yes, Cancel",
          destructive: true,
          onAction: handleCancel,
          loading: isSubmitting,
        }}
        secondaryActions={[
          {
            content: "Keep Subscription",
            onAction: () => setShowCancelModal(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <Text as="p" variant="bodyMd">
              Are you sure you want to cancel your subscription?
            </Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              You will lose access to all premium features immediately.
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
