import { useState, useCallback } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useNavigation, useLoaderData, Form } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  Button,
  Text,
  BlockStack,
  InlineStack,
  Checkbox,
  Tag,
  Banner,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import type { CartConfiguration, CartConfigurationTarget } from "./types";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  
  // Fetch products and collections for targeting
  const productsResponse = await admin.graphql(`
    query getProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            handle
          }
        }
      }
    }
  `, {
    variables: { first: 50 }
  });
  
  const collectionsResponse = await admin.graphql(`
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
  `, {
    variables: { first: 50 }
  });

  const productsData = await productsResponse.json();
  const collectionsData = await collectionsResponse.json();

  interface ShopifyProduct {
    id: string;
    title: string;
    handle: string;
  }

  interface ShopifyCollection {
    id: string;
    title: string;
    handle: string;
  }

  return json({
    products: productsData.data.products.edges.map((edge: { node: ShopifyProduct }) => edge.node),
    collections: collectionsData.data.collections.edges.map((edge: { node: ShopifyCollection }) => edge.node),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, redirect } = await authenticate.admin(request);
  const formData = await request.formData();

  try {
    const name = formData.get("name")?.toString();
    const description = formData.get("description")?.toString();
    const conditionType = formData.get("conditionType")?.toString();
    const conditionOperator = formData.get("conditionOperator")?.toString();
    const conditionValue = parseFloat(formData.get("conditionValue")?.toString() || "0");
    const actionType = formData.get("actionType")?.toString();
    const actionValue = formData.get("actionValue")?.toString() ? parseFloat(formData.get("actionValue")?.toString() || "0") : null;
    const actionMessage = formData.get("actionMessage")?.toString();
    const targetType = formData.get("targetType")?.toString();
    const selectedTargets = formData.get("selectedTargets")?.toString();

    if (!name || !conditionType || !conditionOperator || !actionType || !actionMessage || !targetType) {
      return json({ error: "Please fill in all required fields" }, { status: 400 });
    }

    // Create the configuration
    const config = await (prisma as any).cartConfiguration.create({
      data: {
        shop: session.shop,
        name,
        description: description || null,
        conditionType,
        conditionOperator,
        conditionValue,
        actionType,
        actionValue,
        actionMessage,
        targetType,
      },
    });

    // Create targets if not store-wide
    if (targetType !== "store_wide" && selectedTargets) {
      const targets = JSON.parse(selectedTargets);
      if (targets.length > 0) {
        await (prisma as any).cartConfigurationTarget.createMany({
          data: targets.map((target: { id: string; title: string }) => ({
            configurationId: config.id,
            targetType: targetType.slice(0, -1), // Remove 's' from 'products' or 'collections'
            shopifyId: target.id,
            title: target.title,
          })),
        });
      }
    }

    return redirect("/app/cart-configurations");
  } catch (error) {
    return json({ error: "Failed to create configuration. Please try again." }, { status: 500 });
  }
};

