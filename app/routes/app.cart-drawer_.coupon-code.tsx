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
import { syncCartDrawerConfigToMetafields } from "../utils/sync-config.server";
import { useState, useCallback, useEffect, useRef } from "react";
import { CouponCodeField as CouponCodeFieldComponent } from "../components/shared/CouponCodeField";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);

  // Ensure CartDrawer exists
  let cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop },
  });

  if (!cartDrawer) {
    cartDrawer = await prisma.cartDrawer.create({
      data: { 
        id: crypto.randomUUID(),
        shop, 
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }

  let couponCodeField = await prisma.couponCodeField.findUnique({
    where: { shop },
  });

  // Create default if doesn't exist
  if (!couponCodeField) {
    couponCodeField = await prisma.couponCodeField.create({
      data: { 
        id: crypto.randomUUID(),
        shop,
        updatedAt: new Date(),
      },
    });
  }

  return json({ cartDrawer, couponCodeField });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "toggle") {
    const enabled = formData.get("enabled") === "true";

    // Ensure CartDrawer exists
    await prisma.cartDrawer.upsert({
      where: { shop },
      update: { couponCodeFieldEnabled: enabled, updatedAt: new Date() },
      create: { id: crypto.randomUUID(), shop, couponCodeFieldEnabled: enabled, isActive: true, updatedAt: new Date() },
    });

    await prisma.couponCodeField.upsert({
      where: { shop },
      update: { isActive: enabled, updatedAt: new Date() },
      create: { id: crypto.randomUUID(), shop, isActive: enabled, updatedAt: new Date() },
    });

    // Sync to metafields
    await syncCartDrawerConfigToMetafields(admin, shop);

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
      update: { couponCodeFieldEnabled: true, updatedAt: new Date() },
      create: { id: crypto.randomUUID(), shop, couponCodeFieldEnabled: true, isActive: true, updatedAt: new Date() },
    });

    await prisma.couponCodeField.upsert({
      where: { shop },
      update: { ...data, updatedAt: new Date() },
      create: { id: crypto.randomUUID(), ...data, shop, updatedAt: new Date() },
    });

    // Sync to metafields
    await syncCartDrawerConfigToMetafields(admin, shop);

    return redirect(`/app/cart-drawer`);
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
    submit(formData, { method: "post", action: `/app/cart-drawer/coupon-code` });
  }, [cartDrawer?.couponCodeFieldEnabled, submit]);

  const handleSubmit = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "save");
    Object.entries(formState).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    submit(formData, { method: "post", action: `/app/cart-drawer/coupon-code` });
  }, [formState, submit]);

  return (
    <Page
      backAction={{ url: `/app/cart-drawer` }}
      title="Coupon Code Configuration"
      primaryAction={{
        content: "Save changes",
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
                <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
        
        /* Premium UI CSS */
        .premium-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          margin-bottom: 20px;
        }
        .premium-card:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
          transform: translateY(-2px);
        }
        .premium-card-header {
          padding: 20px 24px;
          border-bottom: 1px solid #f3f4f6;
          background: linear-gradient(to right, #f8fafc, #ffffff);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .premium-card-body {
          padding: 24px;
        }
        
        /* Custom Toggle Switch */
        .premium-toggle-label {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          margin: 0;
        }
        .premium-toggle-label input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .premium-toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #e2e8f0;
          transition: .3s;
          border-radius: 24px;
          border: 1px solid #cbd5e1;
        }
        .premium-toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 2px;
          bottom: 2px;
          background-color: white;
          transition: .3s cubic-bezier(0.4, 0.0, 0.2, 1);
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        .premium-toggle-label input:checked + .premium-toggle-slider {
          background-color: #10b981;
          border-color: #10b981;
        }
        .premium-toggle-label input:focus + .premium-toggle-slider {
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }
        .premium-toggle-label input:checked + .premium-toggle-slider:before {
          transform: translateX(20px);
        }
        .premium-toggle-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
        }
        .status-badge.active {
          background-color: rgba(16, 185, 129, 0.1);
          color: #059669;
        }
        .status-badge.inactive {
          background-color: #f3f4f6;
          color: #6b7280;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .status-dot.active {
          background-color: #10b981;
        }
        .status-dot.inactive {
          background-color: #9ca3af;
        }
        
        /* Modern Input Group */
        .color-picker-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 12px 6px 6px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
          transition: all 0.2s;
        }
        .color-picker-wrapper:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        .color-picker-input {
          width: 32px;
          height: 32px;
          padding: 0;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          background: transparent;
        }
        .color-picker-input::-webkit-color-swatch-wrapper {
          padding: 0;
        }
        .color-picker-input::-webkit-color-swatch {
          border: none;
          border-radius: 4px;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
        }
        
        .icon-circle {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          color: #10b981;
          font-size: 20px;
        }
      `}</style>

      <Layout>
        <Layout.Section>
          <div className="premium-card">
            <div className="premium-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="icon-circle">
                  🏷️
                </div>
                <div>
                  <Text as="h2" variant="headingMd" fontWeight="bold">
                    Coupon Code Display
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Allow customers to apply discounts directly in the cart
                  </Text>
                </div>
              </div>
              <div className="premium-toggle-container">
                <span className={`status-badge ${cartDrawer?.couponCodeFieldEnabled ? 'active' : 'inactive'}`}>
                  <span className={`status-dot ${cartDrawer?.couponCodeFieldEnabled ? 'active' : 'inactive'}`}></span>
                  {cartDrawer?.couponCodeFieldEnabled ? 'Active' : 'Disabled'}
                </span>
                <label className="premium-toggle-label">
                  <input 
                    type="checkbox" 
                    checked={cartDrawer?.couponCodeFieldEnabled || false} 
                    onChange={handleToggle}
                    disabled={isLoading}
                  />
                  <span className="premium-toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="premium-card-body">
              <BlockStack gap="500">
                <div>
                  <Text as="h3" variant="headingSm" fontWeight="medium">
                    Basic Settings
                  </Text>
                  <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)', gap: '16px' }}>
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
                  </div>
                  <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)', gap: '16px' }}>
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
                  </div>
                </div>

                <div style={{ height: '1px', background: '#e5e7eb', margin: '8px 0' }}></div>

                <div>
                  <Text as="h3" variant="headingSm" fontWeight="medium">
                    Auto-Apply Best Offer
                  </Text>
                  <div style={{ marginTop: '16px', backgroundColor: '#f8fafc', padding: '16px', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                    <Checkbox
                      label="Automatically apply best qualifying discount"
                      checked={formState.enableAutoApply}
                      onChange={(checked) => setFormState({ ...formState, enableAutoApply: checked })}
                      helpText="When enabled, the best discount will be automatically applied when the cart loads"
                    />
                    
                    {formState.enableAutoApply && (
                      <div style={{ marginTop: '16px' }}>
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
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ height: '1px', background: '#e5e7eb', margin: '8px 0' }}></div>

                <div>
                  <Text as="h3" variant="headingSm" fontWeight="medium">
                    Show All Offers
                  </Text>
                  <div style={{ marginTop: '16px', backgroundColor: '#f8fafc', padding: '16px', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                    <Checkbox
                      label="Show 'Show all offers' button"
                      checked={formState.showAllOffers}
                      onChange={(checked) => setFormState({ ...formState, showAllOffers: checked })}
                      helpText="Display a button that shows all available discounts to customers"
                    />

                    {formState.showAllOffers && (
                      <div style={{ marginTop: '16px' }}>
                        <TextField
                          label="Button Text"
                          value={formState.showAllOffersButtonText}
                          onChange={(value) => setFormState({ ...formState, showAllOffersButtonText: value })}
                          autoComplete="off"
                          helpText="Text shown on the 'Show all offers' button"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ height: '1px', background: '#e5e7eb', margin: '8px 0' }}></div>

                <div>
                  <Text as="h3" variant="headingSm" fontWeight="medium">
                    Applied Discount Styling
                  </Text>
                  <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <TextField
                        label="Applied Discount Text"
                        value={formState.appliedDiscountText}
                        onChange={(value) => setFormState({ ...formState, appliedDiscountText: value })}
                        helpText="Custom text shown below the discount code"
                        autoComplete="off"
                      />
                    </div>
                    
                    <div>
                      <Text as="p" variant="bodyMd" tone="subdued">Background Color</Text>
                      <div className="color-picker-wrapper" style={{ marginTop: '8px' }}>
                        <input
                          type="color"
                          className="color-picker-input"
                          value={formState.backgroundColor}
                          onChange={(e) => setFormState({ ...formState, backgroundColor: e.target.value })}
                        />
                        <span style={{ fontSize: '14px', fontFamily: 'monospace' }}>{formState.backgroundColor}</span>
                      </div>
                    </div>

                    <div>
                      <Text as="p" variant="bodyMd" tone="subdued">Border Color</Text>
                      <div className="color-picker-wrapper" style={{ marginTop: '8px' }}>
                        <input
                          type="color"
                          className="color-picker-input"
                          value={formState.borderColor}
                          onChange={(e) => setFormState({ ...formState, borderColor: e.target.value })}
                        />
                        <span style={{ fontSize: '14px', fontFamily: 'monospace' }}>{formState.borderColor}</span>
                      </div>
                    </div>

                    <div>
                      <Text as="p" variant="bodyMd" tone="subdued">Text Color</Text>
                      <div className="color-picker-wrapper" style={{ marginTop: '8px' }}>
                        <input
                          type="color"
                          className="color-picker-input"
                          value={formState.textColor}
                          onChange={(e) => setFormState({ ...formState, textColor: e.target.value })}
                        />
                        <span style={{ fontSize: '14px', fontFamily: 'monospace' }}>{formState.textColor}</span>
                      </div>
                    </div>

                    <div>
                      <Text as="p" variant="bodyMd" tone="subdued">Coupon Code Color</Text>
                      <div className="color-picker-wrapper" style={{ marginTop: '8px' }}>
                        <input
                          type="color"
                          className="color-picker-input"
                          value={formState.couponCodeColor || formState.textColor}
                          onChange={(e) => setFormState({ ...formState, couponCodeColor: e.target.value })}
                        />
                        <span style={{ fontSize: '14px', fontFamily: 'monospace' }}>{formState.couponCodeColor || formState.textColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </BlockStack>
            </div>
          </div>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <div className="premium-card">
            <div className="premium-card-header" style={{ padding: '16px 20px', background: '#f8fafc' }}>
              <Text as="h3" variant="headingMd" fontWeight="medium">
                Live Preview
              </Text>
            </div>
            <div className="premium-card-body" style={{ background: '#f1f5f9' }}>
              <div style={{
                backgroundColor: '#ffffff',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}>
                <CouponCodeFieldComponent
                  id="selldrawer-coupon-field-preview"
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
                  onApplyCoupon={() => { }}
                  onRemoveDiscount={() => { }}
                  onSwitchDiscount={() => { }}
                  isPreview={true}
                />
              </div>

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Text as="p" variant="bodySm" tone="subdued">
                  This is how the coupon field will appear in your cart drawer.
                </Text>
              </div>
            </div>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

