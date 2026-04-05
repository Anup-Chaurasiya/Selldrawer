import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "@remix-run/react";
import {
  Page,
  FormLayout,
  TextField,
  Button,
  Text,
  Select,
  Checkbox,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { syncCartDrawerConfigToMetafields } from "../utils/sync-config.server";
import { useState, useCallback, useEffect, useRef } from "react";
import { FreeShippingBar as FreeShippingBarComponent } from "../components/shared/FreeShippingBar";

function stripShopifyGid(
  gid: string | null | undefined,
  resource: "Product" | "ProductVariant",
): string | null {
  if (!gid) return null;
  const prefix = `gid://shopify/${resource}/`;
  return gid.startsWith(prefix) ? gid.slice(prefix.length) : gid;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);

  const cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop },
    include: {
      freeShippingBars: { where: { isActive: true } },
    },
  });

  const freeShippingBar = cartDrawer?.freeShippingBars[0] || null;

  // Fetch collections for the dropdown
  const collectionsResponse = await admin.graphql(
    `#graphql
    query getCollections($first: Int!) {
      collections(first: $first) {
        edges {
          node {
            id
            title
            handle
          }
        }
      }
    }
  `,
    {
      variables: {
        first: 250,
      },
    }
  );

  const collectionsData = (await collectionsResponse.json()) as {
    data?: {
      collections: {
        edges: {
          node: {
            id: string;
            title: string;
            handle: string;
          };
        }[];
      };
    };
  };

  const shopDataResponse = await admin.graphql(
    `#graphql
    query getShop {
      shop {
        currencyCode
      }
    }
  `,
  );

  const collections = collectionsData.data?.collections.edges.map(edge => ({
    label: edge.node.title,
    value: edge.node.handle,
  })) || [];

  const shopData = await shopDataResponse.json() as any;
  const currencyCode = shopData.data?.shop?.currencyCode || 'USD';

  return json({ cartDrawer, freeShippingBar, shop, collections, currencyCode });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "toggle") {
    const enabled = formData.get("enabled") === "true";

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

    await syncCartDrawerConfigToMetafields(admin, shop);

    return json({ success: true });
  }

  if (intent === "save") {
    const cartDrawer = await prisma.cartDrawer.findUnique({
      where: { shop },
      include: {
        freeShippingBars: {
          where: { isActive: true },
          include: {
            upsellProducts: true,
          },
        }
      },
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
      borderColor: formData.get("borderColor") as string,
      showPercentage: formData.get("showPercentage") === "true",
      showProductUpsell: formData.get("showProductUpsell") === "true",
      upsellHeaderText: formData.get("upsellHeaderText") as string,
      eligibilitySource: formData.get("eligibilitySource") as string,
      eligibleCollectionHandle: (formData.get("eligibleCollectionHandle") as string)?.trim() || "",
    };

    if (data.showProductUpsell) {
      if (data.eligibilitySource === "none" || !data.eligibilitySource) {
        return json(
          {
            error:
              "Product upsell is on: choose Collection or All products as the eligibility source (not None).",
          },
          { status: 400 },
        );
      }
      if (data.eligibilitySource === "collection" && !data.eligibleCollectionHandle) {
        return json(
          { error: "Enter a collection handle when using Collection as the eligibility source." },
          { status: 400 },
        );
      }
    }

    const existingBar = cartDrawer.freeShippingBars[0];
    let updatedBar;
    if (existingBar) {
      updatedBar = await prisma.freeShippingProgressBar.update({
        where: { id: existingBar.id },
        data,
      });
    } else {
      updatedBar = await prisma.freeShippingProgressBar.create({
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

    await prisma.cartDrawer.update({
      where: { shop },
      data: { freeShippingProgressBarEnabled: true },
    });

    await syncCartDrawerConfigToMetafields(admin, shop);

    return json({ savedSettings: true as const });
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function FreeShippingBar() {
  const { cartDrawer, freeShippingBar, collections, currencyCode } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ error?: string; savedSettings?: boolean }>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const formData = navigation.formData;
  const submittingIntent = formData?.get("intent") as string | null;

  const prevIsSubmitting = useRef(false);
  const prevSubmittingIntent = useRef<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const justFinishedSave =
      prevIsSubmitting.current &&
      prevSubmittingIntent.current === "save" &&
      !isLoading;

    if (justFinishedSave && !actionData?.error && actionData?.savedSettings) {
      setShowToast(true);
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }

    prevIsSubmitting.current = isLoading;
    prevSubmittingIntent.current = submittingIntent;
  }, [submittingIntent, isLoading, actionData?.error, actionData?.savedSettings]);

  const [formState, setFormState] = useState({
    thresholdMode: freeShippingBar?.thresholdMode || "amount",
    thresholdAmount: freeShippingBar?.thresholdAmount?.toString() || "25",
    thresholdCount: freeShippingBar?.thresholdCount?.toString() || "5",
    currency: freeShippingBar?.currency || currencyCode,
    beforeThresholdMessage: freeShippingBar?.beforeThresholdMessage || "Add {remaining} for FREE shipping",
    afterThresholdMessage: freeShippingBar?.afterThresholdMessage || "You've unlocked FREE shipping!",
    progressBarColor: freeShippingBar?.progressBarColor || "#10b981",
    backgroundColor: freeShippingBar?.backgroundColor || "#f1f5f9",
    borderColor: freeShippingBar?.borderColor || "#e2e8f0",
    showPercentage: freeShippingBar?.showPercentage ?? true,
    showProductUpsell: (freeShippingBar as any)?.showProductUpsell ?? true,
    upsellHeaderText: (freeShippingBar as any)?.upsellHeaderText || "Almost there! Add this to unlock free shipping:",
    eligibilitySource: (freeShippingBar as any)?.eligibilitySource || "all_products",
    eligibleCollectionHandle: (freeShippingBar as any)?.eligibleCollectionHandle || "",
  });

  const currencySymbol = (formState.currency === 'USD') ? '$' : (formState.currency === 'EUR') ? '€' : (formState.currency === 'GBP') ? '£' : (formState.currency === 'INR') ? '₹' : '';

  const handleSubmit = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "save");
    Object.entries(formState).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    submit(formData, { method: "post", action: `/app/cart-drawer/free-shipping-bar` });
  }, [formState, submit]);

  return (
    <Page
      backAction={{ url: `/app/cart-drawer` }}
      title="Free Shipping Booster"
      primaryAction={{
        content: "Save Changes",
        onAction: handleSubmit,
        loading: isLoading,
      }}
    >
      {actionData?.error ? (
        <div style={{ marginBottom: "16px" }}>
          <Banner tone="critical" title="Could not save">
            <p>{actionData.error}</p>
          </Banner>
        </div>
      ) : null}
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
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            maxWidth: '500px',
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <Text as="p" variant="bodyMd" fontWeight="medium">
                Settings saved. Changes apply to your storefront cart drawer.
              </Text>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .premium-layout {
          display: flex;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 40px;
        }
        @media (max-width: 768px) {
          .premium-layout {
            flex-direction: column;
          }
          .sidebar-column {
            width: 100% !important;
            position: static !important;
          }
        }
        .main-column {
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
          min-width: 0;
        }
        .sidebar-column {
          width: 380px;
          flex: 0 0 auto;
          position: sticky;
          top: 24px;
        }
        .premium-card {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
          overflow: hidden;
          transition: all 0.2s ease-in-out;
        }
        .premium-card:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
          border-color: #cbd5e1;
        }
        .card-header {
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
          background: linear-gradient(180deg, rgba(248,250,252,0.8) 0%, rgba(255,255,255,0) 100%);
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .card-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.06);
          border: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        .icon-box.brand {
          background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
          color: white;
          border: none;
        }
        .icon-box svg {
          width: 20px;
          height: 20px;
        }
        .icon-box:not(.brand) svg {
          color: #475569;
        }
        .header-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .header-title {
          font-weight: 600;
          font-size: 16px;
          color: #0f172a;
          margin: 0;
          line-height: 1.2;
        }
        .header-desc {
          font-size: 13px;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
        }
        


        .input-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 600px) {
          .input-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .color-group {
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.2s;
        }
        .color-group:hover {
          border-color: #e2e8f0;
          background: #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .color-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .color-label {
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
        }
        .color-desc {
          font-size: 12px;
          color: #64748b;
        }
        .color-preview {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          overflow: hidden;
          position: relative;
          cursor: pointer;
          flex-shrink: 0;
        }
        .color-preview input[type="color"] {
          position: absolute;
          top: -10px;
          left: -10px;
          width: 56px;
          height: 56px;
          cursor: pointer;
          border: none;
          padding: 0;
        }
        
        .preview-pane {
          background: #ffffff;
          padding: 10px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.02);
        }

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

      <div className="premium-layout">
        <div className="main-column">



          {/* Goal & Requirements Card */}
          <div className="premium-card">
            <div className="card-header">
              <div className="icon-box">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="header-text">
                <h3 className="header-title">Goal Rules</h3>
                <p className="header-desc">Set the target customers need to hit for free shipping</p>
              </div>
            </div>
            <div className="card-body">
              <FormLayout>
                <div className="input-grid">
                  <Select
                    label="Threshold Mode"
                    options={[
                      { label: "Cart Total Amount", value: "amount" },
                      { label: "Item Count", value: "count" },
                    ]}
                    value={formState.thresholdMode}
                    onChange={(value) => setFormState({ ...formState, thresholdMode: value })}
                    helpText="Base free shipping on spend or quantity"
                  />
                  <Select
                    label="Store Currency"
                    options={[
                      { label: "US Dollar (USD)", value: "USD" },
                      { label: "Euro (EUR)", value: "EUR" },
                      { label: "British Pound (GBP)", value: "GBP" },
                      { label: "Indian Rupee (INR)", value: "INR" },
                    ]}
                    value={formState.currency}
                    onChange={(value) => setFormState({ ...formState, currency: value })}
                    helpText="Currency used for display"
                  />
                </div>

                {formState.thresholdMode === "amount" ? (
                  <TextField
                    label="Target Amount"
                    type="number"
                    value={formState.thresholdAmount}
                    onChange={(value) => setFormState({ ...formState, thresholdAmount: value })}
                    helpText="Customers need to spend this amount to unlock free shipping"
                    prefix={currencySymbol}
                    autoComplete="off"
                  />
                ) : (
                  <TextField
                    label="Target Items Count"
                    type="number"
                    value={formState.thresholdCount}
                    onChange={(value) => setFormState({ ...formState, thresholdCount: value })}
                    helpText="Customers need to add this many items to unlock free shipping"
                    suffix="items"
                    autoComplete="off"
                  />
                )}
              </FormLayout>
            </div>
          </div>

          {/* Messaging Card */}
          <div className="premium-card">
            <div className="card-header">
              <div className="icon-box">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="header-text">
                <h3 className="header-title">Dynamic Messaging</h3>
                <p className="header-desc">Customize text shown to customers as they shop</p>
              </div>
            </div>
            <div className="card-body">
              <FormLayout>
                <TextField
                  label="Before Threshold Message"
                  value={formState.beforeThresholdMessage}
                  onChange={(value) => setFormState({ ...formState, beforeThresholdMessage: value })}
                  helpText={formState.thresholdMode === "amount"
                    ? "Use {remaining} to place the remaining amount dynamically."
                    : "Use {remaining} to place the remaining items count dynamically."}
                  autoComplete="off"
                />

                <TextField
                  label="Goal Reached Message"
                  value={formState.afterThresholdMessage}
                  onChange={(value) => setFormState({ ...formState, afterThresholdMessage: value })}
                  helpText="What customers see when they unlock free shipping"
                  autoComplete="off"
                />
              </FormLayout>
            </div>
          </div>

          {/* Product Upsell Card */}
          <div className="premium-card">
            <div className="card-header">
              <div className="icon-box">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <div className="header-text">
                <h3 className="header-title">Product Upsell</h3>
                <p className="header-desc">Show product recommendations to help customers reach free shipping</p>
              </div>
            </div>
            <div className="card-body">
              <FormLayout>
                <div className="color-group" style={{ cursor: 'pointer' }} onClick={() => setFormState({ ...formState, showProductUpsell: !formState.showProductUpsell })}>
                  <div className="color-info">
                    <span className="color-label">Enable Product Recommendations</span>
                    <span className="color-desc">Show products when close to threshold</span>
                  </div>
                  <div style={{ pointerEvents: 'none' }}>
                    <Checkbox
                      label=""
                      checked={formState.showProductUpsell}
                      onChange={(value) => setFormState({ ...formState, showProductUpsell: value })}
                    />
                  </div>
                </div>

                {formState.showProductUpsell && (
                  <>
                    <TextField
                      label="Upsell Header Text"
                      value={formState.upsellHeaderText}
                      onChange={(value) => setFormState({ ...formState, upsellHeaderText: value })}
                      helpText="Heading shown above product recommendations"
                      autoComplete="off"
                    />

                    <Banner tone="info">
                      Configure which products customers can view to help them reach free shipping. Products that meet or exceed the remaining amount are prioritized to help customers reach the goal with one addition.
                    </Banner>

                    <Select
                      label="Eligibility Source"
                      options={[
                        { label: "None (No product recommendations)", value: "none" },
                        { label: "Collection", value: "collection" },
                        { label: "All Products", value: "all_products" },
                      ]}
                      value={formState.eligibilitySource}
                      onChange={(value) => setFormState({ ...formState, eligibilitySource: value })}
                      helpText="Choose where to source products from"
                    />

                    {formState.eligibilitySource === "collection" && (
                      <Select
                        label="Select Collection"
                        options={[
                          { label: "Choose a collection...", value: "" },
                          ...collections,
                        ]}
                        value={formState.eligibleCollectionHandle}
                        onChange={(value) => setFormState({ ...formState, eligibleCollectionHandle: value })}
                        helpText="Select the collection to source upsell products from"
                      />
                    )}
                  </>
                )}
              </FormLayout>
            </div>
          </div>

          {/* Appearance Card */}
          <div className="premium-card">
            <div className="card-header">
              <div className="icon-box">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <div className="header-text">
                <h3 className="header-title">Appearance</h3>
                <p className="header-desc">Design the progress bar to match your brand</p>
              </div>
            </div>
            <div className="card-body">
              <div className="input-grid">
                <div className="color-group">
                  <div className="color-info">
                    <span className="color-label">Progress Bar Fill</span>
                    <span className="color-desc">The active color as it fills</span>
                  </div>
                  <div className="color-preview">
                    <input
                      type="color"
                      value={formState.progressBarColor}
                      onChange={(e) => setFormState({ ...formState, progressBarColor: e.target.value })}
                    />
                  </div>
                </div>

                <div className="color-group">
                  <div className="color-info">
                    <span className="color-label">Track Background</span>
                    <span className="color-desc">The empty part of the bar</span>
                  </div>
                  <div className="color-preview">
                    <input
                      type="color"
                      value={formState.backgroundColor}
                      onChange={(e) => setFormState({ ...formState, backgroundColor: e.target.value })}
                    />
                  </div>
                </div>

                <div className="color-group">
                  <div className="color-info">
                    <span className="color-label">Border Color</span>
                    <span className="color-desc">Outline around the bar</span>
                  </div>
                  <div className="color-preview">
                    <input
                      type="color"
                      value={formState.borderColor}
                      onChange={(e) => setFormState({ ...formState, borderColor: e.target.value })}
                    />
                  </div>
                </div>

                <div className="color-group" style={{ cursor: 'pointer' }} onClick={() => setFormState({ ...formState, showPercentage: !formState.showPercentage })}>
                  <div className="color-info">
                    <span className="color-label">Show Percentage</span>
                    <span className="color-desc">Display % inside the bar</span>
                  </div>
                  <div style={{ pointerEvents: 'none' }}>
                    <Checkbox
                      label=""
                      checked={formState.showPercentage}
                      onChange={(value) => setFormState({ ...formState, showPercentage: value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Preview Sidebar */}
        <div className="sidebar-column">
          <div className="premium-card">
            <div className="card-header">
              <div className="icon-box">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div className="header-text">
                <h3 className="header-title">Live Preview</h3>
                <p className="header-desc">How it looks in the cart</p>
              </div>
            </div>
            <div className="card-body" style={{ backgroundColor: '#f8fafc' }}>

              <div className="preview-pane">
                {(() => {
                  const threshold = formState.thresholdMode === "amount"
                    ? parseFloat(formState.thresholdAmount) || 5000
                    : parseInt(formState.thresholdCount) || 5;

                  const sampleCart = {
                    item_count: formState.thresholdMode === "count"
                      ? Math.floor(threshold * 0.6)
                      : 3,
                    total_price: formState.thresholdMode === "amount"
                      ? Math.round(threshold * 0.6 * 100)
                      : 300000
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
                      borderColor={formState.borderColor}
                      showPercentage={formState.showPercentage}
                      currency={formState.currency}
                      cart={sampleCart}
                      isPreview={true}
                      showProductUpsell={formState.showProductUpsell}
                      upsellHeaderText={formState.upsellHeaderText}
                    />
                  );
                })()}
              </div>

              <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                Preview shows progress at 60% with sample cart data.
              </Text>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
