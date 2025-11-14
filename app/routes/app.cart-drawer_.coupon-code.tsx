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
import { CouponCodeField as CouponCodeFieldComponent } from "../components/shared/CouponCodeField";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Ensure CartDrawer exists
  let cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop },
  });

  if (!cartDrawer) {
    cartDrawer = await prisma.cartDrawer.create({
      data: { shop, isActive: true },
    });
  }

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
    
    // Ensure CartDrawer exists
    await prisma.cartDrawer.upsert({
      where: { shop },
      update: { couponCodeFieldEnabled: enabled },
      create: { shop, couponCodeFieldEnabled: enabled, isActive: true },
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
      isActive: true, // Ensure isActive is set to true when saving configuration
    };

    // Ensure CartDrawer exists and enable coupon code field
    await prisma.cartDrawer.upsert({
      where: { shop },
      update: { couponCodeFieldEnabled: true },
      create: { shop, couponCodeFieldEnabled: true, isActive: true },
    });

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
    enableAutoApply: (couponCodeField as any)?.enableAutoApply || false,
    autoApplyStrategy: (couponCodeField as any)?.autoApplyStrategy || "best_value",
    showAllOffers: (couponCodeField as any)?.showAllOffers || false,
    showAllOffersButtonText: (couponCodeField as any)?.showAllOffersButtonText || "Show all offers",
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
              
              <CouponCodeFieldComponent
                placeholder={formState.placeholder}
                buttonText={formState.buttonText}
                showAllOffers={formState.showAllOffers}
                showAllOffersButtonText={formState.showAllOffersButtonText}
                enableAutoApply={formState.enableAutoApply}
                appliedDiscount={formState.enableAutoApply ? {
                  code: 'SUMMER20',
                  title: 'Summer Sale',
                  description: '20% OFF',
                  type: 'percentage',
                  value: 20
                } : null}
                availableDiscounts={formState.showAllOffers ? [
                  { code: 'SAVE10', title: 'Welcome Offer', description: '10% OFF', type: 'percentage', value: 10 },
                  { code: 'SUMMER20', title: 'Summer Sale', description: '20% OFF', type: 'percentage', value: 20 },
                  { code: 'FLAT500', title: 'Flat Discount', description: '₹500 OFF', type: 'fixed', value: 500 }
                ] : []}
                onApplyCoupon={() => {}}
                onRemoveDiscount={() => {}}
                onSwitchDiscount={() => {}}
                isPreview={true}
              />

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

