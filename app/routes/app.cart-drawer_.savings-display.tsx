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
  Select,
  Checkbox,
  InlineStack,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useState, useCallback } from "react";
import { SavingsDisplay as SavingsDisplayComponent } from "../components/shared/SavingsDisplay";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop },
    include: {
      savingsDisplays: { where: { isActive: true } },
    },
  });

  const savingsDisplay = cartDrawer?.savingsDisplays[0] || null;

  return json({ cartDrawer, savingsDisplay });
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

export default function SavingsDisplay() {
  const { cartDrawer, savingsDisplay } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const [formState, setFormState] = useState({
    message: savingsDisplay?.message || "{amount} Saved so far!",
    position: savingsDisplay?.position || "above_total",
    backgroundColor: savingsDisplay?.backgroundColor || "#10B981",
    textColor: savingsDisplay?.textColor || "#FFFFFF",
    highlightColor: savingsDisplay?.highlightColor || "#FFFFFF",
  });

  const handleToggle = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "toggle");
    formData.append("enabled", (!cartDrawer?.savingsDisplayEnabled).toString());
    submit(formData, { method: "post" });
  }, [cartDrawer?.savingsDisplayEnabled, submit]);

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
      title="Savings Display"
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
                    {cartDrawer?.savingsDisplayEnabled ? "Disable" : "Enable"}
                  </Button>
                </InlineStack>
                
                {!cartDrawer?.savingsDisplayEnabled && (
                  <Banner tone="warning">
                    This feature is currently disabled. Enable it to show savings in your cart.
                  </Banner>
                )}

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
              
              <SavingsDisplayComponent
                message={formState.message}
                amount={330000} // Sample amount in cents (₹3300)
                backgroundColor={formState.backgroundColor}
                textColor={formState.textColor}
                isPreview={true}
              />

              <Text as="p" variant="bodyMd" tone="subdued">
                This is how the savings display will appear in your cart drawer.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

