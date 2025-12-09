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
  InlineStack,
  Banner,
  Checkbox,
  Select,
  Divider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useState, useCallback, useEffect, useRef } from "react";
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
      backgroundColor: formData.get("backgroundColor") as string,
      textColor: formData.get("textColor") as string,
      couponCodeColor: formData.get("couponCodeColor") as string,
      borderColor: formData.get("borderColor") as string,
      appliedDiscountText: formData.get("appliedDiscountText") as string,
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
    placeholder: couponCodeField?.placeholder || "Enter coupon code",
    buttonText: couponCodeField?.buttonText || "Apply",
    successMessage: couponCodeField?.successMessage || "Coupon applied successfully!",
    errorMessage: couponCodeField?.errorMessage || "Invalid coupon code",
    enableAutoApply: (couponCodeField as any)?.enableAutoApply || false,
    autoApplyStrategy: (couponCodeField as any)?.autoApplyStrategy || "best_value",
    showAllOffers: (couponCodeField as any)?.showAllOffers || false,
    showAllOffersButtonText: (couponCodeField as any)?.showAllOffersButtonText || "Show all offers",
    backgroundColor: (couponCodeField as any)?.backgroundColor || "#d1fae5",
    textColor: (couponCodeField as any)?.textColor || "#065f46",
    couponCodeColor: (couponCodeField as any)?.couponCodeColor || "",
    borderColor: (couponCodeField as any)?.borderColor || "#059669",
    appliedDiscountText: (couponCodeField as any)?.appliedDiscountText || "",
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

                  <Divider />

                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">
                      Applied Discount Styling
                    </Text>
                    
                    <TextField
                      label="Applied Discount Text"
                      value={formState.appliedDiscountText}
                      onChange={(value) => setFormState({ ...formState, appliedDiscountText: value })}
                      helpText="Custom text shown below the discount code (e.g., 'Best offer automatically applied'). Leave empty to use default."
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
                      helpText="Color for the applied discount message text"
                      autoComplete="off"
                    />

                    <TextField
                      label="Coupon Code Color"
                      type="color"
                      value={formState.couponCodeColor || formState.textColor}
                      onChange={(value) => setFormState({ ...formState, couponCodeColor: value })}
                      helpText="Color for the coupon code text (e.g., 'SUMMER20 - 20% OFF'). Leave empty to use text color."
                      autoComplete="off"
                    />

                    <TextField
                      label="Border Color"
                      type="color"
                      value={formState.borderColor}
                      onChange={(value) => setFormState({ ...formState, borderColor: value })}
                      autoComplete="off"
                    />
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
                id="upsellity-coupon-field-preview"
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
                backgroundColor={formState.backgroundColor}
                textColor={formState.textColor}
                couponCodeColor={formState.couponCodeColor}
                borderColor={formState.borderColor}
                appliedDiscountText={formState.appliedDiscountText}
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

