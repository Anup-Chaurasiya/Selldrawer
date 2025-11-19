/**
 * Shared Promotional Banner Component
 * Used in both production cart drawer and Remix preview
 */

import React, { useState, useEffect, useRef } from 'react';

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
  isPreview?: boolean;
}

// Helper function to get YouTube embed URL
const getYouTubeEmbedUrl = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0` : null;
};

// Helper function to get Vimeo embed URL
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
  isPreview = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  // Check scroll state
  const updateScrollState = () => {
    const container = scrollContainerRef.current;
    if (!container || slides.length <= 1) return;

    const scrollLeft = container.scrollLeft;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;

    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < maxScrollLeft - 10);

    // Update current index based on scroll position
    const slideWidth = container.clientWidth * 0.8 + 8; // 80% + gap
    const index = Math.round(scrollLeft / slideWidth);
    setCurrentIndex(Math.min(index, slides.length - 1));
  };

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

  // Auto-rotate carousel
  useEffect(() => {
    if (slides &&
      slides.length > 1 &&
      carouselSettings.autoRotate !== false &&
      !isScrolling.current) {
      const interval = setInterval(() => {
        handleNext();
      }, carouselSettings.rotationSpeed || 5000);
      return () => clearInterval(interval);
    }
  }, [slides, carouselSettings, currentIndex]);

  if (!slides || slides.length === 0) {
    return (
      <div style={{
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Media Section */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          height: '200px',
          backgroundColor: '#f9fafb'
        }}>
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=200&fit=crop&crop=center"
            alt="Sample promotional banner"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />

          {/* Dot Indicators */}
          <div style={{
            position: 'absolute',
            bottom: '6px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '4px',
            zIndex: 10
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#007bff',
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }} />
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }} />
          </div>

          {/* Navigation Arrows */}
          <button
            style={{
              position: 'absolute',
              left: '4px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#333',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease'
            }}
          >
            ‹
          </button>
          <button
            style={{
              position: 'absolute',
              right: '4px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#333',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease'
            }}
          >
            ›
          </button>
        </div>

        {/* Text Content Section */}
        <div style={{
          backgroundColor: '#fff',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          {/* Title - Full Width Row */}
          <div style={{
            fontWeight: '700',
            fontSize: '15px',
            color: '#111827',
            lineHeight: '1.2',
            textAlign: 'left',
            wordBreak: 'break-word'
          }}>
            Summer Sale
          </div>
          
          {/* Description and CTA Button Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}>
            {/* Description */}
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              lineHeight: '1.3',
              textAlign: 'left',
              flex: 1,
              minWidth: 0,
              wordBreak: 'break-word'
            }}>
              Get 20% Off on Summer Items
            </div>

            {/* CTA Button */}
            <div style={{ flexShrink: 0 }}>
              <button style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #e5e7eb',
                padding: '6px 14px',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}>
                shop
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render media based on type
  const renderMedia = (slide: Slide) => {
    if (slide.videoUrl && slide.videoType) {
      if (slide.videoType === 'youtube') {
        const embedUrl = getYouTubeEmbedUrl(slide.videoUrl);
        if (embedUrl) {
          return (
            <div style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '12px' 
            }}>
              <iframe
                src={embedUrl}
                style={{
                  position: 'absolute',
                  top: '-60px',
                  left: '0',
                  width: '100%',
                  height: 'calc(100% + 120px)',
                  border: 'none',
                  pointerEvents: 'none'
                }}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          );
        }
      } else if (slide.videoType === 'vimeo') {
        const embedUrl = getVimeoEmbedUrl(slide.videoUrl);
        if (embedUrl) {
          return (
            <iframe
              src={embedUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                objectFit: 'cover',
                pointerEvents: 'none'
              }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          );
        }
      } else if (slide.videoType === 'mp4') {
        return (
          <video
            src={slide.videoUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none'
            }}
            autoPlay
            loop
            muted
            playsInline
          />
        );
      }
    }
    // Fallback to image
    return (
      <img
        src={slide.imageUrl || 'https://via.placeholder.com/400x200'}
        alt="Promotional banner"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
    );
  };

  const scrollToIndex = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    isScrolling.current = true;
    const slideWidth = container.clientWidth * 0.8 + 8; // 80% + gap
    const targetScroll = index * slideWidth;

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });

    // Reset scrolling flag after animation
    setTimeout(() => {
      isScrolling.current = false;
    }, 500);
  };

  const handlePrevious = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const newIndex = currentIndex > 0 ? currentIndex - 1 : slides.length - 1;
    scrollToIndex(newIndex);
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const newIndex = currentIndex < slides.length - 1 ? currentIndex + 1 : 0;
    scrollToIndex(newIndex);
  };

  const handleDotClick = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    scrollToIndex(index);
  };

  const handleCtaClick = (slide: Slide, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (slide.ctaUrl && onCtaClick) {
      onCtaClick(slide.ctaUrl);
    }
  };

  const handleBannerClick = (slide: Slide) => {
    if (slide.ctaUrl && onCtaClick) {
      onCtaClick(slide.ctaUrl);
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <style>{`
        .upsellity-promo-scroll::-webkit-scrollbar {
          display: none;
        }
        .upsellity-promo-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div style={{ position: 'relative' }}>
        {/* Left Arrow */}
        {slides.length > 1 && canScrollLeft && (carouselSettings.showArrows !== false) && (
          <button
            onClick={(e) => handlePrevious(e)}
            style={{
              position: 'absolute',
              left: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 20,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.12)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <span style={{ fontSize: '18px', color: '#374151', fontWeight: '300' }}>‹</span>
          </button>
        )}

        {/* Right Arrow */}
        {slides.length > 1 && canScrollRight && (carouselSettings.showArrows !== false) && (
          <button
            onClick={(e) => handleNext(e)}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 20,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.12)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <span style={{ fontSize: '18px', color: '#374151', fontWeight: '300' }}>›</span>
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="upsellity-promo-scroll"
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {slides.map((slide, index) => (
            <div
              key={index}
              onClick={() => handleBannerClick(slide)}
              style={{
                minWidth: slides.length > 1 ? '80%' : '100%',
                maxWidth: slides.length > 1 ? '80%' : '100%',
                flexShrink: 0,
                scrollSnapAlign: 'start',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                cursor: slide.ctaUrl ? 'pointer' : 'default',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              {/* Media Section */}
              <div
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  aspectRatio: '16 / 9',      // 🔥 maintains consistent shape
                  width: '100%',              // full width
                  maxWidth: '360px',          // ideal container size
                  height: 'auto',
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                }}
              >
                {renderMedia(slide)}
              </div>
              {/* Text Content Section */}
              <div style={{
                backgroundColor: '#fff',
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                {/* Title - Full Width Row */}
                {slide.title && (
                  <div style={{
                    fontWeight: '700',
                    fontSize: '15px',
                    color: '#111827',
                    lineHeight: '1.2',
                    textAlign: slide.ctaText ? 'left' : 'center',
                    wordBreak: 'break-word',
                    marginBottom: slide.description ? '0' : '0'
                  }}>
                    {slide.title}
                  </div>
                )}
                
                {/* Description and CTA Button Row */}
                {(slide.description || slide.ctaText) && (
                  <div style={{
                    display: 'flex',
                    alignItems: slide.ctaText ? 'center' : 'flex-start',
                    justifyContent: slide.ctaText ? 'space-between' : 'center',
                    gap: '10px'
                  }}>
                    {/* Description */}
                    {slide.description && (
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        lineHeight: '1.3',
                        textAlign: slide.ctaText ? 'left' : 'center',
                        flex: slide.ctaText ? 1 : 'none',
                        minWidth: 0,
                        width: slide.ctaText ? 'auto' : '100%',
                        wordBreak: 'break-word'
                      }}>
                        {slide.description}
                      </div>
                    )}

                    {/* CTA Button */}
                    {slide.ctaText && (
                      <div style={{ flexShrink: 0 }}>
                        <button
                          onClick={(e) => handleCtaClick(slide, e)}
                          style={{
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #e5e7eb',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            fontSize: '13px',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {slide.ctaText}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Dot Indicators */}
        {slides.length > 1 && (carouselSettings.showDots !== false) && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '8px'
          }}>
            {slides.map((_, index) => (
              <div
                key={index}
                onClick={(e) => handleDotClick(index, e)}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: index === currentIndex ? '#007bff' : '#d1d5db',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  boxShadow: index === currentIndex ? '0 2px 4px rgba(0, 123, 255, 0.3)' : 'none'
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

