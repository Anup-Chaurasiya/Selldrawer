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
import { FreeShippingBar as FreeShippingBarComponent } from "../components/shared/FreeShippingBar";

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

    // Check if data exists before enabling
    if (enabled) {
      const cartDrawer = await prisma.cartDrawer.findUnique({
        where: { shop },
        include: {
          freeShippingBars: { where: { isActive: true } },
        },
      });

      if (!cartDrawer || cartDrawer.freeShippingBars.length === 0) {
        return json({ 
          success: false, 
          error: "Configuration required. Please save the configuration first before enabling." 
        }, { status: 400 });
      }
    }

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
      thresholdMode: formData.get("thresholdMode") as string,
      thresholdAmount: formData.get("thresholdAmount") ? parseFloat(formData.get("thresholdAmount") as string) : null,
      thresholdCount: formData.get("thresholdCount") ? parseInt(formData.get("thresholdCount") as string) : null,
      currency: formData.get("currency") as string,
      beforeThresholdMessage: formData.get("beforeThresholdMessage") as string,
      afterThresholdMessage: formData.get("afterThresholdMessage") as string,
      progressBarColor: formData.get("progressBarColor") as string,
      backgroundColor: formData.get("backgroundColor") as string,
      showPercentage: formData.get("showPercentage") === "true",
    };

    console.log('Saving free shipping bar configuration:', data);

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

    // Auto-enable the feature after saving configuration
    await prisma.cartDrawer.update({
      where: { shop },
      data: { freeShippingProgressBarEnabled: true },
    });

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
    thresholdMode: freeShippingBar?.thresholdMode || "amount",
    thresholdAmount: freeShippingBar?.thresholdAmount?.toString() || "5000",
    thresholdCount: freeShippingBar?.thresholdCount?.toString() || "5",
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
                    disabled={!freeShippingBar && !cartDrawer?.freeShippingProgressBarEnabled}
                  >
                    {cartDrawer?.freeShippingProgressBarEnabled ? "Disable" : "Enable"}
                  </Button>
                </InlineStack>

                {!cartDrawer?.freeShippingProgressBarEnabled && freeShippingBar && (
                  <Banner tone="info">
                    This feature is currently disabled. Click "Enable" to show the progress bar in your cart.
                  </Banner>
                )}
                {!freeShippingBar && (
                  <Banner tone="warning">
                    This feature is not configured. Please fill in the configuration below and click "Save" to set it up. The feature will be automatically enabled after saving.
                  </Banner>
                )}

                <FormLayout>
                  <Select
                    label="Threshold Mode"
                    options={[
                      { label: "Cart Total Amount", value: "amount" },
                      { label: "Item Count", value: "count" },
                    ]}
                    value={formState.thresholdMode}
                    onChange={(value) => setFormState({ ...formState, thresholdMode: value })}
                    helpText="Choose whether to base free shipping on cart total or number of items"
                  />

                  {formState.thresholdMode === "amount" && (
                    <TextField
                      label="Free Shipping Threshold Amount"
                      type="number"
                      value={formState.thresholdAmount}
                      onChange={(value) => setFormState({ ...formState, thresholdAmount: value })}
                      helpText="Customers need to spend this amount to get free shipping"
                      prefix="₹"
                      autoComplete="off"
                    />
                  )}

                  {formState.thresholdMode === "count" && (
                    <TextField
                      label="Free Shipping Threshold Count"
                      type="number"
                      value={formState.thresholdCount}
                      onChange={(value) => setFormState({ ...formState, thresholdCount: value })}
                      helpText="Customers need to add this many items to get free shipping"
                      suffix="items"
                      autoComplete="off"
                    />
                  )}

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
                    helpText={formState.thresholdMode === "amount"
                      ? "Use {remaining} to show remaining amount"
                      : "Use {remaining} to show remaining items"}
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
                    {...({ type: "color" } as any)}
                    value={formState.progressBarColor}
                    onChange={(value) => setFormState({ ...formState, progressBarColor: value })}
                    autoComplete="off"
                  />

                  <TextField
                    label="Background Color"
                    {...({ type: "color" } as any)}
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

              {/* Preview using shared component */}
              {(() => {
                // Sample cart data for realistic preview (60% of threshold)
                const threshold = formState.thresholdMode === "amount"
                  ? parseFloat(formState.thresholdAmount) || 5000
                  : parseInt(formState.thresholdCount) || 5;

                const sampleCart = {
                  item_count: formState.thresholdMode === "count" 
                    ? Math.floor(threshold * 0.6) 
                    : 3,
                  total_price: formState.thresholdMode === "amount"
                    ? Math.round(threshold * 0.6 * 100) // Convert to cents
                    : 300000 // 3000 rupees in cents
                };

                return (
                  <FreeShippingBarComponent
                    thresholdMode={formState.thresholdMode as 'amount' | 'count'}
                    thresholdAmount={parseFloat(formState.thresholdAmount) || 5000}
                    thresholdCount={parseInt(formState.thresholdCount) || 5}
                    beforeThresholdMessage={formState.beforeThresholdMessage}
                    afterThresholdMessage={formState.afterThresholdMessage}
                    backgroundColor={formState.backgroundColor}
                    progressBarColor={formState.progressBarColor}
                    showPercentage={formState.showPercentage}
                    currency={formState.currency}
                    cart={sampleCart}
                    isPreview={true}
                  />
                );
              })()}

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

