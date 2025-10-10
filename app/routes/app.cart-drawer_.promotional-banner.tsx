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
  Checkbox,
  InlineStack,
  Banner,
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
    include: {
      promotionalBanners: { where: { isActive: true } },
    },
  });

  const promotionalBanner = cartDrawer?.promotionalBanners[0] || null;

  return json({ cartDrawer, promotionalBanner });
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
      data: { promotionalBannerEnabled: enabled },
    });

    return json({ success: true });
  }

  if (intent === "save") {
    const cartDrawer = await prisma.cartDrawer.findUnique({
      where: { shop },
      include: { promotionalBanners: { where: { isActive: true } } },
    });

    if (!cartDrawer) {
      return json({ error: "Cart drawer not found" }, { status: 404 });
    }

    const data = {
      title: formData.get("title") as string,
      subtitle: formData.get("subtitle") as string || null,
      backgroundColor: formData.get("backgroundColor") as string,
      textColor: formData.get("textColor") as string,
    };

    const existingBanner = cartDrawer.promotionalBanners[0];

    if (existingBanner) {
      await prisma.promotionalBanner.update({
        where: { id: existingBanner.id },
        data,
      });
    } else {
      await prisma.promotionalBanner.create({
        data: {
          ...data,
          shop,
          cartDrawerId: cartDrawer.id,
          isActive: true,
        },
      });
    }

    return redirect("/app/cart-drawer");
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function PromotionalBanner() {
  const { cartDrawer, promotionalBanner } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const [formState, setFormState] = useState({
    title: promotionalBanner?.title || "Summer Collection Sale",
    subtitle: promotionalBanner?.subtitle || "Buy 2 Get 10% OFF | Buy 3 Get 15% OFF",
    backgroundColor: promotionalBanner?.backgroundColor || "#FF6B35",
    textColor: promotionalBanner?.textColor || "#FFFFFF",
  });

  const handleToggle = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "toggle");
    formData.append("enabled", (!cartDrawer?.promotionalBannerEnabled).toString());
    submit(formData, { method: "post" });
  }, [cartDrawer?.promotionalBannerEnabled, submit]);

  const handleSubmit = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "save");
    Object.entries(formState).forEach(([key, value]) => {
      formData.append(key, value?.toString() || "");
    });
    submit(formData, { method: "post" });
  }, [formState, submit]);

  return (
    <Page
      backAction={{ url: "/app/cart-drawer" }}
      title="Promotional Banner"
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
                    {cartDrawer?.promotionalBannerEnabled ? "Disable" : "Enable"}
                  </Button>
                </InlineStack>
                
                {!cartDrawer?.promotionalBannerEnabled && (
                  <Banner tone="warning">
                    This feature is currently disabled. Enable it to show promotional banners in your cart.
                  </Banner>
                )}

                <FormLayout>
                  <TextField
                    label="Banner Title"
                    value={formState.title}
                    onChange={(value) => setFormState({ ...formState, title: value })}
                    helpText="Main promotional message"
                    autoComplete="off"
                  />

                  <TextField
                    label="Banner Subtitle (Optional)"
                    value={formState.subtitle}
                    onChange={(value) => setFormState({ ...formState, subtitle: value })}
                    helpText="Additional details or offer information"
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
                    autoComplete="off"
                  />
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
              
              <div style={{ 
                backgroundColor: formState.backgroundColor,
                color: formState.textColor,
                padding: '16px',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
                  {formState.title}
                </div>
                {formState.subtitle && (
                  <div style={{ fontSize: '14px' }}>
                    {formState.subtitle}
                  </div>
                )}
              </div>

              <Text as="p" variant="bodyMd" tone="subdued">
                This is how the banner will appear in your cart drawer.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

