import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  BlockStack,
  Text,
  InlineStack,
  Banner,
  Box,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { syncCartDrawerConfigToMetafields } from "../utils/sync-config.server";
import { useCallback } from "react";
import { AcceleratedCheckout as AcceleratedCheckoutComponent } from "../components/shared/AcceleratedCheckout";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop },
  });

  return json({ cartDrawer });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "toggle") {
    const enabled = formData.get("enabled") === "true";

    await prisma.cartDrawer.update({
      where: { shop },
      data: { acceleratedCheckoutEnabled: enabled },
    });

    await syncCartDrawerConfigToMetafields(admin, shop);
    return json({ success: true });
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function AcceleratedCheckoutAdmin() {
  const { cartDrawer } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const handleToggle = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "toggle");
    formData.append("enabled", (!cartDrawer?.acceleratedCheckoutEnabled).toString());
    submit(formData, { method: "post" });
  }, [cartDrawer?.acceleratedCheckoutEnabled, submit]);

  return (
    <Page
      backAction={{ url: `/app/cart-drawer` }}
      title="Accelerated Checkout"
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
        .premium-card-header { padding: 20px 24px; border-bottom: 1px solid #f3f4f6; background: linear-gradient(to right, #f8fafc, #ffffff); display: flex; justify-content: space-between; align-items: center; }
        .premium-card-body { padding: 24px; }
        .icon-circle { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; font-size: 20px; }
      `}</style>

      <Layout>
        <Layout.Section>
          <div className="premium-card">
            <div className="premium-card-header">
              <InlineStack gap="400" align="center">
                <div className="icon-circle">⚡</div>
                <BlockStack>
                  <Text as="h2" variant="headingMd" fontWeight="bold">Express Buttons</Text>
                  <Text as="p" variant="bodySm" tone="subdued">Surface Shop Pay, Apple Pay, and Google Pay for instant checkout.</Text>
                </BlockStack>
              </InlineStack>
              <Button variant="primary" tone={cartDrawer?.acceleratedCheckoutEnabled ? "critical" : "success"} onClick={handleToggle} loading={isLoading}>
                {cartDrawer?.acceleratedCheckoutEnabled ? 'Disable Feature' : 'Enable Feature'}
              </Button>
            </div>
            <div className="premium-card-body">
              <BlockStack gap="400">
                <Banner tone="info">
                  <Text as="p">
                    This feature automatically detects existing express checkout buttons from your theme and moves them into the cart drawer. This ensures compatibility with <strong>Shopify Basic</strong> without requiring complex API keys or Plus access.
                  </Text>
                </Banner>
                <Text as="p">
                  Once enabled, buttons like Shop Pay, PayPal, and Apple Pay will appear directly below the main checkout button in your cart drawer.
                </Text>
              </BlockStack>
            </div>
          </div>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingSm" fontWeight="bold">Demo Preview</Text>
              <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <AcceleratedCheckoutComponent config={{ isActive: true }} />
              </Box>
              <Text as="p" variant="bodySm" tone="subdued" textAlign="center">
                Buttons will mirror your store's native payment settings.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
