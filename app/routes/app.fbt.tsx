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
  Badge,
  Divider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useState, useCallback } from "react";
import { DeleteIcon, PlusIcon } from "@shopify/polaris-icons";

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

  return json({ fbtConfig, shopProducts, shopCollections });
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
    const upsellType = formData.get("upsellType") as string;
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
  const { fbtConfig, shopProducts, shopCollections } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const [formState, setFormState] = useState(() => {
    const recommendationType = fbtConfig?.recommendationType || "manual";
    const useAI = recommendationType === "ai" || recommendationType === "hybrid";
    return {
      title: fbtConfig?.title || "Frequently Bought Together",
      recommendationType: recommendationType,
      algorithm: fbtConfig?.algorithm || "related",
      useAI: fbtConfig?.useAI ?? useAI,
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
    };
  });

  const [showManualModal, setShowManualModal] = useState(false);
  
  // State for managing multiple upsell rows
  interface UpsellRow {
    id: string;
    triggerType: "specific_product" | "collection" | "all_products";
    selectedTriggerProduct: string | null;
    selectedTriggerCollection: string | null;
    selectedUpsellProducts: string[];
    triggerTab: "product" | "collection";
    upsellTab: "product" | "collection";
    searchQuery: string;
    upsellSearchQuery: string;
    showTriggerModal: boolean;
    showUpsellModal: boolean;
  }
  
  const [upsellRows, setUpsellRows] = useState<UpsellRow[]>([
    {
      id: '1',
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
    }
  ]);

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

  const handleAddNewUpsellRow = useCallback(() => {
    const newRow: UpsellRow = {
      id: Date.now().toString(),
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
    };
    setUpsellRows(prev => [...prev, newRow]);
  }, []);

  const handleRemoveUpsellRow = useCallback((rowId: string) => {
    setUpsellRows(prev => prev.filter(row => row.id !== rowId));
  }, []);

  const updateUpsellRow = useCallback((rowId: string, updates: Partial<UpsellRow>) => {
    setUpsellRows(prev => prev.map(row => 
      row.id === rowId ? { ...row, ...updates } : row
    ));
  }, []);

  const handleSaveAllRules = useCallback(async () => {
    // Validate all rows
    const validRows = upsellRows.filter(row => {
      if (row.selectedUpsellProducts.length === 0) return false;
      if (row.triggerType === "specific_product" && !row.selectedTriggerProduct) return false;
      if (row.triggerType === "collection" && !row.selectedTriggerCollection) return false;
      return true;
    });

    if (validRows.length === 0) {
      return;
    }

    // Submit each rule
    for (const row of validRows) {
      let triggerValue = "";
      let triggerProductId = "";
      let triggerTitle = "";
      let actualTriggerType = row.triggerType;

      if (row.triggerType === "specific_product" && row.selectedTriggerProduct) {
        const triggerProduct = shopProducts.find((p: any) => p.handle === row.selectedTriggerProduct);
        if (!triggerProduct) continue;
        triggerValue = row.selectedTriggerProduct;
        triggerProductId = triggerProduct.shopifyProductId;
        triggerTitle = triggerProduct.title;
      } else if (row.triggerType === "collection" && row.selectedTriggerCollection) {
        const collection = shopCollections.find((c: any) => c.handle === row.selectedTriggerCollection);
        if (!collection) continue;
        triggerValue = row.selectedTriggerCollection;
        triggerProductId = collection.shopifyCollectionId;
        triggerTitle = collection.title;
      } else if (row.triggerType === "all_products") {
        triggerValue = "all";
        triggerTitle = "All Products";
      }

      const formData = new FormData();
      formData.append("intent", "add-rule");
      formData.append("triggerType", actualTriggerType);
      formData.append("triggerValue", triggerValue);
      formData.append("triggerProductId", triggerProductId);
      formData.append("triggerTitle", triggerTitle);
      formData.append("upsellProducts", JSON.stringify(row.selectedUpsellProducts));
      
      await submit(formData, { method: "post" });
    }

    // Reset modal state
    setShowManualModal(false);
    setUpsellRows([
      {
        id: '1',
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
      }
    ]);
  }, [upsellRows, shopProducts, shopCollections, submit]);

  const handleDeleteRule = useCallback((ruleId: string) => {
    const formData = new FormData();
    formData.append("intent", "delete-rule");
    formData.append("ruleId", ruleId);
    submit(formData, { method: "post" });
  }, [submit]);

  const getFilteredTriggerProducts = (row: UpsellRow) => {
    return shopProducts.filter((product: any) =>
      product.title.toLowerCase().includes(row.searchQuery.toLowerCase())
    );
  };

  const getFilteredTriggerCollections = (row: UpsellRow) => {
    return shopCollections.filter((collection: any) =>
      collection.title.toLowerCase().includes(row.searchQuery.toLowerCase())
    );
  };

  const getFilteredUpsellProducts = (row: UpsellRow) => {
    return shopProducts.filter((product: any) =>
      product.title.toLowerCase().includes(row.upsellSearchQuery.toLowerCase()) &&
      product.handle !== row.selectedTriggerProduct
    );
  };

  const getPreviewProducts = () => {
    // If AI only mode, show sample products from shop
    if (formState.recommendationType === "ai") {
      return shopProducts.slice(0, 3).map((product: any) => ({
        id: product.id,
        title: product.title,
        price: product.variants?.[0]?.price || "0.00",
        imageUrl: product.images?.[0]?.src || null,
        handle: product.handle
      }));
    }
    
    // If hybrid mode, prioritize manual but show AI as fallback
    if (formState.recommendationType === "hybrid") {
      // First, check if there are products being configured in the modal
      for (const row of upsellRows) {
        if (row.selectedUpsellProducts.length > 0) {
          return row.selectedUpsellProducts
            .slice(0, 3)
            .map(handle => shopProducts.find((p: any) => p.handle === handle))
            .filter(Boolean);
        }
      }
      
      // Otherwise, use products from the first configured rule
      if (fbtConfig?.rules && fbtConfig.rules.length > 0) {
        return fbtConfig.rules[0].products.slice(0, 3);
      }
      
      // Fallback to AI preview if no manual rules
      return shopProducts.slice(0, 3).map((product: any) => ({
        id: product.id,
        title: product.title,
        price: product.variants?.[0]?.price || "0.00",
        imageUrl: product.images?.[0]?.src || null,
        handle: product.handle
      }));
    }
    
    // Manual mode: show configured products
    // First, check if there are products being configured in the modal
    for (const row of upsellRows) {
      if (row.selectedUpsellProducts.length > 0) {
        return row.selectedUpsellProducts
          .slice(0, 3) // Limit to 3 products for preview
          .map(handle => shopProducts.find((p: any) => p.handle === handle))
          .filter(Boolean);
      }
    }
    
    // Otherwise, use products from the first configured rule
    if (fbtConfig?.rules && fbtConfig.rules.length > 0) {
      return fbtConfig.rules[0].products.slice(0, 3);
    }
    
    // Return empty array if no products are configured
    return [];
  };

  const calculatePreviewTotal = (products: any[]) => {
    if (products.length === 0) return { original: 0, discounted: 0 };
    
    const total = products.reduce((sum, product) => {
      const price = typeof product.price === 'number' 
        ? product.price 
        : parseFloat(product.price) || 0;
      return sum + price;
    }, 0);
    
    let discountedTotal = total;
    if (formState.discountValue) {
      const discountValue = parseFloat(formState.discountValue);
      if (formState.discountType === 'percentage') {
        discountedTotal = total * (1 - discountValue / 100);
      } else {
        discountedTotal = Math.max(0, total - discountValue);
      }
    }
    
    return { 
      original: total.toFixed(2), 
      discounted: discountedTotal.toFixed(2) 
    };
  };

  const previewProducts = getPreviewProducts();
  const { original, discounted } = calculatePreviewTotal(previewProducts);

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

          {/* Configuration Card */}
          <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Product Selection
                </Text>
                
                <FormLayout>
                  <Select
                    label="Recommendation Type"
                    options={[
                      { label: "Manual Only", value: "manual" },
                      { label: "AI Only", value: "ai" },
                      { label: "Hybrid (Manual + AI)", value: "hybrid" },
                    ]}
                    value={formState.recommendationType}
                    onChange={(value) => {
                      const useAI = value === "ai" || value === "hybrid";
                      setFormState({ 
                        ...formState, 
                        recommendationType: value,
                        useAI: useAI
                      });
                    }}
                    helpText="Choose how product recommendations are generated. Manual uses your configured rules, AI uses Shopify's recommendations, Hybrid combines both."
                  />

                  {(formState.recommendationType === "ai" || formState.recommendationType === "hybrid") && (
                    <>
                      <Select
                        label="Recommendation Algorithm"
                        options={[
                          { label: "Related Products", value: "related" },
                          { label: "Complementary Products", value: "complementary" },
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
                    </>
                  )}
                </FormLayout>

                {(formState.recommendationType === "manual" || formState.recommendationType === "hybrid") && (
                  <>
                    <Divider />

                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">
                        Manual Configuration
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Manually configure which products trigger upsell recommendations
                      </Text>
                      <Button onClick={() => setShowManualModal(true)}>
                        Configure Manual Rules
                      </Button>
                    </BlockStack>
                  </>
                )}

                {/* Display existing rules */}
                {fbtConfig?.rules && fbtConfig.rules.length > 0 && (
                  <BlockStack gap="400">
                    <Text as="h3" variant="headingMd">
                      Configured Rules ({fbtConfig.rules.length})
                    </Text>
                    {fbtConfig.rules.map((rule: any) => {
                      const getTriggerLabel = () => {
                        if (rule.triggerType === "collection") {
                          return rule.triggerTitle;
                        } else if (rule.triggerType === "all_products") {
                          return "All Products";
                        } else {
                          return rule.triggerTitle;
                        }
                      };

                      return (
                        <Card key={rule.id}>
                          <BlockStack gap="400">
                            {/* Header with Delete Button */}
                            <InlineStack align="space-between" blockAlign="center">
                              <Text as="p" variant="bodyMd" fontWeight="semibold" tone="subdued">
                                Rule #{fbtConfig.rules.indexOf(rule) + 1}
                              </Text>
                              <Button
                                icon={DeleteIcon}
                                tone="critical"
                                onClick={() => handleDeleteRule(rule.id)}
                                size="slim"
                              >
                                Delete
                              </Button>
                            </InlineStack>

                            {/* Two Column Layout: Trigger | Upsells */}
                            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '16px', alignItems: 'flex-start' }}>
                              {/* Left Column: Trigger Product */}
                              <div style={{ borderRight: '1px solid #e5e7eb', paddingRight: '16px' }}>
                                <div style={{ marginBottom: '8px' }}>
                                  <Text as="p" variant="bodySm" fontWeight="semibold" tone="subdued">
                                    Trigger Product
                                  </Text>
                                </div>
                                {rule.triggerType === "specific_product" && (() => {
                                  const triggerProduct = shopProducts.find((p: any) => p.handle === rule.triggerValue);
                                  return (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                      <img
                                        src={triggerProduct?.images?.[0]?.src || "https://via.placeholder.com/50x50"}
                                        alt={getTriggerLabel()}
                                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                                      />
                                      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <Text as="p" variant="bodySm" fontWeight="semibold">
                                          {getTriggerLabel()}
                                        </Text>
                                      </div>
                                    </div>
                                  );
                                })()}
                                {rule.triggerType === "collection" && (
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <div style={{ width: '50px', height: '50px', backgroundColor: '#f3f4f6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                      📁
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      <Text as="p" variant="bodySm" fontWeight="semibold">
                                        {getTriggerLabel()}
                                      </Text>
                                    </div>
                                  </div>
                                )}
                                {rule.triggerType === "all_products" && (
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <div style={{ width: '50px', height: '50px', backgroundColor: '#f3f4f6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                      🌐
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <Text as="p" variant="bodySm" fontWeight="semibold">
                                        All Products
                                      </Text>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Right Column: Upsell Products */}
                              <div>
                                <div style={{ marginBottom: '8px' }}>
                                  <Text as="p" variant="bodySm" fontWeight="semibold" tone="subdued">
                                    Recommended Products ({rule.products.length})
                                  </Text>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {rule.products.map((product: any, index: number) => (
                                    <div key={product.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '6px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                      <img
                                        src={product.imageUrl || "https://via.placeholder.com/40x40"}
                                        alt={product.title}
                                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e5e7eb' }}
                                      />
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          <Text as="p" variant="bodySm" fontWeight="semibold">
                                            {product.title}
                                          </Text>
                                        </div>
                                        {product.price && (
                                          <div style={{ fontSize: '11px', marginTop: '2px' }}>
                                            <Text as="p" variant="bodySm" tone="subdued">
                                              ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                                            </Text>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </BlockStack>
                        </Card>
                      );
                    })}
                  </BlockStack>
                )}
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
                
                {previewProducts.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '32px 16px',
                    color: '#9ca3af',
                    fontSize: '14px'
                  }}>
                    <p>No products configured yet</p>
                    <p style={{ fontSize: '12px', marginTop: '8px' }}>
                      Configure products in "Manual Configuration" to see preview
                    </p>
                  </div>
                ) : (
                  <>
                    <div style={{
                      display: formState.layout === 'horizontal' ? 'flex' : 'grid',
                      gap: '12px',
                      gridTemplateColumns: formState.layout === 'grid' ? 'repeat(2, 1fr)' : undefined,
                      flexDirection: formState.layout === 'vertical' ? 'column' : 'row',
                      marginBottom: '16px'
                    }}>
                      {previewProducts.map((product: any, index: number) => (
                        <div
                          key={product.id || index}
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
                              <input type="checkbox" defaultChecked={index === 0} />
                            </div>
                          )}
                          <div
                            style={{
                              width: '100%',
                              height: '80px',
                              backgroundColor: '#f3f4f6',
                              borderRadius: '4px',
                              marginBottom: '8px',
                              backgroundImage: product.imageUrl ? `url('${product.imageUrl}')` : undefined,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          />
                          <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {product.title}
                          </div>
                          {formState.showIndividualPrices && (
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>
                              ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
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
                          {formState.showDiscount && original !== discounted && (
                            <span style={{
                              textDecoration: 'line-through',
                              color: '#9ca3af',
                              marginRight: '8px',
                              fontSize: '13px'
                            }}>
                              ${original}
                            </span>
                          )}
                          <span style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                            ${discounted}
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
                  </>
                )}
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
        onClose={() => {
          setShowManualModal(false);
          setUpsellRows([
            {
              id: '1',
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
            }
          ]);
        }}
        title="Configure Manual Upsells"
        primaryAction={{
          content: "Update",
          onAction: handleSaveAllRules,
          disabled: upsellRows.every(row => row.selectedUpsellProducts.length === 0),
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
            {/* Header Row */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '40px 1fr 1fr 40px',
              gap: '16px',
              alignItems: 'center',
              padding: '16px',
              background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
              borderRadius: '12px',
              border: '2px solid #e5e7eb'
            }}>
              <div></div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  <span>🛍️</span>
                  <span style={{ color: 'white' }}>
                    Trigger Product
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  <span>⬆️</span>
                  <span style={{ color: 'white' }}>
                    Upsell Products
                  </span>
                </div>
              </div>
              <div></div>
            </div>

            {/* Upsell Rows */}
            {upsellRows.map((row, index) => (
              <div 
                key={row.id}
                style={{ 
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 1fr 40px',
                  gap: '16px',
                  alignItems: 'start',
                  padding: '20px',
                  backgroundColor: '#fafbfc',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                {/* Drag Handle */}
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'grab',
                  color: '#9ca3af',
                  fontSize: '20px',
                  paddingTop: '8px'
                }}>
                  ⋮⋮
                </div>

                {/* Trigger Product Column */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#eff6ff',
                  border: '2px solid #3b82f6',
                  borderRadius: '10px',
                  borderLeft: '4px solid #3b82f6'
                }}>
                  <BlockStack gap="300">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <Badge tone="info" size="small">TRIGGER</Badge>
                    </div>
                    
                    {/* Trigger Type Selection */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => updateUpsellRow(row.id, { triggerType: "specific_product", showTriggerModal: true })}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          border: row.triggerType === "specific_product" ? '2px solid #3b82f6' : '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: row.triggerType === "specific_product" ? '#eff6ff' : 'white',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '13px',
                          color: row.triggerType === "specific_product" ? '#3b82f6' : '#6b7280',
                          transition: 'all 0.2s'
                        }}
                      >
                        Specific Trigger
                      </button>
                      <span style={{ color: '#6b7280', fontWeight: '600', fontSize: '12px' }}>OR</span>
                      <button
                        onClick={() => updateUpsellRow(row.id, { triggerType: "all_products", selectedTriggerProduct: null, selectedTriggerCollection: null })}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          border: row.triggerType === "all_products" ? '2px solid #3b82f6' : '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: row.triggerType === "all_products" ? '#eff6ff' : 'white',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '13px',
                          color: row.triggerType === "all_products" ? '#3b82f6' : '#6b7280',
                          transition: 'all 0.2s'
                        }}
                      >
                        All Products
                      </button>
                    </div>

                    {/* Display Selected Trigger */}
                    {row.selectedTriggerProduct && (
                      <div style={{
                        padding: '12px',
                        border: '2px solid #3b82f6',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)'
                      }}>
                        {(() => {
                          const product = shopProducts.find((p: any) => p.handle === row.selectedTriggerProduct);
                          return product ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <img
                                src={product.images?.[0]?.src || "https://via.placeholder.com/40x40"}
                                alt={product.title}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  objectFit: 'cover',
                                  borderRadius: '4px'
                                }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: '600', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {product.title}
                                </div>
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}

                    {row.selectedTriggerCollection && (
                      <div style={{
                        padding: '12px',
                        border: '2px solid #3b82f6',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)'
                      }}>
                        {(() => {
                          const collection = shopCollections.find((c: any) => c.handle === row.selectedTriggerCollection);
                          return collection ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: '#3b82f6',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px'
                              }}>
                                📁
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: '600', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {collection.title}
                                </div>
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}

                    {row.triggerType === "all_products" && !row.selectedTriggerProduct && !row.selectedTriggerCollection && (
                      <div style={{
                        padding: '12px',
                        border: '2px solid #3b82f6',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        textAlign: 'center',
                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)'
                      }}>
                        <div style={{ color: '#3b82f6', fontWeight: '600', fontSize: '13px' }}>
                          🌐 All Products
                        </div>
                      </div>
                    )}
                  </BlockStack>
                </div>

                {/* Upsell Product Column */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f0fdf4',
                  border: '2px solid #10b981',
                  borderRadius: '10px',
                  borderLeft: '4px solid #10b981'
                }}>
                  <BlockStack gap="300">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <Badge tone="success" size="small">UPSELL</Badge>
                    </div>
                    
                    <Button
                      size="large"
                      fullWidth
                      onClick={() => updateUpsellRow(row.id, { showUpsellModal: true })}
                      tone="success"
                    >
                      Add Recommended Product
                    </Button>

                    {/* Display Selected Upsell Products */}
                    {row.selectedUpsellProducts.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {row.selectedUpsellProducts.map((productHandle, idx) => {
                          const product = shopProducts.find((p: any) => p.handle === productHandle);
                          return product ? (
                            <div
                              key={productHandle}
                              style={{
                                padding: '12px',
                                border: '2px solid #10b981',
                                borderRadius: '8px',
                                backgroundColor: '#ffffff',
                                display: 'flex',
                                gap: '10px',
                                alignItems: 'center',
                                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.1)',
                                position: 'relative'
                              }}
                            >
                              <div style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: '600'
                              }}>
                                {idx + 1}
                              </div>
                              <img
                                src={product.images?.[0]?.src || "https://via.placeholder.com/40x40"}
                                alt={product.title}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  objectFit: 'cover',
                                  borderRadius: '4px'
                                }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: '600', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {product.title}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                  ${product.variants?.[0]?.price || '0.00'}
                                </div>
                              </div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </BlockStack>
                </div>

                {/* Delete Button */}
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingTop: '8px'
                }}>
                  {upsellRows.length > 1 && (
                    <button
                      onClick={() => handleRemoveUpsellRow(row.id)}
                      style={{
                        width: '32px',
                        height: '32px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Add New Upsell Button */}
            <Button
              size="large"
              fullWidth
              onClick={handleAddNewUpsellRow}
              tone="critical"
              icon={PlusIcon}
            >
              Add New Rule
            </Button>

          </BlockStack>
        </Modal.Section>

        {/* Trigger Selection Modal */}
        {upsellRows.map((row) => row.showTriggerModal && (
          <Modal
            key={`trigger-${row.id}`}
            open={true}
            onClose={() => updateUpsellRow(row.id, { showTriggerModal: false })}
            title="Select Trigger"
            primaryAction={{
              content: "Select",
              onAction: () => updateUpsellRow(row.id, { showTriggerModal: false }),
              disabled: !row.selectedTriggerProduct && !row.selectedTriggerCollection
            }}
            secondaryActions={[
              {
                content: "Cancel",
                onAction: () => updateUpsellRow(row.id, { showTriggerModal: false })
              }
            ]}
            size="large"
          >
            <Modal.Section>
              <BlockStack gap="400">
                {/* Tabs for Product/Collection */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '2px solid #e5e7eb' }}>
                  <button
                    onClick={() => updateUpsellRow(row.id, { triggerTab: "product" })}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderBottom: row.triggerTab === "product" ? '2px solid #2563eb' : '2px solid transparent',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      fontWeight: row.triggerTab === "product" ? '600' : '400',
                      color: row.triggerTab === "product" ? '#2563eb' : '#6b7280',
                      fontSize: '14px'
                    }}
                  >
                    Product
                  </button>
                  <button
                    onClick={() => updateUpsellRow(row.id, { triggerTab: "collection" })}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderBottom: row.triggerTab === "collection" ? '2px solid #2563eb' : '2px solid transparent',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      fontWeight: row.triggerTab === "collection" ? '600' : '400',
                      color: row.triggerTab === "collection" ? '#2563eb' : '#6b7280',
                      fontSize: '14px'
                    }}
                  >
                    Collection
                  </button>
                </div>

                <TextField
                  label=""
                  value={row.searchQuery}
                  onChange={(value) => updateUpsellRow(row.id, { searchQuery: value })}
                  placeholder={row.triggerTab === "product" ? "Search Products..." : "Search Collections..."}
                  autoComplete="off"
                />

                <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '12px' }}>
                  {row.triggerTab === "product" ? (
                    getFilteredTriggerProducts(row).length > 0 ? (
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {getFilteredTriggerProducts(row).map((product: any) => {
                          const isSelected = row.selectedTriggerProduct === product.handle;
                          return (
                            <div
                              key={product.handle}
                              onClick={() => updateUpsellRow(row.id, { 
                                selectedTriggerProduct: product.handle, 
                                selectedTriggerCollection: null 
                              })}
                                  style={{
                                    border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                                    display: 'flex',
                                    gap: '8px',
                                    alignItems: 'center'
                                  }}
                                >
                                  <img
                                    src={product.images?.[0]?.src || "https://via.placeholder.com/40x40"}
                                    alt={product.title}
                                    style={{
                                      width: '40px',
                                      height: '40px',
                                      objectFit: 'cover',
                                      borderRadius: '4px'
                                    }}
                                  />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {product.title}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                      ${product.variants?.[0]?.price || '0.00'}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                            No products found
                          </div>
                        )
                  ) : (
                    getFilteredTriggerCollections(row).length > 0 ? (
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {getFilteredTriggerCollections(row).map((collection: any) => {
                          const isSelected = row.selectedTriggerCollection === collection.handle;
                          return (
                            <div
                              key={collection.handle}
                              onClick={() => updateUpsellRow(row.id, { 
                                selectedTriggerCollection: collection.handle, 
                                selectedTriggerProduct: null 
                              })}
                              style={{
                                border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                borderRadius: '6px',
                                padding: '8px',
                                cursor: 'pointer',
                                backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'center'
                              }}
                            >
                              <div style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: '#e5e7eb',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px'
                              }}>
                                📁
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {collection.title}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                  {collection.productsCount} products
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                        No collections found
                      </div>
                    )
                  )}
                </div>
              </BlockStack>
            </Modal.Section>
          </Modal>
        ))}

        {/* Upsell Selection Modal */}
        {upsellRows.map((row) => row.showUpsellModal && (
          <Modal
            key={`upsell-${row.id}`}
            open={true}
            onClose={() => updateUpsellRow(row.id, { showUpsellModal: false })}
            title="Select Upsell Products"
            primaryAction={{
              content: "Add Products",
              onAction: () => updateUpsellRow(row.id, { showUpsellModal: false })
            }}
            secondaryActions={[
              {
                content: "Cancel",
                onAction: () => updateUpsellRow(row.id, { showUpsellModal: false })
              }
            ]}
            size="large"
          >
            <Modal.Section>
              <BlockStack gap="400">
                <TextField
                  label=""
                  value={row.upsellSearchQuery}
                  onChange={(value) => updateUpsellRow(row.id, { upsellSearchQuery: value })}
                  placeholder="Search Products..."
                  autoComplete="off"
                />

                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {getFilteredUpsellProducts(row).length > 0 ? (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {getFilteredUpsellProducts(row).map((product: any) => {
                        const isSelected = row.selectedUpsellProducts.includes(product.handle);
                        return (
                          <div
                            key={product.handle}
                            onClick={() => {
                              const currentProducts = row.selectedUpsellProducts;
                              if (isSelected) {
                                updateUpsellRow(row.id, { 
                                  selectedUpsellProducts: currentProducts.filter((h: string) => h !== product.handle)
                                });
                              } else {
                                updateUpsellRow(row.id, { 
                                  selectedUpsellProducts: [...currentProducts, product.handle]
                                });
                              }
                            }}
                            style={{
                              border: isSelected ? '2px solid #10b981' : '1px solid #e5e7eb',
                              borderRadius: '6px',
                              padding: '8px',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                              display: 'flex',
                              gap: '8px',
                              alignItems: 'center'
                            }}
                          >
                            <img
                              src={product.images?.[0]?.src || "https://via.placeholder.com/40x40"}
                              alt={product.title}
                              style={{
                                width: '40px',
                                height: '40px',
                                objectFit: 'cover',
                                borderRadius: '4px'
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {product.title}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>
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
                    <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                      No products found
                    </div>
                  )}
                </div>

                {row.selectedUpsellProducts.length > 0 && (
                  <div style={{ padding: '8px', backgroundColor: '#f0fdf4', borderRadius: '6px' }}>
                    <Text as="p" variant="bodySm" fontWeight="semibold">
                      Selected: {row.selectedUpsellProducts.length} product(s)
                    </Text>
                  </div>
                )}
              </BlockStack>
            </Modal.Section>
          </Modal>
        ))}
      </Modal>
    </Page>
  );
}

