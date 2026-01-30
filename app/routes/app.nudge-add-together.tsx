import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "@remix-run/react";
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
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { checkPlanAccess } from "../utils/planAccess.server";
import { useState, useCallback, useEffect, useRef } from "react";
import { DeleteIcon, EditIcon } from "@shopify/polaris-icons";
import { NudgeWidget } from "../components/shared/NudgeWidget";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing, session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  // Check billing - if no active payment, return redirect URL
  const { requireBilling } = await import("../utils/billing.server");
  const billingRedirectUrl = await requireBilling(billing);
  if (billingRedirectUrl) {
    return json({ billingRedirectUrl });
  }

  // Check plan access for nudge add together feature
  const planAccess = await checkPlanAccess(shop, 'nudge_add_together');

  // Get or create NudgeAddTogether configuration
  let nudgeAddTogetherConfig = await prisma.nudgeAddTogether.findUnique({
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

  if (!nudgeAddTogetherConfig) {
    nudgeAddTogetherConfig = await prisma.nudgeAddTogether.create({
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

  // Fetch products from Shopify (only active products)
  let shopProducts: any[] = [];
  let shopCollections: any[] = [];

  try {
    const response = await admin.graphql(`
      query getProducts($first: Int!, $query: String!) {
        products(first: $first, query: $query) {
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
      variables: {
        first: 100,
        query: "status:active"
      }
    });

    const responseJson = await response.json();

    if (responseJson.data?.products?.edges) {
      shopProducts = responseJson.data.products.edges
        .filter((edge: any) => edge.node.status === 'ACTIVE')
        .map((edge: any) => {
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
              productsCount {
                count
              }
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
          productsCount: collection.productsCount?.count || 0
        };
      });
    }
  } catch (error) {
    console.error('Error fetching collections:', error);
  }

  return json({ nudgeAddTogetherConfig, shopProducts, shopCollections, planAccess });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Get or create NudgeAddTogether config
  let nudgeAddTogetherConfig = await prisma.nudgeAddTogether.findUnique({
    where: { shop }
  });

  if (!nudgeAddTogetherConfig) {
    nudgeAddTogetherConfig = await prisma.nudgeAddTogether.create({
      data: { shop }
    });
  }

  if (intent === "toggle") {
    const enabled = formData.get("enabled") === "true";
    await prisma.nudgeAddTogether.update({
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
      triggerPoint: formData.get("triggerPoint") as string || "add_to_cart",
      popupDelay: parseInt(formData.get("popupDelay") as string || "0"),
      overlayColor: formData.get("overlayColor") as string,
      overlayOpacity: parseInt(formData.get("overlayOpacity") as string || "50"),
      popupBackgroundColor: formData.get("popupBackgroundColor") as string,
      popupBorderRadius: parseInt(formData.get("popupBorderRadius") as string || "8"),
      titleColor: formData.get("titleColor") as string,
      subtitleColor: formData.get("subtitleColor") as string,
      addSelectedButtonText: formData.get("addSelectedButtonText") as string,
      addSelectedButtonColor: formData.get("addSelectedButtonColor") as string,
      addSelectedButtonTextColor: formData.get("addSelectedButtonTextColor") as string,
      closeButtonColor: formData.get("closeButtonColor") as string,
      showProductImage: formData.get("showProductImage") === "true",
      showProductPrice: formData.get("showProductPrice") === "true",
      showProductComparePrice: formData.get("showProductComparePrice") === "true",
      showProductDescription: formData.get("showProductDescription") === "true",
      maxProducts: parseInt(formData.get("maxProducts") as string || "4"),
      layout: formData.get("layout") as string,
      enableAnimation: formData.get("enableAnimation") === "true",
      animationType: formData.get("animationType") as string,
      checkboxMode: formData.get("checkboxMode") === "true",
    };

    await prisma.nudgeAddTogether.update({
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
    const triggerPoint = formData.get("triggerPoint") as string || "add_to_cart";
    const upsellProducts = JSON.parse(formData.get("upsellProducts") as string || "[]");

    // Create the rule
    const rule = await prisma.nudgeAddTogetherRule.create({
      data: {
        nudgeAddTogetherId: nudgeAddTogetherConfig.id,
        triggerType,
        triggerValue,
        triggerProductId,
        triggerTitle,
        triggerPoint,
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
              status
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

          // Only save active products
          if (product.status !== 'ACTIVE') {
            console.warn(`Skipping product ${productHandle}: status is ${product.status}, only ACTIVE products are allowed`);
            continue;
          }

          const variant = product.variants.edges[0]?.node;
          const image = product.images.edges[0]?.node;

          if (variant) {
            await prisma.nudgeAddTogetherProduct.create({
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
    await prisma.nudgeAddTogetherRule.delete({
      where: { id: ruleId }
    });
    return json({ success: true });
  }

  if (intent === "update-rule") {
    const ruleId = formData.get("ruleId") as string;
    const triggerType = formData.get("triggerType") as string;
    const triggerValue = formData.get("triggerValue") as string;
    const triggerProductId = formData.get("triggerProductId") as string;
    const triggerTitle = formData.get("triggerTitle") as string;
    const triggerPoint = formData.get("triggerPoint") as string || "add_to_cart";
    const upsellProducts = JSON.parse(formData.get("upsellProducts") as string || "[]");

    // Update the rule
    await prisma.nudgeAddTogetherRule.update({
      where: { id: ruleId },
      data: {
        triggerType,
        triggerValue,
        triggerProductId,
        triggerTitle,
        triggerPoint,
      }
    });

    // Delete existing products for this rule
    await prisma.nudgeAddTogetherProduct.deleteMany({
      where: { ruleId }
    });

    // Add updated upsell products
    for (let i = 0; i < upsellProducts.length; i++) {
      const productHandle = upsellProducts[i];

      try {
        const response = await admin.graphql(`
          query getProductByHandle($handle: String!) {
            productByHandle(handle: $handle) {
              id
              title
              handle
              status
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

          // Only save active products
          if (product.status !== 'ACTIVE') {
            console.warn(`Skipping product ${productHandle}: status is ${product.status}, only ACTIVE products are allowed`);
            continue;
          }

          const variant = product.variants.edges[0]?.node;
          const image = product.images.edges[0]?.node;

          if (variant) {
            await prisma.nudgeAddTogetherProduct.create({
              data: {
                ruleId: ruleId,
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

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function NudgeAddTogether() {
  const data = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();

  // Check if we need to redirect for billing
  if ('billingRedirectUrl' in data) {
    if (typeof window !== 'undefined') {
      window.top!.location.href = data.billingRedirectUrl;
    }
    return null;
  }

  const { nudgeAddTogetherConfig, shopProducts, shopCollections } = data as Exclude<typeof data, { billingRedirectUrl: string }>;

  // Check which action is being submitted
  const formData = navigation.formData;
  const submittingIntent = formData?.get("intent") as string | null;
  const isSubmitting = navigation.state === "submitting";
  const isToggleLoading = isSubmitting && submittingIntent === "toggle";
  const isSaveSettingsLoading = isSubmitting && submittingIntent === "save-settings";

  // Track previous submission state to detect when save completes
  const prevIsSubmitting = useRef(false);
  const prevSubmittingIntent = useRef<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Show toast notification when settings are saved successfully
  useEffect(() => {
    // Check if we just finished submitting a save-settings action
    const justFinishedSave =
      prevIsSubmitting.current &&
      prevSubmittingIntent.current === "save-settings" &&
      !isSubmitting &&
      actionData &&
      'success' in actionData &&
      actionData.success;

    if (justFinishedSave) {
      setShowToast(true);
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Update refs for next render
    prevIsSubmitting.current = isSubmitting;
    prevSubmittingIntent.current = submittingIntent;
  }, [actionData, submittingIntent, isSubmitting]);

  const [formState, setFormState] = useState(() => {
    return {
      title: nudgeAddTogetherConfig?.title || "Complete your purchase",
      subtitle: nudgeAddTogetherConfig?.subtitle || "Add these products together",
      recommendationType: "manual",
      showOnAddToCart: nudgeAddTogetherConfig?.showOnAddToCart ?? true,
      triggerPoint: nudgeAddTogetherConfig?.triggerPoint || "add_to_cart",
      popupDelay: nudgeAddTogetherConfig?.popupDelay?.toString() || "0",
      overlayColor: nudgeAddTogetherConfig?.overlayColor || "#000000",
      overlayOpacity: nudgeAddTogetherConfig?.overlayOpacity?.toString() || "50",
      popupBackgroundColor: nudgeAddTogetherConfig?.popupBackgroundColor || "#FFFFFF",
      popupBorderRadius: nudgeAddTogetherConfig?.popupBorderRadius?.toString() || "8",
      titleColor: nudgeAddTogetherConfig?.titleColor || "#000000",
      subtitleColor: nudgeAddTogetherConfig?.subtitleColor || "#666666",
      addSelectedButtonText: nudgeAddTogetherConfig?.addSelectedButtonText || "Add Selected to Cart",
      addSelectedButtonColor: nudgeAddTogetherConfig?.addSelectedButtonColor || "#4F46E5",
      addSelectedButtonTextColor: nudgeAddTogetherConfig?.addSelectedButtonTextColor || "#FFFFFF",
      closeButtonColor: nudgeAddTogetherConfig?.closeButtonColor || "#999999",
      showProductImage: nudgeAddTogetherConfig?.showProductImage ?? true,
      showProductPrice: nudgeAddTogetherConfig?.showProductPrice ?? true,
      showProductComparePrice: nudgeAddTogetherConfig?.showProductComparePrice ?? true,
      showProductDescription: nudgeAddTogetherConfig?.showProductDescription ?? false,
      maxProducts: nudgeAddTogetherConfig?.maxProducts?.toString() || "4",
      layout: nudgeAddTogetherConfig?.layout || "grid",
      enableAnimation: nudgeAddTogetherConfig?.enableAnimation ?? true,
      animationType: nudgeAddTogetherConfig?.animationType || "fade",
      checkboxMode: nudgeAddTogetherConfig?.checkboxMode ?? true,
    };
  });

  const [showManualModal, setShowManualModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState({
    triggerType: "specific_product" as "specific_product" | "collection" | "all_products",
    selectedTriggerProduct: null as string | null,
    selectedTriggerCollection: null as string | null,
    selectedUpsellProducts: [] as string[],
    triggerPoint: "add_to_cart" as "add_to_cart" | "checkout",
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
    formData.append("enabled", (!nudgeAddTogetherConfig?.isActive).toString());
    submit(formData, { method: "post" });
  }, [nudgeAddTogetherConfig?.isActive, submit]);

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
    const intent = editingRuleId ? "update-rule" : "add-rule";
    formData.append("intent", intent);

    if (editingRuleId) {
      formData.append("ruleId", editingRuleId);
    }

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
    formData.append("triggerPoint", modalConfig.triggerPoint);
    formData.append("upsellProducts", JSON.stringify(modalConfig.selectedUpsellProducts));

    submit(formData, { method: "post" });
    setShowManualModal(false);
    setEditingRuleId(null);
    setModalConfig({
      triggerType: "specific_product",
      selectedTriggerProduct: null,
      selectedTriggerCollection: null,
      selectedUpsellProducts: [],
      triggerPoint: "add_to_cart",
      triggerTab: "product",
      upsellTab: "product",
      searchQuery: "",
      upsellSearchQuery: "",
      showTriggerModal: false,
      showUpsellModal: false,
    });
  }, [modalConfig, shopProducts, shopCollections, submit, editingRuleId]);

  const handleDeleteRule = useCallback((ruleId: string) => {
    if (confirm("Are you sure you want to delete this rule?")) {
      const formData = new FormData();
      formData.append("intent", "delete-rule");
      formData.append("ruleId", ruleId);
      submit(formData, { method: "post" });
    }
  }, [submit]);

  const handleEditRule = useCallback((rule: any) => {
    setEditingRuleId(rule.id);

    // Convert rule to modal config format
    const triggerType = rule.triggerType === "product" ? "specific_product" :
      rule.triggerType === "collection" ? "collection" :
        "all_products";
    const selectedTriggerProduct = triggerType === "specific_product" && rule.triggerValue && rule.triggerValue !== "all"
      ? rule.triggerValue
      : null;
    const selectedTriggerCollection = triggerType === "collection" && rule.triggerValue
      ? rule.triggerValue
      : null;
    const selectedUpsellProducts = rule.products.map((p: any) => p.handle);

    setModalConfig({
      triggerType: triggerType as "specific_product" | "collection" | "all_products",
      selectedTriggerProduct: selectedTriggerProduct,
      selectedTriggerCollection: selectedTriggerCollection,
      selectedUpsellProducts: selectedUpsellProducts,
      triggerPoint: (rule.triggerPoint as "add_to_cart" | "checkout") || "add_to_cart",
      triggerTab: triggerType === "collection" ? "collection" : "product",
      upsellTab: "product",
      searchQuery: "",
      upsellSearchQuery: "",
      showTriggerModal: false,
      showUpsellModal: false,
    });

    setShowManualModal(true);
  }, []);

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

  // Get products for preview
  const getPreviewProducts = () => {
    // Check if there are any rules with products
    if (nudgeAddTogetherConfig?.rules && nudgeAddTogetherConfig.rules.length > 0) {
      for (const rule of nudgeAddTogetherConfig.rules) {
        if (rule.products && rule.products.length > 0) {
          return rule.products
            .slice(0, parseInt(formState.maxProducts))
            .map(product => ({
              id: product.shopifyProductId || product.id,
              variantId: product.shopifyVariantId || '',
              title: product.title,
              handle: product.handle,
              price: product.price ? parseFloat(product.price.toString()) : 0,
              compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice.toString()) : undefined,
              imageUrl: product.imageUrl,
              description: product.description || ''
            }));
        }
      }
    }

    // Fallback to sample products from shop
    if (shopProducts.length > 0) {
      return shopProducts.slice(0, Math.min(parseInt(formState.maxProducts), 3)).map((product: any) => ({
        id: product.shopifyProductId || product.id,
        variantId: product.variants?.[0]?.id || '',
        title: product.title,
        handle: product.handle,
        price: product.price ? parseFloat(product.price) :
          (product.variants?.[0]?.price ? parseFloat(product.variants[0].price) : 0),
        compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice) :
          (product.variants?.[0]?.compare_at_price ? parseFloat(product.variants[0].compare_at_price) : undefined),
        imageUrl: product.imageUrl || product.images?.[0]?.src || '',
        description: product.description || ''
      }));
    }

    // Ultimate fallback to empty array
    return [];
  };

  const previewProducts = getPreviewProducts();

  return (
    <Page
      title="Nudge Add Together"
      primaryAction={{
        content: "Save",
        onAction: handleSaveSettings,
        loading: isSaveSettingsLoading,
      }}
    >
      <TitleBar title="Nudge Add Together" />

      {/* Custom Toast Notification - Appears at Top */}
      {showToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          animation: 'slideDown 0.3s ease-out',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            maxWidth: '500px',
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <Text as="p" variant="bodyMd" fontWeight="medium">
                Settings saved successfully
              </Text>
            </div>
            <button
              onClick={() => setShowToast(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                flexShrink: 0,
              }}
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>

      <Layout>
        <Layout.Section variant="oneHalf">
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
                      {nudgeAddTogetherConfig?.isActive
                        ? "Nudge Add Together feature is currently enabled"
                        : "Nudge Add Together feature is currently disabled"}
                    </Text>
                  </BlockStack>
                  <Button onClick={handleToggle} loading={isToggleLoading}>
                    {nudgeAddTogetherConfig?.isActive ? "Disable" : "Enable"}
                  </Button>
                </InlineStack>

                {!nudgeAddTogetherConfig?.isActive && (
                  <Banner tone="warning">
                    Enable this feature to show additional products in a popup when customers click "Add to Cart". Customers can add the original product plus selected popup products together.
                  </Banner>
                )}
              </BlockStack>
            </Card>

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

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Selection Settings
                </Text>
                <FormLayout>
                  <Checkbox
                    label="Enable Checkbox Mode"
                    checked={formState.checkboxMode}
                    onChange={(value) => setFormState({ ...formState, checkboxMode: value })}
                    helpText="Allow users to select multiple products using checkboxes"
                  />
                </FormLayout>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Style Settings
                </Text>
                <FormLayout>
                  <TextField
                    label="Title Color"
                    value={formState.titleColor}
                    onChange={(value) => setFormState({ ...formState, titleColor: value })}
                    autoComplete="off"
                    {...({ type: "color" } as any)}
                  />
                  <TextField
                    label="Subtitle Color"
                    value={formState.subtitleColor}
                    onChange={(value) => setFormState({ ...formState, subtitleColor: value })}
                    autoComplete="off"
                    {...({ type: "color" } as any)}
                  />
                  <TextField
                    label="Popup Background Color"
                    value={formState.popupBackgroundColor}
                    onChange={(value) => setFormState({ ...formState, popupBackgroundColor: value })}
                    autoComplete="off"
                    {...({ type: "color" } as any)}
                  />
                  <TextField
                    label="Overlay Color"
                    value={formState.overlayColor}
                    onChange={(value) => setFormState({ ...formState, overlayColor: value })}
                    autoComplete="off"
                    {...({ type: "color" } as any)}
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

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Button Settings
                </Text>
                <FormLayout>
                  <TextField
                    label="Add Selected Button Text"
                    value={formState.addSelectedButtonText}
                    onChange={(value) => setFormState({ ...formState, addSelectedButtonText: value })}
                    autoComplete="off"
                  />
                  <TextField
                    label="Add Selected Button Background Color"
                    value={formState.addSelectedButtonColor}
                    onChange={(value) => setFormState({ ...formState, addSelectedButtonColor: value })}
                    autoComplete="off"
                    {...({ type: "color" } as any)}
                  />
                  <TextField
                    label="Add Selected Button Text Color"
                    value={formState.addSelectedButtonTextColor}
                    onChange={(value) => setFormState({ ...formState, addSelectedButtonTextColor: value })}
                    autoComplete="off"
                    {...({ type: "color" } as any)}
                  />
                  <Divider />
                  <TextField
                    label="Close Button Color"
                    value={formState.closeButtonColor}
                    onChange={(value) => setFormState({ ...formState, closeButtonColor: value })}
                    autoComplete="off"
                    {...({ type: "color" } as any)}
                  />
                </FormLayout>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">
                    Manual Rules
                  </Text>
                  <Button onClick={() => {
                    setEditingRuleId(null);
                    setShowManualModal(true);
                  }}>
                    Add Rule
                  </Button>
                </InlineStack>

                {nudgeAddTogetherConfig?.rules && nudgeAddTogetherConfig.rules.length > 0 ? (
                  <ResourceList
                    resourceName={{ singular: 'rule', plural: 'rules' }}
                    items={nudgeAddTogetherConfig.rules}
                    renderItem={(rule) => {
                      const { id, triggerType, triggerTitle, triggerValue, products } = rule;
                      const triggerProduct = triggerType === 'product' && triggerValue && triggerValue !== 'all'
                        ? shopProducts.find(p => p.handle === triggerValue)
                        : null;
                      return (
                        <ResourceItem
                          id={id}
                          accessibilityLabel={`View details for ${triggerTitle}`}
                          onClick={() => { }}
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
                                  <InlineStack gap="200" blockAlign="center">
                                    <Text as="h3" variant="headingMd">
                                      {triggerTitle || "Unknown"}
                                    </Text>
                                    <Badge tone={(rule as any).triggerPoint === "checkout" ? "info" : "success"}>
                                      {(rule as any).triggerPoint === "checkout" ? "Checkout" : "Add to Cart"}
                                    </Badge>
                                  </InlineStack>
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    Trigger: {triggerType} | {products.length} upsell {products.length === 1 ? 'product' : 'products'}
                                  </Text>
                                </BlockStack>
                              </InlineStack>
                              <InlineStack gap="200">
                                <Button
                                  icon={EditIcon}
                                  variant="plain"
                                  onClick={() => handleEditRule(rule)}
                                />
                                <Button
                                  icon={DeleteIcon}
                                  variant="plain"
                                  tone="critical"
                                  onClick={() => handleDeleteRule(id)}
                                />
                              </InlineStack>
                            </InlineStack>
                            {products.length > 0 && (
                              <Box paddingBlockStart="200">
                                <BlockStack gap="200">
                                  <Text as="p" variant="bodySm" fontWeight="semibold">
                                    Recommended Products:
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
          </BlockStack>
        </Layout.Section>

        {/* Preview Section */}
        <div style={{
          flex: '0 0 45%',
          minWidth: '350px',
          paddingLeft: '12px',
          position: 'sticky',
          top: '0',
          height: 'fit-content',
          maxHeight: 'calc(100vh)',
          overflowY: 'auto',
          paddingTop: '15px'
        }}>
          <div style={{ position: 'sticky', top: '24px' }}>
            <Card>
              <BlockStack gap="400">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text as="h3" variant="headingMd">
                    Live Preview
                  </Text>
                  <Badge tone={previewProducts.length === 0 ? 'info' : 'success'}>
                    {formState.layout === 'grid' ? 'Grid' : 'Carousel'}
                  </Badge>
                </div>

                <div style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  backgroundColor: '#fafbfc',
                  maxHeight: 'calc(100vh - 240px)',
                  overflowY: 'auto',
                  position: 'relative',
                  minHeight: '600px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    width: '100%',
                  }}>
                    <div style={{
                      width: '100%',
                      maxWidth: '800px'
                    }}>
                      <NudgeWidget
                        config={{
                          title: formState.title,
                          subtitle: formState.subtitle,
                          layout: (formState.layout === 'list' ? 'grid' : formState.layout) as 'grid' | 'carousel',
                          maxProducts: parseInt(formState.maxProducts),
                          showProductImage: formState.showProductImage,
                          showProductDescription: formState.showProductDescription,
                          showProductPrice: formState.showProductPrice,
                          showProductComparePrice: formState.showProductComparePrice,
                          selectButtonText: formState.addSelectedButtonText,
                          selectButtonColor: formState.addSelectedButtonColor,
                          selectButtonTextColor: formState.addSelectedButtonTextColor,
                          continueButtonText: '',
                          continueButtonColor: '#000000',
                          continueButtonTextColor: '#FFFFFF',
                          overlayColor: formState.overlayColor,
                          overlayOpacity: parseInt(formState.overlayOpacity),
                          popupBackgroundColor: formState.popupBackgroundColor,
                          popupBorderRadius: parseInt(formState.popupBorderRadius),
                          closeButtonColor: formState.closeButtonColor,
                          titleColor: formState.titleColor,
                          subtitleColor: formState.subtitleColor,
                          enableAnimation: formState.enableAnimation,
                          animationType: formState.animationType as 'fade' | 'slide-up' | 'scale',
                          popupDelay: parseInt(formState.popupDelay),
                          showOnAddToCart: formState.showOnAddToCart
                        }}
                        recommendations={previewProducts}
                        isVisible={true}
                        isPreview={true}
                        checkboxMode={formState.checkboxMode}
                        selectedProductIds={new Set()}
                        onSelectProduct={() => { }} // No-op for preview
                        onSelectAll={() => { }} // No-op for preview
                      />
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '12px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe'
                }}>
                  <Text as="p" variant="bodySm">
                    <strong>💡 Preview Tip:</strong> {previewProducts.length === 0 ? 'Using sample products. Configure rules above to see your actual products.' : 'Showing your configured products. Change layout to see different styles.'}
                  </Text>
                </div>

                <Text as="p" variant="bodyMd" tone="subdued">
                  This preview shows how the nudge popup will appear when customers click "Add to Cart". Customers can select multiple products using checkboxes and add them together with the original product.
                </Text>
              </BlockStack>
            </Card>
          </div>
        </div>
      </Layout>

      {/* Add Rule Modal */}
      <Modal
        open={showManualModal}
        onClose={() => {
          setShowManualModal(false);
          setEditingRuleId(null);
          setModalConfig({
            triggerType: "specific_product",
            selectedTriggerProduct: null,
            selectedTriggerCollection: null,
            selectedUpsellProducts: [],
            triggerPoint: "add_to_cart",
            triggerTab: "product",
            upsellTab: "product",
            searchQuery: "",
            upsellSearchQuery: "",
            showTriggerModal: false,
            showUpsellModal: false,
          });
        }}
        title={editingRuleId ? "Edit Nudge Rule" : "Add Nudge Rule"}
        primaryAction={{
          content: editingRuleId ? "Update Rule" : "Add Rule",
          onAction: handleAddRule,
          disabled: modalConfig.selectedUpsellProducts.length === 0,
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

              <Select
                label="Trigger Point"
                options={[
                  { label: "Add to Cart", value: "add_to_cart" },
                  { label: "Checkout", value: "checkout" },
                ]}
                value={modalConfig.triggerPoint}
                onChange={(value) => setModalConfig({ ...modalConfig, triggerPoint: value as "add_to_cart" | "checkout" })}
                helpText="Choose when the nudge popup should appear"
              />

              <Divider />

              <Text as="h3" variant="headingMd">
                Products to Show in Popup
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Select products that will be shown as additional options (customers can select multiple)
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
        size="large"
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
                        triggerType: "collection",
                        selectedTriggerCollection: collection.handle,
                        selectedTriggerProduct: null,
                        showTriggerModal: false,
                      });
                    }}
                  >
                    <BlockStack gap="100">
                      <Text as="h3" variant="bodyMd" fontWeight="semibold">
                        {collection.title}
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {collection.productsCount?.count} products
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
                        triggerType: "specific_product",
                        selectedTriggerProduct: product.handle,
                        selectedTriggerCollection: null,
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
        size="large"
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

