/**
 * Shared Promotional Banner Component
 * Used in both production cart drawer and Remix preview
 */

import React, { useState, useEffect } from 'react';

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
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0` : null;
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
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Auto-rotate carousel
  useEffect(() => {
    if (slides && 
        slides.length > 1 && 
        carouselSettings.autoRotate !== false) {
      const interval = setInterval(() => {
        setCarouselIndex((prev) => (prev + 1) % slides.length);
      }, carouselSettings.rotationSpeed || 5000);
      return () => clearInterval(interval);
    }
  }, [slides, carouselSettings]);

  if (!slides || slides.length === 0) {
    return (
      <div style={{
        marginBottom: '16px',
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
          height: isPreview ? '200px' : '160px',
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
              width: isPreview ? '24px' : '32px',
              height: isPreview ? '24px' : '32px',
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
              width: isPreview ? '24px' : '32px',
              height: isPreview ? '24px' : '32px',
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
          padding: isPreview ? '12px 16px' : '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          minHeight: isPreview ? '70px' : '60px'
        }}>
          {/* Title & Description - Left Side */}
          <div style={{ 
            flex: 1,
            textAlign: 'left',
            minWidth: 0
          }}>
            <div style={{ 
              fontWeight: '700', 
              fontSize: isPreview ? '15px' : '18px', 
              color: '#111827',
              marginBottom: '4px',
              lineHeight: '1.3',
              wordBreak: 'break-word'
            }}>
              Summer Sale
            </div>
            <div style={{ 
              fontSize: isPreview ? '12px' : '14px', 
              color: '#6b7280',
              lineHeight: '1.4',
              wordBreak: 'break-word'
            }}>
              Get 20% Off on Summer Items
            </div>
          </div>

          {/* CTA Button - Right Side */}
          <div style={{ flexShrink: 0 }}>
            <button style={{
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #e5e7eb',
              padding: '8px 20px',
              borderRadius: isPreview ? '8px' : '6px',
              fontWeight: isPreview ? '500' : '600',
              cursor: 'pointer',
              fontSize: isPreview ? '13px' : '14px',
              transition: 'all 0.2s ease',
              minWidth: '80px'
            }}>
              shop
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentSlide = slides[carouselIndex] || slides[0];

  // Render media based on type
  const renderMedia = () => {
    if (currentSlide.videoUrl && currentSlide.videoType) {
      if (currentSlide.videoType === 'youtube') {
        const embedUrl = getYouTubeEmbedUrl(currentSlide.videoUrl);
        if (embedUrl) {
          return (
            <iframe
              src={embedUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                objectFit: 'cover'
              }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          );
        }
      } else if (currentSlide.videoType === 'vimeo') {
        const embedUrl = getVimeoEmbedUrl(currentSlide.videoUrl);
        if (embedUrl) {
          return (
            <iframe
              src={embedUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                objectFit: 'cover'
              }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          );
        }
      } else if (currentSlide.videoType === 'mp4') {
        return (
          <video
            src={currentSlide.videoUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
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
        src={currentSlide.imageUrl || 'https://via.placeholder.com/400x200'}
        alt="Promotional banner"
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover'
        }}
      />
    );
  };

  const handlePrevious = () => {
    setCarouselIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCarouselIndex((prev) => (prev + 1) % slides.length);
  };

  const handleDotClick = (index: number) => {
    setCarouselIndex(index);
  };

  const handleCtaClick = () => {
    if (currentSlide.ctaUrl && onCtaClick) {
      onCtaClick(currentSlide.ctaUrl);
    }
  };

  return (
    <div style={{
      marginBottom: '16px',
      borderRadius: isPreview ? '12px' : '10px',
      overflow: 'hidden',
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      boxShadow: isPreview ? '0 1px 3px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {/* Media Section */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        height: isPreview ? '200px' : '160px',
        backgroundColor: isPreview ? '#f9fafb' : '#000'
      }}>
        {/* Media (Image or Video) */}
        {renderMedia()}

        {/* Dot Indicators */}
        {slides.length > 1 && (carouselSettings.showDots !== false) && (
          <div style={{
            position: 'absolute',
            bottom: '6px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: isPreview ? '4px' : '8px',
            zIndex: 10
          }}>
            {slides.map((_, index) => (
              <div 
                key={index} 
                onClick={() => handleDotClick(index)}
                style={{
                  width: isPreview ? '6px' : '12px',
                  height: isPreview ? '6px' : '12px',
                  borderRadius: '50%',
                  backgroundColor: index === carouselIndex ? '#007bff' : 'rgba(255,255,255,0.6)',
                  border: isPreview ? '1px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.9)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  boxShadow: isPreview ? '0 1px 2px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.2)'
                }} 
              />
            ))}
          </div>
        )}

        {/* Navigation Arrows */}
        {slides.length > 1 && (carouselSettings.showArrows !== false) && (
          <>
            <button
              onClick={handlePrevious}
              style={{
                position: 'absolute',
                left: isPreview ? '4px' : '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: '50%',
                width: isPreview ? '24px' : '32px',
                height: isPreview ? '24px' : '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: 'none',
                fontSize: isPreview ? '14px' : '18px',
                fontWeight: 'bold',
                color: '#333',
                boxShadow: isPreview ? '0 2px 6px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              ‹
            </button>
            <button
              onClick={handleNext}
              style={{
                position: 'absolute',
                right: isPreview ? '4px' : '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: '50%',
                width: isPreview ? '24px' : '32px',
                height: isPreview ? '24px' : '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: 'none',
                fontSize: isPreview ? '14px' : '18px',
                fontWeight: 'bold',
                color: '#333',
                boxShadow: isPreview ? '0 2px 6px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              ›
            </button>
          </>
        )}
      </div>
      
      {/* Text Content Section (Below Image) */}
      <div style={{
        backgroundColor: '#fff',
        padding: isPreview ? '12px 16px' : '10px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        minHeight: isPreview ? '70px' : '60px'
      }}>
        {/* Title & Description - Left Side */}
        {(currentSlide.title || currentSlide.description) && (
          <div style={{ 
            flex: 1,
            textAlign: 'left',
            minWidth: 0
          }}>
            {currentSlide.title && (
              <div style={{ 
                fontWeight: '700', 
                fontSize: isPreview ? '15px' : '18px', 
                color: isPreview ? '#111827' : '#1f2937',
                marginBottom: currentSlide.description ? (isPreview ? '4px' : '2px') : '0',
                lineHeight: '1.3',
                wordBreak: 'break-word'
              }}>
                {currentSlide.title}
              </div>
            )}
            {currentSlide.description && (
              <div style={{ 
                fontSize: isPreview ? '12px' : '14px', 
                color: '#6b7280',
                lineHeight: '1.4',
                wordBreak: 'break-word'
              }}>
                {currentSlide.description}
              </div>
            )}
          </div>
        )}

        {/* CTA Button - Right Side */}
        {currentSlide.ctaText && (
          <div style={{ flexShrink: 0 }}>
            <button 
              onClick={handleCtaClick}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #e5e7eb',
                padding: isPreview ? '8px 20px' : '8px 16px',
                borderRadius: isPreview ? '8px' : '6px',
                fontWeight: isPreview ? '500' : '600',
                cursor: 'pointer',
                fontSize: isPreview ? '13px' : '14px',
                transition: 'all 0.2s ease',
                minWidth: isPreview ? '80px' : '110px',
                boxShadow: isPreview ? 'none' : '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              {currentSlide.ctaText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

