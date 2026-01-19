import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
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
  const url = new URL(request.url);
  const editingVersion = url.searchParams.get("version") || "default";

  const cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop_version: { shop, version: editingVersion } },
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
      where: { shop_version: { shop, version: editingVersion } },
      data: { promotionalBannerEnabled: enabled },
    });

    return json({ success: true });
  }

  if (intent === "save-banner") {
    const cartDrawer = await prisma.cartDrawer.findUnique({
      where: { shop_version: { shop, version: editingVersion } },
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
      where: { shop_version: { shop, version: editingVersion } },
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

    // Validate character limits
    const MIN_TITLE_LENGTH = 10;
    const MAX_TITLE_LENGTH = 25;
    const MIN_DESCRIPTION_LENGTH = 15;
    const MAX_DESCRIPTION_LENGTH = 35;
    const MAX_CTA_TEXT_LENGTH = 12;

    if (title && (title.length < MIN_TITLE_LENGTH || title.length > MAX_TITLE_LENGTH)) {
      return json({
        error: `Title must be between ${MIN_TITLE_LENGTH}-${MAX_TITLE_LENGTH} characters`
      }, { status: 400 });
    }
    if (description && (description.length < MIN_DESCRIPTION_LENGTH || description.length > MAX_DESCRIPTION_LENGTH)) {
      return json({
        error: `Description must be between ${MIN_DESCRIPTION_LENGTH}-${MAX_DESCRIPTION_LENGTH} characters`
      }, { status: 400 });
    }
    if (ctaText && ctaText.length > MAX_CTA_TEXT_LENGTH) {
      return json({
        error: `CTA text must be ${MAX_CTA_TEXT_LENGTH} characters or less`
      }, { status: 400 });
    }

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
      where: { shop_version: { shop, version: editingVersion } },
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

    // Validate character limits
    const MIN_TITLE_LENGTH = 10;
    const MAX_TITLE_LENGTH = 23;
    const MIN_DESCRIPTION_LENGTH = 15;
    const MAX_DESCRIPTION_LENGTH = 35;
    const MAX_CTA_TEXT_LENGTH = 10;

    if (title && (title.length < MIN_TITLE_LENGTH || title.length > MAX_TITLE_LENGTH)) {
      return json({
        error: `Title must be between ${MIN_TITLE_LENGTH}-${MAX_TITLE_LENGTH} characters`
      }, { status: 400 });
    }
    if (description && (description.length < MIN_DESCRIPTION_LENGTH || description.length > MAX_DESCRIPTION_LENGTH)) {
      return json({
        error: `Description must be between ${MIN_DESCRIPTION_LENGTH}-${MAX_DESCRIPTION_LENGTH} characters`
      }, { status: 400 });
    }
    if (ctaText && ctaText.length > MAX_CTA_TEXT_LENGTH) {
      return json({
        error: `CTA text must be ${MAX_CTA_TEXT_LENGTH} characters or less`
      }, { status: 400 });
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

    return json({ success: true });
  }

  if (intent === "save-colors") {
    const bannerId = formData.get("bannerId") as string;
    const titleColor = formData.get("titleColor") as string;
    const descriptionColor = formData.get("descriptionColor") as string;
    const ctaTextColor = formData.get("ctaTextColor") as string;
    const ctaBackgroundColor = formData.get("ctaBackgroundColor") as string;
    const borderColor = formData.get("borderColor") as string;

    await (prisma.promotionalBanner.update as any)({
      where: { id: bannerId },
      data: {
        titleColor,
        descriptionColor,
        ctaTextColor,
        ctaBackgroundColor,
        borderColor,
      },
    });

    return json({ success: true });
  }

  if (intent === "save") {
    const bannerId = formData.get("bannerId") as string;

    if (!bannerId) {
      return json({ error: "Banner ID is required" }, { status: 400 });
    }

    // Save carousel settings
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

    // Save color settings
    const titleColor = formData.get("titleColor") as string;
    const descriptionColor = formData.get("descriptionColor") as string;
    const ctaTextColor = formData.get("ctaTextColor") as string;
    const ctaBackgroundColor = formData.get("ctaBackgroundColor") as string;
    const borderColor = formData.get("borderColor") as string;

    await (prisma.promotionalBanner.update as any)({
      where: { id: bannerId },
      data: {
        titleColor,
        descriptionColor,
        ctaTextColor,
        ctaBackgroundColor,
        borderColor,
      },
    });

    return redirect(`/app/cart-drawer?version=${editingVersion}`);
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
  const MIN_TITLE_LENGTH = 10;
  const MAX_TITLE_LENGTH = 25;
  const MIN_DESCRIPTION_LENGTH = 15;
  const MAX_DESCRIPTION_LENGTH = 35;
  const MAX_CTA_TEXT_LENGTH = 12;

  // Validation errors
  const titleError = formData.title.length > 0 && formData.title.length < MIN_TITLE_LENGTH
    ? `Title must be between ${MIN_TITLE_LENGTH}-${MAX_TITLE_LENGTH} characters`
    : formData.title.length > MAX_TITLE_LENGTH
      ? `Title must be between ${MIN_TITLE_LENGTH}-${MAX_TITLE_LENGTH} characters`
      : undefined;
  const descriptionError = formData.description.length > 0 && formData.description.length < MIN_DESCRIPTION_LENGTH
    ? `Description must be between ${MIN_DESCRIPTION_LENGTH}-${MAX_DESCRIPTION_LENGTH} characters`
    : formData.description.length > MAX_DESCRIPTION_LENGTH
      ? `Description must be between ${MIN_DESCRIPTION_LENGTH}-${MAX_DESCRIPTION_LENGTH} characters`
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
            helpText="Images: 360×200px or 720×400px. Videos: 1280×720 or 1920×1080, 5-10 sec, under 3MB. Use 16:9 ratio for best results."
            autoComplete="off"
            requiredIndicator
          />

          <TextField
            label="Slide Title"
            value={formData.title}
            onChange={(value) => setFormData({ ...formData, title: value })}
            placeholder="Summer Sale"
            helpText={`${formData.title.length}/${MAX_TITLE_LENGTH} characters (min ${MIN_TITLE_LENGTH})`}
            autoComplete="off"
            error={titleError}
            maxLength={MAX_TITLE_LENGTH}
          />

          <TextField
            label="Slide Description"
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            placeholder="Get 20% off all summer items"
            helpText={`${formData.description.length}/${MAX_DESCRIPTION_LENGTH} characters (min ${MIN_DESCRIPTION_LENGTH})`}
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
function CarouselPreview({
  slides,
  carouselSettings,
  titleColor,
  descriptionColor,
  ctaTextColor,
  ctaBackgroundColor,
  borderColor
}: {
  slides: any[];
  carouselSettings: any;
  titleColor?: string;
  descriptionColor?: string;
  ctaTextColor?: string;
  ctaBackgroundColor?: string;
  borderColor?: string;
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
      titleColor={titleColor}
      descriptionColor={descriptionColor}
      ctaTextColor={ctaTextColor}
      ctaBackgroundColor={ctaBackgroundColor}
      borderColor={borderColor}
      onCtaClick={() => { }}
      isPreview={true}
    />
  );
}

export default function PromotionalBanner() {
  const { cartDrawer, promotionalBanner } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
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

  const [editingSlide, setEditingSlide] = useState<any>(null);
  const [isAddingSlide, setIsAddingSlide] = useState(false);
  const [carouselSettings, setCarouselSettings] = useState({
    autoRotate: promotionalBanner?.carouselSettings?.autoRotate ?? true,
    rotationSpeed: promotionalBanner?.carouselSettings?.rotationSpeed ?? 5000,
    showDots: promotionalBanner?.carouselSettings?.showDots ?? true,
    showArrows: promotionalBanner?.carouselSettings?.showArrows ?? true,
  });

  const [colorSettings, setColorSettings] = useState({
    titleColor: (promotionalBanner as any)?.titleColor || "#111827",
    descriptionColor: (promotionalBanner as any)?.descriptionColor || "#6b7280",
    ctaTextColor: (promotionalBanner as any)?.ctaTextColor || "#374151",
    ctaBackgroundColor: (promotionalBanner as any)?.ctaBackgroundColor || "#f3f4f6",
    borderColor: (promotionalBanner as any)?.borderColor || "#e5e7eb",
  });

  const slides = promotionalBanner?.images || [];

  // Close slide editor after successful add/update
  useEffect(() => {
    const justFinishedSlideAction =
      prevIsSubmitting.current &&
      (prevSubmittingIntent.current === "add-slide" || prevSubmittingIntent.current === "update-slide") &&
      !isLoading &&
      actionData &&
      'success' in actionData &&
      actionData.success;

    if (justFinishedSlideAction) {
      setIsAddingSlide(false);
      setEditingSlide(null);
    }

    // Update refs for next render
    prevIsSubmitting.current = isLoading;
    prevSubmittingIntent.current = submittingIntent;
  }, [submittingIntent, isLoading, actionData]);

  const handleToggle = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "toggle");
    formData.append("enabled", (!cartDrawer?.promotionalBannerEnabled).toString());
    submit(formData, { method: "post", action: `/app/cart-drawer/promotional-banner?version=${editingVersion}` });
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
    // Don't close immediately - let useEffect handle it after success
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
    // Don't close immediately - let useEffect handle it after success
  }, [editingSlide, submit]);

  const handleDeleteSlide = useCallback((slideId: string) => {
    if (!confirm("Are you sure you want to delete this slide?")) return;

    const formData = new FormData();
    formData.append("intent", "delete-slide");
    formData.append("slideId", slideId);
    submit(formData, { method: "post", replace: true });
  }, [submit]);

  const handleSaveAll = useCallback(() => {
    // Save carousel settings and colors if banner exists
    if (!promotionalBanner?.id) return;

    const formData = new FormData();
    formData.append("intent", "save");
    formData.append("bannerId", promotionalBanner.id);
    formData.append("autoRotate", carouselSettings.autoRotate.toString());
    formData.append("rotationSpeed", carouselSettings.rotationSpeed.toString());
    formData.append("showDots", carouselSettings.showDots.toString());
    formData.append("showArrows", carouselSettings.showArrows.toString());
    formData.append("titleColor", colorSettings.titleColor);
    formData.append("descriptionColor", colorSettings.descriptionColor);
    formData.append("ctaTextColor", colorSettings.ctaTextColor);
    formData.append("ctaBackgroundColor", colorSettings.ctaBackgroundColor);
    formData.append("borderColor", colorSettings.borderColor);
    submit(formData, { method: "post", action: `/app/cart-drawer/promotional-banner?version=${editingVersion}` });
  }, [promotionalBanner?.id, carouselSettings, colorSettings, submit]);

  return (
    <Page
      backAction={{ url: `/app/cart-drawer?version=${editingVersion}` }}
      title="Promotional Banner - Carousel Mode"
      primaryAction={{
        content: "Save",
        onAction: handleSaveAll,
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

                {/* Image Size Recommendations */}
                <Banner tone="info">
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      📐 Recommended Sizes for Cart Drawer
                    </Text>
                    <Text as="p" variant="bodyMd">
                      For optimal display in the cart drawer, use these dimensions:
                    </Text>

                    {/* Image Sizes */}
                    <BlockStack gap="100">
                      <Text as="p" variant="bodySm" fontWeight="semibold">
                        Images:
                      </Text>
                      <Text as="p" variant="bodySm">
                        • <strong>Recommended</strong>: 360×200px (16:9 aspect ratio)
                      </Text>
                      <Text as="p" variant="bodySm">
                        • <strong>Retina displays</strong>: 720×400px or 540×300px (same 16:9 ratio)
                      </Text>
                      <Text as="p" variant="bodySm">
                        • <strong>Format</strong>: JPG or PNG, optimized for web
                      </Text>
                    </BlockStack>

                    {/* Video Recommendations */}
                    <BlockStack gap="100">
                      <Text as="p" variant="bodySm" fontWeight="semibold">
                        Videos (MP4, YouTube, Vimeo):
                      </Text>
                      <Text as="p" variant="bodySm">
                        • <strong>Standard</strong>: 640×360px (matches 360×200 container)
                      </Text>
                      <Text as="p" variant="bodySm">
                        • <strong>High quality</strong>: 1280×720 (HD) or 720×405px
                      </Text>
                      <Text as="p" variant="bodySm">
                        • <strong>Retina displays</strong>: 1920×1080 (Full HD)
                      </Text>
                      <Text as="p" variant="bodySm">
                        • <strong>Format</strong>: MP4 (H.264) for best compatibility
                      </Text>
                    </BlockStack>

                    <Text as="p" variant="bodySm" tone="subdued">
                      💡 Pro Tips: Videos auto-play muted in cart drawer. Keep videos short and engaging. Higher resolution images (720×400px) look sharper on retina displays.
                    </Text>
                  </BlockStack>
                </Banner>
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
              <>
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

                {/* Color Settings */}
                <Card>
                  <BlockStack gap="400">
                    <Text as="h2" variant="headingMd">
                      Color Settings
                    </Text>

                    <FormLayout>
                      <TextField
                        label="Slide Title Color"
                        {...({ type: "color" } as any)}
                        value={colorSettings.titleColor}
                        onChange={(value) => setColorSettings({ ...colorSettings, titleColor: value })}
                        autoComplete="off"
                      />

                      <TextField
                        label="Slide Description Color"
                        {...({ type: "color" } as any)}
                        value={colorSettings.descriptionColor}
                        onChange={(value) => setColorSettings({ ...colorSettings, descriptionColor: value })}
                        autoComplete="off"
                      />

                      <TextField
                        label="CTA Button Text Color"
                        {...({ type: "color" } as any)}
                        value={colorSettings.ctaTextColor}
                        onChange={(value) => setColorSettings({ ...colorSettings, ctaTextColor: value })}
                        autoComplete="off"
                      />

                      <TextField
                        label="CTA Button Background Color"
                        {...({ type: "color" } as any)}
                        value={colorSettings.ctaBackgroundColor}
                        onChange={(value) => setColorSettings({ ...colorSettings, ctaBackgroundColor: value })}
                        autoComplete="off"
                      />

                      <TextField
                        label="Border Color"
                        {...({ type: "color" } as any)}
                        value={colorSettings.borderColor}
                        onChange={(value) => setColorSettings({ ...colorSettings, borderColor: value })}
                        autoComplete="off"
                      />
                    </FormLayout>
                  </BlockStack>
                </Card>
              </>
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
                titleColor={colorSettings.titleColor}
                descriptionColor={colorSettings.descriptionColor}
                ctaTextColor={colorSettings.ctaTextColor}
                ctaBackgroundColor={colorSettings.ctaBackgroundColor}
                borderColor={colorSettings.borderColor}
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

