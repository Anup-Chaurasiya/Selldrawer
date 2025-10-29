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
  Badge,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useState, useCallback, useEffect, useRef } from "react";

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
            helpText="Title displayed on bottom-right"
            autoComplete="off"
          />

          <TextField
            label="Slide Description"
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            placeholder="Get 20% off all summer items"
            helpText="Description displayed on bottom-right"
            autoComplete="off"
            multiline={2}
          />

          <TextField
            label="CTA Button Text"
            value={formData.ctaText}
            onChange={(value) => setFormData({ ...formData, ctaText: value })}
            placeholder="Shop Now"
            helpText="Button text displayed on bottom-left"
            autoComplete="off"
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
            disabled={!formData.mediaUrl}
          >
            {slide ? "Update Slide" : "Add Slide"}
          </Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

// Carousel Preview Component
function CarouselPreview({ slides, currentIndex, carouselSettings, onPrevious, onNext, onDotClick }: { 
  slides: any[]; 
  currentIndex: number; 
  carouselSettings: any;
  onPrevious: () => void;
  onNext: () => void;
  onDotClick: (index: number) => void;
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

  const currentSlide = slides[currentIndex] || slides[0];

  return (
    <div style={{ 
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {/* Media Section - Fixed 160px height */}
      <div style={{ 
        position: 'relative',
        height: '160px',
        backgroundColor: '#000',
        overflow: 'hidden',
        borderRadius: '8px 8px 0 0'
      }}>
        {/* Background Image/Video */}
        {currentSlide.videoUrl && currentSlide.videoType !== "none" ? (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            position: 'relative',
            backgroundColor: '#1a1a1a'
          }}>
            {currentSlide.videoType === "mp4" ? (
              <video 
                src={currentSlide.videoUrl}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px 8px 0 0' }}
                muted
                loop
                autoPlay
              />
            ) : (
              <div style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#fff',
                fontSize: '14px'
              }}>
                📹 {currentSlide.videoType?.toUpperCase() || 'VIDEO'} Video
              </div>
            )}
            {/* Fallback overlay */}
            <img 
              src={currentSlide.imageUrl}
              alt="Slide background"
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                zIndex: -1
              }}
            />
          </div>
        ) : (
          <img 
            src={currentSlide.imageUrl}
            alt="Slide background"
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              borderRadius: '8px 8px 0 0'
            }}
          />
        )}

        {/* Navigation Arrows */}
        {slides.length > 1 && (carouselSettings?.showArrows !== false) && (
          <>
            <button 
              onClick={onPrevious}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#333',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                border: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,1)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              ‹
            </button>
            <button 
              onClick={onNext}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#333',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                border: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,1)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              ›
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {slides.length > 1 && (carouselSettings?.showDots !== false) && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px',
            zIndex: 10
          }}>
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => onDotClick(index)}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: index === currentIndex ? '#007bff' : 'rgba(255,255,255,0.6)',
                  border: '2px solid rgba(255,255,255,0.9)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  padding: 0
                }}
              />
            ))}
          </div>
        )}

        {/* 5% Preview Edges */}
        {slides.length > 1 && (
          <>
            {currentIndex > 0 && (
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: '5%',
                overflow: 'hidden',
                opacity: 0.5
              }}>
                <img 
                  src={slides[currentIndex - 1].imageUrl}
                  alt="Previous"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
            {currentIndex < slides.length - 1 && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: 0,
                height: '100%',
                width: '5%',
                overflow: 'hidden',
                opacity: 0.5
              }}>
                <img 
                  src={slides[currentIndex + 1].imageUrl}
                  alt="Next"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Text Section - Below Media */
      }
      {(currentSlide.title || currentSlide.description || currentSlide.ctaText) && (
        <div className="carousel-text-section" style={{
          backgroundColor: '#fff',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          minHeight: '60px',
          flexWrap: 'wrap'
        }}>
          {/* CTA Button - Left side */}
          {currentSlide.ctaText && (
            <div style={{ flexShrink: 0 }}>
              <button style={{
                backgroundColor: '#ff6b35',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease',
                minWidth: '110px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e85d2f';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ff6b35';
              }}
              >
                {currentSlide.ctaText}
              </button>
            </div>
          )}

          {/* Title & Description - Right side */}
          {(currentSlide.title || currentSlide.description) && (
            <div style={{ 
              flex: 1,
              textAlign: 'right',
              minWidth: 0
            }}>
              {currentSlide.title && (
                <div style={{ 
                  fontWeight: '700', 
                  fontSize: '18px', 
                  color: '#1f2937',
                  marginBottom: currentSlide.description ? '2px' : '0',
                  lineHeight: '1.2'
                }}>
                  {currentSlide.title}
                </div>
              )}
              {currentSlide.description && (
                <div style={{ 
                  fontSize: '14px', 
                  color: '#6b7280',
                  lineHeight: '1.4'
                }}>
                  {currentSlide.description}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mobile Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .carousel-text-section {
            flex-direction: column !important;
            text-align: center !important;
            gap: 16px !important;
          }
          .carousel-text-section > div:last-child {
            text-align: center !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function PromotionalBanner() {
  const { cartDrawer, promotionalBanner } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const [editingSlide, setEditingSlide] = useState<any>(null);
  const [isAddingSlide, setIsAddingSlide] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [carouselSettings, setCarouselSettings] = useState({
    autoRotate: promotionalBanner?.carouselSettings?.autoRotate ?? true,
    rotationSpeed: promotionalBanner?.carouselSettings?.rotationSpeed ?? 5000,
    showDots: promotionalBanner?.carouselSettings?.showDots ?? true,
    showArrows: promotionalBanner?.carouselSettings?.showArrows ?? true,
  });

  const slides = promotionalBanner?.images || [];

  // Auto-rotate preview
  useEffect(() => {
    if (slides.length > 1 && carouselSettings.autoRotate && !editingSlide && !isAddingSlide) {
      const interval = setInterval(() => {
        setPreviewIndex((prev) => (prev + 1) % slides.length);
      }, carouselSettings.rotationSpeed);
      return () => clearInterval(interval);
    }
  }, [slides.length, carouselSettings.autoRotate, carouselSettings.rotationSpeed, editingSlide, isAddingSlide]);

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
                              <Thumbnail source={slide.imageUrl} alt={`Slide ${index + 1}`} size="small" />
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
                              <Button onClick={() => setPreviewIndex(index)}>Preview</Button>
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
                        onChange={(value) => setCarouselSettings({ ...carouselSettings, rotationSpeed: value * 1000 })}
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
                currentIndex={previewIndex}
                carouselSettings={carouselSettings}
                onPrevious={() => setPreviewIndex((prev) => (prev - 1 + slides.length) % slides.length)}
                onNext={() => setPreviewIndex((prev) => (prev + 1) % slides.length)}
                onDotClick={(index) => setPreviewIndex(index)}
              />

              <Text as="p" variant="bodySm" tone="subdued">
                Features: Fixed 300px media container, separate white text section below, CTA button (left), title/description (right), responsive mobile layout, auto-rotate, navigation arrows, dot indicators, and 5% edge previews.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

