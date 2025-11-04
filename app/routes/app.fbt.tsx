import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useFetcher } from "@remix-run/react";
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
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useState, useCallback, useEffect } from "react";
import { DeleteIcon, EditIcon } from "@shopify/polaris-icons";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  // Get or create FBT configuration
  let fbtConfig = await prisma.frequentlyBoughtTogether.findUnique({
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

  if (!fbtConfig) {
    fbtConfig = await prisma.frequentlyBoughtTogether.create({
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

  return json({ fbtConfig, shopProducts });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Get or create FBT config
  let fbtConfig = await prisma.frequentlyBoughtTogether.findUnique({
    where: { shop }
  });

  if (!fbtConfig) {
    fbtConfig = await prisma.frequentlyBoughtTogether.create({
      data: { shop }
    });
  }

  if (intent === "toggle") {
    const enabled = formData.get("enabled") === "true";
    await prisma.frequentlyBoughtTogether.update({
      where: { shop },
      data: { isActive: enabled }
    });
    return json({ success: true });
  }

  if (intent === "save-settings") {
    const data = {
      title: formData.get("title") as string,
      recommendationType: formData.get("recommendationType") as string,
      algorithm: formData.get("algorithm") as string,
      useAI: formData.get("useAI") === "true",
      useSmartVariantMatching: formData.get("useSmartVariantMatching") === "true",
      showOfferIfInCart: formData.get("showOfferIfInCart") === "true",
      limitUpsellsInCart: formData.get("limitUpsellsInCart") === "true",
      maxUpsellsInCart: parseInt(formData.get("maxUpsellsInCart") as string || "3"),
      showProductReviews: formData.get("showProductReviews") === "true",
      layout: formData.get("layout") as string,
      buttonText: formData.get("buttonText") as string,
      buttonColor: formData.get("buttonColor") as string,
      buttonTextColor: formData.get("buttonTextColor") as string,
      showDiscount: formData.get("showDiscount") === "true",
      showTotalPrice: formData.get("showTotalPrice") === "true",
      showIndividualPrices: formData.get("showIndividualPrices") === "true",
      showCheckboxes: formData.get("showCheckboxes") === "true",
      discountType: formData.get("discountType") as string,
      discountValue: formData.get("discountValue") ? parseFloat(formData.get("discountValue") as string) : null,
    };

    await prisma.frequentlyBoughtTogether.update({
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
    const rule = await prisma.fBTRule.create({
      data: {
        fbtId: fbtConfig.id,
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
            await prisma.fBTProduct.create({
              data: {
                ruleId: rule.id,
                shopifyProductId: productHandle,
                shopifyVariantId: variant.id.replace('gid://shopify/ProductVariant/', ''),
                title: product.title,
                handle: product.handle,
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
    await prisma.fBTRule.delete({
      where: { id: ruleId }
    });
    return json({ success: true });
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function FrequentlyBoughtTogether() {
  const { fbtConfig, shopProducts } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const [formState, setFormState] = useState({
    title: fbtConfig?.title || "Frequently Bought Together",
    recommendationType: fbtConfig?.recommendationType || "manual",
    algorithm: fbtConfig?.algorithm || "related",
    useAI: fbtConfig?.useAI ?? false,
    useSmartVariantMatching: fbtConfig?.useSmartVariantMatching ?? false,
    showOfferIfInCart: fbtConfig?.showOfferIfInCart ?? false,
    limitUpsellsInCart: fbtConfig?.limitUpsellsInCart ?? false,
    maxUpsellsInCart: fbtConfig?.maxUpsellsInCart?.toString() || "3",
    showProductReviews: fbtConfig?.showProductReviews ?? false,
    layout: fbtConfig?.layout || "horizontal",
    buttonText: fbtConfig?.buttonText || "Add selected items",
    buttonColor: fbtConfig?.buttonColor || "#000000",
    buttonTextColor: fbtConfig?.buttonTextColor || "#FFFFFF",
    showDiscount: fbtConfig?.showDiscount ?? true,
    showTotalPrice: fbtConfig?.showTotalPrice ?? true,
    showIndividualPrices: fbtConfig?.showIndividualPrices ?? true,
    showCheckboxes: fbtConfig?.showCheckboxes ?? true,
    discountType: fbtConfig?.discountType || "percentage",
    discountValue: fbtConfig?.discountValue?.toString() || "",
  });

  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedTriggerProduct, setSelectedTriggerProduct] = useState<string | null>(null);
  const [selectedUpsellProducts, setSelectedUpsellProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [upsellSearchQuery, setUpsellSearchQuery] = useState("");

  const handleToggle = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "toggle");
    formData.append("enabled", (!fbtConfig?.isActive).toString());
    submit(formData, { method: "post" });
  }, [fbtConfig?.isActive, submit]);

  const handleSaveSettings = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "save-settings");
    Object.entries(formState).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    submit(formData, { method: "post" });
  }, [formState, submit]);

  const handleAddRule = useCallback(() => {
    if (!selectedTriggerProduct || selectedUpsellProducts.length === 0) {
      return;
    }

    const triggerProduct = shopProducts.find((p: any) => p.handle === selectedTriggerProduct);
    if (!triggerProduct) return;

    const formData = new FormData();
    formData.append("intent", "add-rule");
    formData.append("triggerType", "specific_product");
    formData.append("triggerValue", selectedTriggerProduct);
    formData.append("triggerProductId", triggerProduct.shopifyProductId);
    formData.append("triggerTitle", triggerProduct.title);
    formData.append("upsellProducts", JSON.stringify(selectedUpsellProducts));
    submit(formData, { method: "post" });

    // Reset modal state
    setShowManualModal(false);
    setSelectedTriggerProduct(null);
    setSelectedUpsellProducts([]);
    setSearchQuery("");
    setUpsellSearchQuery("");
  }, [selectedTriggerProduct, selectedUpsellProducts, shopProducts, submit]);

  const handleDeleteRule = useCallback((ruleId: string) => {
    const formData = new FormData();
    formData.append("intent", "delete-rule");
    formData.append("ruleId", ruleId);
    submit(formData, { method: "post" });
  }, [submit]);

  const filteredProducts = shopProducts.filter((product: any) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUpsellProducts = shopProducts.filter((product: any) =>
    product.title.toLowerCase().includes(upsellSearchQuery.toLowerCase()) &&
    product.handle !== selectedTriggerProduct
  );

  return (
    <Page
      title="Frequently Bought Together"
      primaryAction={{
        content: "Save Settings",
        onAction: handleSaveSettings,
        loading: isLoading,
      }}
    >
      <TitleBar title="Frequently Bought Together" />
      
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {/* Status Card */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingMd">
                      Status
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      {fbtConfig?.isActive 
                        ? "FBT feature is currently enabled" 
                        : "FBT feature is currently disabled"}
                    </Text>
                  </BlockStack>
                  <Button onClick={handleToggle} loading={isLoading}>
                    {fbtConfig?.isActive ? "Disable" : "Enable"}
                  </Button>
                </InlineStack>
                
                {!fbtConfig?.isActive && (
                  <Banner tone="warning">
                    Enable this feature to show frequently bought together products on your store.
                  </Banner>
                )}
              </BlockStack>
            </Card>

            {/* Configuration Card */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Product Selection
                </Text>
                
                <FormLayout>
                  <Checkbox
                    label="Use AI recommended upsells"
                    checked={formState.useAI}
                    onChange={(value) => setFormState({ ...formState, useAI: value })}
                    helpText="Let AI suggest related products automatically"
                  />

                  <Select
                    label="Recommendation Algorithm"
                    options={[
                      { label: "Related Products", value: "related" },
                      { label: "Complementary Products", value: "complementary" },
                      { label: "Best Sellers", value: "bestsellers" },
                      { label: "New Arrivals", value: "new_arrivals" },
                    ]}
                    value={formState.algorithm}
                    onChange={(value) => setFormState({ ...formState, algorithm: value })}
                    helpText="Select how automatic recommendations are generated"
                  />

                  <Checkbox
                    label="Use smart variant matching"
                    checked={formState.useSmartVariantMatching}
                    onChange={(value) => setFormState({ ...formState, useSmartVariantMatching: value })}
                    helpText="Automatically match product variants based on customer selections"
                  />
                </FormLayout>

                <Divider />

                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    Manual Configuration
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Manually configure which products trigger upsell recommendations
                  </Text>
                  <Button onClick={() => setShowManualModal(true)}>
                    Configure Manual Upsells
                  </Button>
                </BlockStack>

                {/* Display existing rules */}
                {fbtConfig?.rules && fbtConfig.rules.length > 0 && (
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">
                      Configured Rules ({fbtConfig.rules.length})
                    </Text>
                    {fbtConfig.rules.map((rule: any) => (
                      <Card key={rule.id}>
                        <BlockStack gap="300">
                          <InlineStack align="space-between" blockAlign="center">
                            <BlockStack gap="200">
                              <Text as="p" variant="bodyMd" fontWeight="semibold">
                                Trigger: {rule.triggerTitle}
                              </Text>
                              <Text as="p" variant="bodyMd" tone="subdued">
                                {rule.products.length} upsell product(s)
                              </Text>
                            </BlockStack>
                            <Button
                              icon={DeleteIcon}
                              tone="critical"
                              onClick={() => handleDeleteRule(rule.id)}
                            >
                              Delete
                            </Button>
                          </InlineStack>
                          
                          {rule.products.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {rule.products.map((product: any) => (
                                <div
                                  key={product.id}
                                  style={{
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    padding: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    backgroundColor: '#f9fafb'
                                  }}
                                >
                                  <img
                                    src={product.imageUrl || "https://via.placeholder.com/40x40"}
                                    alt={product.title}
                                    style={{
                                      width: '40px',
                                      height: '40px',
                                      objectFit: 'cover',
                                      borderRadius: '4px'
                                    }}
                                  />
                                  <Text as="span" variant="bodySm">
                                    {product.title}
                                  </Text>
                                </div>
                              ))}
                            </div>
                          )}
                        </BlockStack>
                      </Card>
                    ))}
                  </BlockStack>
                )}
              </BlockStack>
            </Card>

            {/* Upsell Settings Card */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Upsell Settings
                </Text>
                
                <FormLayout>
                  <Checkbox
                    label="Show upsell offer if item already in cart"
                    checked={formState.showOfferIfInCart}
                    onChange={(value) => setFormState({ ...formState, showOfferIfInCart: value })}
                  />

                  <Checkbox
                    label="Limit the number of upsells in the cart"
                    checked={formState.limitUpsellsInCart}
                    onChange={(value) => setFormState({ ...formState, limitUpsellsInCart: value })}
                  />

                  {formState.limitUpsellsInCart && (
                    <TextField
                      label="Maximum upsells in cart"
                      type="number"
                      value={formState.maxUpsellsInCart}
                      onChange={(value) => setFormState({ ...formState, maxUpsellsInCart: value })}
                      autoComplete="off"
                    />
                  )}

                  <Checkbox
                    label="Show product reviews on upsells"
                    checked={formState.showProductReviews}
                    onChange={(value) => setFormState({ ...formState, showProductReviews: value })}
                  />
                </FormLayout>
              </BlockStack>
            </Card>

            {/* Appearance Card */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Appearance
                </Text>
                
                <FormLayout>
                  <TextField
                    label="Section Title"
                    value={formState.title}
                    onChange={(value) => setFormState({ ...formState, title: value })}
                    autoComplete="off"
                  />

                  <Select
                    label="Layout"
                    options={[
                      { label: "Horizontal", value: "horizontal" },
                      { label: "Vertical", value: "vertical" },
                      { label: "Grid", value: "grid" },
                    ]}
                    value={formState.layout}
                    onChange={(value) => setFormState({ ...formState, layout: value })}
                  />

                  <TextField
                    label="Button Text"
                    value={formState.buttonText}
                    onChange={(value) => setFormState({ ...formState, buttonText: value })}
                    autoComplete="off"
                  />

                  <InlineStack gap="400">
                    <div style={{ flex: 1 }}>
                      <TextField
                        label="Button Color"
                        value={formState.buttonColor}
                        onChange={(value) => setFormState({ ...formState, buttonColor: value })}
                        autoComplete="off"
                        helpText="Hex color code (e.g., #000000)"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <TextField
                        label="Button Text Color"
                        value={formState.buttonTextColor}
                        onChange={(value) => setFormState({ ...formState, buttonTextColor: value })}
                        autoComplete="off"
                        helpText="Hex color code (e.g., #FFFFFF)"
                      />
                    </div>
                  </InlineStack>

                  <Checkbox
                    label="Show discount information"
                    checked={formState.showDiscount}
                    onChange={(value) => setFormState({ ...formState, showDiscount: value })}
                  />

                  <Checkbox
                    label="Show total price"
                    checked={formState.showTotalPrice}
                    onChange={(value) => setFormState({ ...formState, showTotalPrice: value })}
                  />

                  <Checkbox
                    label="Show individual prices"
                    checked={formState.showIndividualPrices}
                    onChange={(value) => setFormState({ ...formState, showIndividualPrices: value })}
                  />

                  <Checkbox
                    label="Show checkboxes"
                    checked={formState.showCheckboxes}
                    onChange={(value) => setFormState({ ...formState, showCheckboxes: value })}
                  />

                  <Select
                    label="Discount Type"
                    options={[
                      { label: "Percentage", value: "percentage" },
                      { label: "Fixed Amount", value: "fixed" },
                    ]}
                    value={formState.discountType}
                    onChange={(value) => setFormState({ ...formState, discountType: value })}
                  />

                  <TextField
                    label="Discount Value"
                    type="number"
                    value={formState.discountValue}
                    onChange={(value) => setFormState({ ...formState, discountValue: value })}
                    helpText={formState.discountType === 'percentage' ? 'Discount percentage (e.g., 10 for 10%)' : 'Fixed discount amount'}
                    autoComplete="off"
                  />
                </FormLayout>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        {/* Preview Section */}
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                Preview
              </Text>
              
              <div style={{
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#ffffff'
              }}>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  marginBottom: '16px',
                  color: '#111827'
                }}>
                  {formState.title}
                </div>
                
                <div style={{
                  display: formState.layout === 'horizontal' ? 'flex' : 'grid',
                  gap: '12px',
                  gridTemplateColumns: formState.layout === 'grid' ? 'repeat(2, 1fr)' : undefined,
                  flexDirection: formState.layout === 'vertical' ? 'column' : 'row',
                  marginBottom: '16px'
                }}>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        padding: '12px',
                        flex: formState.layout === 'horizontal' ? '1' : undefined,
                        minWidth: formState.layout === 'horizontal' ? '100px' : undefined
                      }}
                    >
                      {formState.showCheckboxes && (
                        <div style={{ marginBottom: '8px' }}>
                          <input type="checkbox" defaultChecked={i === 1} />
                        </div>
                      )}
                      <div
                        style={{
                          width: '100%',
                          height: '80px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '4px',
                          marginBottom: '8px'
                        }}
                      />
                      <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
                        Product {i}
                      </div>
                      {formState.showIndividualPrices && (
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>
                          $29.99
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {formState.showTotalPrice && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    padding: '8px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '4px'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>Total price:</span>
                    <div>
                      {formState.showDiscount && (
                        <span style={{
                          textDecoration: 'line-through',
                          color: '#9ca3af',
                          marginRight: '8px',
                          fontSize: '13px'
                        }}>
                          $89.97
                        </span>
                      )}
                      <span style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                        $80.97
                      </span>
                    </div>
                  </div>
                )}

                <button
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: formState.buttonColor,
                    color: formState.buttonTextColor,
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {formState.buttonText}
                </button>
              </div>

              <Text as="p" variant="bodyMd" tone="subdued">
                This is how the FBT widget will appear on product pages.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Manual Configuration Modal */}
      <Modal
        open={showManualModal}
        onClose={() => setShowManualModal(false)}
        title="Configure Manual Upsells"
        primaryAction={{
          content: "Add Upsell",
          onAction: handleAddRule,
          disabled: !selectedTriggerProduct || selectedUpsellProducts.length === 0,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setShowManualModal(false),
          },
        ]}
        size="large"
      >
        <Modal.Section>
          <BlockStack gap="400">
            {/* Trigger Product Selection */}
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">
                  Trigger Product
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Select the product that will trigger upsell recommendations
                </Text>
                
                <TextField
                  label="Search Products"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search for trigger product..."
                  autoComplete="off"
                />

                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {filteredProducts.length > 0 ? (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {filteredProducts.map((product: any) => {
                        const isSelected = selectedTriggerProduct === product.handle;
                        return (
                          <div
                            key={product.handle}
                            onClick={() => setSelectedTriggerProduct(product.handle)}
                            style={{
                              border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                              borderRadius: '6px',
                              padding: '12px',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                              display: 'flex',
                              gap: '12px',
                              alignItems: 'center'
                            }}
                          >
                            <img
                              src={product.images?.[0]?.src || "https://via.placeholder.com/60x60"}
                              alt={product.title}
                              style={{
                                width: '60px',
                                height: '60px',
                                objectFit: 'cover',
                                borderRadius: '4px'
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                                {product.title}
                              </div>
                              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                ${product.variants?.[0]?.price || '0.00'}
                              </div>
                            </div>
                            {isSelected && (
                              <Badge tone="success">Selected</Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      heading="No products found"
                      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                    >
                      <p>Try adjusting your search</p>
                    </EmptyState>
                  )}
                </div>
              </BlockStack>
            </Card>

            {/* Upsell Products Selection */}
            {selectedTriggerProduct && (
              <Card>
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">
                    Add Upsell Products
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Select products to recommend when the trigger product is viewed
                  </Text>
                  
                  <TextField
                    label="Search Upsell Products"
                    value={upsellSearchQuery}
                    onChange={setUpsellSearchQuery}
                    placeholder="Search for upsell products..."
                    autoComplete="off"
                  />

                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {filteredUpsellProducts.length > 0 ? (
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {filteredUpsellProducts.map((product: any) => {
                          const isSelected = selectedUpsellProducts.includes(product.handle);
                          return (
                            <div
                              key={product.handle}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedUpsellProducts(prev => prev.filter(h => h !== product.handle));
                                } else {
                                  setSelectedUpsellProducts(prev => [...prev, product.handle]);
                                }
                              }}
                              style={{
                                border: isSelected ? '2px solid #10b981' : '1px solid #e5e7eb',
                                borderRadius: '6px',
                                padding: '12px',
                                cursor: 'pointer',
                                backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center'
                              }}
                            >
                              <img
                                src={product.images?.[0]?.src || "https://via.placeholder.com/60x60"}
                                alt={product.title}
                                style={{
                                  width: '60px',
                                  height: '60px',
                                  objectFit: 'cover',
                                  borderRadius: '4px'
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                                  {product.title}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                  ${product.variants?.[0]?.price || '0.00'}
                                </div>
                              </div>
                              <Checkbox
                                label=""
                                checked={isSelected}
                                onChange={() => {}}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <EmptyState
                        heading="No products found"
                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                      >
                        <p>Try adjusting your search</p>
                      </EmptyState>
                    )}
                  </div>

                  {selectedUpsellProducts.length > 0 && (
                    <div>
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        Selected: {selectedUpsellProducts.length} product(s)
                      </Text>
                    </div>
                  )}
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

