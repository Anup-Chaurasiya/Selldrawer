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
import { BILLING_PLANS, getPlanById } from "../utils/billingPlans";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  
  const url = new URL(request.url);
  const billingStatus = url.searchParams.get("billing");

  const subscription = await prisma.appSubscription.findUnique({
    where: { shop },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const orderCount = await prisma.analyticsEvent.count({
    where: {
      shop,
      eventType: 'conversion',
      createdAt: { gte: startOfMonth }
    }
  });

  return json({ 
    subscription,
    plans: BILLING_PLANS.filter(p => p.id !== 'trial'),
    orderCount,
    billingStatus,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;
  const planId = formData.get("planId") as string;

  try {
    if (actionType === "cancel") {
      await prisma.appSubscription.update({
        where: { shop },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      });

      return json({ success: true, message: "Subscription cancelled successfully" });
    }

    if (actionType === "subscribe" || actionType === "upgrade" || actionType === "downgrade") {
      const plan = getPlanById(planId);
      if (!plan) {
        return json({ error: "Invalid plan" }, { status: 400 });
      }

      const url = new URL(request.url);
      const host = url.searchParams.get("host") || request.headers.get("shopify-app-host");
      
      const appUrl = process.env.SHOPIFY_APP_URL;
      const returnUrl = `${appUrl}/app/billing/callback?shop=${shop}&plan=${planId}${host ? `&host=${host}` : ''}`;
      
      let confirmationUrl: string;
      
      try {
        const billingResponse = await billing.request({
          plan: planId as any,
          isTest: true,
          returnUrl,
        });
        
        confirmationUrl = (billingResponse as any).confirmationUrl;
      } catch (error: any) {
        // Handle 401 response with confirmation URL in header
        if (error.status === 401 && error.headers) {
          const reauthorizeUrl = error.headers.get('X-Shopify-API-Request-Failure-Reauthorize-Url');
          if (reauthorizeUrl) {
            confirmationUrl = reauthorizeUrl;
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
      
      await prisma.appSubscription.upsert({
        where: { shop },
        create: {
          shop,
          planId,
          planName: plan.name,
          status: "PENDING",
          amount: plan.monthlyPrice,
          currencyCode: "USD",
          interval: "EVERY_30_DAYS",
          trialDays: 14,
          shopifyConfirmationUrl: confirmationUrl,
        },
        update: {
          planId,
          planName: plan.name,
          status: "PENDING",
          amount: plan.monthlyPrice,
          shopifyConfirmationUrl: confirmationUrl,
          updatedAt: new Date(),
        },
      });

      return json({ 
        confirmationUrl,
        requiresRedirect: true 
      });
    }

    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Billing error:", error);
    return json({ error: error.message || "Failed to process billing" }, { status: 500 });
  }
};

export default function Billing() {
  const { subscription, plans, orderCount, billingStatus } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const shopify = useAppBridge();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());

  const isSubmitting = navigation.state === "submitting";

  const togglePlanFeatures = (planId: string) => {
    setExpandedPlans(prev => {
      const newSet = new Set(prev);
      if (newSet.has(planId)) {
        newSet.delete(planId);
      } else {
        newSet.add(planId);
      }
      return newSet;
    });
  };

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
      if ('requiresRedirect' in actionData && actionData.requiresRedirect) {
        const data = actionData as any;
        if (data.confirmationUrl) {
          if (window.top) {
            window.top.location.href = data.confirmationUrl;
          } else {
            window.location.href = data.confirmationUrl;
          }
        }
      } else if ('success' in actionData && actionData.success) {
        if ('message' in actionData) {
          shopify.toast.show((actionData as any).message || "Action completed successfully");
        }
      } else if ('error' in actionData) {
        shopify.toast.show((actionData as any).error, { isError: true });
      }
    }
  }, [actionData, shopify]);

  const currentPlan = subscription ? getPlanById(subscription.planId) : null;
  const isTrialActive = subscription?.trialEndsAt ? new Date(subscription.trialEndsAt) > new Date() : false;

  const handlePlanSelect = (planId: string, actionType: string) => {
    setSelectedPlanId(planId);
    const formData = new FormData();
    formData.append("planId", planId);
    formData.append("actionType", actionType);
    submit(formData, { method: "post" });
  };

  const handleCancel = () => {
    const formData = new FormData();
    formData.append("actionType", "cancel");
    submit(formData, { method: "post" });
    setShowCancelModal(false);
  };

  const orderLimit = currentPlan ? (currentPlan.orderCap.includes('<2000') ? 2000 : currentPlan.orderCap.includes('50') ? 50 : Infinity) : 0;
  const orderPercentage = orderLimit !== Infinity ? (orderCount / orderLimit) * 100 : 0;

  return (
    <Page>
      <TitleBar title="Billing & Plans" />
      <BlockStack gap="500">
        {subscription && currentPlan && (
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingLg">Current Plan</Text>
                    {subscription.status === "ACTIVE" ? (
                      <Badge tone="success">Active</Badge>
                    ) : subscription.status === "CANCELLED" ? (
                      <Badge tone="critical">Cancelled</Badge>
                    ) : (
                      <Badge>Pending</Badge>
                    )}
                  </InlineStack>

                  <Divider />

                  <Layout>
                    <Layout.Section variant="oneThird">
                      <BlockStack gap="200">
                        <Text as="p" variant="bodyMd" tone="subdued">Plan</Text>
                        <Text as="h3" variant="headingMd">{currentPlan.name}</Text>
                        <Text as="p" variant="bodyMd" tone="subdued">{currentPlan.tagline}</Text>
                      </BlockStack>
                    </Layout.Section>
                    
                    <Layout.Section variant="oneThird">
                      <BlockStack gap="200">
                        <Text as="p" variant="bodyMd" tone="subdued">Price</Text>
                        <Text as="h3" variant="headingMd">${currentPlan.monthlyPrice}/month</Text>
                        <Text as="p" variant="bodySm" tone="subdued">${currentPlan.annualPrice}/year</Text>
                      </BlockStack>
                    </Layout.Section>

                    <Layout.Section variant="oneThird">
                      <BlockStack gap="200">
                        <Text as="p" variant="bodyMd" tone="subdued">Order Usage</Text>
                        <Text as="h3" variant="headingMd">
                          {orderCount} / {orderLimit === Infinity ? '∞' : orderLimit}
                        </Text>
                        {orderLimit !== Infinity && (
                          <Box paddingBlockStart="200">
                            <ProgressBar 
                              progress={Math.min(orderPercentage, 100)} 
                            />
                          </Box>
                        )}
                      </BlockStack>
                    </Layout.Section>
                  </Layout>

                  {isTrialActive && subscription.trialEndsAt && (
                    <Banner tone="info">
                      Your free trial ends on {new Date(subscription.trialEndsAt).toLocaleDateString()}. 
                      You won't be charged until then.
                    </Banner>
                  )}

                  {orderPercentage > 80 && orderLimit !== Infinity && (
                    <Banner tone="warning">
                      You're approaching your monthly order limit. Consider upgrading to avoid interruptions.
                    </Banner>
                  )}

                  {subscription.status === "ACTIVE" && (
                    <InlineStack align="start">
                      <Button tone="critical" onClick={() => setShowCancelModal(true)}>
                        Cancel Subscription
                      </Button>
                    </InlineStack>
                  )}
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        )}

        <Layout>
          <Layout.Section>
            <BlockStack gap="300">
              <Text as="h2" variant="headingLg">
                {subscription ? "Change Your Plan" : "Choose a Plan"}
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                All plans include a 14-day free trial. Cancel anytime.
              </Text>
            </BlockStack>
          </Layout.Section>
        </Layout>

        <Layout>
          {plans.map((plan) => {
            const isCurrent = subscription?.planId === plan.id;
            const canUpgrade = subscription && currentPlan && plan.monthlyPrice > currentPlan.monthlyPrice;
            const canDowngrade = subscription && currentPlan && plan.monthlyPrice < currentPlan.monthlyPrice;
            const isLoading = isSubmitting && selectedPlanId === plan.id;

            return (
              <Layout.Section key={plan.id} variant="oneThird">
                <Card>
                  <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="start">
                      <BlockStack gap="100">
                        <InlineStack gap="200" blockAlign="center">
                          <Text as="h3" variant="headingMd">{plan.name}</Text>
                          {plan.isPopular && <Badge tone="info">Popular</Badge>}
                          {isCurrent && <Badge tone="success">Current</Badge>}
                        </InlineStack>
                        <Text as="p" variant="bodySm" tone="subdued">{plan.tagline}</Text>
                      </BlockStack>
                    </InlineStack>

                    <Divider />

                    <BlockStack gap="100">
                      <Text as="h2" variant="heading2xl">
                        ${plan.monthlyPrice}
                        <Text as="span" variant="bodyLg" tone="subdued">/mo</Text>
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        or ${plan.annualPrice}/year (save ${(plan.monthlyPrice * 12) - plan.annualPrice})
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued" fontWeight="medium">
                        {plan.orderCap}
                      </Text>
                    </BlockStack>

                    <Divider />

                    <BlockStack gap="200">
                      <Text as="h4" variant="headingSm">Key Features</Text>
                      <BlockStack gap="150">
                        {(expandedPlans.has(plan.id) ? plan.features : plan.features.slice(0, 6)).map((feature, index) => (
                          <InlineStack key={index} gap="200" blockAlign="center">
                            <Box minWidth="20px">
                              <Icon source={CheckIcon} tone="success" />
                            </Box>
                            <Text as="p" variant="bodySm">{feature}</Text>
                          </InlineStack>
                        ))}
                        {plan.features.length > 6 && (
                          <Button
                            variant="plain"
                            onClick={() => togglePlanFeatures(plan.id)}
                          >
                            {expandedPlans.has(plan.id) 
                              ? "Show less" 
                              : `+ ${plan.features.length - 6} more features`
                            }
                          </Button>
                        )}
                      </BlockStack>
                    </BlockStack>

                    <Box paddingBlockStart="200">
                      {isCurrent ? (
                        <Button size="large" fullWidth disabled>
                          Current Plan
                        </Button>
                      ) : (
                        <Button
                          variant={plan.isPopular ? "primary" : "secondary"}
                          size="large"
                          fullWidth
                          loading={isLoading}
                          disabled={isSubmitting && !isLoading}
                          onClick={() => {
                            const actionType = subscription 
                              ? (canUpgrade ? "upgrade" : canDowngrade ? "downgrade" : "subscribe")
                              : "subscribe";
                            handlePlanSelect(plan.id, actionType);
                          }}
                        >
                          {subscription 
                            ? (canUpgrade ? "Upgrade" : canDowngrade ? "Downgrade" : "Switch Plan")
                            : "Start Free Trial"
                          }
                        </Button>
                      )}
                    </Box>
                  </BlockStack>
                </Card>
              </Layout.Section>
            );
          })}
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
