import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useRevalidator, useActionData } from "@remix-run/react";
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
  ResourceList,
  ResourceItem,
  Thumbnail,
  Badge,
  EmptyState,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useState, useCallback, useEffect, useRef } from "react";
import { ProductRecommendations as ProductRecommendationsComponent } from "../components/shared/ProductRecommendations";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);
  const editingVersion = url.searchParams.get("version") || "default";

  const cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop_version: { shop, version: editingVersion } },
    include: {
      productRecommendations: { 
        where: { isActive: true },
        include: {
          products: {
            orderBy: { position: 'asc' }
          }
        }
      },
    },
  });

  const productRecommendation = cartDrawer?.productRecommendations[0] || null;

  // Fetch real products from Shopify store using GraphQL
  let shopProducts: any[] = [];
  
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
                    availableForSale
                    inventoryQuantity
                  }
                }
              }
            }
          }
        }
      }
    `, {
      variables: { first: 50, query: "status:active" }
    });

    const responseJson = await response.json() as any;
    
    // Check for GraphQL errors
    if (responseJson.errors) {
      throw new Error('Failed to fetch products from Shopify. Please check your Shopify connection.');
      // Continue with empty array instead of throwing
    } else if (responseJson.data?.products?.edges) {
      shopProducts = responseJson.data.products.edges
        .map((edge: any) => {
          const product = edge.node;
          const image = product.images.edges[0]?.node;
          const variant = product.variants.edges[0]?.node;
          
          // Check if product is available (variant available and has inventory if tracked)
          const isAvailable = variant ? (
            variant.availableForSale && 
            (variant.inventoryQuantity === null || 
             variant.inventoryQuantity > 0)
          ) : false;
          
          return {
            id: product.handle, // Use handle as ID for frontend compatibility
            shopifyProductId: product.id.replace('gid://shopify/Product/', ''), // Keep numeric ID for reference
            title: product.title,
            handle: product.handle,
            status: product.status.toLowerCase(),
            images: image ? [{ src: image.url, alt: image.altText }] : [],
            variants: variant ? [{
              price: variant.price,
              compare_at_price: variant.compareAtPrice,
              available: isAvailable
            }] : [],
            available: isAvailable
          };
        })
        .filter((product: any) => product.available); // Filter out out-of-stock products
      
    } else {
      console.error('No products found in GraphQL response:', responseJson);
    }
  } catch (error) {
    console.error('Error fetching products from Shopify:', error);
    // Handle gracefully - return empty array instead of throwing
    // This allows the page to load even if product fetching fails
  }

  
  return json({ cartDrawer, productRecommendation, shopProducts });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);
  const editingVersion = url.searchParams.get("version") || "default";

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "toggle") {
    const enabled = formData.get("enabled") === "true";

    // Check if data exists before enabling
    if (enabled) {
      const cartDrawer = await prisma.cartDrawer.findUnique({
        where: { shop_version: { shop, version: editingVersion } },
        include: {
          productRecommendations: { 
            where: { isActive: true },
            include: {
              products: {
                orderBy: { position: 'asc' }
              }
            }
          },
        },
      });

      if (!cartDrawer) {
        return json({ 
          success: false, 
          error: "Configuration required. Please save the configuration first before enabling." 
        }, { status: 400 });
      }

      const hasProducts = cartDrawer.productRecommendations.length > 0 && 
        cartDrawer.productRecommendations.some(rec => rec.products && rec.products.length > 0);

      if (!hasProducts) {
        return json({ 
          success: false, 
          error: "Configuration required. Please add at least one product before enabling." 
        }, { status: 400 });
      }
    }
    
    await prisma.cartDrawer.update({
      where: { shop_version: { shop, version: editingVersion } },
      data: { productRecommendationsEnabled: enabled },
    });

    // Return with revalidation headers to ensure instant update
    return json({ success: true }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      }
    });
  }


  if (intent === "save") {
    const cartDrawer = await prisma.cartDrawer.findUnique({
      where: { shop_version: { shop, version: editingVersion } },
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

    const selectedProducts = JSON.parse(formData.get("selectedProducts") as string || "[]");

    const existingRecommendation = cartDrawer.productRecommendations[0];

    let recommendation;
    if (existingRecommendation) {
      recommendation = await prisma.productRecommendation.update({
        where: { id: existingRecommendation.id },
        data,
      });
    } else {
      recommendation = await prisma.productRecommendation.create({
        data: {
          ...data,
          shop,
          cartDrawerId: cartDrawer.id,
          isActive: true,
        },
      });
    }

    // Clear existing recommended products
    await prisma.recommendedProduct.deleteMany({
      where: { recommendationId: recommendation.id }
    });

    // Add new recommended products
    if (selectedProducts.length > 0) {
      for (let i = 0; i < selectedProducts.length; i++) {
        const productId = selectedProducts[i];
        try {
          // Use GraphQL to fetch product details by handle
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
                      availableForSale
                      inventoryQuantity
                    }
                  }
                }
              }
            }
          `, {
            variables: { 
              handle: productId 
            }
          });

          const responseJson = await response.json() as any;
          
          // Check for GraphQL errors
          if (responseJson.errors) {
            console.error(`GraphQL errors for product ${productId}:`, responseJson.errors);
            continue; // Skip this product and continue with the next one
          }
          
          if (responseJson.data && responseJson.data.productByHandle) {
            const product = responseJson.data.productByHandle;
            const image = product.images.edges[0]?.node;
            const variant = product.variants.edges[0]?.node;
            
            // Check if product is available before saving
            const isAvailable = variant ? (
              variant.availableForSale && 
              (variant.inventoryQuantity === null || 
               variant.inventoryQuantity > 0)
            ) : false;
            
            // Only save if product is available
            if (variant && isAvailable) {
              const variantId = variant.id.replace('gid://shopify/ProductVariant/', '');
              
              // Shopify GraphQL returns prices in cents, convert to rupees for storage
              const priceInRupees = parseFloat(variant.price);
              const compareAtPriceInRupees = variant.compareAtPrice ? parseFloat(variant.compareAtPrice): null;
              
              await prisma.recommendedProduct.create({
                data: {
                  recommendationId: recommendation.id,
                  shopifyProductId: productId, // Store product handle (which is the frontend ID)
                  shopifyVariantId: variantId, // Store the variant ID for add to cart functionality
                  title: product.title,
                  price: priceInRupees,
                  compareAtPrice: compareAtPriceInRupees,
                  imageUrl: image?.url || null,
                  position: i,
                },
              });
            } else {
              console.warn(`Product ${product.title} is out of stock and will not be added to recommendations`);
            }
          }
        } catch (error) {
          console.error(`Error fetching product ${productId}:`, error);
        }
      }
    }

    // Redirect with cache-busting to ensure fresh data
    // Auto-enable the feature after saving configuration (only if products were added)
    if (selectedProducts.length > 0) {
      await prisma.cartDrawer.update({
        where: { shop_version: { shop, version: editingVersion } },
        data: { productRecommendationsEnabled: true },
      });
    }

    return redirect("/app/cart-drawer", {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      }
    });
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function ProductRecommendations() {
  const { cartDrawer, productRecommendation, shopProducts, editingVersion } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const actionData = useActionData<typeof action>();
  const isLoading = navigation.state === "submitting";
  
  // Check which action is being submitted
  const formData = navigation.formData;
  const submittingIntent = formData?.get("intent") as string | null;

  // Track previous submission state to detect when save completes
  const prevIsSubmitting = useRef(false);
  const prevSubmittingIntent = useRef<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Show toast notification when settings are saved successfully
  useEffect(() => {
    // Check if we just finished submitting a save action
    const justFinishedSave = 
      prevIsSubmitting.current && 
      prevSubmittingIntent.current === "save" &&
      !isLoading;

    if (justFinishedSave) {
      setShowToast(true);
      // Auto-hide after 2 seconds (shorter since redirect will happen)
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Update refs for next render
    prevIsSubmitting.current = isLoading;
    prevSubmittingIntent.current = submittingIntent;
  }, [submittingIntent, isLoading]);

  const [formState, setFormState] = useState({
    title: productRecommendation?.title || "You may also like",
    maxProducts: productRecommendation?.maxProducts?.toString() || "4",
    layout: productRecommendation?.layout || "grid",
    recommendationType: productRecommendation?.recommendationType || "manual",
    showDiscount: productRecommendation?.showDiscount ?? true,
    showDiscountBadge: productRecommendation?.showDiscountBadge ?? true,
    showAddButton: productRecommendation?.showAddButton ?? true,
  });

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync formState when loader data changes
  useEffect(() => {
    if (productRecommendation) {
      setFormState({
        title: productRecommendation.title || "You may also like",
        maxProducts: productRecommendation.maxProducts?.toString() || "4",
        layout: productRecommendation.layout || "grid",
        recommendationType: productRecommendation.recommendationType || "manual",
        showDiscount: productRecommendation.showDiscount ?? true,
        showDiscountBadge: productRecommendation.showDiscountBadge ?? true,
        showAddButton: productRecommendation.showAddButton ?? true,
      });
    }
  }, [productRecommendation]);

  // Initialize selected products when data is loaded - use shopifyProductId (handle) for matching
  useEffect(() => {
    if (productRecommendation?.products && shopProducts.length > 0) {
      const savedProducts = productRecommendation.products.map(p => {
        // Match by shopifyProductId (which is the handle) instead of title
        // shopifyProductId in RecommendedProduct is the product handle
        const matchingProduct = shopProducts.find(sp => 
          sp.handle === p.shopifyProductId || sp.id === p.shopifyProductId
        );
        return matchingProduct?.id || matchingProduct?.handle || '';
      }).filter(id => id !== '');
      
      setSelectedProducts(savedProducts);
    } else if (!productRecommendation?.products || productRecommendation.products.length === 0) {
      // Clear selection if no products are saved
      setSelectedProducts([]);
    }
  }, [productRecommendation?.products, shopProducts]);

  const handleToggle = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "toggle");
    formData.append("enabled", (!cartDrawer?.productRecommendationsEnabled).toString());
    submit(formData, { 
      method: "post",
      // Revalidate after submission to update UI instantly
    });
    // Revalidate immediately after toggle to ensure UI updates
    setTimeout(() => {
      revalidator.revalidate();
    }, 100);
  }, [cartDrawer?.productRecommendationsEnabled, submit, revalidator]);

  const handleProductToggle = useCallback((productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        // Allow unlimited selection - no maxProducts limit
        return [...prev, productId];
      }
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "save");
    Object.entries(formState).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    formData.append("selectedProducts", JSON.stringify(selectedProducts));
    submit(formData, { method: "post", action: `/app/cart-drawer/product-recommendations?version=${editingVersion}` });
  }, [formState, selectedProducts, submit]);

  // Filter products based on search query
  const filteredProducts = shopProducts.filter((product: any) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <Page
      backAction={{ url: `/app/cart-drawer?version=${editingVersion}` }}
      title="Product Recommendations"
      primaryAction={{
        content: "Save",
        onAction: handleSubmit,
        loading: isLoading,
      }}
    >
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
                <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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
                      { label: "Complementary Products", value: "complementary" },
                    ]}
                    value={formState.recommendationType}
                    onChange={(value) => setFormState({ ...formState, recommendationType: value })}
                    helpText="How to select products to recommend. Related and Complementary use Shopify's recommendation engine."
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

                {/* Product Selection Section */}
                {formState.recommendationType === "manual" && (
                  <Card>
                    <BlockStack gap="400">
                      <Text as="h3" variant="headingMd">
                        Select Products to Recommend
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Choose which products to show as recommendations. You can select up to {formState.maxProducts} products.
                      </Text>
                      
                      <TextField
                        label="Search Products"
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search for products..."
                        autoComplete="off"
                      />
                      
                      {/* Product count info */}
                      <div style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#f0f9ff', 
                        border: '1px solid #bae6fd', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#0c4a6e'
                      }}>
                        {shopProducts.length} products from your store
                        {searchQuery && ` • ${filteredProducts.length} matching "${searchQuery}"`}
                        {selectedProducts.length > 0 && ` • ${selectedProducts.length} selected`}
                      </div>

                      <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                        {filteredProducts.length > 0 ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                            {filteredProducts.map((product: any) => {
                              const isSelected = selectedProducts.includes(product.id);
                              const variant = product.variants?.[0];
                              const price = variant ? parseFloat(variant.price) : 0;
                              const comparePrice = variant?.compare_at_price ? parseFloat(variant.compare_at_price) : null;
                              const discountPercent = comparePrice && comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;
                              
                              return (
                                <div 
                                  key={product.id} 
                                  style={{ 
                                    border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onClick={() => handleProductToggle(product.id)}
                                >
                                  <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ flexShrink: 0 }}>
                                      {product.images?.[0]?.src ? (
                                        <img 
                                          src={product.images[0].src} 
                                          alt={product.title}
                                          style={{ 
                                            width: '80px', 
                                            height: '80px', 
                                            objectFit: 'cover',
                                            borderRadius: '6px',
                                            border: '1px solid #e5e7eb'
                                          }}
                                        />
                                      ) : (
                                        <div style={{ 
                                          width: '80px', 
                                          height: '80px', 
                                          backgroundColor: '#f3f4f6',
                                          borderRadius: '6px',
                                          border: '1px solid #e5e7eb',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '32px'
                                        }}>
                                          📦
                                        </div>
                                      )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <h4 style={{ 
                                          fontSize: '14px', 
                                          fontWeight: '600', 
                                          margin: 0, 
                                          color: '#111827',
                                          lineHeight: '1.4'
                                        }}>
                                          {product.title}
                                        </h4>
                                        <Checkbox
                                          label=""
                                          checked={isSelected}
                                          onChange={() => handleProductToggle(product.id)}
                                        />
                                      </div>
                                      
                                      <div style={{ marginBottom: '8px' }}>
                                        {comparePrice && comparePrice > price ? (
                                          <div>
                                            <span style={{ 
                                              textDecoration: 'line-through', 
                                              color: '#9ca3af',
                                              fontSize: '12px',
                                              marginRight: '6px'
                                            }}>
                                              ₹{Math.round(comparePrice)}
                                            </span>
                                            <span style={{ 
                                              fontWeight: '600', 
                                              fontSize: '14px',
                                              color: '#111827'
                                            }}>
                                              ₹{Math.round(price)}
                                            </span>
                                          </div>
                                        ) : (
                                          <span style={{ 
                                            fontWeight: '600', 
                                            fontSize: '14px',
                                            color: '#111827'
                                          }}>
                                            ₹{Math.round(price)}
                                          </span>
                                        )}
                                      </div>
                                      
                                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <Badge tone={product.status === 'active' ? 'success' : 'warning'}>
                                          {product.status}
                                        </Badge>
                                        {discountPercent > 0 && (
                                          <Badge tone="info">
                                            {`${discountPercent}% off`}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                            <div style={{ 
                              width: '80px', 
                              height: '80px', 
                              backgroundColor: '#f3f4f6',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 16px',
                              fontSize: '32px'
                            }}>
                              📦
                            </div>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px', color: '#111827' }}>
                              No products found
                            </h3>
                            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                              Try adjusting your search terms or check if you have products in your store.
                            </p>
                          </div>
                        )}
                      </div>

                      {selectedProducts.length > 0 && (
                        <div>
                      <div style={{ marginBottom: '12px' }}>
                        <Text as="p" variant="bodyMd" fontWeight="semibold">
                          Selected Products ({selectedProducts.length}/{formState.maxProducts})
                        </Text>
                      </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                            {selectedProducts.map((productId, index) => {
                              const product = shopProducts.find((p: any) => p.id === productId);
                              if (!product) return null;
                              
                              const variant = product.variants?.[0];
                              const price = variant ? parseFloat(variant.price) : 0;
                              const comparePrice = variant?.compare_at_price ? parseFloat(variant.compare_at_price) : null;
                              const discountPercent = comparePrice && comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;
                              
                              return (
                                <div key={productId} style={{ 
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  padding: '12px',
                                  backgroundColor: '#f8fafc',
                                  position: 'relative'
                                }}>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <div style={{ flexShrink: 0 }}>
                                      {product.images?.[0]?.src ? (
                                        <img 
                                          src={product.images[0].src} 
                                          alt={product.title}
                                          style={{ 
                                            width: '60px', 
                                            height: '60px', 
                                            objectFit: 'cover',
                                            borderRadius: '4px',
                                            border: '1px solid #e5e7eb'
                                          }}
                                        />
                                      ) : (
                                        <div style={{ 
                                          width: '60px', 
                                          height: '60px', 
                                          backgroundColor: '#f3f4f6',
                                          borderRadius: '4px',
                                          border: '1px solid #e5e7eb',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '24px'
                                        }}>
                                          📦
                                        </div>
                                      )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <h5 style={{ 
                                        fontSize: '12px', 
                                        fontWeight: '600', 
                                        margin: '0 0 4px', 
                                        color: '#111827',
                                        lineHeight: '1.3'
                                      }}>
                                        {product.title.length > 20 ? product.title.substring(0, 20) + '...' : product.title}
                                      </h5>
                                      
                                      <div style={{ marginBottom: '4px' }}>
                                        {comparePrice && comparePrice > price ? (
                                          <div>
                                            <span style={{ 
                                              textDecoration: 'line-through', 
                                              color: '#9ca3af',
                                              fontSize: '10px',
                                              marginRight: '4px'
                                            }}>
                                              ₹{Math.round(comparePrice)}
                                            </span>
                                            <span style={{ 
                                              fontWeight: '600', 
                                              fontSize: '12px',
                                              color: '#111827'
                                            }}>
                                              ₹{Math.round(price)}
                                            </span>
                                          </div>
                                        ) : (
                                          <span style={{ 
                                            fontWeight: '600', 
                                            fontSize: '12px',
                                            color: '#111827'
                                          }}>
                                            ₹{Math.round(price)}
                                          </span>
                                        )}
                                      </div>
                                      
                                      {discountPercent > 0 && (
                                        <Badge tone="info" size="small">
                                          {`${discountPercent}% off`}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div style={{ 
                                    position: 'absolute', 
                                    top: '8px', 
                                    right: '8px',
                                    display: 'flex',
                                    gap: '4px'
                                  }}>
                             <span style={{
                               fontSize: '10px',
                               color: '#6b7280',
                               backgroundColor: '#f3f4f6',
                               padding: '2px 6px',
                               borderRadius: '4px',
                               fontWeight: '600'
                             }}>
                               #{String(index + 1)}
                             </span>
                                    <button
                                      onClick={() => handleProductToggle(productId)}
                                      style={{
                                        width: '20px',
                                        height: '20px',
                                        border: 'none',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </BlockStack>
                  </Card>
                )}

                {/* Info message for Shopify recommendation types */}
                {(formState.recommendationType === "related" || formState.recommendationType === "complementary") && (
                  <Card>
                    <BlockStack gap="400">
                      <Banner tone="info">
                        <Text as="p" variant="bodyMd">
                          {formState.recommendationType === "related" 
                            ? "Related Products" 
                            : "Complementary Products"} will be automatically fetched from Shopify's recommendation engine based on the products in the customer's cart. No manual product selection is needed.
                        </Text>
                      </Banner>
                    </BlockStack>
                  </Card>
                )}
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
              
              {/* Preview using shared component */}
              {(() => {
                // Prepare products for the shared component
                const previewProducts = selectedProducts.length > 0
                  ? selectedProducts.slice(0, parseInt(formState.maxProducts)).map((productId) => {
                      const product = shopProducts.find((p: any) => p.id === productId);
                      if (!product) return null;
                      
                      const variant = product.variants?.[0];
                      const price = variant ? parseFloat(variant.price) : 0;
                      const comparePrice = variant?.compare_at_price ? parseFloat(variant.compare_at_price) : null;
                      
                      return {
                        id: product.id,
                        title: product.title,
                        price: price ? parseFloat(price.toString()) : 0,
                        compareAtPrice: comparePrice ? parseFloat(comparePrice.toString()) : null,
                        imageUrl: product.images?.[0]?.src || null,
                        variantId: product.shopifyProductId || product.id,
                      };
                    }).filter(Boolean)
                  : [
                      { id: 'sample1', title: 'Sample Product 1', price: 99900, compareAtPrice: 149900, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=60&h=60&fit=crop&crop=center', variantId: 'sample1' },
                      { id: 'sample2', title: 'Sample Product 2', price: 129900, compareAtPrice: null, imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=60&h=60&fit=crop&crop=center', variantId: 'sample2' },
                      { id: 'sample3', title: 'Sample Product 3', price: 159900, compareAtPrice: 199900, imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=60&h=60&fit=crop&crop=center', variantId: 'sample3' },
                      { id: 'sample4', title: 'Sample Product 4', price: 89900, compareAtPrice: null, imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=60&h=60&fit=crop&crop=center', variantId: 'sample4' }
                    ];

                return (
                  <ProductRecommendationsComponent
                    title={formState.title}
                    products={previewProducts as any}
                    layout={formState.layout as 'grid' | 'carousel'}
                    maxProducts={parseInt(formState.maxProducts)}
                    showDiscount={formState.showDiscount}
                    showDiscountBadge={formState.showDiscountBadge}
                    showAddButton={formState.showAddButton}
                    onAddToCart={() => {}}
                    isPreview={true}
                  />
                );
              })()}

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

