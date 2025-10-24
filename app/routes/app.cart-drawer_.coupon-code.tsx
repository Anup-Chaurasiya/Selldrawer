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
  InlineStack,
  Banner,
  Checkbox,
  Select,
  Divider,
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
  });

  let couponCodeField = await prisma.couponCodeField.findUnique({
    where: { shop },
  });

  // Create default if doesn't exist
  if (!couponCodeField) {
    couponCodeField = await prisma.couponCodeField.create({
      data: { shop },
    });
  }

  return json({ cartDrawer, couponCodeField });
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
      data: { couponCodeFieldEnabled: enabled },
    });

    await prisma.couponCodeField.upsert({
      where: { shop },
      update: { isActive: enabled },
      create: { shop, isActive: enabled },
    });

    return json({ success: true });
  }

  if (intent === "save") {
    const data = {
      placeholder: formData.get("placeholder") as string,
      buttonText: formData.get("buttonText") as string,
      successMessage: formData.get("successMessage") as string,
      errorMessage: formData.get("errorMessage") as string,
      enableAutoApply: formData.get("enableAutoApply") === "true",
      autoApplyStrategy: formData.get("autoApplyStrategy") as string,
      showAllOffers: formData.get("showAllOffers") === "true",
      showAllOffersButtonText: formData.get("showAllOffersButtonText") as string,
    };

    await prisma.couponCodeField.upsert({
      where: { shop },
      update: data,
      create: { ...data, shop },
    });

    return redirect("/app/cart-drawer");
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function CouponCode() {
  const { cartDrawer, couponCodeField } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const [formState, setFormState] = useState({
    placeholder: couponCodeField?.placeholder || "Enter coupon code",
    buttonText: couponCodeField?.buttonText || "Apply",
    successMessage: couponCodeField?.successMessage || "Coupon applied successfully!",
    errorMessage: couponCodeField?.errorMessage || "Invalid coupon code",
    enableAutoApply: couponCodeField?.enableAutoApply || false,
    autoApplyStrategy: couponCodeField?.autoApplyStrategy || "best_value",
    showAllOffers: couponCodeField?.showAllOffers || false,
    showAllOffersButtonText: couponCodeField?.showAllOffersButtonText || "Show all offers",
  });

  const handleToggle = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "toggle");
    formData.append("enabled", (!cartDrawer?.couponCodeFieldEnabled).toString());
    submit(formData, { method: "post" });
  }, [cartDrawer?.couponCodeFieldEnabled, submit]);

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
      title="Coupon Code Field"
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
                    {cartDrawer?.couponCodeFieldEnabled ? "Disable" : "Enable"}
                  </Button>
                </InlineStack>
                
                {!cartDrawer?.couponCodeFieldEnabled && (
                  <Banner tone="warning">
                    This feature is currently disabled. Enable it to show the coupon field in your cart.
                  </Banner>
                )}

                <FormLayout>
                  <TextField
                    label="Placeholder Text"
                    value={formState.placeholder}
                    onChange={(value) => setFormState({ ...formState, placeholder: value })}
                    autoComplete="off"
                  />

                  <TextField
                    label="Button Text"
                    value={formState.buttonText}
                    onChange={(value) => setFormState({ ...formState, buttonText: value })}
                    autoComplete="off"
                  />

                  <TextField
                    label="Success Message"
                    value={formState.successMessage}
                    onChange={(value) => setFormState({ ...formState, successMessage: value })}
                    helpText="Message shown when coupon is applied successfully"
                    autoComplete="off"
                  />

                  <TextField
                    label="Error Message"
                    value={formState.errorMessage}
                    onChange={(value) => setFormState({ ...formState, errorMessage: value })}
                    helpText="Message shown when coupon is invalid"
                    autoComplete="off"
                  />

                  <Divider />

                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">
                      Auto-Apply Best Offer
                    </Text>
                    
                    <Checkbox
                      label="Automatically apply best qualifying discount"
                      checked={formState.enableAutoApply}
                      onChange={(checked) => setFormState({ ...formState, enableAutoApply: checked })}
                      helpText="When enabled, the best discount will be automatically applied when the cart loads"
                    />

                    {formState.enableAutoApply && (
                      <Select
                        label="Auto-apply Strategy"
                        options={[
                          { label: 'Best Value (Maximum savings)', value: 'best_value' },
                          { label: 'Highest Percentage', value: 'highest_percentage' },
                          { label: 'First Available', value: 'first_available' },
                        ]}
                        value={formState.autoApplyStrategy}
                        onChange={(value) => setFormState({ ...formState, autoApplyStrategy: value })}
                        helpText="Choose how to select the best discount to apply"
                      />
                    )}
                  </BlockStack>

                  <Divider />

                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">
                      Show All Offers
                    </Text>
                    
                    <Checkbox
                      label="Show 'Show all offers' button"
                      checked={formState.showAllOffers}
                      onChange={(checked) => setFormState({ ...formState, showAllOffers: checked })}
                      helpText="Display a button that shows all available discounts to customers"
                    />

                    {formState.showAllOffers && (
                      <TextField
                        label="Button Text"
                        value={formState.showAllOffersButtonText}
                        onChange={(value) => setFormState({ ...formState, showAllOffersButtonText: value })}
                        autoComplete="off"
                        helpText="Text shown on the 'Show all offers' button"
                      />
                    )}
                  </BlockStack>
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
              
              {/* Manual Coupon Input */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder={formState.placeholder}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <button style={{
                  padding: '8px 16px',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  {formState.buttonText}
                </button>
              </div>

              {/* Auto-Applied Discount Preview */}
              {formState.enableAutoApply && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #10b981',
                  borderRadius: '6px',
                  marginTop: '8px'
                }}>
                  <div style={{ fontWeight: 600, color: '#059669', marginBottom: '4px', fontSize: '14px' }}>
                    ✓ SUMMER20 - 20% OFF
                  </div>
                  <div style={{ fontSize: '12px', color: '#047857' }}>
                    Best offer automatically applied
                  </div>
                </div>
              )}

              {/* Show All Offers Preview */}
              {formState.showAllOffers && (
                <div style={{ marginTop: '12px' }}>
                  <button style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'white',
                    color: '#1f2937',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{formState.showAllOffersButtonText} (3 available)</span>
                    <span>▼</span>
                  </button>
                </div>
              )}

              <Text as="p" variant="bodyMd" tone="subdued">
                This is how the coupon field will appear in your cart drawer.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

