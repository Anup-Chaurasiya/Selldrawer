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
  Checkbox,
  InlineStack,
  Banner,
  Select,
  RangeSlider,
  Thumbnail,
  ButtonGroup,
  Modal,
  DropZone,
  List,
  Icon,
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
      promotionalBanners: { 
        where: { isActive: true },
        include: {
          images: { orderBy: { order: 'asc' } },
          carouselSettings: true,
        }
      },
    },
  });

  const promotionalBanner = cartDrawer?.promotionalBanners[0] || null;

  return json({ cartDrawer, promotionalBanner });
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
      data: { promotionalBannerEnabled: enabled },
    });

    return json({ success: true });
  }

  if (intent === "save") {
    const cartDrawer = await prisma.cartDrawer.findUnique({
      where: { shop },
      include: { 
        promotionalBanners: { 
          where: { isActive: true },
          include: { images: true, carouselSettings: true }
        } 
      },
    });

    if (!cartDrawer) {
      return json({ error: "Cart drawer not found" }, { status: 404 });
    }

    // Safely parse imageUrls JSON
    let imageUrls: string[] = [];
    try {
      const imageUrlsString = formData.get("imageUrls") as string;
      if (imageUrlsString && imageUrlsString !== "[]" && imageUrlsString !== "") {
        const parsed = JSON.parse(imageUrlsString);
        if (Array.isArray(parsed)) {
          imageUrls = parsed;
        }
      }
    } catch (error) {
      console.error("Error parsing imageUrls:", error);
      imageUrls = [];
    }

    const data = {
      title: formData.get("title") as string,
      subtitle: formData.get("subtitle") as string || null,
      bannerType: formData.get("bannerType") as string || "image",
      imageUrls: imageUrls,
      ctaEnabled: formData.get("ctaEnabled") === "true",
      ctaType: formData.get("ctaType") as string || null,
      ctaButtonText: formData.get("ctaButtonText") as string || null,
      ctaUrl: formData.get("ctaUrl") as string || null,
      ctaProductHandle: formData.get("ctaProductHandle") as string || null,
      ctaVariantId: formData.get("ctaVariantId") as string || null,
      ctaQuantity: formData.get("ctaQuantity") ? parseInt(formData.get("ctaQuantity") as string) : 1,
    };

    const existingBanner = cartDrawer.promotionalBanners[0];

    if (existingBanner) {
      await prisma.promotionalBanner.update({
        where: { id: existingBanner.id },
        data,
      });
    } else {
      await prisma.promotionalBanner.create({
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

  if (intent === "upload-image") {
    const bannerId = formData.get("bannerId") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const altText = formData.get("altText") as string || "";
    const order = parseInt(formData.get("order") as string) || 0;

    await prisma.promotionalBannerImage.create({
      data: {
        bannerId,
        imageUrl,
        altText,
        order,
      },
    });

    return json({ success: true });
  }

  if (intent === "delete-image") {
    const imageId = formData.get("imageId") as string;
    
    await prisma.promotionalBannerImage.delete({
      where: { id: imageId },
    });

    return json({ success: true });
  }

  if (intent === "save-carousel-settings") {
    const bannerId = formData.get("bannerId") as string;
    const autoRotate = formData.get("autoRotate") === "true";
    const rotationSpeed = parseInt(formData.get("rotationSpeed") as string) || 5000;
    const showDots = formData.get("showDots") === "true";
    const showArrows = formData.get("showArrows") === "true";

    await prisma.promotionalBannerCarouselSettings.upsert({
      where: { bannerId },
      create: {
        bannerId,
        autoRotate,
        rotationSpeed,
        showDots,
        showArrows,
      },
      update: {
        autoRotate,
        rotationSpeed,
        showDots,
        showArrows,
      },
    });

    return json({ success: true });
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

export default function PromotionalBanner() {
  const { cartDrawer, promotionalBanner } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const [formState, setFormState] = useState({
    title: promotionalBanner?.title || "Summer Collection Sale",
    subtitle: promotionalBanner?.subtitle || "Buy 2 Get 10% OFF | Buy 3 Get 15% OFF",
    bannerType: promotionalBanner?.bannerType || "image",
    imageUrls: promotionalBanner?.imageUrls || [],
    ctaEnabled: promotionalBanner?.ctaEnabled || false,
    ctaType: promotionalBanner?.ctaType || "redirect",
    ctaButtonText: promotionalBanner?.ctaButtonText || "Shop Now",
    ctaUrl: promotionalBanner?.ctaUrl || "",
    ctaProductHandle: promotionalBanner?.ctaProductHandle || "",
    ctaVariantId: promotionalBanner?.ctaVariantId || "",
    ctaQuantity: promotionalBanner?.ctaQuantity || 1,
  });

  const [newImageUrl, setNewImageUrl] = useState("");

  const handleToggle = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "toggle");
    formData.append("enabled", (!cartDrawer?.promotionalBannerEnabled).toString());
    submit(formData, { method: "post" });
  }, [cartDrawer?.promotionalBannerEnabled, submit]);

  const handleSubmit = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "save");
    
    // Handle each field individually to ensure proper formatting
    formData.append("title", formState.title);
    formData.append("subtitle", formState.subtitle || "");
    formData.append("bannerType", formState.bannerType);
    formData.append("imageUrls", JSON.stringify(formState.imageUrls));
    formData.append("ctaEnabled", formState.ctaEnabled.toString());
    formData.append("ctaType", formState.ctaType || "");
    formData.append("ctaButtonText", formState.ctaButtonText || "");
    formData.append("ctaUrl", formState.ctaUrl || "");
    formData.append("ctaProductHandle", formState.ctaProductHandle || "");
    formData.append("ctaVariantId", formState.ctaVariantId || "");
    formData.append("ctaQuantity", formState.ctaQuantity.toString());
    
    submit(formData, { method: "post" });
  }, [formState, submit]);

  // Removed old image handling methods - now using enhanced system

  // Removed old image and carousel handling methods - now using enhanced system

  return (
    <Page
      backAction={{ url: "/app/cart-drawer" }}
      title="Promotional Banner"
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
                    {cartDrawer?.promotionalBannerEnabled ? "Disable" : "Enable"}
                  </Button>
                </InlineStack>
                
                {!cartDrawer?.promotionalBannerEnabled && (
                  <Banner tone="warning">
                    This feature is currently disabled. Enable it to show promotional banners in your cart.
                  </Banner>
                )}

                <FormLayout>
                  {/* Banner Type Selection */}
                  <Select
                    label="Banner Type"
                    options={[
                      { label: "Single Image", value: "image" },
                      { label: "Image Carousel", value: "carousel" },
                    ]}
                    value={formState.bannerType}
                    onChange={(value) => setFormState({ ...formState, bannerType: value })}
                    helpText="Choose between single image or rotating carousel"
                  />

                  {/* Banner Content */}
                  <TextField
                    label="Banner Title"
                    value={formState.title}
                    onChange={(value) => setFormState({ ...formState, title: value })}
                    helpText="Main promotional message"
                    autoComplete="off"
                  />

                  <TextField
                    label="Banner Subtitle (Optional)"
                    value={formState.subtitle}
                    onChange={(value) => setFormState({ ...formState, subtitle: value })}
                    helpText="Additional details or offer information"
                    autoComplete="off"
                  />

                  {/* Image Management */}
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">
                      Images
                    </Text>
                    
                    <InlineStack gap="200">
            <TextField
              label="Add Image URL"
              value={newImageUrl}
              onChange={setNewImageUrl}
              placeholder="https://example.com/image.jpg"
              helpText="Enter image URL to add to banner"
              autoComplete="off"
            />
                      <Button 
                        onClick={() => {
                          if (newImageUrl) {
                            setFormState({
                              ...formState,
                              imageUrls: [...formState.imageUrls, newImageUrl]
                            });
                            setNewImageUrl("");
                          }
                        }}
                        disabled={!newImageUrl}
                      >
                        Add Image
                      </Button>
                    </InlineStack>

                    {formState.imageUrls.length > 0 ? (
                      <BlockStack gap="200">
                        {formState.imageUrls.map((url, index) => (
                          <InlineStack key={index} gap="200" align="space-between">
                            <InlineStack gap="200">
                              <Thumbnail
                                source={url}
                                alt={`Banner image ${index + 1}`}
                                size="small"
                              />
                              <Text as="p" variant="bodyMd">
                                Image {index + 1}
                              </Text>
                            </InlineStack>
                            <Button
                              variant="tertiary"
                              tone="critical"
                              onClick={() => {
                                const newUrls = formState.imageUrls.filter((_, i) => i !== index);
                                setFormState({ ...formState, imageUrls: newUrls });
                              }}
                            >
                              Remove
                            </Button>
                          </InlineStack>
                        ))}
                      </BlockStack>
                    ) : (
                      <Text as="p" variant="bodyMd" tone="subdued">
                        No images added yet. Add image URLs to display in your banner.
                      </Text>
                    )}
                  </BlockStack>

                  {/* Call-to-Action Configuration */}
                  <BlockStack gap="400">
                    <Text as="h3" variant="headingMd">
                      Call-to-Action (CTA)
                    </Text>
                    
                    <Checkbox
                      label="Enable Call-to-Action"
                      checked={formState.ctaEnabled}
                      onChange={(checked) => setFormState({ ...formState, ctaEnabled: checked })}
                      helpText="Add clickable functionality to your banner"
                    />

                    {formState.ctaEnabled && (
                      <BlockStack gap="300">
                        <Select
                          label="CTA Type"
                          options={[
                            { label: "Redirect to URL", value: "redirect" },
                            { label: "Add Product to Cart", value: "add_to_cart" },
                          ]}
                          value={formState.ctaType}
                          onChange={(value) => setFormState({ ...formState, ctaType: value })}
                        />

                <TextField
                  label="Button Text"
                  value={formState.ctaButtonText}
                  onChange={(value) => setFormState({ ...formState, ctaButtonText: value })}
                  placeholder="Shop Now, Add to Cart, etc."
                  helpText="Text displayed on the CTA button"
                  autoComplete="off"
                />

                        {formState.ctaType === "redirect" && (
                          <TextField
                            label="Redirect URL"
                            value={formState.ctaUrl}
                            onChange={(value) => setFormState({ ...formState, ctaUrl: value })}
                            placeholder="https://example.com/product"
                            helpText="URL to redirect to when clicked"
                            autoComplete="off"
                          />
                        )}

                        {formState.ctaType === "add_to_cart" && (
                          <BlockStack gap="200">
                            <TextField
                              label="Product Handle"
                              value={formState.ctaProductHandle}
                              onChange={(value) => setFormState({ ...formState, ctaProductHandle: value })}
                              placeholder="product-handle"
                              helpText="Product handle (URL-friendly name)"
                              autoComplete="off"
                            />
                            
                            <TextField
                              label="Variant ID (Optional)"
                              value={formState.ctaVariantId}
                              onChange={(value) => setFormState({ ...formState, ctaVariantId: value })}
                              placeholder="123456789"
                              helpText="Specific variant ID if needed"
                              autoComplete="off"
                            />
                            
                            <TextField
                              label="Quantity"
                              type="number"
                              value={formState.ctaQuantity.toString()}
                              onChange={(value) => setFormState({ ...formState, ctaQuantity: parseInt(value) || 1 })}
                              min="1"
                              helpText="Number of items to add to cart"
                              autoComplete="off"
                            />
                          </BlockStack>
                        )}
                      </BlockStack>
                    )}
                  </BlockStack>
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
              
              {formState.imageUrls.length > 0 ? (
                formState.bannerType === "image" ? (
                  <div style={{ 
                    borderRadius: '6px',
                    overflow: 'hidden',
                    textAlign: 'center',
                    cursor: formState.ctaEnabled ? 'pointer' : 'default',
                    position: 'relative'
                  }}>
                    <img 
                      src={formState.imageUrls[0]} 
                      alt="Banner image"
                      style={{ 
                        width: '100%', 
                        height: '150px', 
                        objectFit: 'cover' 
                      }}
                    />
                    <div style={{ 
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                      padding: '20px 16px 16px',
                      color: 'white'
                    }}>
                      <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '4px' }}>
                        {formState.title}
                      </div>
                      {formState.subtitle && (
                        <div style={{ fontSize: '14px', marginBottom: formState.ctaEnabled ? '12px' : '0' }}>
                          {formState.subtitle}
                        </div>
                      )}
                      {formState.ctaEnabled && (
                        <button style={{
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '14px',
                          marginTop: '8px'
                        }}>
                          {formState.ctaButtonText}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    borderRadius: '6px',
                    overflow: 'hidden',
                    textAlign: 'center',
                    position: 'relative',
                    cursor: formState.ctaEnabled ? 'pointer' : 'default'
                  }}>
                    <div style={{ 
                      display: 'flex',
                      transition: 'transform 0.5s ease',
                      width: `${formState.imageUrls.length * 100}%`
                    }}>
                      {formState.imageUrls.map((url, index) => (
                        <div key={index} style={{ 
                          width: `${100 / formState.imageUrls.length}%`,
                          flexShrink: 0
                        }}>
                          <img 
                            src={url} 
                            alt={`Banner image ${index + 1}`}
                            style={{ 
                              width: '100%', 
                              height: '150px', 
                              objectFit: 'cover' 
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <div style={{ 
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                      padding: '20px 16px 16px',
                      color: 'white'
                    }}>
                      <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '4px' }}>
                        {formState.title}
                      </div>
                      {formState.subtitle && (
                        <div style={{ fontSize: '14px', marginBottom: formState.ctaEnabled ? '12px' : '0' }}>
                          {formState.subtitle}
                        </div>
                      )}
                      {formState.ctaEnabled && (
                        <button style={{
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '14px',
                          marginTop: '8px'
                        }}>
                          {formState.ctaButtonText}
                        </button>
                      )}
                    </div>
                    {formState.imageUrls.length > 1 && (
                      <div style={{ 
                        position: 'absolute',
                        bottom: '80px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '4px'
                      }}>
                        {formState.imageUrls.map((_, index) => (
                          <div key={index} style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: index === 0 ? '#007bff' : 'rgba(255,255,255,0.5)'
                          }} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div style={{ 
                  padding: '40px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#f8f9fa',
                  textAlign: 'center',
                  border: '2px dashed #dee2e6'
                }}>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Add images to see preview
                  </Text>
                </div>
              )}

              <Text as="p" variant="bodyMd" tone="subdued">
                This is how the banner will appear in your cart drawer.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Old modals removed - now using enhanced system */}
    </Page>
  );
}

