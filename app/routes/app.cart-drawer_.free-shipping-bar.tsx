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
  Checkbox,
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
      freeShippingBars: { where: { isActive: true } },
    },
  });

  const freeShippingBar = cartDrawer?.freeShippingBars[0] || null;

  return json({ cartDrawer, freeShippingBar, shop });
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
      data: { freeShippingProgressBarEnabled: enabled },
    });

    return json({ success: true });
  }

  if (intent === "save") {
    const cartDrawer = await prisma.cartDrawer.findUnique({
      where: { shop },
      include: { freeShippingBars: { where: { isActive: true } } },
    });

    if (!cartDrawer) {
      return json({ error: "Cart drawer not found" }, { status: 404 });
    }

    const data = {
      thresholdAmount: parseFloat(formData.get("thresholdAmount") as string),
      currency: formData.get("currency") as string,
      beforeThresholdMessage: formData.get("beforeThresholdMessage") as string,
      afterThresholdMessage: formData.get("afterThresholdMessage") as string,
      progressBarColor: formData.get("progressBarColor") as string,
      backgroundColor: formData.get("backgroundColor") as string,
      showPercentage: formData.get("showPercentage") === "true",
    };

    const existingBar = cartDrawer.freeShippingBars[0];

    if (existingBar) {
      await prisma.freeShippingProgressBar.update({
        where: { id: existingBar.id },
        data,
      });
    } else {
      await prisma.freeShippingProgressBar.create({
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

export default function FreeShippingBar() {
  const { cartDrawer, freeShippingBar } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const [formState, setFormState] = useState({
    thresholdAmount: freeShippingBar?.thresholdAmount?.toString() || "5000",
    currency: freeShippingBar?.currency || "INR",
    beforeThresholdMessage: freeShippingBar?.beforeThresholdMessage || "Add {remaining} for FREE shipping",
    afterThresholdMessage: freeShippingBar?.afterThresholdMessage || "You've unlocked FREE shipping!",
    progressBarColor: freeShippingBar?.progressBarColor || "#FF6B35",
    backgroundColor: freeShippingBar?.backgroundColor || "#F3F4F6",
    showPercentage: freeShippingBar?.showPercentage ?? true,
  });

  const handleToggle = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "toggle");
    formData.append("enabled", (!cartDrawer?.freeShippingProgressBarEnabled).toString());
    submit(formData, { method: "post" });
  }, [cartDrawer?.freeShippingProgressBarEnabled, submit]);

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
      title="Free Shipping Progress Bar"
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
                  <Button
                    onClick={handleToggle}
                    loading={isLoading}
                  >
                    {cartDrawer?.freeShippingProgressBarEnabled ? "Disable" : "Enable"}
                  </Button>
                </InlineStack>
                
                {!cartDrawer?.freeShippingProgressBarEnabled && (
                  <Banner tone="warning">
                    This feature is currently disabled. Enable it to show the progress bar in your cart.
                  </Banner>
                )}

                <FormLayout>
                  <TextField
                    label="Free Shipping Threshold"
                    type="number"
                    value={formState.thresholdAmount}
                    onChange={(value) => setFormState({ ...formState, thresholdAmount: value })}
                    helpText="Customers need to spend this amount to get free shipping"
                    prefix="₹"
                    autoComplete="off"
                  />

                  <Select
                    label="Currency"
                    options={[
                      { label: "Indian Rupee (INR)", value: "INR" },
                      { label: "US Dollar (USD)", value: "USD" },
                      { label: "Euro (EUR)", value: "EUR" },
                      { label: "British Pound (GBP)", value: "GBP" },
                    ]}
                    value={formState.currency}
                    onChange={(value) => setFormState({ ...formState, currency: value })}
                  />

                  <TextField
                    label="Before Threshold Message"
                    value={formState.beforeThresholdMessage}
                    onChange={(value) => setFormState({ ...formState, beforeThresholdMessage: value })}
                    helpText="Use {remaining} to show remaining amount"
                    autoComplete="off"
                  />

                  <TextField
                    label="After Threshold Message"
                    value={formState.afterThresholdMessage}
                    onChange={(value) => setFormState({ ...formState, afterThresholdMessage: value })}
                    helpText="Message shown when threshold is reached"
                    autoComplete="off"
                  />

                  <TextField
                    label="Progress Bar Color"
                    type="color"
                    value={formState.progressBarColor}
                    onChange={(value) => setFormState({ ...formState, progressBarColor: value })}
                    autoComplete="off"
                  />

                  <TextField
                    label="Background Color"
                    type="color"
                    value={formState.backgroundColor}
                    onChange={(value) => setFormState({ ...formState, backgroundColor: value })}
                    autoComplete="off"
                  />

                  <Checkbox
                    label="Show percentage"
                    checked={formState.showPercentage}
                    onChange={(value) => setFormState({ ...formState, showPercentage: value })}
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
              
              {/* Preview Component */}
              <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text as="p" variant="bodySm">
                    {formState.beforeThresholdMessage.replace('{remaining}', `₹${formState.thresholdAmount}`)}
                  </Text>
                  {formState.showPercentage && (
                    <Text as="span" variant="bodySm" tone="success">
                      54%
                    </Text>
                  )}
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '8px', 
                  backgroundColor: formState.backgroundColor,
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: '54%', 
                    height: '100%',
                    backgroundColor: formState.progressBarColor,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              <Text as="p" variant="bodyMd" tone="subdued">
                This is how the progress bar will appear in your cart drawer.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

