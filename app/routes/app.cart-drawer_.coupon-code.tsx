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
              
              {/* Manual Coupon Input */}
              <div style={{ 
                display: 'flex', 
                gap: '10px',
                padding: '16px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Subtle background pattern */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.03) 0%, transparent 50%)',
                  pointerEvents: 'none'
                }} />
                
                <div style={{ position: 'relative', flex: 1, zIndex: 1 }}>
                  <input
                    type="text"
                    placeholder={formState.placeholder}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: 'white',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                      fontWeight: '500'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.02)';
                    }}
                  />
                </div>
                <button style={{
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                  zIndex: 1
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.transform = 'translateY(-1px)';
                  target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.transform = 'translateY(0)';
                  target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }}>
                  <span style={{ position: 'relative', zIndex: 1 }}>
                    {formState.buttonText}
                  </span>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(45deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
                    pointerEvents: 'none'
                  }} />
                </button>
              </div>

              {/* Auto-Applied Discount Preview */}
              {formState.enableAutoApply && (
                <div style={{
                  padding: '14px 16px',
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                  border: '2px solid #10b981',
                  borderRadius: '10px',
                  marginTop: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(45deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
                    pointerEvents: 'none'
                  }} />
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                    }}>✓</div>
                    <div>
                      <div style={{ 
                        fontWeight: '700', 
                        color: '#047857', 
                        fontSize: '14px', 
                        marginBottom: '2px',
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}>
                        SUMMER20 - 20% OFF
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#065f46',
                        fontWeight: '500'
                      }}>
                        Best offer automatically applied
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Show All Offers Preview */}
              {formState.showAllOffers && (
                <div style={{ marginTop: '12px' }}>
                  <button style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    color: '#374151',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLButtonElement;
                    target.style.borderColor = '#3b82f6';
                    target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                    target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLButtonElement;
                    target.style.borderColor = '#e5e7eb';
                    target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.04)';
                    target.style.transform = 'translateY(0)';
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>🎁</span>
                      <span>{formState.showAllOffersButtonText} (3 available)</span>
                    </span>
                    <span style={{ 
                      fontSize: '12px',
                      color: '#6b7280',
                      transition: 'transform 0.3s ease'
                    }}>▼</span>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
                      pointerEvents: 'none',
                      opacity: 0,
                      transition: 'opacity 0.3s ease'
                    }} />
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

