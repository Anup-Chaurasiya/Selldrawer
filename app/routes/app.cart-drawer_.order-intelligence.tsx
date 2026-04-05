import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  TextField,
  Text,
  Button,
  InlineStack,
  Box,
  Divider,
  Banner,
  Badge,
  Checkbox,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useState, useCallback } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { syncCartDrawerConfigToMetafields } from "../utils/sync-config.server";



export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop },
  });

  if (!cartDrawer) {
    return redirect("/app/cart-drawer");
  }

  return json({ cartDrawer });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  
  const intent = formData.get("intent");

  if (intent === "save-settings") {
    const orderNoteEnabled = formData.get("orderNoteEnabled") === "true";
    const orderNotePlaceholder = formData.get("orderNotePlaceholder") as string;
    const termsConditionsEnabled = formData.get("termsConditionsEnabled") === "true";
    const termsConditionsText = formData.get("termsConditionsText") as string;
    const deliveryEstimatesEnabled = formData.get("deliveryEstimatesEnabled") === "true";
    const deliveryEstimatesText = formData.get("deliveryEstimatesText") as string;
    const processingDaysMin = parseInt(formData.get("processingDaysMin") as string) || 1;
    const processingDaysMax = parseInt(formData.get("processingDaysMax") as string) || 2;
    const transitDaysMin = parseInt(formData.get("transitDaysMin") as string) || 3;
    const transitDaysMax = parseInt(formData.get("transitDaysMax") as string) || 5;
    const shippingProtectionEnabled = formData.get("shippingProtectionEnabled") === "true";
    const shippingProtectionProductId = formData.get("shippingProtectionProductId") as string;
    const shippingProtectionTitle = formData.get("shippingProtectionTitle") as string;
    const shippingProtectionPrice = parseFloat(formData.get("shippingProtectionPrice") as string) || 0;

    await prisma.cartDrawer.update({
      where: { shop },
      data: {
        orderNoteEnabled,
        orderNotePlaceholder,
        termsConditionsEnabled,
        termsConditionsText,
        deliveryEstimatesEnabled,
        deliveryEstimatesText,
        processingDaysMin,
        processingDaysMax,
        transitDaysMin,
        transitDaysMax,
        shippingProtectionEnabled,
        shippingProtectionProductId,
        shippingProtectionTitle,
        shippingProtectionPrice,
        updatedAt: new Date(),
      },
    });
    
    // Sync to Shopify Metafields for zero-latency storefront access
    const { admin } = await authenticate.admin(request);
    await syncCartDrawerConfigToMetafields(admin, shop);


    return json({ success: true });
  }

  return json({ success: false });
};

