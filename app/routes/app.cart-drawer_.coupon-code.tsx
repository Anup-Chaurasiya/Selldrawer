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
  });

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
    
    await prisma.cartDrawer.update({
      where: { shop },
      data: { couponCodeFieldEnabled: enabled },
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
    };

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
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder={formState.placeholder}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <button style={{
                  padding: '8px 16px',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  {formState.buttonText}
                </button>
              </div>

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

