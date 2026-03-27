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
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useState, useCallback, useEffect, useRef } from "react";
import { CartTotals as CartTotalsComponent } from "../components/shared/CartTotals";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);
  const editingVersion = url.searchParams.get("version") || "default";

  const cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop },
    include: {
      cartTotals: { where: { isActive: true } },
    },
  });

  const cartTotals = cartDrawer?.cartTotals[0] || null;

  return json({ cartDrawer, cartTotals, editingVersion });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);
  const editingVersion = url.searchParams.get("version") || "default";

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "toggle") {
    const enabled = formData.get("enabled") === "true";

    // Check if data exists before enabling
    if (enabled) {
      const cartDrawer = await prisma.cartDrawer.findUnique({
        where: { shop },
        include: {
          cartTotals: { where: { isActive: true } },
        },
      });

      if (!cartDrawer || cartDrawer.cartTotals.length === 0) {
        return json({
          success: false,
          error: "Configuration required. Please save the configuration first before enabling."
        }, { status: 400 });
      }
    }

    await prisma.cartDrawer.update({
      where: { shop },
      data: { cartTotalsEnabled: enabled },
    });

    return json({ success: true });
  }

  if (intent === "save") {
    const cartDrawer = await prisma.cartDrawer.findUnique({
      where: { shop },
      include: { cartTotals: { where: { isActive: true } } },
    });

    if (!cartDrawer) {
      return json({ error: "Cart drawer not found" }, { status: 404 });
    }

    const data = {
      showOriginalPrice: formData.get("showOriginalPrice") === "true",
      showItemDiscounts: formData.get("showItemDiscounts") === "true",
      showSubtotal: formData.get("showSubtotal") === "true",
      showCouponDiscount: formData.get("showCouponDiscount") === "true",
      showTaxNotice: formData.get("showTaxNotice") === "true",
      subtotalLabel: formData.get("subtotalLabel") as string,
      totalLabel: formData.get("totalLabel") as string,
      taxNoticeText: formData.get("taxNoticeText") as string,
      originalPriceLabel: formData.get("originalPriceLabel") as string,
      itemDiscountsLabel: formData.get("itemDiscountsLabel") as string,
      borderColor: formData.get("borderColor") as string,
      backgroundColor: formData.get("backgroundColor") as string,
      textColor: formData.get("textColor") as string,
      totalTextColor: formData.get("totalTextColor") as string,
      discountColor: formData.get("discountColor") as string,
    };

    const existingCartTotals = cartDrawer.cartTotals[0];

    if (existingCartTotals) {
      await prisma.cartTotals.update({
        where: { id: existingCartTotals.id },
        data,
      });
    } else {
      await prisma.cartTotals.create({
        data: {
          id: crypto.randomUUID(),
          ...data,
          shop,
          cartDrawerId: cartDrawer.id,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    }

    // Auto-enable the feature after saving configuration
    await prisma.cartDrawer.update({
      where: { shop },
      data: { cartTotalsEnabled: true },
    });

    return redirect(`/app/cart-drawer?version=${editingVersion}`);
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function CartTotals() {
  const { cartDrawer, cartTotals, editingVersion } = useLoaderData<typeof loader>();
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
    showOriginalPrice: cartTotals?.showOriginalPrice ?? true,
    showItemDiscounts: cartTotals?.showItemDiscounts ?? true,
    showSubtotal: cartTotals?.showSubtotal ?? true,
    showCouponDiscount: cartTotals?.showCouponDiscount ?? true,
    showTaxNotice: cartTotals?.showTaxNotice ?? true,
    subtotalLabel: cartTotals?.subtotalLabel || "Subtotal",
    totalLabel: cartTotals?.totalLabel || "Total",
    taxNoticeText: cartTotals?.taxNoticeText || "Taxes and shipping calculated at checkout",
    originalPriceLabel: cartTotals?.originalPriceLabel || "Original Price",
    itemDiscountsLabel: cartTotals?.itemDiscountsLabel || "Item Discounts",
    borderColor: cartTotals?.borderColor || "#e5e7eb",
    backgroundColor: cartTotals?.backgroundColor || "#ffffff",
    textColor: cartTotals?.textColor || "#374151",
    totalTextColor: cartTotals?.totalTextColor || "#111827",
    discountColor: cartTotals?.discountColor || "#f59e0b",
  });

  const handleToggle = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "toggle");
    formData.append("enabled", (!cartDrawer?.cartTotalsEnabled).toString());
    submit(formData, { method: "post", action: `/app/cart-drawer/cart-totals?version=${editingVersion}` });
  }, [cartDrawer?.cartTotalsEnabled, submit]);

  const handleSubmit = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "save");
    Object.entries(formState).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    submit(formData, { method: "post", action: `/app/cart-drawer/cart-totals?version=${editingVersion}` });
  }, [formState, submit]);

  // Sample cart data for preview
  const sampleCartItems = [
    {
      original_price: 4999 * 100, // in cents
      final_price: 2999 * 100,
      quantity: 1,
    },
    {
      original_price: 1999 * 100,
      final_price: 1499 * 100,
      quantity: 2,
    }
  ];

  const sampleTotalPrice = sampleCartItems.reduce((sum, item) =>
    sum + (item.final_price * item.quantity), 0
  );

  const sampleDiscount = {
    code: 'SAVE20',
    type: 'percentage' as const,
    value: 20
  };

  return (
    <Page
      backAction={{ url: `/app/cart-drawer?version=${editingVersion}` }}
      title="Cart Totals Configuration"
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
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          color: #0ea5e9;
          font-size: 20px;
        }
      `}</style>

      <Layout>
        <Layout.Section>
          {/* Main Configuration Card */}
          <div className="premium-card">
            <div className="premium-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="icon-circle">
                  💰
                </div>
                <div>
                  <Text as="h2" variant="headingMd" fontWeight="bold">
                    Cart Totals Display
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Configure how prices, discounts, and taxes are displayed
                  </Text>
                </div>
              </div>
              <div className="premium-toggle-container">
                <span className={`status-badge ${cartDrawer?.cartTotalsEnabled ? 'active' : 'inactive'}`}>
                  <span className={`status-dot ${cartDrawer?.cartTotalsEnabled ? 'active' : 'inactive'}`}></span>
                  {cartDrawer?.cartTotalsEnabled ? 'Active' : 'Disabled'}
                </span>
                <label className="premium-toggle-label">
                  <input 
                    type="checkbox" 
                    checked={cartDrawer?.cartTotalsEnabled || false} 
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
                    Display Options
                  </Text>
                  <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    <Checkbox
                      label="Show Original Price"
                      checked={formState.showOriginalPrice}
                      onChange={(value) => setFormState({ ...formState, showOriginalPrice: value })}
                      helpText="When items have discounts"
                    />
                    <Checkbox
                      label="Show Item Discounts"
                      checked={formState.showItemDiscounts}
                      onChange={(value) => setFormState({ ...formState, showItemDiscounts: value })}
                      helpText="Detailed breakdown"
                    />
                    <Checkbox
                      label="Show Subtotal"
                      checked={formState.showSubtotal}
                      onChange={(value) => setFormState({ ...formState, showSubtotal: value })}
                    />
                    <Checkbox
                      label="Show Coupon Discount"
                      checked={formState.showCouponDiscount}
                      onChange={(value) => setFormState({ ...formState, showCouponDiscount: value })}
                      helpText="When applied"
                    />
                    <Checkbox
                      label="Show Tax & Shipping Notice"
                      checked={formState.showTaxNotice}
                      onChange={(value) => setFormState({ ...formState, showTaxNotice: value })}
                    />
                  </div>
                </div>

                <div style={{ height: '1px', background: '#e5e7eb', margin: '8px 0' }}></div>

                <div>
                  <Text as="h3" variant="headingSm" fontWeight="medium">
                    Labels & Text
                  </Text>
                  <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <TextField
                      label="Subtotal Label"
                      value={formState.subtotalLabel}
                      onChange={(value) => setFormState({ ...formState, subtotalLabel: value })}
                      autoComplete="off"
                    />
                    <TextField
                      label="Total Label"
                      value={formState.totalLabel}
                      onChange={(value) => setFormState({ ...formState, totalLabel: value })}
                      autoComplete="off"
                    />
                    <TextField
                      label="Original Price Label"
                      value={formState.originalPriceLabel}
                      onChange={(value) => setFormState({ ...formState, originalPriceLabel: value })}
                      autoComplete="off"
                    />
                    <TextField
                      label="Item Discounts Label"
                      value={formState.itemDiscountsLabel}
                      onChange={(value) => setFormState({ ...formState, itemDiscountsLabel: value })}
                      autoComplete="off"
                    />
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <TextField
                      label="Tax Notice Text"
                      value={formState.taxNoticeText}
                      onChange={(value) => setFormState({ ...formState, taxNoticeText: value })}
                      autoComplete="off"
                      multiline={2}
                    />
                  </div>
                </div>

                <div style={{ height: '1px', background: '#e5e7eb', margin: '8px 0' }}></div>

                <div>
                  <Text as="h3" variant="headingSm" fontWeight="medium">
                    Styling
                  </Text>
                  <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                    
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
                      <Text as="p" variant="bodyMd" tone="subdued">Total Text Color</Text>
                      <div className="color-picker-wrapper" style={{ marginTop: '8px' }}>
                        <input
                          type="color"
                          className="color-picker-input"
                          value={formState.totalTextColor}
                          onChange={(e) => setFormState({ ...formState, totalTextColor: e.target.value })}
                        />
                        <span style={{ fontSize: '14px', fontFamily: 'monospace' }}>{formState.totalTextColor}</span>
                      </div>
                    </div>

                    <div>
                      <Text as="p" variant="bodyMd" tone="subdued">Discount Color</Text>
                      <div className="color-picker-wrapper" style={{ marginTop: '8px' }}>
                        <input
                          type="color"
                          className="color-picker-input"
                          value={formState.discountColor}
                          onChange={(e) => setFormState({ ...formState, discountColor: e.target.value })}
                        />
                        <span style={{ fontSize: '14px', fontFamily: 'monospace' }}>{formState.discountColor}</span>
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
                backgroundColor: formState.backgroundColor,
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}>
                <CartTotalsComponent
                  items={sampleCartItems}
                  totalPrice={sampleTotalPrice}
                  config={{
                    showOriginalPrice: formState.showOriginalPrice,
                    showItemDiscounts: formState.showItemDiscounts,
                    showSubtotal: formState.showSubtotal,
                    showCouponDiscount: formState.showCouponDiscount,
                    showTaxNotice: formState.showTaxNotice,
                    subtotalLabel: formState.subtotalLabel,
                    totalLabel: formState.totalLabel,
                    taxNoticeText: formState.taxNoticeText,
                    originalPriceLabel: formState.originalPriceLabel,
                    itemDiscountsLabel: formState.itemDiscountsLabel,
                    borderColor: formState.borderColor,
                    backgroundColor: formState.backgroundColor,
                    textColor: formState.textColor,
                    totalTextColor: formState.totalTextColor,
                    discountColor: formState.discountColor,
                  }}
                  isPreview={true}
                />
              </div>

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Text as="p" variant="bodySm" tone="subdued">
                  Sample data used for preview
                </Text>
              </div>
            </div>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

