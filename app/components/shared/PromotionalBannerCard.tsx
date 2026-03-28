/**
 * Shared Promotional Banner Component
 * Premium redesign — works in any Shopify theme (light)
 * Cinematic full-bleed media with overlay text, frosted-glass CTA
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

// Helper function to convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

interface Slide {
  imageUrl?: string;
  videoUrl?: string;
  videoType?: 'youtube' | 'vimeo' | 'mp4';
  title?: string;
  description?: string;
  ctaText?: string;
  ctaUrl?: string;
}

interface CarouselSettings {
  showArrows?: boolean;
  showDots?: boolean;
  autoRotate?: boolean;
  rotationSpeed?: number;
}

interface PromotionalBannerCardProps {
  slides: Slide[];
  carouselSettings?: CarouselSettings;
  onCtaClick?: (url: string) => void;
  onImpression?: () => void;
  isPreview?: boolean;
  context?: 'cart-drawer' | 'block';
  maxHeight?: string;
  titleColor?: string;
  descriptionColor?: string;
  ctaTextColor?: string;
  ctaBackgroundColor?: string;
  borderColor?: string;
}

const PROMO_KEYFRAMES = `
  @keyframes sd-promo-fade-in {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  @keyframes sd-promo-slide-up {
    0% { opacity: 0; transform: translateY(16px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes sd-promo-dot-expand {
    0% { width: 6px; }
    100% { width: 20px; }
  }
  @keyframes sd-promo-shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes sd-promo-cta-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.2); }
    50% { box-shadow: 0 0 0 6px rgba(255,255,255,0); }
  }
`;

const getYouTubeEmbedUrl = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;
  if (!videoId) return null;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&enablejsapi=1&origin=${encodeURIComponent(origin)}&playsinline=1&widget_referrer=${encodeURIComponent(origin)}`;
};

const getVimeoEmbedUrl = (url: string): string | null => {
  const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
  const match = url.match(regExp);
  const videoId = match ? match[1] : null;
  return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1&loop=1&muted=1&background=1` : null;
};

export const PromotionalBannerCard: React.FC<PromotionalBannerCardProps> = ({
  slides,
  carouselSettings = {},
  onCtaClick,
  onImpression,
  isPreview = false,
  context = 'cart-drawer',
  maxHeight = '180px',
  titleColor = '#111827',
  descriptionColor = '#6b7280',
  ctaTextColor = '#374151',
  ctaBackgroundColor = '#f3f4f6',
  borderColor = '#e5e7eb'
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [containerHovered, setContainerHovered] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const currentIndexRef = useRef(0);
  const impressionTracked = useRef(false);

  const [isMuted, setIsMuted] = useState<Record<number, boolean>>(() =>
    slides.reduce<Record<number, boolean>>((acc, _, idx) => ({ ...acc, [idx]: true }), {})
  );
  const videoRefs = useRef<Record<number, HTMLVideoElement | HTMLIFrameElement | null>>({});

  const isBlockContext = context === 'block';

  useEffect(() => {
    if (!impressionTracked.current && onImpression && !isPreview && slides.length > 0) {
      onImpression();
      impressionTracked.current = true;
    }
  }, [onImpression, isPreview, slides.length]);

  const updateScrollState = () => {
    const container = scrollContainerRef.current;
    if (!container || slides.length <= 1) return;
    const scrollLeft = container.scrollLeft;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < maxScrollLeft - 10);
    const gap = isBlockContext ? 16 : 8;
    const slideWidth = container.clientWidth + gap;
    const index = Math.round(scrollLeft / slideWidth);
    const newIndex = Math.min(index, slides.length - 1);
    setCurrentIndex(newIndex);
    currentIndexRef.current = newIndex;
  };

  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  useEffect(() => {
    updateScrollState();
    const container = scrollContainerRef.current;
    if (container && slides.length > 1) {
      container.addEventListener('scroll', updateScrollState);
      window.addEventListener('resize', updateScrollState);
      return () => {
        container.removeEventListener('scroll', updateScrollState);
        window.removeEventListener('resize', updateScrollState);
      };
    }
  }, [slides]);

  useEffect(() => {
    if (!slides || slides.length <= 1 || !carouselSettings || carouselSettings.autoRotate === false) return;
    const interval = setInterval(() => {
      if (isScrolling.current) return;
      const container = scrollContainerRef.current;
      if (!container) return;
      isScrolling.current = true;
      const gap = isBlockContext ? 16 : 8;
      const slideWidth = container.clientWidth + gap;
      const currentIdx = currentIndexRef.current;
      const nextIndex = currentIdx < slides.length - 1 ? currentIdx + 1 : 0;
      const targetScroll = nextIndex * slideWidth;
      setCurrentIndex(nextIndex);
      currentIndexRef.current = nextIndex;
      container.scrollTo({ left: targetScroll, behavior: 'smooth' });
      setTimeout(() => { isScrolling.current = false; }, 500);
    }, carouselSettings?.rotationSpeed || 5000);
    return () => clearInterval(interval);
  }, [slides.length, carouselSettings?.autoRotate, carouselSettings?.rotationSpeed, isBlockContext]);

  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    slides.forEach((slide, index) => {
      const videoElement = videoRefs.current[index];
      if (!videoElement || !slide.videoUrl) return;
      if (index === currentIndex) {
        if (slide.videoType === 'mp4' && videoElement instanceof HTMLVideoElement) {
          videoElement.muted = isMuted[index];
          videoElement.play().catch(err => { console.error('[PromotionalBanner] MP4 play error:', err); });
        } else if (slide.videoType === 'youtube' && videoElement instanceof HTMLIFrameElement) {
          try {
            videoElement.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
            const muteCommand = isMuted[index] ? 'mute' : 'unMute';
            videoElement.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: muteCommand, args: [] }), '*');
          } catch (error) { console.error('[PromotionalBanner] YouTube play/mute error:', error); }
        } else if (slide.videoType === 'vimeo' && videoElement instanceof HTMLIFrameElement) {
          try {
            videoElement.contentWindow?.postMessage(JSON.stringify({ method: 'play' }), '*');
            const volume = isMuted[index] ? 0 : 1;
            videoElement.contentWindow?.postMessage(JSON.stringify({ method: 'setVolume', value: volume }), '*');
          } catch (error) { console.error('[PromotionalBanner] Vimeo play/mute error:', error); }
        }
      } else {
        if (slide.videoType === 'mp4' && videoElement instanceof HTMLVideoElement) {
          videoElement.pause();
          videoElement.muted = true;
        } else if (slide.videoType === 'youtube' && videoElement instanceof HTMLIFrameElement) {
          try {
            videoElement.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
            videoElement.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'mute', args: [] }), '*');
          } catch (error) { console.error('[PromotionalBanner] YouTube pause/mute error:', error); }
        } else if (slide.videoType === 'vimeo' && videoElement instanceof HTMLIFrameElement) {
          try {
            videoElement.contentWindow?.postMessage(JSON.stringify({ method: 'pause' }), '*');
            videoElement.contentWindow?.postMessage(JSON.stringify({ method: 'setVolume', value: 0 }), '*');
          } catch (error) { console.error('[PromotionalBanner] Vimeo pause/mute error:', error); }
        }
      }
    });
  }, [currentIndex, slides, isMuted]);

  const normalizeImageUrl = (url: string | undefined | null): string | null => {
    if (!url || typeof url !== 'string' || url.trim() === '') return null;
    const trimmedUrl = url.trim();
    if (/^https?:\/\//i.test(trimmedUrl)) return trimmedUrl;
    if (trimmedUrl.startsWith('//')) return `https:${trimmedUrl}`;
    if (trimmedUrl.startsWith('/')) { console.warn('[PromotionalBanner] Invalid relative image URL:', trimmedUrl); return null; }
    console.warn('[PromotionalBanner] Potentially invalid image URL:', trimmedUrl);
    return null;
  };

  const handleMuteToggle = useCallback((slideIndex: number, e?: React.MouseEvent) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    setIsMuted(prev => {
      const newMuted = !prev[slideIndex];
      const videoElement = videoRefs.current[slideIndex];
      if (!videoElement) return prev;
      const slide = slides[slideIndex];
      if (slide?.videoType === 'mp4' && videoElement instanceof HTMLVideoElement) {
        videoElement.muted = newMuted;
      } else if (slide?.videoType === 'youtube' && videoElement instanceof HTMLIFrameElement) {
        try {
          const command = newMuted ? 'mute' : 'unMute';
          videoElement.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: command, args: [] }), '*');
        } catch (error) { console.error('[PromotionalBanner] YouTube mute control error:', error); }
      } else if (slide?.videoType === 'vimeo' && videoElement instanceof HTMLIFrameElement) {
        try {
          const value = newMuted ? 0 : 1;
          videoElement.contentWindow?.postMessage(JSON.stringify({ method: 'setVolume', value }), '*');
        } catch (error) { console.error('[PromotionalBanner] Vimeo mute control error:', error); }
      }
      return { ...prev, [slideIndex]: newMuted };
    });
  }, [slides]);

  const renderMedia = (slide: Slide, slideIndex: number) => {
    if (slide.videoUrl && slide.videoType) {
      if (slide.videoType === 'youtube') {
        const embedUrl = getYouTubeEmbedUrl(slide.videoUrl);
        if (embedUrl) {
          return (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <iframe
                ref={(el) => { videoRefs.current[slideIndex] = el; }}
                src={embedUrl}
                style={{ position: 'absolute', top: '-60px', left: '0', width: '100%', height: 'calc(100% + 120px)', border: 'none', pointerEvents: 'none' }}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
              <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', height: '80px', background: 'transparent', pointerEvents: 'auto', zIndex: 10 }} />
            </div>
          );
        }
      } else if (slide.videoType === 'vimeo') {
        const embedUrl = getVimeoEmbedUrl(slide.videoUrl);
        if (embedUrl) {
          return (
            <iframe
              ref={(el) => { videoRefs.current[slideIndex] = el; }}
              src={embedUrl}
              style={{ width: '100%', height: '100%', border: 'none', objectFit: 'cover', pointerEvents: 'none' }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          );
        }
      } else if (slide.videoType === 'mp4') {
        const normalizedVideoUrl = normalizeImageUrl(slide.videoUrl);
        if (normalizedVideoUrl) {
          return (
            <video
              ref={(el) => { videoRefs.current[slideIndex] = el; }}
              src={normalizedVideoUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
              autoPlay loop muted playsInline
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          );
        }
      }
    }
    const normalizedImageUrl = normalizeImageUrl(slide.imageUrl);
    if (normalizedImageUrl) {
      return (
        <img
          src={normalizedImageUrl}
          alt={slide.title || "Promotional banner"}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.innerHTML = '<div style="width:100%;height:100%;background:linear-gradient(135deg,#f5f3ff,#ede9fe);display:flex;align-items:center;justify-content:center;font-size:48px">🖼️</div>';
            }
          }}
        />
      );
    }
    return (
      <div style={{
        width: '100%', height: '100%',
        background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px',
      }}>🖼️</div>
    );
  };

  const scrollToIndex = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    isScrolling.current = true;
    setCurrentIndex(index);
    currentIndexRef.current = index;
    const gap = isBlockContext ? 16 : 8;
    const slideWidth = container.clientWidth + gap;
    container.scrollTo({ left: index * slideWidth, behavior: 'smooth' });
    setTimeout(() => { isScrolling.current = false; }, 500);
  };

  const handlePrevious = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    scrollToIndex(currentIndex > 0 ? currentIndex - 1 : slides.length - 1);
  };
  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    scrollToIndex(currentIndex < slides.length - 1 ? currentIndex + 1 : 0);
  };
  const handleDotClick = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    scrollToIndex(index);
  };
  const handleCtaClick = (slide: Slide, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (slide.ctaUrl && onCtaClick) onCtaClick(slide.ctaUrl);
  };
  const handleBannerClick = (slide: Slide) => {
    if (slide.ctaUrl && onCtaClick) onCtaClick(slide.ctaUrl);
  };

  // Empty state
  if (!slides || slides.length === 0) {
    return (
      <div style={{
        borderRadius: '16px', overflow: 'hidden', position: 'relative',
        border: `1.5px solid ${borderColor}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }}>
        <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)' }}>
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=200&fit=crop&crop=center"
            alt="Sample promotional banner"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Dark scrim */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)' }} />
          {/* Overlay content */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '3px', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>Summer Sale</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Get 20% Off on Summer Items</div>
            </div>
            <button style={{
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
              color: 'white', border: '1px solid rgba(255,255,255,0.3)',
              padding: '8px 16px', borderRadius: '10px', fontWeight: '600', fontSize: '13px',
              cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
            }}>Shop Now</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        ${PROMO_KEYFRAMES}
        .sd-promo-scroll::-webkit-scrollbar { display: none; }
        .sd-promo-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        ${isBlockContext ? `
          .sd-promo-block-media { height: ${maxHeight === 'auto' ? 'auto' : maxHeight}; ${maxHeight === 'auto' ? 'aspect-ratio: 16/9;' : ''} }
          @media (max-width: 768px) { .sd-promo-block-media { height: ${maxHeight === 'auto' ? 'auto' : `calc(${maxHeight} * 0.78)`}; ${maxHeight === 'auto' ? 'aspect-ratio: 16/9;' : ''} } }
          @media (max-width: 480px) { .sd-promo-block-media { height: ${maxHeight === 'auto' ? 'auto' : `calc(${maxHeight} * 0.67)`}; ${maxHeight === 'auto' ? 'aspect-ratio: 16/9;' : ''} } }
        ` : ''}
      `}</style>

      <div style={{ marginBottom: isBlockContext ? '0' : '4px' }}>
        <div
          style={{ position: 'relative', overflow: 'visible' }}
          onMouseEnter={() => setContainerHovered(true)}
          onMouseLeave={() => setContainerHovered(false)}
        >
          {/* Left Arrow */}
          {slides.length > 1 && canScrollLeft && carouselSettings?.showArrows !== false && (
            <button
              onClick={(e) => handlePrevious(e)}
              style={{
                position: 'absolute', left: '10px', top: '50%',
                transform: `translateY(-50%) scale(${containerHovered ? 1 : 0.85})`,
                background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50%', width: '34px', height: '34px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 20,
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                opacity: containerHovered ? 1 : 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.65)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* Right Arrow */}
          {slides.length > 1 && canScrollRight && carouselSettings?.showArrows !== false && (
            <button
              onClick={(e) => handleNext(e)}
              style={{
                position: 'absolute', right: '10px', top: '50%',
                transform: `translateY(-50%) scale(${containerHovered ? 1 : 0.85})`,
                background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50%', width: '34px', height: '34px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 20,
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                opacity: containerHovered ? 1 : 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.65)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          {/* Scrollable container */}
          <div
            ref={scrollContainerRef}
            className="sd-promo-scroll"
            style={{
              display: 'flex',
              gap: isBlockContext ? '16px' : '8px',
              overflowX: 'auto',
              scrollBehavior: 'smooth',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              borderRadius: '16px',
            }}
          >
            {slides.map((slide, index) => (
              <div
                key={index}
                onClick={() => handleBannerClick(slide)}
                style={{
                  minWidth: slides.length > 1 ? (isBlockContext ? '100%' : '92%') : '100%',
                  maxWidth: slides.length > 1 ? (isBlockContext ? '100%' : '92%') : '100%',
                  flexShrink: 0,
                  scrollSnapAlign: 'start',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: `1.5px solid ${borderColor}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  cursor: slide.ctaUrl ? 'pointer' : 'default',
                  position: 'relative',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  background: '#f4f4f8',
                }}
              >
                {/* Media */}
                <div
                  className={isBlockContext ? 'sd-promo-block-media' : ''}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    ...(isBlockContext ? { width: '100%' } : { aspectRatio: '16/9', width: '100%', height: 'auto' }),
                    backgroundColor: '#f4f4f8',
                  }}
                >
                  {renderMedia(slide, index)}

                  {/* Dark gradient scrim for text overlay */}
                  {(slide.title || slide.description || slide.ctaText) && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.3) 45%, transparent 100%)',
                      pointerEvents: 'none', zIndex: 2,
                    }} />
                  )}

                  {/* Overlaid text content */}
                  {(slide.title || slide.description || slide.ctaText) && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      padding: isBlockContext ? '16px 18px 14px' : '12px 14px 12px',
                      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                      gap: '12px', zIndex: 3,
                      animation: 'sd-promo-slide-up 0.4s ease',
                    }}>
                      {/* Text block */}
                      {(slide.title || slide.description) && (
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {slide.title && (
                            <div style={{
                              fontSize: isBlockContext ? '18px' : '15px',
                              fontWeight: '700',
                              color: 'white',
                              lineHeight: '1.25',
                              marginBottom: slide.description ? '4px' : '0',
                              textShadow: '0 1px 6px rgba(0,0,0,0.4)',
                              letterSpacing: '-0.02em',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {slide.title}
                            </div>
                          )}
                          {slide.description && (
                            <div style={{
                              fontSize: isBlockContext ? '13px' : '12px',
                              color: 'rgba(255,255,255,0.85)',
                              lineHeight: '1.35',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {slide.description}
                            </div>
                          )}
                        </div>
                      )}

                      {/* CTA Button — frosted glass */}
                      {slide.ctaText && (
                        <button
                          onClick={(e) => handleCtaClick(slide, e)}
                          style={{
                            flexShrink: 0,
                            background: 'rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(8px)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.3)',
                            padding: isBlockContext ? '9px 18px' : '7px 14px',
                            borderRadius: '10px',
                            fontWeight: '700',
                            fontSize: isBlockContext ? '13px' : '12px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            letterSpacing: '0.01em',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.28)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.2)';
                          }}
                        >
                          {slide.ctaText}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Mute/Unmute Button */}
                  {slide.videoUrl && slide.videoType && (
                    <button
                      onClick={(e) => handleMuteToggle(index, e)}
                      style={{
                        position: 'absolute', top: '10px', right: '10px',
                        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '8px', width: '32px', height: '32px',
                        cursor: 'pointer', zIndex: 15,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.7)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.transform = 'scale(1)'; }}
                      aria-label={isMuted[index] ? 'Unmute video' : 'Mute video'}
                    >
                      {isMuted[index] ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white" style={{ display: 'block' }}>
                          <path d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12A4.5 4.5 0 0014 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24z" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white" style={{ display: 'block' }}>
                          <path d="M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L7 9H4c-.55 0-1 .45-1 1zm13.5 2A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 4.45v.2c0 .38.25.71.6.85C17.18 6.53 19 9.06 19 12s-1.82 5.47-4.4 6.5c-.36.14-.6.47-.6.85v.2c0 .63.63 1.07 1.21.85C18.6 19.11 21 15.84 21 12s-2.4-7.11-5.79-8.4c-.58-.23-1.21.22-1.21.85z" />
                        </svg>
                      )}
                    </button>
                  )}

                  {/* Story-style dot indicators INSIDE the media */}
                  {slides.length > 1 && carouselSettings?.showDots !== false && (
                    <div style={{
                      position: 'absolute', bottom: (slide.title || slide.description || slide.ctaText) ? '72px' : '10px',
                      left: '50%', transform: 'translateX(-50%)',
                      display: 'flex', gap: '4px', zIndex: 10,
                    }}>
                      {slides.map((_, dotIdx) => (
                        <div
                          key={`dot-${dotIdx}`}
                          onClick={(e) => handleDotClick(dotIdx, e)}
                          style={{
                            height: '3px',
                            width: dotIdx === currentIndex ? '20px' : '6px',
                            borderRadius: '3px',
                            background: dotIdx === currentIndex
                              ? 'white'
                              : 'rgba(255,255,255,0.45)',
                            cursor: 'pointer',
                            transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                            boxShadow: dotIdx === currentIndex ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
