import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  BlockStack,
  Text,
  Select,
  InlineStack,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useState, useCallback, useEffect, useRef } from "react";
import { FreeShippingMessage as FreeShippingMessageComponent } from "../components/shared/FreeShippingMessage";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop },
    include: {
      freeShippingMessages: { where: { isActive: true } },
    },
  });

  const freeShippingMessage = cartDrawer?.freeShippingMessages[0] || null;

  return json({ cartDrawer, freeShippingMessage });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "toggle") {
    const enabled = formData.get("enabled") === "true";

    // Check if data exists before enabling
    if (enabled) {
      const cartDrawer = await prisma.cartDrawer.findUnique({
        where: { shop },
        include: {
          freeShippingMessages: { where: { isActive: true } },
        },
      });

      if (!cartDrawer || cartDrawer.freeShippingMessages.length === 0) {
        return json({ 
          success: false, 
          error: "Configuration required. Please save the configuration first before enabling." 
        }, { status: 400 });
      }
    }
    
    await prisma.cartDrawer.update({
      where: { shop },
      data: { freeShippingMessageEnabled: enabled },
    });

    return json({ success: true });
  }

  if (intent === "save") {
    const cartDrawer = await prisma.cartDrawer.findUnique({
      where: { shop },
      include: { freeShippingMessages: { where: { isActive: true } } },
    });

    if (!cartDrawer) {
      return json({ error: "Cart drawer not found" }, { status: 404 });
    }

    const data = {
      thresholdAmount: parseFloat(formData.get("thresholdAmount") as string),
      currency: formData.get("currency") as string,
      beforeThresholdMessage: formData.get("beforeThresholdMessage") as string,
      afterThresholdMessage: formData.get("afterThresholdMessage") as string,
      achievedMessage: formData.get("achievedMessage") as string,
      backgroundColor: formData.get("backgroundColor") as string,
      textColor: formData.get("textColor") as string,
      borderColor: formData.get("borderColor") as string,
      icon: formData.get("icon") as string,
    };

    const existingMessage = cartDrawer.freeShippingMessages[0];

    if (existingMessage) {
      await prisma.freeShippingMessage.update({
        where: { id: existingMessage.id },
        data,
      });
    } else {
      await prisma.freeShippingMessage.create({
        data: {
          ...data,
          shop,
          cartDrawerId: cartDrawer.id,
          isActive: true,
        },
      });
    }

    // Auto-enable the feature after saving configuration
    await prisma.cartDrawer.update({
      where: { shop },
      data: { freeShippingMessageEnabled: true },
    });

    return redirect("/app/cart-drawer");
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function FreeShippingMessage() {
  const { cartDrawer, freeShippingMessage } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();
  const isLoading = navigation.state === "submitting";
  
  // Check which action is being submitted
  const formData = navigation.formData;
  const submittingIntent = formData?.get("intent") as string | null;

  // Track previous submission state to detect when save completes
  const prevIsSubmitting = useRef(false);
  const prevSubmittingIntent = useRef<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Show toast notification when settings are saved successfully
  useEffect(() => {
    // Check if we just finished submitting a save action
    const justFinishedSave = 
      prevIsSubmitting.current && 
      prevSubmittingIntent.current === "save" &&
      !isLoading;

    if (justFinishedSave) {
      setShowToast(true);
      // Auto-hide after 2 seconds (shorter since redirect will happen)
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Update refs for next render
    prevIsSubmitting.current = isLoading;
    prevSubmittingIntent.current = submittingIntent;
  }, [submittingIntent, isLoading]);

  const [formState, setFormState] = useState({
    thresholdAmount: freeShippingMessage?.thresholdAmount?.toString() || "5000",
    currency: freeShippingMessage?.currency || "INR",
    beforeThresholdMessage: freeShippingMessage?.beforeThresholdMessage || "Free shipping on orders over {threshold}",
    afterThresholdMessage: freeShippingMessage?.afterThresholdMessage || "Add {remaining} more for FREE shipping",
    achievedMessage: freeShippingMessage?.achievedMessage || "Free shipping applied!",
    backgroundColor: freeShippingMessage?.backgroundColor || "#FEF3C7",
    textColor: freeShippingMessage?.textColor || "#92400E",
    borderColor: freeShippingMessage?.borderColor || "#92400E",
    icon: freeShippingMessage?.icon || "🚚",
  });

  const handleToggle = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "toggle");
    formData.append("enabled", (!cartDrawer?.freeShippingMessageEnabled).toString());
    submit(formData, { method: "post" });
  }, [cartDrawer?.freeShippingMessageEnabled, submit]);

  const handleSubmit = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "save");
    Object.entries(formState).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    submit(formData, { method: "post" });
  }, [formState, submit]);

  return (
    <Page
      backAction={{ url: "/app/cart-drawer" }}
      title="Free Shipping Message"
      primaryAction={{
        content: "Save",
        onAction: handleSubmit,
        loading: isLoading,
      }}
    >
      {/* Custom Toast Notification - Appears at Top */}
      {showToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          animation: 'slideDown 0.3s ease-out',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            maxWidth: '500px',
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <Text as="p" variant="bodyMd" fontWeight="medium">
                Settings saved successfully
              </Text>
            </div>
            <button
              onClick={() => setShowToast(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                flexShrink: 0,
              }}
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
      
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">
                    Configuration
                  </Text>
                  <Button onClick={handleToggle} loading={isLoading}>
                    {cartDrawer?.freeShippingMessageEnabled ? "Disable" : "Enable"}
                  </Button>
                </InlineStack>
                
                {!cartDrawer?.freeShippingMessageEnabled && (
                  <Banner tone="warning">
                    This feature is currently disabled. Enable it to show the free shipping message in your cart.
                  </Banner>
                )}

                <FormLayout>
                  <TextField
                    label="Free Shipping Threshold"
                    type="number"
                    value={formState.thresholdAmount}
                    onChange={(value) => setFormState({ ...formState, thresholdAmount: value })}
                    helpText="Minimum amount for free shipping"
                    prefix="₹"
                    autoComplete="off"
                  />

                  <TextField
                    label="Before Threshold Message"
                    value={formState.beforeThresholdMessage}
                    onChange={(value) => setFormState({ ...formState, beforeThresholdMessage: value })}
                    helpText="Use {threshold} to show threshold amount"
                    autoComplete="off"
                  />

                  <TextField
                    label="After Threshold Message"
                    value={formState.afterThresholdMessage}
                    onChange={(value) => setFormState({ ...formState, afterThresholdMessage: value })}
                    helpText="Use {remaining} to show remaining amount"
                    autoComplete="off"
                  />

                  <TextField
                    label="Achieved Message"
                    value={formState.achievedMessage}
                    onChange={(value) => setFormState({ ...formState, achievedMessage: value })}
                    helpText="Message when threshold is met"
                    autoComplete="off"
                  />

                  <TextField
                    label="Background Color"
                    type="color"
                    value={formState.backgroundColor}
                    onChange={(value) => setFormState({ ...formState, backgroundColor: value })}
                    autoComplete="off"
                  />

                  <TextField
                    label="Text Color"
                    type="color"
                    value={formState.textColor}
                    onChange={(value) => setFormState({ ...formState, textColor: value })}
                    autoComplete="off"
                  />

                  <TextField
                    label="Border Color"
                    type="color"
                    value={formState.borderColor}
                    onChange={(value) => setFormState({ ...formState, borderColor: value })}
                    autoComplete="off"
                  />

                  <TextField
                    label="Icon"
                    value={formState.icon}
                    onChange={(value) => setFormState({ ...formState, icon: value })}
                    helpText="Enter an emoji or icon (e.g., 🚚, 🎁, ✨). Default: 🚚"
                    autoComplete="off"
                  />
                </FormLayout>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                Preview
              </Text>
              
              <FreeShippingMessageComponent
                thresholdAmount={parseFloat(formState.thresholdAmount) || 5000}
                cartTotal={300000} // Sample cart total (₹3000 in cents)
                beforeThresholdMessage={formState.beforeThresholdMessage}
                achievedMessage={formState.achievedMessage}
                backgroundColor={formState.backgroundColor}
                textColor={formState.textColor}
                borderColor={formState.borderColor}
                icon={formState.icon}
                currency={formState.currency}
                isPreview={true}
              />

              <Text as="p" variant="bodyMd" tone="subdued">
                This is how the message will appear in your cart drawer.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

