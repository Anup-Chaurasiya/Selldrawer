import { useState, useCallback, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useNavigation, useLoaderData } from "@remix-run/react";
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
  Tag,
  Banner,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import type { CartConfiguration, CartConfigurationTarget } from "./types";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const configId = params.id;

  if (!configId) {
    throw new Response("Configuration not found", { status: 404 });
  }

  const configuration = await (prisma as any).cartConfiguration.findFirst({
    where: { id: configId, shop: session.shop },
    include: { targets: true },
  });

  if (!configuration) {
    throw new Response("Configuration not found", { status: 404 });
  }

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
    configuration,
    products: productsData.data.products.edges.map((edge: { node: ShopifyProduct }) => edge.node),
    collections: collectionsData.data.collections.edges.map((edge: { node: ShopifyCollection }) => edge.node),
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const configId = params.id;
  const formData = await request.formData();

  if (!configId) {
    return json({ error: "Configuration not found" }, { status: 404 });
  }

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

    // Update the configuration
    await (prisma as any).cartConfiguration.update({
      where: { id: configId },
      data: {
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

    // Delete existing targets
    await (prisma as any).cartConfigurationTarget.deleteMany({
      where: { configurationId: configId },
    });

    // Create new targets if not store-wide
    if (targetType !== "store_wide" && selectedTargets) {
      const targets = JSON.parse(selectedTargets);
      if (targets.length > 0) {
        await (prisma as any).cartConfigurationTarget.createMany({
          data: targets.map((target: { id: string; title: string }) => ({
            configurationId: configId,
            targetType: targetType.slice(0, -1), // Remove 's' from 'products' or 'collections'
            shopifyId: target.id,
            title: target.title,
          })),
        });
      }
    }

    return redirect("/app/cart-configurations");
  } catch (error) {
    console.error("Error updating configuration:", error);
    return json({ error: "Failed to update configuration" }, { status: 500 });
  }
};

export default function EditCartConfiguration() {
  const { configuration, products, collections } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const shopify = useAppBridge();

  const [name, setName] = useState(configuration.name);
  const [description, setDescription] = useState(configuration.description || "");
  const [conditionType, setConditionType] = useState(configuration.conditionType);
  const [conditionOperator, setConditionOperator] = useState(configuration.conditionOperator);
  const [conditionValue, setConditionValue] = useState(configuration.conditionValue.toString());
  const [actionType, setActionType] = useState(configuration.actionType);
  const [actionValue, setActionValue] = useState(configuration.actionValue?.toString() || "");
  const [actionMessage, setActionMessage] = useState(configuration.actionMessage);
  const [targetType, setTargetType] = useState(configuration.targetType);
  const [selectedProducts, setSelectedProducts] = useState<{ id: string; title: string }[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<{ id: string; title: string }[]>([]);

  const isSubmitting = navigation.state === "submitting";

  // Initialize selected items based on existing targets
  useEffect(() => {
    if (configuration.targets) {
      const productTargets = configuration.targets.filter((t: CartConfigurationTarget) => t.targetType === "product");
      const collectionTargets = configuration.targets.filter((t: CartConfigurationTarget) => t.targetType === "collection");
      
      setSelectedProducts(productTargets.map((t: CartConfigurationTarget) => ({ id: t.shopifyId, title: t.title || '' })));
      setSelectedCollections(collectionTargets.map((t: CartConfigurationTarget) => ({ id: t.shopifyId, title: t.title || '' })));
    }
  }, [configuration.targets]);

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

  const handleSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    
    if (targetType === "products") {
      formData.set("selectedTargets", JSON.stringify(selectedProducts));
    } else if (targetType === "collections") {
      formData.set("selectedTargets", JSON.stringify(selectedCollections));
    }

    form.requestSubmit();
  }, [targetType, selectedProducts, selectedCollections]);

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const removeCollection = (collectionId: string) => {
    setSelectedCollections(prev => prev.filter(c => c.id !== collectionId));
  };

  return (
    <Page
      backAction={{ content: "Cart Configurations", url: "/app/cart-configurations" }}
      title={`Edit: ${configuration.name}`}
    >
      <Layout>
        <Layout.Section>
          {actionData?.error && (
            <Banner tone="critical" title="Error">
              {actionData.error}
            </Banner>
          )}
          
          <form method="post" onSubmit={handleSubmit}>
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
                    multiline={2}
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
                    multiline={2}
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
                  Update Configuration
                </Button>
                <Button url="/app/cart-configurations">
                  Cancel
                </Button>
              </InlineStack>
            </FormLayout>
          </form>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
