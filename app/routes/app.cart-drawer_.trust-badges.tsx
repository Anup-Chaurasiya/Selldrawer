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
  Box,
  Divider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { syncCartDrawerConfigToMetafields } from "../utils/sync-config.server";
import { useState, useCallback, useEffect, useRef } from "react";
import { TrustBadges as TrustBadgesComponent } from "../components/shared/TrustBadges";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop },
    include: {
      trustBadges: { where: { isActive: true } },
    },
  });

  const trustBadge = cartDrawer?.trustBadges[0] || null;

  return json({ cartDrawer, trustBadge });
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
          trustBadges: { where: { isActive: true } },
        },
      });

      if (!cartDrawer || cartDrawer.trustBadges.length === 0) {
        return json({
          success: false,
          error: "Configuration required. Please save the configuration first before enabling."
        }, { status: 400 });
      }
    }

    await prisma.cartDrawer.update({
      where: { shop },
      data: { trustBadgesEnabled: enabled },
    });

    await syncCartDrawerConfigToMetafields(admin, shop);
    return json({ success: true });
  }

  if (intent === "save") {
    const cartDrawer = await prisma.cartDrawer.findUnique({
      where: { shop },
      include: { trustBadges: { where: { isActive: true } } },
    });

    if (!cartDrawer) {
      return json({ error: "Cart drawer not found" }, { status: 404 });
    }

    const title = formData.get("title") as string;
    const alignment = formData.get("alignment") as string;
    const paymentIcons = formData.getAll("paymentIcons") as string[];
    const imageUrl = formData.get("imageUrl") as string;
    const socialProofText = formData.get("socialProofText") as string;
    const imageUrls = imageUrl ? [imageUrl] : [];

    const data = {
      title,
      alignment,
      paymentIcons,
      imageUrls,
      socialProofText,
    };

    const existingBadge = cartDrawer.trustBadges[0];

    if (existingBadge) {
      await prisma.trustBadge.update({
        where: { id: existingBadge.id },
        data,
      });
    } else {
      await prisma.trustBadge.create({
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
      data: { trustBadgesEnabled: true },
    });

    await syncCartDrawerConfigToMetafields(admin, shop);
    return redirect(`/app/cart-drawer`);
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function TrustBadgesAdmin() {
  const { cartDrawer, trustBadge } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();
  const isLoading = navigation.state === "submitting";

  const [formState, setFormState] = useState({
    title: trustBadge?.title || "Secure Checkout",
    alignment: (trustBadge?.alignment as 'left'|'center'|'right') || "center",
    paymentIcons: trustBadge?.paymentIcons || ["visa", "master", "amex", "paypal"],
    imageUrl: trustBadge?.imageUrls?.[0] || "",
    socialProofText: trustBadge?.socialProofText || "Joined by 2,000+ others",
  });

  const handleIconToggle = (icon: string) => {
    const nextIcons = formState.paymentIcons.includes(icon)
      ? formState.paymentIcons.filter(i => i !== icon)
      : [...formState.paymentIcons, icon];
    setFormState({ ...formState, paymentIcons: nextIcons });
  };

  const handleToggle = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "toggle");
    formData.append("enabled", (!cartDrawer?.trustBadgesEnabled).toString());
    submit(formData, { method: "post" });
  }, [cartDrawer?.trustBadgesEnabled, submit]);

  const handleSubmit = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "save");
    formData.append("title", formState.title);
    formData.append("alignment", formState.alignment);
    formData.append("imageUrl", formState.imageUrl);
    formData.append("socialProofText", formState.socialProofText);
    formState.paymentIcons.forEach(icon => formData.append("paymentIcons", icon));
    submit(formData, { method: "post" });
  }, [formState, submit]);

  return (
    <Page
      backAction={{ url: `/app/cart-drawer` }}
      title="Trust Badges"
      primaryAction={{
        content: "Save",
        onAction: handleSubmit,
        loading: isLoading,
      }}
    >
      <style>{`
        .premium-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          margin-bottom: 20px;
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
        .payment-icon-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
        }
        .payment-icon-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .payment-icon-item.selected {
          border-color: #10b981;
          background-color: #f0fdf4;
        }
      `}</style>

      <Layout>
        <Layout.Section>
          <div className="premium-card">
            <div className="premium-card-header">
              <InlineStack gap="400" align="center">
                <div className="icon-circle">🛡️</div>
                <BlockStack>
                  <Text as="h2" variant="headingMd" fontWeight="bold">Trust Badges Settings</Text>
                  <Text as="p" variant="bodySm" tone="subdued">Increase conversion rates by showing secure payment options.</Text>
                </BlockStack>
              </InlineStack>
              <Button 
                variant="primary" 
                tone={cartDrawer?.trustBadgesEnabled ? "critical" : "success"}
                onClick={handleToggle}
              >
                {cartDrawer?.trustBadgesEnabled ? 'Disable Feature' : 'Enable Feature'}
              </Button>
            </div>
            <div className="premium-card-body">
              <FormLayout>
                <TextField 
                  label="Badge Title"
                  value={formState.title}
                  onChange={(v) => setFormState({ ...formState, title: v })}
                  autoComplete="off"
                />
                <Select
                  label="Alignment"
                  options={[
                    { label: "Left", value: "left" },
                    { label: "Center", value: "center" },
                    { label: "Right", value: "right" },
                  ]}
                  value={formState.alignment}
                  onChange={(v) => setFormState({ ...formState, alignment: v as any })}
                />

                <TextField 
                  label="Social Proof Text (Many Others)"
                  helpText="Show how many other people are trusting your brand. e.g. 'Joined by 2,000+ others'"
                  value={formState.socialProofText}
                  onChange={(v) => setFormState({ ...formState, socialProofText: v })}
                  autoComplete="off"
                />
                
                <Box paddingBlockStart="400">
                  <Text as="h3" variant="headingSm" fontWeight="bold">Select Payment Icons</Text>
                  <Box paddingBlockStart="200">
                    <div className="payment-icon-grid">
                      {["visa", "master", "amex", "paypal", "applepay", "googlepay", "shoppay"].map(icon => (
                        <div 
                          key={icon} 
                          className={`payment-icon-item ${formState.paymentIcons.includes(icon) ? 'selected' : ''}`}
                          onClick={() => handleIconToggle(icon)}
                        >
                          <Checkbox checked={formState.paymentIcons.includes(icon)} label={icon.toUpperCase()} />
                        </div>
                      ))}
                    </div>
                  </Box>
                </Box>

                <TextField 
                  label="Custom Badge Image URL (Optional)"
                  helpText="If provided, this image will replace the standard payment icons."
                  value={formState.imageUrl}
                  onChange={(v) => setFormState({ ...formState, imageUrl: v })}
                  autoComplete="off"
                />
              </FormLayout>
            </div>
          </div>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingSm" fontWeight="bold">Live Preview</Text>
              <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <TrustBadgesComponent 
                  config={{
                    isActive: true,
                    ...formState,
                    imageUrls: formState.imageUrl ? [formState.imageUrl] : []
                  }} 
                />
              </Box>
              <Text as="p" variant="bodySm" tone="subdued" textAlign="center">
                This is how the badges will be displayed below your checkout button.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