export default function NewCartConfiguration() {
  const { products, collections } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const shopify = useAppBridge();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [conditionType, setConditionType] = useState("cart_value");
  const [conditionOperator, setConditionOperator] = useState("greater_than");
  const [conditionValue, setConditionValue] = useState("");
  const [actionType, setActionType] = useState("discount_percentage");
  const [actionValue, setActionValue] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [targetType, setTargetType] = useState("store_wide");
  const [selectedProducts, setSelectedProducts] = useState<{ id: string; title: string }[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<{ id: string; title: string }[]>([]);

  const isSubmitting = navigation.state === "submitting";

  const conditionOptions = [
    { label: "Cart Value", value: "cart_value" },
    { label: "Product Count", value: "product_count" },
    { label: "Category Value", value: "category_value" },
  ];

  const operatorOptions = [
    { label: "Greater than", value: "greater_than" },
    { label: "Less than", value: "less_than" },
    { label: "Equals", value: "equals" },
  ];

  const actionOptions = [
    { label: "Percentage Discount", value: "discount_percentage" },
    { label: "Fixed Amount Discount", value: "discount_fixed" },
    { label: "Free Shipping", value: "free_shipping" },
    { label: "Upsell Product", value: "upsell_product" },
  ];

  const targetOptions = [
    { label: "Store-wide", value: "store_wide" },
    { label: "Specific Products", value: "products" },
    { label: "Specific Collections", value: "collections" },
  ];


  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const removeCollection = (collectionId: string) => {
    setSelectedCollections(prev => prev.filter(c => c.id !== collectionId));
  };

  return (
    <Page
      backAction={{ content: "Cart Configurations", url: "/app/cart-configurations" }}
      title="Create Cart Configuration"
    >
      <Layout>
        <Layout.Section>
          {actionData?.error && (
            <Banner tone="critical" title="Error">
              {actionData.error}
            </Banner>
          )}
          
          <Form method="post">
            {/* Hidden fields for selected targets */}
            <input 
              type="hidden" 
              name="selectedTargets" 
              value={targetType === "products" ? JSON.stringify(selectedProducts) : targetType === "collections" ? JSON.stringify(selectedCollections) : ""} 
            />
            <FormLayout>
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Basic Information
                  </Text>
                    <TextField
                      label="Configuration Name"
                      value={name}
                      onChange={setName}
                      name="name"
                      autoComplete="off"
                      helpText="A descriptive name for this cart configuration"
                    />
                    <TextField
                      label="Description"
                      value={description}
                      onChange={setDescription}
                      name="description"
                      autoComplete="off"
                      helpText="Optional description for internal reference"
                      multiline
                    />
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Condition
                  </Text>
                  <InlineStack gap="400">
                    <div style={{ flex: 1 }}>
                      <Select
                        label="Condition Type"
                        options={conditionOptions}
                        value={conditionType}
                        onChange={setConditionType}
                        name="conditionType"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Select
                        label="Operator"
                        options={operatorOptions}
                        value={conditionOperator}
                        onChange={setConditionOperator}
                        name="conditionOperator"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <TextField
                        label="Value"
                        value={conditionValue}
                        onChange={setConditionValue}
                        name="conditionValue"
                        type="number"
                        step={0.01}
                        autoComplete="off"
                      />
                    </div>
                  </InlineStack>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Action
                  </Text>
                  <Select
                    label="Action Type"
                    options={actionOptions}
                    value={actionType}
                    onChange={setActionType}
                    name="actionType"
                  />
                  {(actionType === "discount_percentage" || actionType === "discount_fixed") && (
                    <TextField
                      label={actionType === "discount_percentage" ? "Discount Percentage" : "Discount Amount"}
                      value={actionValue}
                      onChange={setActionValue}
                      name="actionValue"
                      type="number"
                      step={0.01}
                      suffix={actionType === "discount_percentage" ? "%" : "$"}
                      autoComplete="off"
                    />
                  )}
                  <TextField
                    label="Message to Customer"
                    value={actionMessage}
                    onChange={setActionMessage}
                    name="actionMessage"
                    autoComplete="off"
                    helpText="The message shown to customers (e.g., 'Add $50 more to get 10% off!')"
                    multiline
                  />
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Targeting
                  </Text>
                  <Select
                    label="Apply to"
                    options={targetOptions}
                    value={targetType}
                    onChange={setTargetType}
                    name="targetType"
                  />
                  
                  {targetType === "products" && (
                    <BlockStack gap="200">
                      <Button
                        onClick={() => {
                          shopify.resourcePicker({
                            type: "product",
                            multiple: true,
                          }).then((selection) => {
                            if (selection) {
                              setSelectedProducts(selection);
                            }
                          });
                        }}
                      >
                        Select Products
                      </Button>
                      {selectedProducts.length > 0 && (
                        <BlockStack gap="100">
                          <Text as="p" variant="bodyMd">
                            Selected Products:
                          </Text>
                          <InlineStack gap="100" wrap={false}>
                            {selectedProducts.map((product) => (
                              <Tag key={product.id} onRemove={() => removeProduct(product.id)}>
                                {product.title}
                              </Tag>
                            ))}
                          </InlineStack>
                        </BlockStack>
                      )}
                    </BlockStack>
                  )}

                  {targetType === "collections" && (
                    <BlockStack gap="200">
                      <Button
                        onClick={() => {
                          shopify.resourcePicker({
                            type: "collection",
                            multiple: true,
                          }).then((selection) => {
                            if (selection) {
                              setSelectedCollections(selection);
                            }
                          });
                        }}
                      >
                        Select Collections
                      </Button>
                      {selectedCollections.length > 0 && (
                        <BlockStack gap="100">
                          <Text as="p" variant="bodyMd">
                            Selected Collections:
                          </Text>
                          <InlineStack gap="100" wrap={false}>
                            {selectedCollections.map((collection) => (
                              <Tag key={collection.id} onRemove={() => removeCollection(collection.id)}>
                                {collection.title}
                              </Tag>
                            ))}
                          </InlineStack>
                        </BlockStack>
                      )}
                    </BlockStack>
                  )}
                </BlockStack>
              </Card>

              <InlineStack gap="200">
                <Button
                  variant="primary"
                  submit
                  loading={isSubmitting}
                >
                  Create Configuration
                </Button>
                <Button url="/app/cart-configurations">
                  Cancel
                </Button>
              </InlineStack>
            </FormLayout>
          </Form>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
