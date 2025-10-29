import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
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
import { useState, useCallback } from "react";

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

    return redirect("/app/cart-drawer");
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function FreeShippingMessage() {
  const { cartDrawer, freeShippingMessage } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const [formState, setFormState] = useState({
    thresholdAmount: freeShippingMessage?.thresholdAmount?.toString() || "5000",
    currency: freeShippingMessage?.currency || "INR",
    beforeThresholdMessage: freeShippingMessage?.beforeThresholdMessage || "Free shipping on orders over {threshold}",
    afterThresholdMessage: freeShippingMessage?.afterThresholdMessage || "Add {remaining} more for FREE shipping",
    achievedMessage: freeShippingMessage?.achievedMessage || "Free shipping applied!",
    backgroundColor: freeShippingMessage?.backgroundColor || "#FEF3C7",
    textColor: freeShippingMessage?.textColor || "#92400E",
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
              
              <div style={{ 
                backgroundColor: formState.backgroundColor,
                color: formState.textColor,
                padding: '16px 20px',
                borderRadius: '12px',
                border: `2px solid ${formState.textColor}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Delivery truck icon */}
                <div style={{
                  fontSize: '24px',
                  flexShrink: 0
                }}>
                  🚚
                </div>
                
                {/* Message text */}
                <div style={{ flex: 1 }}>
                  {formState.beforeThresholdMessage.replace('{threshold}', `₹${formState.thresholdAmount}`)}
                </div>
                
                {/* Subtle background pattern */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
                  pointerEvents: 'none'
                }} />
              </div>

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

