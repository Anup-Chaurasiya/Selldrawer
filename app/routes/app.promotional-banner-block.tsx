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
  Checkbox,
  InlineStack,
  Banner,
  RangeSlider,
  Thumbnail,
  Icon,
  Select,
  Tabs,
  Modal,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useState, useCallback, useEffect, useRef } from "react";
import { PromotionalBannerCard } from "../components/shared/PromotionalBannerCard";
import { PlayIcon, DeleteIcon, ImageIcon } from "@shopify/polaris-icons";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Fetch all promotional banner configurations for this shop
  const promotionalBannerBlocks = await prisma.promotionalBannerBlock.findMany({
    where: { shop },
    include: {
      images: { orderBy: { order: 'asc' } },
      carouselSettings: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return json({ promotionalBannerBlocks });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create-config") {
    const configId = formData.get("configId") as string;
    const name = formData.get("name") as string;

    if (!configId || !name) {
      return json({ error: "Configuration ID and name are required" }, { status: 400 });
    }

    // Validate configId format (alphanumeric, hyphens, underscores only)
    if (!/^[a-z0-9_-]+$/i.test(configId)) {
      return json({ error: "Configuration ID can only contain letters, numbers, hyphens, and underscores" }, { status: 400 });
    }

    // Check if config already exists
    const existing = await prisma.promotionalBannerBlock.findUnique({
      where: { shop_configId: { shop, configId } },
    });

    if (existing) {
      return json({ error: "A configuration with this ID already exists" }, { status: 400 });
    }

    await prisma.promotionalBannerBlock.create({
      data: {
        id: crypto.randomUUID(),
        shop,
        configId,
        name,
        isActive: true,
        title: name,
        updatedAt: new Date(),
      },
    });

    return json({ success: true, configId });
  }

  if (intent === "delete-config") {
    const configId = formData.get("configId") as string;

    if (!configId) {
      return json({ error: "Configuration ID is required" }, { status: 400 });
    }

    // Don't allow deleting if it's the only config
    const count = await prisma.promotionalBannerBlock.count({
      where: { shop },
    });

    if (count <= 1) {
      return json({ error: "Cannot delete the last configuration" }, { status: 400 });
    }

    await prisma.promotionalBannerBlock.delete({
      where: { shop_configId: { shop, configId } },
    });

    return json({ success: true });
  }

  if (intent === "toggle") {
    const enabled = formData.get("enabled") === "true";
    const configId = formData.get("configId") as string;

    if (!configId) {
      return json({ error: "Configuration ID is required" }, { status: 400 });
    }

    await prisma.promotionalBannerBlock.update({
      where: { shop_configId: { shop, configId } },
      data: { isActive: enabled },
    });

    return json({ success: true });
  }

  // All remaining intents need a configId
  const configId = formData.get("configId") as string;
  if (!configId) {
    return json({ error: "Configuration ID is required" }, { status: 400 });
  }

  if (intent === "add-slide") {
    const block = await prisma.promotionalBannerBlock.findUnique({
      where: { shop_configId: { shop, configId } },
    });

    if (!block) {
      return json({ error: "Configuration not found" }, { status: 404 });
    }

    const blockId = block.id;

    // Support new single-field mediaUrl
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

    const maxOrder = await prisma.promotionalBannerBlockImage.findFirst({
      where: { blockId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    await prisma.promotionalBannerBlockImage.create({
      data: {
        id: crypto.randomUUID(),
        blockId,
        imageUrl,
        videoUrl,
        videoType,
        title,
        description,
        ctaText,
        ctaUrl,
        order: (maxOrder?.order ?? -1) + 1,
        updatedAt: new Date(),
      },
    });

    return json({ success: true });
  }

  if (intent === "update-slide") {
    const slideId = formData.get("slideId") as string;
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
      const existingSlide = await prisma.promotionalBannerBlockImage.findUnique({
        where: { id: slideId },
      });

      if (!existingSlide) {
        return json({ error: "Slide not found" }, { status: 404 });
      }

      await prisma.promotionalBannerBlockImage.update({
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
      await prisma.promotionalBannerBlockImage.delete({
        where: { id: slideId },
      });

      return json({ success: true });
    } catch (error) {
      console.error("Error deleting slide:", error);
      return json({ error: "Failed to delete slide" }, { status: 500 });
    }
  }

  if (intent === "save-carousel-settings") {
    const block = await prisma.promotionalBannerBlock.findUnique({
      where: { shop_configId: { shop, configId } },
    });

    if (!block) {
      return json({ error: "Configuration not found" }, { status: 404 });
    }

    const blockId = block.id;
    const autoRotate = formData.get("autoRotate") === "true";
    const rotationSpeed = parseInt(formData.get("rotationSpeed") as string) || 5000;
    const showDots = formData.get("showDots") === "true";
    const showArrows = formData.get("showArrows") === "true";

    await prisma.promotionalBannerBlockCarouselSettings.upsert({
      where: { blockId },
      create: {
        blockId,
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

// Slide Management Component
interface SlideFormData {
  mediaUrl: string;
  imageUrl?: string;
  videoUrl?: string;
  videoType?: string;
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
    <BlockStack gap="400">
      <FormLayout>
        <TextField
          label="Media URL (Image or Video)"
          value={formData.mediaUrl}
          onChange={(value) => setFormData({ ...formData, mediaUrl: value })}
          placeholder="https://... (jpg, png, mp4, YouTube, Vimeo)"
          helpText="Images: 1920×400px (full-width) or 750×300px (mobile). Videos: 1920×1080 or 1280×720, 5-15 sec, under 5MB. Use 16:9 ratio."
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
  );
}

// Carousel Preview Component
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
      onCtaClick={() => { }}
      isPreview={true}
    />
  );
}

export default function PromotionalBannerBlockPage() {
  const { promotionalBannerBlocks } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();
  const isLoading = navigation.state === "submitting";

  // State for managing configs
  const [selectedConfigIndex, setSelectedConfigIndex] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newConfigId, setNewConfigId] = useState("");
  const [newConfigName, setNewConfigName] = useState("");

  // Get the current config
  const currentConfig = promotionalBannerBlocks[selectedConfigIndex];

  // Check which action is being submitted
  const formData = navigation.formData;
  const submittingIntent = formData?.get("intent") as string | null;

  // Track previous submission state
  const prevIsSubmitting = useRef(false);
  const prevSubmittingIntent = useRef<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Show toast notification when settings are saved successfully
  useEffect(() => {
    const justFinishedSave =
      prevIsSubmitting.current &&
      prevSubmittingIntent.current === "save-carousel-settings" &&
      !isLoading &&
      actionData &&
      'success' in actionData &&
      actionData.success;

    if (justFinishedSave) {
      setShowToast(true);
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }

    prevIsSubmitting.current = isLoading;
    prevSubmittingIntent.current = submittingIntent;
  }, [actionData, submittingIntent, isLoading]);

  const [editingSlide, setEditingSlide] = useState<any>(null);
  const [isAddingSlide, setIsAddingSlide] = useState(false);
  const [carouselSettings, setCarouselSettings] = useState({
    autoRotate: currentConfig?.carouselSettings?.autoRotate ?? true,
    rotationSpeed: currentConfig?.carouselSettings?.rotationSpeed ?? 5000,
    showDots: currentConfig?.carouselSettings?.showDots ?? true,
    showArrows: currentConfig?.carouselSettings?.showArrows ?? true,
  });

  // Update carousel settings when config changes
  useEffect(() => {
    if (currentConfig) {
      setCarouselSettings({
        autoRotate: currentConfig.carouselSettings?.autoRotate ?? true,
        rotationSpeed: currentConfig.carouselSettings?.rotationSpeed ?? 5000,
        showDots: currentConfig.carouselSettings?.showDots ?? true,
        showArrows: currentConfig.carouselSettings?.showArrows ?? true,
      });
    }
  }, [currentConfig]);

  // Auto-select newly created configuration
  useEffect(() => {
    if (actionData && 'success' in actionData && actionData.success && 'configId' in actionData) {
      // Find the index of the newly created config
      const newConfigIndex = promotionalBannerBlocks.findIndex(
        (config) => config.configId === actionData.configId
      );
      if (newConfigIndex !== -1) {
        setSelectedConfigIndex(newConfigIndex);
        // Show success message
        shopify.toast.show(`Configuration "${promotionalBannerBlocks[newConfigIndex].name}" created successfully!`);
      }
    }
  }, [actionData, promotionalBannerBlocks]);

  const slides = currentConfig?.images || [];

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
  }, [actionData, submittingIntent, isLoading]);

  const handleCreateConfig = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "create-config");
    formData.append("configId", newConfigId);
    formData.append("name", newConfigName);
    submit(formData, { method: "post" });
    setShowCreateModal(false);
    setNewConfigId("");
    setNewConfigName("");

    // After successful creation, switch to the new config
    // The new config will be at the end of the array after reload
    setTimeout(() => {
      const newIndex = promotionalBannerBlocks.length;
      setSelectedConfigIndex(newIndex);
    }, 100);
  }, [newConfigId, newConfigName, submit, promotionalBannerBlocks.length]);

  const handleDeleteConfig = useCallback((configId: string) => {
    if (!confirm("Are you sure you want to delete this configuration? All slides will be removed.")) return;

    const formData = new FormData();
    formData.append("intent", "delete-config");
    formData.append("configId", configId);
    submit(formData, { method: "post" });

    // Switch to first config after delete
    setSelectedConfigIndex(0);
  }, [submit]);

  const handleToggle = useCallback(() => {
    if (!currentConfig) return;

    const formData = new FormData();
    formData.append("intent", "toggle");
    formData.append("configId", currentConfig.configId);
    formData.append("enabled", (!currentConfig.isActive).toString());
    submit(formData, { method: "post" });
  }, [currentConfig, submit]);

  const handleAddSlide = useCallback((data: SlideFormData) => {
    if (!currentConfig) return;

    const formData = new FormData();
    formData.append("intent", "add-slide");
    formData.append("configId", currentConfig.configId);
    if (data.mediaUrl) formData.append("mediaUrl", data.mediaUrl);
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("ctaText", data.ctaText);
    formData.append("ctaUrl", data.ctaUrl);
    submit(formData, { method: "post", replace: true });
    // Don't close immediately - let useEffect handle it after success
  }, [currentConfig, submit]);

  const handleUpdateSlide = useCallback((data: SlideFormData) => {
    if (!editingSlide || !currentConfig) return;

    const formData = new FormData();
    formData.append("intent", "update-slide");
    formData.append("configId", currentConfig.configId);
    formData.append("slideId", editingSlide.id);
    if (data.mediaUrl) formData.append("mediaUrl", data.mediaUrl);
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("ctaText", data.ctaText);
    formData.append("ctaUrl", data.ctaUrl);
    submit(formData, { method: "post", replace: true });
    // Don't close immediately - let useEffect handle it after success
  }, [editingSlide, currentConfig, submit]);

  const handleDeleteSlide = useCallback((slideId: string) => {
    if (!confirm("Are you sure you want to delete this slide?")) return;
    if (!currentConfig) return;

    const formData = new FormData();
    formData.append("intent", "delete-slide");
    formData.append("configId", currentConfig.configId);
    formData.append("slideId", slideId);
    submit(formData, { method: "post", replace: true });
  }, [currentConfig, submit]);

  const handleSaveCarouselSettings = useCallback(() => {
    if (!currentConfig) return;

    const formData = new FormData();
    formData.append("intent", "save-carousel-settings");
    formData.append("configId", currentConfig.configId);
    formData.append("autoRotate", carouselSettings.autoRotate.toString());
    formData.append("rotationSpeed", carouselSettings.rotationSpeed.toString());
    formData.append("showDots", carouselSettings.showDots.toString());
    formData.append("showArrows", carouselSettings.showArrows.toString());
    submit(formData, { method: "post", replace: true });
  }, [currentConfig, carouselSettings, submit]);

  // Create tabs for each configuration
  const tabs = promotionalBannerBlocks.map((config, index) => ({
    id: config.configId,
    content: config.name,
    accessibilityLabel: config.name,
    panelID: `config-${config.configId}`,
  }));

  if (promotionalBannerBlocks.length === 0) {
    return (
      <Page
        backAction={{ url: "/app" }}
        title="Promotional Banner Block"
      >
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="p" variant="bodyMd">
                  No promotional banner configurations found. Create your first configuration to get started.
                </Text>
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                  Create Configuration
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Modal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Configuration"
          primaryAction={{
            content: "Create",
            onAction: handleCreateConfig,
            disabled: !newConfigId || !newConfigName,
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: () => setShowCreateModal(false),
            },
          ]}
        >
          <Modal.Section>
            <FormLayout>
              <TextField
                label="Configuration ID"
                value={newConfigId}
                onChange={setNewConfigId}
                placeholder="homepage-banner"
                helpText="Unique identifier (use lowercase, hyphens, underscores only)"
                autoComplete="off"
              />
              <TextField
                label="Configuration Name"
                value={newConfigName}
                onChange={setNewConfigName}
                placeholder="Homepage Banner"
                helpText="Display name for this configuration"
                autoComplete="off"
              />
            </FormLayout>
          </Modal.Section>
        </Modal>
      </Page>
    );
  }

  return (
    <Page
      backAction={{ url: "/app" }}
      title="🎨 Promotional Banner Block"
      primaryAction={{
        content: "Save Settings",
        onAction: handleSaveCarouselSettings,
        loading: isLoading && submittingIntent === "save-carousel-settings",
      }}
      secondaryActions={[
        {
          content: "Create New Configuration",
          onAction: () => setShowCreateModal(true),
        },
      ]}
    >
      {/* Toast notification */}
      {showToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
        }}>
          <Banner tone="success" onDismiss={() => setShowToast(false)}>
            Settings saved successfully
          </Banner>
        </div>
      )}

      {/* Error banner */}
      {actionData && 'error' in actionData && (
        <Layout>
          <Layout.Section>
            <Banner tone="critical">
              {actionData.error}
            </Banner>
          </Layout.Section>
        </Layout>
      )}

      <Layout>
        <Layout.Section>
          <Card>
            <Tabs
              tabs={tabs}
              selected={selectedConfigIndex}
              onSelect={setSelectedConfigIndex}
            >
              <BlockStack gap="400">
                {/* Configuration Info */}
                <InlineStack align="space-between">
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd">
                      {currentConfig.name}
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Configuration ID: <code>{currentConfig.configId}</code>
                    </Text>
                  </BlockStack>
                  <InlineStack gap="200">
                    <Checkbox
                      label="Enabled"
                      checked={currentConfig.isActive}
                      onChange={handleToggle}
                    />
                    {promotionalBannerBlocks.length > 1 && (
                      <Button
                        variant="plain"
                        tone="critical"
                        onClick={() => handleDeleteConfig(currentConfig.configId)}
                      >
                        Delete Config
                      </Button>
                    )}
                  </InlineStack>
                </InlineStack>

                {/* Usage Instructions */}
                <Banner>
                  <Text as="p" variant="bodyMd">
                    To use this configuration on your storefront, add the Promotional Banner block and set the <strong>Configuration ID</strong> to: <code>{currentConfig.configId}</code>
                  </Text>
                </Banner>

                {/* Image Size Recommendations */}
                <Banner tone="info">
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      📐 Image & Video Size Recommendations
                    </Text>
                    <Text as="p" variant="bodyMd">
                      Choose the right size based on where you'll place this banner in your theme:
                    </Text>

                    {/* Image Sizes */}
                    <BlockStack gap="100">
                      <Text as="p" variant="bodySm" fontWeight="semibold">
                        Images:
                      </Text>
                      <Text as="p" variant="bodySm">
                        • <strong>Full-width sections</strong> (homepage hero, above footer): 1920×400px to 1920×600px
                      </Text>
                      <Text as="p" variant="bodySm">
                        • <strong>Standard content areas</strong> (product pages, collection pages): 1200×400px
                      </Text>
                      <Text as="p" variant="bodySm">
                        • <strong>Narrow sidebars or columns</strong>: 800×350px to 600×300px
                      </Text>
                      <Text as="p" variant="bodySm">
                        • <strong>Mobile-first designs</strong>: 750×300px (scales well on all devices)
                      </Text>
                    </BlockStack>

                    {/* Video Recommendations */}
                    <BlockStack gap="100">
                      <Text as="p" variant="bodySm" fontWeight="semibold">
                        Videos (MP4, YouTube, Vimeo):
                      </Text>
                      <Text as="p" variant="bodySm">
                        • <strong>Full-width sections</strong>: 1920×1080 (Full HD) or 1920×600px
                      </Text>
                      <Text as="p" variant="bodySm">
                        • <strong>Standard content areas</strong>: 1280×720 (HD) or 1200×675px
                      </Text>
                      <Text as="p" variant="bodySm">
                        • <strong>Narrow sidebars</strong>: 800×450px or 640×360px
                      </Text>
                      <Text as="p" variant="bodySm">
                        • <strong>Mobile-first</strong>: 750×422px or 640×360px
                      </Text>
                      <Text as="p" variant="bodySm">
                        • <strong>Format</strong>: MP4 (H.264 codec) for best compatibility
                      </Text>
                    </BlockStack>

                    <Text as="p" variant="bodySm" tone="subdued">
                      💡 Pro Tips: Use 16:9 aspect ratio for all media. Videos create more engagement than static images. For YouTube/Vimeo, use short, high-quality clips without intros/outros.
                    </Text>
                  </BlockStack>
                </Banner>
              </BlockStack>
            </Tabs>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Layout>
            <Layout.Section variant="oneThird">
              {/* Slides Management */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <Text as="h3" variant="headingMd">Slides ({slides.length})</Text>
                    <Button variant="primary" onClick={() => setIsAddingSlide(true)}>
                      Add Slide
                    </Button>
                  </InlineStack>

                  {slides.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {slides.map((slide: any) => (
                        <Card key={slide.id}>
                          <InlineStack align="space-between" blockAlign="center">
                            <InlineStack gap="300" blockAlign="center">
                              {slide.imageUrl && (
                                <Thumbnail source={slide.imageUrl} alt={slide.title || "Slide"} size="small" />
                              )}
                              <BlockStack gap="100">
                                <Text as="p" variant="bodyMd" fontWeight="semibold">
                                  {slide.title || `Slide ${slide.order + 1}`}
                                </Text>
                                <Text as="p" variant="bodySm" tone="subdued">
                                  {slide.description || "No description"}
                                </Text>
                              </BlockStack>
                            </InlineStack>
                            <InlineStack gap="200">
                              <Button onClick={() => setEditingSlide(slide)}>Edit</Button>
                              <Button variant="plain" tone="critical" onClick={() => handleDeleteSlide(slide.id)}>
                                Delete
                              </Button>
                            </InlineStack>
                          </InlineStack>
                        </Card>
                      ))}
                    </div>
                  )}
                </BlockStack>
              </Card>

              {/* Carousel Settings */}
              <Card>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">Carousel Settings</Text>
                  <FormLayout>
                    <Checkbox
                      label="Auto-rotate slides"
                      checked={carouselSettings.autoRotate}
                      onChange={(value) => setCarouselSettings({ ...carouselSettings, autoRotate: value })}
                    />
                    {carouselSettings.autoRotate && (
                      <RangeSlider
                        label="Rotation speed (ms)"
                        value={carouselSettings.rotationSpeed}
                        onChange={(value) => setCarouselSettings({ ...carouselSettings, rotationSpeed: value as number })}
                        min={2000}
                        max={10000}
                        step={500}
                        output
                      />
                    )}
                    <Checkbox
                      label="Show navigation dots"
                      checked={carouselSettings.showDots}
                      onChange={(value) => setCarouselSettings({ ...carouselSettings, showDots: value })}
                    />
                    <Checkbox
                      label="Show navigation arrows"
                      checked={carouselSettings.showArrows}
                      onChange={(value) => setCarouselSettings({ ...carouselSettings, showArrows: value })}
                    />
                  </FormLayout>
                </BlockStack>
              </Card>
            </Layout.Section>

            <Layout.Section variant="oneThird">
              {/* Preview */}
              <Card>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">Preview</Text>
                  <CarouselPreview slides={slides} carouselSettings={carouselSettings} />
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        </Layout.Section>
      </Layout>

      {/* Add Slide Modal */}
      <Modal
        open={isAddingSlide}
        onClose={() => setIsAddingSlide(false)}
        title="Add New Slide"
      >
        <Modal.Section>
          {isAddingSlide && (
            <SlideEditor
              onSave={handleAddSlide}
              onCancel={() => setIsAddingSlide(false)}
              isLoading={isLoading && submittingIntent === "add-slide"}
            />
          )}
        </Modal.Section>
      </Modal>

      {/* Edit Slide Modal */}
      <Modal
        open={!!editingSlide}
        onClose={() => setEditingSlide(null)}
        title={editingSlide ? `Edit Slide ${editingSlide.order + 1}` : "Edit Slide"}
      >
        <Modal.Section>
          {editingSlide && (
            <SlideEditor
              slide={editingSlide}
              onSave={handleUpdateSlide}
              onCancel={() => setEditingSlide(null)}
              isLoading={isLoading && submittingIntent === "update-slide"}
            />
          )}
        </Modal.Section>
      </Modal>

      {/* Create Config Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Configuration"
        primaryAction={{
          content: "Create",
          onAction: handleCreateConfig,
          disabled:
            !newConfigId ||
            !newConfigName ||
            newConfigName.length < 3 ||
            !/^[a-z0-9-_]+$/.test(newConfigId),
          loading: isLoading && submittingIntent === "create-config",
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setShowCreateModal(false),
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Configuration ID"
              value={newConfigId}
              onChange={(value) => {
                // Only allow lowercase letters, numbers, hyphens, and underscores
                const sanitized = value.toLowerCase().replace(/[^a-z0-9-_]/g, '');
                setNewConfigId(sanitized);
              }}
              placeholder="homepage-banner"
              helpText="Use lowercase letters, numbers, hyphens, and underscores only (e.g., homepage-banner, product-page)"
              autoComplete="off"
              error={newConfigId && !/^[a-z0-9-_]+$/.test(newConfigId) ? "Invalid format: use only lowercase, numbers, hyphens, underscores" : undefined}
            />
            <TextField
              label="Configuration Name"
              value={newConfigName}
              onChange={setNewConfigName}
              placeholder="Homepage Banner"
              helpText="Display name for this configuration (e.g., Homepage Banner, Product Page Promo)"
              autoComplete="off"
              error={newConfigName && newConfigName.length < 3 ? "Name must be at least 3 characters" : undefined}
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
