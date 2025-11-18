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
  RangeSlider,
  Thumbnail,
  Icon,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useState, useCallback, useEffect, useRef } from "react";
import { PromotionalBannerCard } from "../components/shared/PromotionalBannerCard";
import { PlayIcon } from "@shopify/polaris-icons";

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

    // Check if data exists before enabling
    if (enabled) {
      const cartDrawer = await prisma.cartDrawer.findUnique({
        where: { shop },
        include: {
          promotionalBanners: { 
            where: { isActive: true },
            include: {
              images: { orderBy: { order: 'asc' } },
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

      const hasBannerData = cartDrawer.promotionalBanners.length > 0 && 
        cartDrawer.promotionalBanners.some(banner => 
          (banner.images && banner.images.length > 0) || 
          (banner.imageUrls && banner.imageUrls.length > 0) || 
          banner.title
        );

      if (!hasBannerData) {
        return json({ 
          success: false, 
          error: "Configuration required. Please add at least one slide or configure the banner before enabling." 
        }, { status: 400 });
      }
    }
    
    await prisma.cartDrawer.update({
      where: { shop },
      data: { promotionalBannerEnabled: enabled },
    });

    return json({ success: true });
  }

  if (intent === "save-banner") {
    const cartDrawer = await prisma.cartDrawer.findUnique({
      where: { shop },
      include: { 
        promotionalBanners: { 
          where: { isActive: true },
        } 
      },
    });

    if (!cartDrawer) {
      return json({ error: "Cart drawer not found" }, { status: 404 });
    }

    const bannerType = formData.get("bannerType") as string || "carousel";
    
    const existingBanner = cartDrawer.promotionalBanners[0];

    if (existingBanner) {
      await prisma.promotionalBanner.update({
        where: { id: existingBanner.id },
        data: {
          bannerType,
          title: formData.get("title") as string || "Promotional Banner",
        },
      });
    } else {
      await prisma.promotionalBanner.create({
        data: {
          shop,
          cartDrawerId: cartDrawer.id,
          isActive: true,
          bannerType,
          title: formData.get("title") as string || "Promotional Banner",
        },
      });
    }

    // Auto-enable the feature after creating banner
    await prisma.cartDrawer.update({
      where: { shop },
      data: { promotionalBannerEnabled: true },
    });

    return json({ success: true });
  }

  if (intent === "add-slide") {
    const bannerId = formData.get("bannerId") as string;
    // Support new single-field mediaUrl; fallback to legacy fields if provided
    const mediaUrlRaw = (formData.get("mediaUrl") as string) || "";
    let imageUrl = (formData.get("imageUrl") as string) || "";
    let videoUrl = (formData.get("videoUrl") as string) || null;
    let videoType = (formData.get("videoType") as string) || null;
    const mediaUrl = (mediaUrlRaw || "").trim();
    if (mediaUrl) {
      const lower = mediaUrl.toLowerCase();
      const isYouTube = /youtube\.com|youtu\.be/.test(lower);
      const isVimeo = /vimeo\.com/.test(lower);
      const isMp4 = /\.mp4(\?|$)/.test(lower);
      if (isYouTube) {
        videoType = "youtube";
        videoUrl = mediaUrl;
        // no image detected from a single url; keep empty
        imageUrl = imageUrl || "";
      } else if (isVimeo) {
        videoType = "vimeo";
        videoUrl = mediaUrl;
        imageUrl = imageUrl || "";
      } else if (isMp4) {
        videoType = "mp4";
        videoUrl = mediaUrl;
        imageUrl = imageUrl || "";
      } else {
        // Assume it's an image
        imageUrl = mediaUrl;
        videoType = null;
        videoUrl = null;
      }
    }
    const title = formData.get("title") as string || null;
    const description = formData.get("description") as string || null;
    const ctaText = formData.get("ctaText") as string || null;
    const ctaUrl = formData.get("ctaUrl") as string || null;
    
    const maxOrder = await prisma.promotionalBannerImage.findFirst({
      where: { bannerId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    await prisma.promotionalBannerImage.create({
      data: {
        bannerId,
        imageUrl,
        videoUrl,
        videoType,
        title,
        description,
        ctaText,
        ctaUrl,
        order: (maxOrder?.order ?? -1) + 1,
      },
    });

    // Auto-enable the feature after adding a slide
    await prisma.cartDrawer.update({
      where: { shop },
      data: { promotionalBannerEnabled: true },
    });

    return json({ success: true });
  }

  if (intent === "update-slide") {
    const slideId = formData.get("slideId") as string;
    // Support new single-field mediaUrl; fallback to legacy fields if provided
    const mediaUrlRaw = (formData.get("mediaUrl") as string) || "";
    let imageUrl = (formData.get("imageUrl") as string) || "";
    let videoUrl = (formData.get("videoUrl") as string) || null;
    let videoType = (formData.get("videoType") as string) || null;
    const mediaUrl = (mediaUrlRaw || "").trim();
    if (mediaUrl) {
      const lower = mediaUrl.toLowerCase();
      const isYouTube = /youtube\.com|youtu\.be/.test(lower);
      const isVimeo = /vimeo\.com/.test(lower);
      const isMp4 = /\.mp4(\?|$)/.test(lower);
      if (isYouTube) {
        videoType = "youtube";
        videoUrl = mediaUrl;
        imageUrl = imageUrl || "";
      } else if (isVimeo) {
        videoType = "vimeo";
        videoUrl = mediaUrl;
        imageUrl = imageUrl || "";
      } else if (isMp4) {
        videoType = "mp4";
        videoUrl = mediaUrl;
        imageUrl = imageUrl || "";
      } else {
        imageUrl = mediaUrl;
        videoType = null;
        videoUrl = null;
      }
    }
    const title = formData.get("title") as string || null;
    const description = formData.get("description") as string || null;
    const ctaText = formData.get("ctaText") as string || null;
    const ctaUrl = formData.get("ctaUrl") as string || null;

    if (!slideId) {
      return json({ error: "Slide ID is required" }, { status: 400 });
    }

    try {
      // Check if the slide exists before updating
      const existingSlide = await prisma.promotionalBannerImage.findUnique({
        where: { id: slideId },
      });

      if (!existingSlide) {
        console.error(`Slide not found for update: ${slideId}`);
        return json({ error: "Slide not found" }, { status: 404 });
      }

      await prisma.promotionalBannerImage.update({
        where: { id: slideId },
        data: {
          imageUrl,
          videoUrl,
          videoType,
          title,
          description,
          ctaText,
          ctaUrl,
        },
      });

      return json({ success: true });
    } catch (error) {
      console.error("Error updating slide:", error);
      return json({ error: "Failed to update slide" }, { status: 500 });
    }
  }

  if (intent === "delete-slide") {
    const slideId = formData.get("slideId") as string;
    
    if (!slideId) {
      return json({ error: "Slide ID is required" }, { status: 400 });
    }

    try {
      // Check if the slide exists before deleting
      const existingSlide = await prisma.promotionalBannerImage.findUnique({
        where: { id: slideId },
      });

      if (!existingSlide) {
        console.error(`Slide not found for deletion: ${slideId}`);
        return json({ error: "Slide not found" }, { status: 404 });
      }

      await prisma.promotionalBannerImage.delete({
        where: { id: slideId },
      });

      return json({ success: true });
    } catch (error) {
      console.error("Error deleting slide:", error);
      return json({ error: "Failed to delete slide" }, { status: 500 });
    }
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

    return redirect("/app/cart-drawer");
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};

// Slide Management Component
interface SlideFormData {
  mediaUrl: string; // single field entered by user
  imageUrl?: string; // derived or legacy
  videoUrl?: string; // derived or legacy
  videoType?: string; // derived or legacy
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
}

function SlideEditor({ 
  slide, 
  onSave, 
  onCancel, 
  isLoading 
}: { 
  slide?: any; 
  onSave: (data: SlideFormData) => void; 
  onCancel: () => void; 
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<SlideFormData>({
    mediaUrl: slide?.videoUrl || slide?.imageUrl || "",
    imageUrl: slide?.imageUrl || "",
    videoUrl: slide?.videoUrl || "",
    videoType: slide?.videoType || "",
    title: slide?.title || "",
    description: slide?.description || "",
    ctaText: slide?.ctaText || "",
    ctaUrl: slide?.ctaUrl || "",
  });

  // Character limits
  const MAX_TITLE_LENGTH = 30;
  const MAX_DESCRIPTION_LENGTH = 30;
  const MAX_CTA_TEXT_LENGTH = 12;

  // Validation errors
  const titleError = formData.title.length > MAX_TITLE_LENGTH 
    ? `Title must be ${MAX_TITLE_LENGTH} characters or less` 
    : undefined;
  const descriptionError = formData.description.length > MAX_DESCRIPTION_LENGTH 
    ? `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less` 
    : undefined;
  const ctaTextError = formData.ctaText.length > MAX_CTA_TEXT_LENGTH 
    ? `CTA text must be ${MAX_CTA_TEXT_LENGTH} characters or less` 
    : undefined;

  const hasValidationErrors = !!(titleError || descriptionError || ctaTextError);

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          {slide ? `Edit Slide ${slide.order + 1}` : "Add New Slide"}
        </Text>
        
        <FormLayout>
          <TextField
            label="Media URL (Image or Video)"
            value={formData.mediaUrl}
            onChange={(value) => setFormData({ ...formData, mediaUrl: value })}
            placeholder="https://... (jpg, png, mp4, YouTube, Vimeo)"
            helpText="Paste an image URL or a video URL (MP4/YouTube/Vimeo). We'll detect it."
            autoComplete="off"
            requiredIndicator
          />

          <TextField
            label="Slide Title"
            value={formData.title}
            onChange={(value) => setFormData({ ...formData, title: value })}
            placeholder="Summer Sale"
            helpText={`${formData.title.length}/${MAX_TITLE_LENGTH} characters`}
            autoComplete="off"
            error={titleError}
            maxLength={MAX_TITLE_LENGTH}
          />

          <TextField
            label="Slide Description"
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            placeholder="Get 20% off all summer items"
            helpText={`${formData.description.length}/${MAX_DESCRIPTION_LENGTH} characters`}
            autoComplete="off"
            multiline={2}
            error={descriptionError}
            maxLength={MAX_DESCRIPTION_LENGTH}
          />

          <TextField
            label="CTA Button Text"
            value={formData.ctaText}
            onChange={(value) => setFormData({ ...formData, ctaText: value })}
            placeholder="Shop Now"
            helpText={`${formData.ctaText.length}/${MAX_CTA_TEXT_LENGTH} characters`}
            autoComplete="off"
            error={ctaTextError}
            maxLength={MAX_CTA_TEXT_LENGTH}
          />

          <TextField
            label="CTA Button URL"
            value={formData.ctaUrl}
            onChange={(value) => setFormData({ ...formData, ctaUrl: value })}
            placeholder="/collections/summer"
            helpText="Link when button is clicked"
            autoComplete="off"
          />
        </FormLayout>

        <InlineStack gap="200" align="end">
          <Button onClick={onCancel}>Cancel</Button>
          <Button 
            variant="primary" 
            onClick={() => onSave(formData)}
            loading={isLoading}
            disabled={!formData.mediaUrl || hasValidationErrors}
          >
            {slide ? "Update Slide" : "Add Slide"}
          </Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

// Carousel Preview Component - using the shared PromotionalBannerCard
function CarouselPreview({ slides, carouselSettings }: { 
  slides: any[]; 
  carouselSettings: any;
}) {
  if (!slides || slides.length === 0) {
    return (
      <div style={{ 
        padding: '60px 20px',
        borderRadius: '12px',
        backgroundColor: '#f8f9fa',
        textAlign: 'center',
        border: '2px dashed #dee2e6'
      }}>
        <Text as="p" variant="bodyMd" tone="subdued">
          Add slides to see carousel preview
        </Text>
      </div>
    );
  }
  
  return (
    <PromotionalBannerCard 
      slides={slides}
      carouselSettings={carouselSettings}
      onCtaClick={() => {}}
      isPreview={true}
    />
  );
}

export default function PromotionalBanner() {
  const { cartDrawer, promotionalBanner } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const [editingSlide, setEditingSlide] = useState<any>(null);
  const [isAddingSlide, setIsAddingSlide] = useState(false);
  const [carouselSettings, setCarouselSettings] = useState({
    autoRotate: promotionalBanner?.carouselSettings?.autoRotate ?? true,
    rotationSpeed: promotionalBanner?.carouselSettings?.rotationSpeed ?? 5000,
    showDots: promotionalBanner?.carouselSettings?.showDots ?? true,
    showArrows: promotionalBanner?.carouselSettings?.showArrows ?? true,
  });

  const slides = promotionalBanner?.images || [];

  const handleToggle = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "toggle");
    formData.append("enabled", (!cartDrawer?.promotionalBannerEnabled).toString());
    submit(formData, { method: "post" });
  }, [cartDrawer?.promotionalBannerEnabled, submit]);

  const handleAddSlide = useCallback((data: SlideFormData) => {
    if (!promotionalBanner?.id) {
      // Create banner first
      const bannerForm = new FormData();
      bannerForm.append("intent", "save-banner");
      bannerForm.append("bannerType", "carousel");
      bannerForm.append("title", "Promotional Carousel");
      submit(bannerForm, { method: "post" });
      return;
    }

    const formData = new FormData();
    formData.append("intent", "add-slide");
    formData.append("bannerId", promotionalBanner.id);
    if (data.mediaUrl) formData.append("mediaUrl", data.mediaUrl);
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("ctaText", data.ctaText);
    formData.append("ctaUrl", data.ctaUrl);
    submit(formData, { method: "post", replace: true });
    setIsAddingSlide(false);
  }, [promotionalBanner?.id, submit]);

  const handleUpdateSlide = useCallback((data: SlideFormData) => {
    if (!editingSlide) return;

    const formData = new FormData();
    formData.append("intent", "update-slide");
    formData.append("slideId", editingSlide.id);
    if (data.mediaUrl) formData.append("mediaUrl", data.mediaUrl);
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("ctaText", data.ctaText);
    formData.append("ctaUrl", data.ctaUrl);
    submit(formData, { method: "post", replace: true });
    setEditingSlide(null);
  }, [editingSlide, submit]);

  const handleDeleteSlide = useCallback((slideId: string) => {
    if (!confirm("Are you sure you want to delete this slide?")) return;

    const formData = new FormData();
    formData.append("intent", "delete-slide");
    formData.append("slideId", slideId);
    submit(formData, { method: "post", replace: true });
  }, [submit]);

  const handleSaveCarouselSettings = useCallback(() => {
    if (!promotionalBanner?.id) return;

    const formData = new FormData();
    formData.append("intent", "save-carousel-settings");
    formData.append("bannerId", promotionalBanner.id);
    formData.append("autoRotate", carouselSettings.autoRotate.toString());
    formData.append("rotationSpeed", carouselSettings.rotationSpeed.toString());
    formData.append("showDots", carouselSettings.showDots.toString());
    formData.append("showArrows", carouselSettings.showArrows.toString());
    submit(formData, { method: "post", replace: true });
  }, [promotionalBanner?.id, carouselSettings, submit]);

  const handleSaveAll = useCallback(() => {
    // Save carousel settings if banner exists
    if (promotionalBanner?.id) {
      handleSaveCarouselSettings();
    }
  }, [promotionalBanner?.id, handleSaveCarouselSettings]);

  return (
    <Page
      backAction={{ url: "/app/cart-drawer" }}
      title="Promotional Banner - Carousel Mode"
      primaryAction={{
        content: "Save",
        onAction: handleSaveAll,
        loading: isLoading,
      }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {/* Header Card */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">
                    Carousel Configuration
                  </Text>
                  <Button onClick={handleToggle} loading={isLoading}>
                    {cartDrawer?.promotionalBannerEnabled ? "Disable" : "Enable"}
                  </Button>
                </InlineStack>
                
                {!cartDrawer?.promotionalBannerEnabled && (
                  <Banner tone="warning">
                    This feature is currently disabled. Enable it to show the carousel in your cart.
                  </Banner>
                )}

                <Text as="p" variant="bodyMd" tone="subdued">
                  Create a stunning carousel with per-slide content, video support, and customizable controls.
                </Text>
              </BlockStack>
            </Card>

            {/* Slides Management */}
            {!isAddingSlide && !editingSlide && (
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <Text as="h2" variant="headingMd">
                      Slides ({slides.length})
                    </Text>
                    <Button variant="primary" onClick={() => setIsAddingSlide(true)}>
                      Add Slide
                    </Button>
                  </InlineStack>

                  {slides.length > 0 ? (
                    <BlockStack gap="300">
                      {slides.map((slide: any, index: number) => (
                        <Card key={slide.id}>
                          <InlineStack align="space-between" blockAlign="center">
                            <InlineStack gap="300" blockAlign="center">
                              {slide.videoUrl && !slide.imageUrl ? (
                                <div
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '8px',
                                    backgroundColor: '#FA003F',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}
                                >
                                  <Icon source={PlayIcon} tone="base" />
                                </div>
                              ) : (
                                <Thumbnail 
                                  source={slide.imageUrl || slide.videoUrl} 
                                  alt={`Slide ${index + 1}`} 
                                  size="small" 
                                />
                              )}
                              <BlockStack gap="100">
                                <Text as="p" variant="bodyMd" fontWeight="semibold">
                                  Slide {index + 1}
                                </Text>
                                {slide.title && (
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    {slide.title}
                                  </Text>
                                )}
                              </BlockStack>
                            </InlineStack>
                            <InlineStack gap="200">
                              <Button onClick={() => setEditingSlide(slide)}>Edit</Button>
                              <Button tone="critical" onClick={() => handleDeleteSlide(slide.id)}>
                                Delete
                              </Button>
                            </InlineStack>
                          </InlineStack>
                        </Card>
                      ))}
                    </BlockStack>
                  ) : (
                    <Banner tone="info">
                      No slides added yet. Click "Add Slide" to create your first slide.
                    </Banner>
                  )}
                </BlockStack>
              </Card>
            )}

            {/* Add/Edit Slide */}
            {(isAddingSlide || editingSlide) && (
              <SlideEditor
                slide={editingSlide}
                onSave={editingSlide ? handleUpdateSlide : handleAddSlide}
                onCancel={() => {
                  setIsAddingSlide(false);
                  setEditingSlide(null);
                }}
                isLoading={isLoading}
              />
            )}

            {/* Carousel Settings */}
            {!isAddingSlide && !editingSlide && promotionalBanner?.id && (
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Carousel Settings
                  </Text>

                  <FormLayout>
                    <Checkbox
                      label="Auto-rotate slides"
                      checked={carouselSettings.autoRotate}
                      onChange={(checked) => setCarouselSettings({ ...carouselSettings, autoRotate: checked })}
                      helpText="Automatically cycle through slides"
                    />

                    {carouselSettings.autoRotate && (
                      <RangeSlider
                        label="Rotation speed (seconds)"
                        value={carouselSettings.rotationSpeed / 1000}
                        onChange={(value: number) => setCarouselSettings({ ...carouselSettings, rotationSpeed: value * 1000 })}
                        min={2}
                        max={10}
                        step={1}
                        output
                      />
                    )}

                    <Checkbox
                      label="Show dot indicators"
                      checked={carouselSettings.showDots}
                      onChange={(checked) => setCarouselSettings({ ...carouselSettings, showDots: checked })}
                    />

                    <Checkbox
                      label="Show navigation arrows"
                      checked={carouselSettings.showArrows}
                      onChange={(checked) => setCarouselSettings({ ...carouselSettings, showArrows: checked })}
                    />
                  </FormLayout>
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Layout.Section>

        {/* Preview Section */}
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                Live Preview
              </Text>
              
              <CarouselPreview 
                slides={slides} 
                carouselSettings={carouselSettings}
              />

              <Text as="p" variant="bodySm" tone="subdued">
                Features: Fixed 200px media container, separate white text section below, title/description (left), CTA button (right), responsive mobile layout, auto-rotate, navigation arrows, and dot indicators.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