export default function OrderIntelligenceConfig() {
  const { cartDrawer } = useLoaderData<typeof loader>();
  const shopify = useAppBridge();
  const currencySymbol = (typeof window !== 'undefined' && (window as any).selldrawer_config?.currency?.symbol) || '';
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";


  const [orderNoteEnabled, setOrderNoteEnabled] = useState(cartDrawer.orderNoteEnabled);
  const [orderNotePlaceholder, setOrderNotePlaceholder] = useState(cartDrawer.orderNotePlaceholder);
  const [termsConditionsEnabled, setTermsConditionsEnabled] = useState(cartDrawer.termsConditionsEnabled);
  const [termsConditionsText, setTermsConditionsText] = useState(cartDrawer.termsConditionsText);
  const [deliveryEstimatesEnabled, setDeliveryEstimatesEnabled] = useState(cartDrawer.deliveryEstimatesEnabled);
  const [deliveryEstimatesText, setDeliveryEstimatesText] = useState(cartDrawer.deliveryEstimatesText);
  const [processingDaysMin, setProcessingDaysMin] = useState(String(cartDrawer.processingDaysMin));
  const [processingDaysMax, setProcessingDaysMax] = useState(String(cartDrawer.processingDaysMax));
  const [transitDaysMin, setTransitDaysMin] = useState(String(cartDrawer.transitDaysMin));
  const [transitDaysMax, setTransitDaysMax] = useState(String(cartDrawer.transitDaysMax));
  const [shippingProtectionEnabled, setShippingProtectionEnabled] = useState(cartDrawer.shippingProtectionEnabled);
  const [shippingProtectionProductId, setShippingProtectionProductId] = useState(cartDrawer.shippingProtectionProductId || "");
  const [shippingProtectionTitle, setShippingProtectionTitle] = useState(cartDrawer.shippingProtectionTitle || "Shipping Protection");
  const [shippingProtectionPrice, setShippingProtectionPrice] = useState(String(cartDrawer.shippingProtectionPrice || "0"));


  const handleSave = () => {
    const formData = new FormData();
    formData.append("intent", "save-settings");
    formData.append("orderNoteEnabled", String(orderNoteEnabled));
    formData.append("orderNotePlaceholder", orderNotePlaceholder);
    formData.append("termsConditionsEnabled", String(termsConditionsEnabled));
    formData.append("termsConditionsText", termsConditionsText);
    formData.append("deliveryEstimatesEnabled", String(deliveryEstimatesEnabled));
    formData.append("deliveryEstimatesText", deliveryEstimatesText);
    formData.append("processingDaysMin", processingDaysMin);
    formData.append("processingDaysMax", processingDaysMax);
    formData.append("transitDaysMin", transitDaysMin);
    formData.append("transitDaysMax", transitDaysMax);
    formData.append("shippingProtectionEnabled", String(shippingProtectionEnabled));
    formData.append("shippingProtectionProductId", shippingProtectionProductId);
    formData.append("shippingProtectionTitle", shippingProtectionTitle);
    formData.append("shippingProtectionPrice", shippingProtectionPrice);
    submit(formData, { method: "post" });
  };

  const handleSelectProduct = async () => {
    const selected = await shopify.resourcePicker({
      type: 'product',
      multiple: false,
      action: 'select',
    });

    if (selected && selected.length > 0) {
      const product = selected[0] as any;
      const variant = product.variants?.[0];
      
      if (variant) {
        setShippingProtectionProductId(variant.id.split('/').pop() || "");
        setShippingProtectionTitle(product.title);
        setShippingProtectionPrice(variant.price);
      }
    }
  };



  return (
    <Page
      backAction={{ content: "Cart Drawer", url: "/app/cart-drawer" }}
      title="Order Intelligence"
      subtitle="Deep cart functionality to enhance the checkout flow"
      primaryAction={{
        content: "Save Settings",
        onAction: handleSave,
        loading: isSaving,
      }}
    >
      {actionData?.success && (
        <Banner title="Settings saved" tone="success" onDismiss={() => {}} />
      )}


      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            {/* ORDER NOTES */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">Order Notes</Text>
                  <Badge tone={orderNoteEnabled ? "success" : "info"}>
                    {orderNoteEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </InlineStack>
                <Text as="p" tone="subdued">
                  Allow customers to add special instructions or messages to their order.
                </Text>
                <Checkbox
                  label="Enable Order Notes"
                  checked={orderNoteEnabled}
                  onChange={setOrderNoteEnabled}
                />
                {orderNoteEnabled && (
                  <TextField
                    label="Placeholder Text"
                    value={orderNotePlaceholder}
                    onChange={setOrderNotePlaceholder}
                    autoComplete="off"
                    helpText="Example: 'Special instructions for delivery...'"
                  />
                )}
              </BlockStack>
            </Card>

            {/* TERMS & CONDITIONS */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">Terms & Conditions</Text>
                  <Badge tone={termsConditionsEnabled ? "success" : "info"}>
                    {termsConditionsEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </InlineStack>
                <Text as="p" tone="subdued">
                  Require customers to agree to your terms before checking out.
                </Text>
                <Checkbox
                  label="Enable Terms & Conditions Checkbox"
                  checked={termsConditionsEnabled}
                  onChange={setTermsConditionsEnabled}
                />
                {termsConditionsEnabled && (
                  <TextField
                    label="Checkbox Text"
                    value={termsConditionsText}
                    onChange={setTermsConditionsText}
                    autoComplete="off"
                    multiline={2}
                    helpText="You can use HTML links here (e.g. Terms & Conditions)"
                  />
                )}
              </BlockStack>
            </Card>

            {/* DELIVERY ESTIMATES */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">Delivery Estimates</Text>
                  <Badge tone={deliveryEstimatesEnabled ? "success" : "info"}>
                    {deliveryEstimatesEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </InlineStack>
                <Text as="p" tone="subdued">
                  Show transparent delivery windows to build trust and reduce support queries.
                </Text>
                <Checkbox
                  label="Enable Delivery Estimates"
                  checked={deliveryEstimatesEnabled}
                  onChange={setDeliveryEstimatesEnabled}
                />
                {deliveryEstimatesEnabled && (
                  <>
                    <TextField
                      label="Display Message"
                      value={deliveryEstimatesText}
                      onChange={setDeliveryEstimatesText}
                      autoComplete="off"
                      helpText="Use {date} as a placeholder for the calculated date range."
                    />
                    <InlineStack gap="400">
                      <Box minWidth="150px">
                        <TextField
                          label="Min Processing Days"
                          type="number"
                          value={processingDaysMin}
                          onChange={setProcessingDaysMin}
                          autoComplete="off"
                        />
                      </Box>
                      <Box minWidth="150px">
                        <TextField
                          label="Max Processing Days"
                          type="number"
                          value={processingDaysMax}
                          onChange={setProcessingDaysMax}
                          autoComplete="off"
                        />
                      </Box>
                    </InlineStack>
                    <InlineStack gap="400">
                      <Box minWidth="150px">
                        <TextField
                          label="Min Transit Days"
                          type="number"
                          value={transitDaysMin}
                          onChange={setTransitDaysMin}
                          autoComplete="off"
                        />
                      </Box>
                      <Box minWidth="150px">
                        <TextField
                          label="Max Transit Days"
                          type="number"
                          value={transitDaysMax}
                          onChange={setTransitDaysMax}
                          autoComplete="off"
                        />
                      </Box>
                    </InlineStack>
                  </>
                )}
              </BlockStack>
            </Card>

            {/* SHIPPING PROTECTION */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">Shipping Protection</Text>
                  <Badge tone={shippingProtectionEnabled ? "success" : "info"}>
                    {shippingProtectionEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </InlineStack>
                <Text as="p" tone="subdued">
                  Offer shipping insurance to protect against loss or damage.
                </Text>
                <Checkbox
                  label="Enable Shipping Protection Toggle"
                  checked={shippingProtectionEnabled}
                  onChange={setShippingProtectionEnabled}
                />
                {shippingProtectionEnabled && (
                  <Box>
                    <BlockStack gap="400">
                      <InlineStack align="space-between" blockAlign="center">
                        <Box>
                          <Text as="p" fontWeight="bold">Protection Product</Text>
                          {shippingProtectionProductId ? (
                            <Text as="p" tone="success">Selected: {shippingProtectionTitle} (ID: {shippingProtectionProductId})</Text>
                          ) : (
                            <Text as="p" tone="critical">No product selected</Text>
                          )}
                        </Box>
                        <Button onClick={handleSelectProduct}>
                          {shippingProtectionProductId ? "Change Product" : "Select Product"}
                        </Button>

                      </InlineStack>

                      {shippingProtectionProductId && (
                        <TextField
                          label="Protection Price (in cents)"
                          type="number"
                          value={shippingProtectionPrice}
                          onChange={setShippingProtectionPrice}
                          autoComplete="off"
                          helpText={`Example: 100 = ${currencySymbol || ''}1.00. This is auto-filled from the variant price.`}
                        />
                      )}
                    </BlockStack>

                    {!shippingProtectionProductId && (
                      <Box paddingBlockStart="200">
                        <Banner tone="warning">
                          <Text as="p">
                            You must select a product variant to enable shipping protection.
                          </Text>
                        </Banner>
                      </Box>
                    )}
                  </Box>
                )}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
        
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Best Practices</Text>
              <Divider />
              <Box>
                <Text as="p" fontWeight="bold">Transparency Wins</Text>
                <Text as="p" tone="subdued">Showing delivery estimates reduces "Where is my order?" queries by up to 30%.</Text>
              </Box>
              <Box>
                <Text as="p" fontWeight="bold">Legal Protection</Text>
                <Text as="p" tone="subdued">The T&C checkbox is highly recommended for digital products or subscription services.</Text>
              </Box>
              <Box>
                <Text as="p" fontWeight="bold">Incremental Revenue</Text>
                <Text as="p" tone="subdued">Shipping protection is pure profit if you self-insure small orders.</Text>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
      <Box paddingBlockStart="800" />
    </Page>
  );
}
