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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop },
    include: {
      productRecommendations: { where: { isActive: true } },
    },
  });

  const productRecommendation = cartDrawer?.productRecommendations[0] || null;

  return json({ cartDrawer, productRecommendation });
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
      data: { productRecommendationsEnabled: enabled },
    });

    return json({ success: true });
  }


  if (intent === "save") {
    const cartDrawer = await prisma.cartDrawer.findUnique({
      where: { shop },
      include: { productRecommendations: { where: { isActive: true } } },
    });

    if (!cartDrawer) {
      return json({ error: "Cart drawer not found" }, { status: 404 });
    }

    const data = {
      title: formData.get("title") as string,
      maxProducts: parseInt(formData.get("maxProducts") as string),
      layout: formData.get("layout") as string,
      recommendationType: formData.get("recommendationType") as string,
      showDiscount: formData.get("showDiscount") === "true",
      showDiscountBadge: formData.get("showDiscountBadge") === "true",
      showAddButton: formData.get("showAddButton") === "true",
    };

    const existingRecommendation = cartDrawer.productRecommendations[0];

    if (existingRecommendation) {
      await prisma.productRecommendation.update({
        where: { id: existingRecommendation.id },
        data,
      });
    } else {
      await prisma.productRecommendation.create({
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

export default function ProductRecommendations() {
  const { cartDrawer, productRecommendation } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const [formState, setFormState] = useState({
    title: productRecommendation?.title || "You may also like",
    maxProducts: productRecommendation?.maxProducts?.toString() || "4",
    layout: productRecommendation?.layout || "grid",
    recommendationType: productRecommendation?.recommendationType || "manual",
    showDiscount: productRecommendation?.showDiscount ?? true,
    showDiscountBadge: productRecommendation?.showDiscountBadge ?? true,
    showAddButton: productRecommendation?.showAddButton ?? true,
  });

  const handleToggle = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "toggle");
    formData.append("enabled", (!cartDrawer?.productRecommendationsEnabled).toString());
    submit(formData, { method: "post" });
  }, [cartDrawer?.productRecommendationsEnabled, submit]);

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
      title="Product Recommendations"
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
                    {cartDrawer?.productRecommendationsEnabled ? "Disable" : "Enable"}
                  </Button>
                </InlineStack>
                
                {!cartDrawer?.productRecommendationsEnabled && (
                  <Banner tone="warning">
                    This feature is currently disabled. Enable it to show product recommendations in your cart.
                  </Banner>
                )}

                <FormLayout>
                  <TextField
                    label="Section Title"
                    value={formState.title}
                    onChange={(value) => setFormState({ ...formState, title: value })}
                    helpText="Heading for the recommendations section"
                    autoComplete="off"
                  />

                  <TextField
                    label="Maximum Products to Show"
                    type="number"
                    value={formState.maxProducts}
                    onChange={(value) => setFormState({ ...formState, maxProducts: value })}
                    helpText="Number of recommended products to display"
                    autoComplete="off"
                  />

                  <Select
                    label="Layout"
                    options={[
                      { label: "Grid", value: "grid" },
                      { label: "Carousel", value: "carousel" },
                    ]}
                    value={formState.layout}
                    onChange={(value) => setFormState({ ...formState, layout: value })}
                  />

                  <Select
                    label="Recommendation Type"
                    options={[
                      { label: "Manual Selection", value: "manual" },
                      { label: "Related Products", value: "related" },
                      { label: "Frequently Bought Together", value: "frequently_bought" },
                      { label: "Best Sellers", value: "bestsellers" },
                      { label: "AI Powered", value: "ai" },
                    ]}
                    value={formState.recommendationType}
                    onChange={(value) => setFormState({ ...formState, recommendationType: value })}
                    helpText="How to select products to recommend"
                  />

                  <Checkbox
                    label="Show discount information"
                    checked={formState.showDiscount}
                    onChange={(value) => setFormState({ ...formState, showDiscount: value })}
                  />

                  <Checkbox
                    label="Show discount badge"
                    checked={formState.showDiscountBadge}
                    onChange={(value) => setFormState({ ...formState, showDiscountBadge: value })}
                  />

                  <Checkbox
                    label="Show add to cart button"
                    checked={formState.showAddButton}
                    onChange={(value) => setFormState({ ...formState, showAddButton: value })}
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
              
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                  {formState.title}
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px'
                }}>
                  {[1, 2].slice(0, Math.min(parseInt(formState.maxProducts), 2)).map((_, idx) => (
                    <div key={idx} style={{ 
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        width: '100%',
                        height: '80px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '4px',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px'
                      }}>
                        👟
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
                        Product {idx + 1}
                      </div>
                      {formState.showDiscount && (
                        <div style={{ marginBottom: '4px', fontSize: '12px' }}>
                          <span style={{ textDecoration: 'line-through', color: '#9ca3af', marginRight: '4px' }}>
                            ₹5999
                          </span>
                          <span style={{ fontWeight: '600' }}>₹2699</span>
                        </div>
                      )}
                      {formState.showDiscountBadge && (
                        <div style={{ 
                          display: 'inline-block',
                          backgroundColor: '#10b981',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          marginBottom: '8px'
                        }}>
                          55% off
                        </div>
                      )}
                      {formState.showAddButton && (
                        <div style={{ 
                          width: '100%',
                          padding: '4px',
                          border: '1px solid #f97316',
                          background: 'white',
                          color: '#f97316',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          + Add
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Text as="p" variant="bodyMd" tone="subdued">
                This is how recommendations will appear in your cart drawer.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

