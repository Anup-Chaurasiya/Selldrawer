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
  Select,
  Checkbox,
  InlineStack,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useState, useCallback, useEffect, useRef } from "react";
import { SavingsDisplay as SavingsDisplayComponent } from "../components/shared/SavingsDisplay";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);
  const editingVersion = url.searchParams.get("version") || "default";

  const cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop },
    include: {
      savingsDisplays: { where: { isActive: true } },
    },
  });

  const savingsDisplay = cartDrawer?.savingsDisplays[0] || null;

  return json({ cartDrawer, savingsDisplay, editingVersion });
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
          savingsDisplays: { where: { isActive: true } },
        },
      });

      if (!cartDrawer || cartDrawer.savingsDisplays.length === 0) {
        return json({
          success: false,
          error: "Configuration required. Please save the configuration first before enabling."
        }, { status: 400 });
      }
    }

    await prisma.cartDrawer.update({
      where: { shop },
      data: { savingsDisplayEnabled: enabled },
    });

    return json({ success: true });
  }

  if (intent === "save") {
    const cartDrawer = await prisma.cartDrawer.findUnique({
      where: { shop },
      include: { savingsDisplays: { where: { isActive: true } } },
    });

    if (!cartDrawer) {
      return json({ error: "Cart drawer not found" }, { status: 404 });
    }

    const data = {
      message: formData.get("message") as string,
      position: formData.get("position") as string,
      backgroundColor: formData.get("backgroundColor") as string,
      textColor: formData.get("textColor") as string,
      borderColor: formData.get("borderColor") as string,
      highlightColor: formData.get("highlightColor") as string,
    };

    const existingDisplay = cartDrawer.savingsDisplays[0];

    if (existingDisplay) {
      await prisma.savingsDisplay.update({
        where: { id: existingDisplay.id },
        data,
      });
    } else {
      await prisma.savingsDisplay.create({
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
      data: { savingsDisplayEnabled: true },
    });

    return redirect(`/app/cart-drawer?version=${editingVersion}`);
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function SavingsDisplay() {
  const { cartDrawer, savingsDisplay, editingVersion } = useLoaderData<typeof loader>();
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
    message: savingsDisplay?.message || "{amount} Saved so far!",
    position: savingsDisplay?.position || "above_total",
    backgroundColor: savingsDisplay?.backgroundColor || "#10B981",
    textColor: savingsDisplay?.textColor || "#FFFFFF",
    borderColor: savingsDisplay?.borderColor || "#FFFFFF",
    highlightColor: savingsDisplay?.highlightColor || "#FFFFFF",
  });

  const handleToggle = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "toggle");
    formData.append("enabled", (!cartDrawer?.savingsDisplayEnabled).toString());
    submit(formData, { method: "post", action: `/app/cart-drawer/savings-display?version=${editingVersion}` });
  }, [cartDrawer?.savingsDisplayEnabled, submit]);

  const handleSubmit = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "save");
    Object.entries(formState).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    submit(formData, { method: "post", action: `/app/cart-drawer/savings-display?version=${editingVersion}` });
  }, [formState, submit]);

  return (
    <Page
      backAction={{ url: `/app/cart-drawer?version=${editingVersion}` }}
      title="Savings Display"
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
        
        .icon-circle {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
          color: #ffffff;
          font-size: 20px;
        }
      `}</style>

      <Layout>
        <Layout.Section>
          <div className="premium-card">
            <div className="premium-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="icon-circle">
                  💰
                </div>
                <div>
                  <Text as="h2" variant="headingMd" fontWeight="bold">
                    Savings Display
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Show customers how much they're saving to encourage checkout.
                  </Text>
                </div>
              </div>
              <div className="premium-toggle-container">
                <span className={`status-badge ${cartDrawer?.savingsDisplayEnabled ? 'active' : 'inactive'}`}>
                  <span className={`status-dot ${cartDrawer?.savingsDisplayEnabled ? 'active' : 'inactive'}`}></span>
                  {cartDrawer?.savingsDisplayEnabled ? 'Active' : 'Disabled'}
                </span>
                <label className="premium-toggle-label">
                  <input 
                    type="checkbox" 
                    checked={cartDrawer?.savingsDisplayEnabled || false} 
                    onChange={handleToggle}
                    disabled={isLoading}
                  />
                  <span className="premium-toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="premium-card-body">
              {!cartDrawer?.savingsDisplayEnabled && (
                <div style={{ marginBottom: '20px' }}>
                  <Banner tone="warning">
                    This feature is currently disabled. Enable it to show savings in your cart.
                  </Banner>
                </div>
              )}
                
              <BlockStack gap="400">
                <FormLayout>
                  <TextField
                    label="Message"
                    value={formState.message}
                    onChange={(value) => setFormState({ ...formState, message: value })}
                    helpText="Use {amount} to show total savings"
                    autoComplete="off"
                  />

                  <Select
                    label="Position"
                    options={[
                      { label: "Above Total", value: "above_total" },
                      { label: "Below Total", value: "below_total" },
                      { label: "Top of Cart", value: "top" },
                    ]}
                    value={formState.position}
                    onChange={(value) => setFormState({ ...formState, position: value })}
                  />
                </FormLayout>
              </BlockStack>
            </div>
          </div>
          
          <div className="premium-card">
            <div className="premium-card-header">
              <Text as="h3" variant="headingMd" fontWeight="medium">
                Color Profile
              </Text>
            </div>
            
            <div className="premium-card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                  <TextField
                    label="Background Color"
                    type={"color" as any}
                    value={formState.backgroundColor}
                    onChange={(value) => setFormState({ ...formState, backgroundColor: value })}
                    autoComplete="off"
                  />

                  <TextField
                    label="Text Color"
                    type={"color" as any}
                    value={formState.textColor}
                    onChange={(value) => setFormState({ ...formState, textColor: value })}
                    autoComplete="off"
                  />

                  <TextField
                    label="Border Color"
                    type={"color" as any}
                    value={formState.borderColor}
                    onChange={(value) => setFormState({ ...formState, borderColor: value })}
                    autoComplete="off"
                  />
                </div>
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
            <div className="premium-card-body" style={{ background: '#f8fafc' }}>
              <SavingsDisplayComponent
                message={formState.message}
                amount={330000} // Sample amount in cents (₹3300)
                backgroundColor={formState.backgroundColor}
                textColor={formState.textColor}
                borderColor={formState.borderColor}
                isPreview={true}
              />

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Text as="p" variant="bodySm" tone="subdued">
                  This is how the savings display will appear in your cart drawer.
                </Text>
              </div>
            </div>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

