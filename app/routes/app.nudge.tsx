import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
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
  Modal,
  ResourceList,
  ResourceItem,
  Thumbnail,
  Badge,
  EmptyState,
  Divider,
  Box,
  Icon,
  ColorPicker,
  RangeSlider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useState, useCallback } from "react";
import { DeleteIcon, EditIcon } from "@shopify/polaris-icons";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  // Get or create Nudge configuration
  let nudgeConfig = await prisma.nudgePopup.findUnique({
    where: { shop },
    include: {
      rules: {
        include: {
          products: {
            orderBy: { position: 'asc' }
          }
        }
      }
    }
  });

  if (!nudgeConfig) {
    nudgeConfig = await prisma.nudgePopup.create({
      data: {
        shop,
        isActive: false,
      },
      include: {
        rules: {
          include: {
            products: {
              orderBy: { position: 'asc' }
            }
          }
        }
      }
    });
  }

  // Fetch products from Shopify
  let shopProducts: any[] = [];
  let shopCollections: any[] = [];
  
  try {
    const response = await admin.graphql(`
      query getProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              status
              description
              images(first: 1) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              variants(first: 1) {
                edges {
                  node {
                    id
                    price
                    compareAtPrice
                  }
                }
              }
            }
          }
        }
      }
    `, {
      variables: { first: 100 }
    });

    const responseJson = await response.json();
    
    if (responseJson.data?.products?.edges) {
      shopProducts = responseJson.data.products.edges.map((edge: any) => {
        const product = edge.node;
        const image = product.images.edges[0]?.node;
        const variant = product.variants.edges[0]?.node;
        
        return {
          id: product.handle,
          shopifyProductId: product.id.replace('gid://shopify/Product/', ''),
          title: product.title,
          handle: product.handle,
          description: product.description || '',
          status: product.status.toLowerCase(),
          images: image ? [{ src: image.url, alt: image.altText }] : [],
          variants: variant ? [{
            id: variant.id.replace('gid://shopify/ProductVariant/', ''),
            price: variant.price,
            compare_at_price: variant.compareAtPrice
          }] : []
        };
      });
    }
  } catch (error) {
    console.error('Error fetching products:', error);
  }

  // Fetch collections
  try {
    const collectionsResponse = await admin.graphql(`
      query getCollections($first: Int!) {
        collections(first: $first) {
          edges {
            node {
              id
              title
              handle
              productsCount
            }
          }
        }
      }
    `, {
      variables: { first: 100 }
    });

    const collectionsJson = await collectionsResponse.json();
    
    if (collectionsJson.data?.collections?.edges) {
      shopCollections = collectionsJson.data.collections.edges.map((edge: any) => {
        const collection = edge.node;
        return {
          id: collection.handle,
          shopifyCollectionId: collection.id.replace('gid://shopify/Collection/', ''),
          title: collection.title,
          handle: collection.handle,
          productsCount: collection.productsCount || 0
        };
      });
    }
  } catch (error) {
    console.error('Error fetching collections:', error);
  }

  return json({ nudgeConfig, shopProducts, shopCollections });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Get or create Nudge config
  let nudgeConfig = await prisma.nudgePopup.findUnique({
    where: { shop }
  });

  if (!nudgeConfig) {
    nudgeConfig = await prisma.nudgePopup.create({
      data: { shop }
    });
  }

  if (intent === "toggle") {
    const enabled = formData.get("enabled") === "true";
    await prisma.nudgePopup.update({
      where: { shop },
      data: { isActive: enabled }
    });
    return json({ success: true });
  }

  if (intent === "save-settings") {
    const data = {
      title: formData.get("title") as string,
      subtitle: formData.get("subtitle") as string,
      recommendationType: "manual",
      showOnAddToCart: formData.get("showOnAddToCart") === "true",
      popupDelay: parseInt(formData.get("popupDelay") as string || "0"),
      overlayColor: formData.get("overlayColor") as string,
      overlayOpacity: parseInt(formData.get("overlayOpacity") as string || "50"),
      popupBackgroundColor: formData.get("popupBackgroundColor") as string,
      popupBorderRadius: parseInt(formData.get("popupBorderRadius") as string || "8"),
      titleColor: formData.get("titleColor") as string,
      subtitleColor: formData.get("subtitleColor") as string,
      continueButtonText: formData.get("continueButtonText") as string,
      continueButtonColor: formData.get("continueButtonColor") as string,
      continueButtonTextColor: formData.get("continueButtonTextColor") as string,
      selectButtonText: formData.get("selectButtonText") as string,
      selectButtonColor: formData.get("selectButtonColor") as string,
      selectButtonTextColor: formData.get("selectButtonTextColor") as string,
      closeButtonColor: formData.get("closeButtonColor") as string,
      showProductImage: formData.get("showProductImage") === "true",
      showProductPrice: formData.get("showProductPrice") === "true",
      showProductComparePrice: formData.get("showProductComparePrice") === "true",
      showProductDescription: formData.get("showProductDescription") === "true",
      maxProducts: parseInt(formData.get("maxProducts") as string || "4"),
      layout: formData.get("layout") as string,
      enableAnimation: formData.get("enableAnimation") === "true",
      animationType: formData.get("animationType") as string,
    };

    await prisma.nudgePopup.update({
      where: { shop },
      data
    });

    return json({ success: true });
  }

  if (intent === "add-rule") {
    const triggerType = formData.get("triggerType") as string;
    const triggerValue = formData.get("triggerValue") as string;
    const triggerProductId = formData.get("triggerProductId") as string;
    const triggerTitle = formData.get("triggerTitle") as string;
    const upsellProducts = JSON.parse(formData.get("upsellProducts") as string || "[]");

    // Create the rule
    const rule = await prisma.nudgeRule.create({
      data: {
        nudgeId: nudgeConfig.id,
        triggerType,
        triggerValue,
        triggerProductId,
        triggerTitle,
      }
    });

    // Add upsell products
    for (let i = 0; i < upsellProducts.length; i++) {
      const productHandle = upsellProducts[i];
      
      try {
        const response = await admin.graphql(`
          query getProductByHandle($handle: String!) {
            productByHandle(handle: $handle) {
              id
              title
              handle
              description
              images(first: 1) {
                edges {
                  node {
                    url
                  }
                }
              }
              variants(first: 1) {
                edges {
                  node {
                    id
                    price
                    compareAtPrice
                  }
                }
              }
            }
          }
        `, {
          variables: { handle: productHandle }
        });

        const responseJson = await response.json();
        
        if (responseJson.data?.productByHandle) {
          const product = responseJson.data.productByHandle;
          const variant = product.variants.edges[0]?.node;
          const image = product.images.edges[0]?.node;
          
          if (variant) {
            await prisma.nudgeProduct.create({
              data: {
                ruleId: rule.id,
                shopifyProductId: productHandle,
                shopifyVariantId: variant.id.replace('gid://shopify/ProductVariant/', ''),
                title: product.title,
                handle: product.handle,
                description: product.description || null,
                price: parseFloat(variant.price),
                compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) : null,
                imageUrl: image?.url || null,
                position: i,
              }
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching product ${productHandle}:`, error);
      }
    }

    return json({ success: true });
  }

  if (intent === "delete-rule") {
    const ruleId = formData.get("ruleId") as string;
    await prisma.nudgeRule.delete({
      where: { id: ruleId }
    });
    return json({ success: true });
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function NudgePopup() {
  const { nudgeConfig, shopProducts, shopCollections } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const [formState, setFormState] = useState(() => {
    return {
      title: nudgeConfig?.title || "You might also like",
      subtitle: nudgeConfig?.subtitle || "Select a product to replace your choice",
      recommendationType: "manual",
      showOnAddToCart: nudgeConfig?.showOnAddToCart ?? true,
      popupDelay: nudgeConfig?.popupDelay?.toString() || "0",
      overlayColor: nudgeConfig?.overlayColor || "#000000",
      overlayOpacity: nudgeConfig?.overlayOpacity?.toString() || "50",
      popupBackgroundColor: nudgeConfig?.popupBackgroundColor || "#FFFFFF",
      popupBorderRadius: nudgeConfig?.popupBorderRadius?.toString() || "8",
      titleColor: nudgeConfig?.titleColor || "#000000",
      subtitleColor: nudgeConfig?.subtitleColor || "#666666",
      continueButtonText: nudgeConfig?.continueButtonText || "Continue with original",
      continueButtonColor: nudgeConfig?.continueButtonColor || "#000000",
      continueButtonTextColor: nudgeConfig?.continueButtonTextColor || "#FFFFFF",
      selectButtonText: nudgeConfig?.selectButtonText || "Select this product",
      selectButtonColor: nudgeConfig?.selectButtonColor || "#4F46E5",
      selectButtonTextColor: nudgeConfig?.selectButtonTextColor || "#FFFFFF",
      closeButtonColor: nudgeConfig?.closeButtonColor || "#999999",
      showProductImage: nudgeConfig?.showProductImage ?? true,
      showProductPrice: nudgeConfig?.showProductPrice ?? true,
      showProductComparePrice: nudgeConfig?.showProductComparePrice ?? true,
      showProductDescription: nudgeConfig?.showProductDescription ?? false,
      maxProducts: nudgeConfig?.maxProducts?.toString() || "4",
      layout: nudgeConfig?.layout || "grid",
      enableAnimation: nudgeConfig?.enableAnimation ?? true,
      animationType: nudgeConfig?.animationType || "fade",
    };
  });

  const [showManualModal, setShowManualModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    triggerType: "specific_product" as "specific_product" | "collection" | "all_products",
    selectedTriggerProduct: null as string | null,
    selectedTriggerCollection: null as string | null,
    selectedUpsellProducts: [] as string[],
    triggerTab: "product" as "product" | "collection",
    upsellTab: "product" as "product" | "collection",
    searchQuery: "",
    upsellSearchQuery: "",
    showTriggerModal: false,
    showUpsellModal: false,
  });

  const handleToggle = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "toggle");
    formData.append("enabled", (!nudgeConfig?.isActive).toString());
    submit(formData, { method: "post" });
  }, [nudgeConfig?.isActive, submit]);

  const handleSaveSettings = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "save-settings");
    Object.entries(formState).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    submit(formData, { method: "post" });
  }, [formState, submit]);

  const handleAddRule = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "add-rule");
    
    let triggerType = "all";
    let triggerValue = "all";
    let triggerProductId = "";
    let triggerTitle = "All Products";

    if (modalConfig.triggerType === "specific_product" && modalConfig.selectedTriggerProduct) {
      triggerType = "product";
      triggerValue = modalConfig.selectedTriggerProduct;
      const product = shopProducts.find(p => p.handle === modalConfig.selectedTriggerProduct);
      triggerProductId = product?.shopifyProductId || "";
      triggerTitle = product?.title || "";
    } else if (modalConfig.triggerType === "collection" && modalConfig.selectedTriggerCollection) {
      triggerType = "collection";
      triggerValue = modalConfig.selectedTriggerCollection;
      const collection = shopCollections.find(c => c.handle === modalConfig.selectedTriggerCollection);
      triggerTitle = collection?.title || "";
    }

    formData.append("triggerType", triggerType);
    formData.append("triggerValue", triggerValue);
    formData.append("triggerProductId", triggerProductId);
    formData.append("triggerTitle", triggerTitle);
    formData.append("upsellProducts", JSON.stringify(modalConfig.selectedUpsellProducts));

    submit(formData, { method: "post" });
    setShowManualModal(false);
    setModalConfig({
      triggerType: "specific_product",
      selectedTriggerProduct: null,
      selectedTriggerCollection: null,
      selectedUpsellProducts: [],
      triggerTab: "product",
      upsellTab: "product",
      searchQuery: "",
      upsellSearchQuery: "",
      showTriggerModal: false,
      showUpsellModal: false,
    });
  }, [modalConfig, shopProducts, shopCollections, submit]);

  const handleDeleteRule = useCallback((ruleId: string) => {
    if (confirm("Are you sure you want to delete this rule?")) {
      const formData = new FormData();
      formData.append("intent", "delete-rule");
      formData.append("ruleId", ruleId);
      submit(formData, { method: "post" });
    }
  }, [submit]);

  const filteredProducts = shopProducts.filter(product =>
    product.title.toLowerCase().includes(modalConfig.searchQuery.toLowerCase()) ||
    product.handle.toLowerCase().includes(modalConfig.searchQuery.toLowerCase())
  );

  const filteredUpsellProducts = shopProducts.filter(product =>
    product.title.toLowerCase().includes(modalConfig.upsellSearchQuery.toLowerCase()) ||
    product.handle.toLowerCase().includes(modalConfig.upsellSearchQuery.toLowerCase())
  );

  const filteredCollections = shopCollections.filter(collection =>
    collection.title.toLowerCase().includes(modalConfig.searchQuery.toLowerCase())
  );

  return (
    <Page title="Nudge Upsell">
      <TitleBar title="Nudge Upsell" />
      
      <Layout>
        {!nudgeConfig?.isActive && (
          <Layout.Section>
            <Banner
              title="Nudge Upsell is currently disabled"
              tone="warning"
            >
              <p>Enable the Nudge Upsell to start showing product alternatives when customers click "Add to Cart".</p>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <InlineStack align="space-between" blockAlign="center">
            <Button
              variant={nudgeConfig?.isActive ? "primary" : "secondary"}
              tone={nudgeConfig?.isActive ? "critical" : "success"}
              onClick={handleToggle}
              loading={isLoading}
            >
              {nudgeConfig?.isActive ? "Disable" : "Enable"}
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveSettings}
              loading={isLoading}
            >
              Save Settings
            </Button>
          </InlineStack>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                General Settings
              </Text>
              <FormLayout>
                <TextField
                  label="Popup Title"
                  value={formState.title}
                  onChange={(value) => setFormState({ ...formState, title: value })}
                  autoComplete="off"
                />
                <TextField
                  label="Popup Subtitle"
                  value={formState.subtitle}
                  onChange={(value) => setFormState({ ...formState, subtitle: value })}
                  autoComplete="off"
                  helpText="Optional description text shown below the title"
                />
                <TextField
                  label="Maximum Products to Show"
                  type="number"
                  value={formState.maxProducts}
                  onChange={(value) => setFormState({ ...formState, maxProducts: value })}
                  min="1"
                  max="10"
                  autoComplete="off"
                />
                <TextField
                  label="Popup Delay (milliseconds)"
                  type="number"
                  value={formState.popupDelay}
                  onChange={(value) => setFormState({ ...formState, popupDelay: value })}
                  min="0"
                  autoComplete="off"
                  helpText="Delay before showing popup after Add to Cart is clicked (0 for instant)"
                />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Display Settings
              </Text>
              <FormLayout>
                <Select
                  label="Layout"
                  options={[
                    { label: "Grid", value: "grid" },
                    { label: "List", value: "list" },
                    { label: "Carousel", value: "carousel" },
                  ]}
                  value={formState.layout}
                  onChange={(value) => setFormState({ ...formState, layout: value })}
                />
                <Checkbox
                  label="Show Product Images"
                  checked={formState.showProductImage}
                  onChange={(value) => setFormState({ ...formState, showProductImage: value })}
                />
                <Checkbox
                  label="Show Product Prices"
                  checked={formState.showProductPrice}
                  onChange={(value) => setFormState({ ...formState, showProductPrice: value })}
                />
                <Checkbox
                  label="Show Compare At Price"
                  checked={formState.showProductComparePrice}
                  onChange={(value) => setFormState({ ...formState, showProductComparePrice: value })}
                />
                <Checkbox
                  label="Show Product Description"
                  checked={formState.showProductDescription}
                  onChange={(value) => setFormState({ ...formState, showProductDescription: value })}
                />
                <Checkbox
                  label="Enable Animations"
                  checked={formState.enableAnimation}
                  onChange={(value) => setFormState({ ...formState, enableAnimation: value })}
                />
                {formState.enableAnimation && (
                  <Select
                    label="Animation Type"
                    options={[
                      { label: "Fade", value: "fade" },
                      { label: "Slide Up", value: "slide-up" },
                      { label: "Scale", value: "scale" },
                    ]}
                    value={formState.animationType}
                    onChange={(value) => setFormState({ ...formState, animationType: value })}
                  />
                )}
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Style Settings
              </Text>
              <FormLayout>
                <TextField
                  label="Title Color"
                  type="color"
                  value={formState.titleColor}
                  onChange={(value) => setFormState({ ...formState, titleColor: value })}
                  autoComplete="off"
                />
                <TextField
                  label="Subtitle Color"
                  type="color"
                  value={formState.subtitleColor}
                  onChange={(value) => setFormState({ ...formState, subtitleColor: value })}
                  autoComplete="off"
                />
                <TextField
                  label="Popup Background Color"
                  type="color"
                  value={formState.popupBackgroundColor}
                  onChange={(value) => setFormState({ ...formState, popupBackgroundColor: value })}
                  autoComplete="off"
                />
                <TextField
                  label="Overlay Color"
                  type="color"
                  value={formState.overlayColor}
                  onChange={(value) => setFormState({ ...formState, overlayColor: value })}
                  autoComplete="off"
                />
                <TextField
                  label="Overlay Opacity (%)"
                  type="number"
                  value={formState.overlayOpacity}
                  onChange={(value) => setFormState({ ...formState, overlayOpacity: value })}
                  min="0"
                  max="100"
                  autoComplete="off"
                />
                <TextField
                  label="Popup Border Radius (px)"
                  type="number"
                  value={formState.popupBorderRadius}
                  onChange={(value) => setFormState({ ...formState, popupBorderRadius: value })}
                  min="0"
                  max="50"
                  autoComplete="off"
                />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Button Settings
              </Text>
              <FormLayout>
                <TextField
                  label="Select Button Text"
                  value={formState.selectButtonText}
                  onChange={(value) => setFormState({ ...formState, selectButtonText: value })}
                  autoComplete="off"
                />
                <TextField
                  label="Select Button Background Color"
                  type="color"
                  value={formState.selectButtonColor}
                  onChange={(value) => setFormState({ ...formState, selectButtonColor: value })}
                  autoComplete="off"
                />
                <TextField
                  label="Select Button Text Color"
                  type="color"
                  value={formState.selectButtonTextColor}
                  onChange={(value) => setFormState({ ...formState, selectButtonTextColor: value })}
                  autoComplete="off"
                />
                <Divider />
                <TextField
                  label="Continue Button Text"
                  value={formState.continueButtonText}
                  onChange={(value) => setFormState({ ...formState, continueButtonText: value })}
                  autoComplete="off"
                />
                <TextField
                  label="Continue Button Background Color"
                  type="color"
                  value={formState.continueButtonColor}
                  onChange={(value) => setFormState({ ...formState, continueButtonColor: value })}
                  autoComplete="off"
                />
                <TextField
                  label="Continue Button Text Color"
                  type="color"
                  value={formState.continueButtonTextColor}
                  onChange={(value) => setFormState({ ...formState, continueButtonTextColor: value })}
                  autoComplete="off"
                />
                <Divider />
                <TextField
                  label="Close Button Color"
                  type="color"
                  value={formState.closeButtonColor}
                  onChange={(value) => setFormState({ ...formState, closeButtonColor: value })}
                  autoComplete="off"
                />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">
                    Manual Rules 
                  </Text>
                  <Button onClick={() => setShowManualModal(true)}>
                    Add Rule
                  </Button>
                </InlineStack>

                {nudgeConfig?.rules && nudgeConfig.rules.length > 0 ? (
                  <ResourceList
                    resourceName={{ singular: 'rule', plural: 'rules' }}
                    items={nudgeConfig.rules}
                    renderItem={(rule) => {
                      const { id, triggerType, triggerTitle, triggerValue, products } = rule;
                      const triggerProduct = triggerType === 'product' && triggerValue && triggerValue !== 'all'
                        ? shopProducts.find(p => p.handle === triggerValue)
                        : null;
                      return (
                        <ResourceItem
                          id={id}
                          accessibilityLabel={`View details for ${triggerTitle}`}
                          onClick={() => {}}
                        >
                          <BlockStack gap="300">
                            <InlineStack align="space-between" blockAlign="center">
                              <InlineStack gap="300" blockAlign="center">
                                {triggerProduct && (
                                  <Thumbnail
                                    source={triggerProduct.images[0]?.src || ''}
                                    alt={triggerProduct.title}
                                    size="medium"
                                  />
                                )}
                                <BlockStack gap="100">
                                  <Text as="h3" variant="headingMd">
                                    {triggerTitle || "Unknown"}
                                  </Text>
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    Trigger: {triggerType} | {products.length} upsell {products.length === 1 ? 'product' : 'products'}
                                  </Text>
                                </BlockStack>
                              </InlineStack>
                              <Button
                                icon={DeleteIcon}
                                variant="plain"
                                tone="critical"
                                onClick={() => handleDeleteRule(id)}
                              />
                            </InlineStack>
                            {products.length > 0 && (
                              <Box paddingBlockStart="200">
                                <BlockStack gap="200">
                                  <Text as="p" variant="bodySm" fontWeight="semibold">
                                    Upsell Products:
                                  </Text>
                                  <InlineStack gap="200" wrap>
                                    {products.map((product: any) => (
                                      <InlineStack key={product.id} gap="200" blockAlign="center">
                                        <Thumbnail
                                          source={product.imageUrl || ''}
                                          alt={product.title}
                                          size="small"
                                        />
                                        <Text as="p" variant="bodySm" tone="subdued">
                                          {product.title}
                                        </Text>
                                      </InlineStack>
                                    ))}
                                  </InlineStack>
                                </BlockStack>
                              </Box>
                            )}
                          </BlockStack>
                        </ResourceItem>
                      );
                    }}
                  />
                ) : (
                  <EmptyState
                    heading="No manual rules configured"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>Add rules to show specific products in the nudge popup.</p>
                  </EmptyState>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
      </Layout>

      {/* Add Rule Modal */}
      <Modal
        open={showManualModal}
        onClose={() => setShowManualModal(false)}
        title="Add Nudge Rule"
        primaryAction={{
          content: "Add Rule",
          onAction: handleAddRule,
          disabled: modalConfig.selectedUpsellProducts.length === 0,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setShowManualModal(false),
          },
        ]}
        large
      >
        <Modal.Section>
          <BlockStack gap="400">
            <FormLayout>
              <Select
                label="When to show this rule"
                options={[
                  { label: "For a specific product", value: "specific_product" },
                  { label: "For products in a collection", value: "collection" },
                  { label: "For all products", value: "all_products" },
                ]}
                value={modalConfig.triggerType}
                onChange={(value) => setModalConfig({ ...modalConfig, triggerType: value as any })}
              />

              {modalConfig.triggerType === "specific_product" && (
                <Box>
                  <BlockStack gap="200">
                    {modalConfig.selectedTriggerProduct ? (
                      <InlineStack gap="300" blockAlign="center">
                        <Thumbnail
                          source={shopProducts.find(p => p.handle === modalConfig.selectedTriggerProduct)?.images[0]?.src || ''}
                          alt={shopProducts.find(p => p.handle === modalConfig.selectedTriggerProduct)?.title || ''}
                          size="small"
                        />
                        <Text as="p" variant="bodyMd">
                          {shopProducts.find(p => p.handle === modalConfig.selectedTriggerProduct)?.title}
                        </Text>
                      </InlineStack>
                    ) : (
                      <Text as="p" variant="bodyMd">
                        Selected Product: None
                      </Text>
                    )}
                    <Button onClick={() => setModalConfig({ ...modalConfig, showTriggerModal: true })}>
                      Select Product
                    </Button>
                  </BlockStack>
                </Box>
              )}

              {modalConfig.triggerType === "collection" && (
                <Box>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">
                      Selected Collection: {modalConfig.selectedTriggerCollection ? 
                        shopCollections.find(c => c.handle === modalConfig.selectedTriggerCollection)?.title : 
                        "None"}
                    </Text>
                    <Button onClick={() => setModalConfig({ ...modalConfig, showTriggerModal: true })}>
                      Select Collection
                    </Button>
                  </BlockStack>
                </Box>
              )}

              <Divider />

              <Text as="h3" variant="headingMd">
                Products to Show in Popup
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Select products that will be shown as alternatives
              </Text>
              
              <Box>
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd">
                    Selected: {modalConfig.selectedUpsellProducts.length} products
                  </Text>
                  {modalConfig.selectedUpsellProducts.length > 0 && (
                    <Box>
                      <BlockStack gap="200">
                        {modalConfig.selectedUpsellProducts.map(handle => {
                          const product = shopProducts.find(p => p.handle === handle);
                          return product ? (
                            <InlineStack key={handle} align="space-between" blockAlign="center" gap="300">
                              <InlineStack gap="300" blockAlign="center">
                                <Thumbnail
                                  source={product.images[0]?.src || ''}
                                  alt={product.title}
                                  size="small"
                                />
                                <Text as="p" variant="bodySm">{product.title}</Text>
                              </InlineStack>
                              <Button
                                size="micro"
                                onClick={() => setModalConfig({
                                  ...modalConfig,
                                  selectedUpsellProducts: modalConfig.selectedUpsellProducts.filter(p => p !== handle)
                                })}
                              >
                                Remove
                              </Button>
                            </InlineStack>
                          ) : null;
                        })}
                      </BlockStack>
                    </Box>
                  )}
                  <Button onClick={() => setModalConfig({ ...modalConfig, showUpsellModal: true })}>
                    Select Products
                  </Button>
                </BlockStack>
              </Box>
            </FormLayout>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Product Selection Modal for Trigger */}
      <Modal
        open={modalConfig.showTriggerModal}
        onClose={() => setModalConfig({ ...modalConfig, showTriggerModal: false })}
        title={modalConfig.triggerType === "collection" ? "Select Collection" : "Select Product"}
        primaryAction={{
          content: "Done",
          onAction: () => setModalConfig({ ...modalConfig, showTriggerModal: false }),
        }}
        large
      >
        <Modal.Section>
          <BlockStack gap="400">
            <TextField
              label="Search"
              value={modalConfig.searchQuery}
              onChange={(value) => setModalConfig({ ...modalConfig, searchQuery: value })}
              autoComplete="off"
              placeholder={modalConfig.triggerType === "collection" ? "Search collections..." : "Search products..."}
            />
            
            {modalConfig.triggerType === "collection" ? (
              <ResourceList
                resourceName={{ singular: 'collection', plural: 'collections' }}
                items={filteredCollections}
                renderItem={(collection) => (
                  <ResourceItem
                    id={collection.id}
                    onClick={() => {
                      setModalConfig({
                        ...modalConfig,
                        selectedTriggerCollection: collection.handle,
                        showTriggerModal: false,
                      });
                    }}
                  >
                    <BlockStack gap="100">
                      <Text as="h3" variant="bodyMd" fontWeight="semibold">
                        {collection.title}
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {collection.productsCount} products
                      </Text>
                    </BlockStack>
                  </ResourceItem>
                )}
              />
            ) : (
              <ResourceList
                resourceName={{ singular: 'product', plural: 'products' }}
                items={filteredProducts}
                renderItem={(product) => (
                  <ResourceItem
                    id={product.id}
                    media={
                      <Thumbnail
                        source={product.images[0]?.src || ''}
                        alt={product.title}
                      />
                    }
                    onClick={() => {
                      setModalConfig({
                        ...modalConfig,
                        selectedTriggerProduct: product.handle,
                        showTriggerModal: false,
                      });
                    }}
                  >
                    <Text as="h3" variant="bodyMd" fontWeight="semibold">
                      {product.title}
                    </Text>
                  </ResourceItem>
                )}
              />
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Product Selection Modal for Upsells */}
      <Modal
        open={modalConfig.showUpsellModal}
        onClose={() => setModalConfig({ ...modalConfig, showUpsellModal: false })}
        title="Select Products to Show"
        primaryAction={{
          content: "Done",
          onAction: () => setModalConfig({ ...modalConfig, showUpsellModal: false }),
        }}
        large
      >
        <Modal.Section>
          <BlockStack gap="400">
            <TextField
              label="Search"
              value={modalConfig.upsellSearchQuery}
              onChange={(value) => setModalConfig({ ...modalConfig, upsellSearchQuery: value })}
              autoComplete="off"
              placeholder="Search products..."
            />
            
            <ResourceList
              resourceName={{ singular: 'product', plural: 'products' }}
              items={filteredUpsellProducts}
              renderItem={(product) => {
                const isSelected = modalConfig.selectedUpsellProducts.includes(product.handle);
                return (
                  <ResourceItem
                    id={product.id}
                    media={
                      <Thumbnail
                        source={product.images[0]?.src || ''}
                        alt={product.title}
                      />
                    }
                    onClick={() => {
                      if (isSelected) {
                        setModalConfig({
                          ...modalConfig,
                          selectedUpsellProducts: modalConfig.selectedUpsellProducts.filter(p => p !== product.handle)
                        });
                      } else {
                        setModalConfig({
                          ...modalConfig,
                          selectedUpsellProducts: [...modalConfig.selectedUpsellProducts, product.handle]
                        });
                      }
                    }}
                  >
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="h3" variant="bodyMd" fontWeight="semibold">
                        {product.title}
                      </Text>
                      {isSelected && <Badge tone="success">Selected</Badge>}
                    </InlineStack>
                  </ResourceItem>
                );
              }}
            />
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

