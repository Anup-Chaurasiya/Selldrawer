/**
 * Carousel management module - handles all carousel functionality
 */

import { getYouTubeEmbedUrl, getVimeoEmbedUrl } from './utils.js';

/**
 * Initialize promotional banner carousel
 */
export function initializePromoCarousel(carouselId, slides, settings) {
  const carousel = document.getElementById(carouselId);
  if (!carousel || slides.length <= 1) return;

  const track = carousel.querySelector('.upsellity-promo-carousel-track');
  const dots = carousel.querySelectorAll('[data-dot-index]');
  const prevEdge = carousel.querySelector('.upsellity-promo-prev-edge');
  const nextEdge = carousel.querySelector('.upsellity-promo-next-edge');
  
  const textContents = document.querySelectorAll('[data-slide-text]');
  const ctaButtons = document.querySelectorAll('[data-slide-cta]');
  
  if (!track) return;

  let currentIndex = 0;
  let autoRotateInterval;

  const updateCarousel = () => {
    const translateX = -currentIndex * 100;
    track.style.transform = `translateX(${translateX}%)`;
    
    dots.forEach((dot, index) => {
      if (index === currentIndex) {
        dot.style.backgroundColor = '#007bff';
      } else {
        dot.style.backgroundColor = 'rgba(255,255,255,0.6)';
      }
    });

    textContents.forEach((content, index) => {
      content.style.display = index === currentIndex ? 'block' : 'none';
    });

    ctaButtons.forEach((button, index) => {
      button.style.display = index === currentIndex ? 'block' : 'none';
    });

    if (prevEdge && nextEdge) {
      const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
      const nextIndex = (currentIndex + 1) % slides.length;
      
      if (currentIndex > 0) {
        prevEdge.style.display = 'block';
        prevEdge.innerHTML = `<img src="${slides[prevIndex].imageUrl}" alt="Previous" style="width: 100%; height: 100%; object-fit: cover;" />`;
      } else {
        prevEdge.style.display = 'none';
      }
      
      if (currentIndex < slides.length - 1) {
        nextEdge.style.display = 'block';
        nextEdge.innerHTML = `<img src="${slides[nextIndex].imageUrl}" alt="Next" style="width: 100%; height: 100%; object-fit: cover;" />`;
      } else {
        nextEdge.style.display = 'none';
      }
    }
  };

  const nextSlide = () => {
    currentIndex = (currentIndex + 1) % slides.length;
    updateCarousel();
  };

  const prevSlide = () => {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateCarousel();
  };

  const goToSlide = (index) => {
    currentIndex = index;
    updateCarousel();
  };

  window.upsellityDrawer.promoCarouselNext = (id) => {
    if (id === carouselId) nextSlide();
  };
  
  window.upsellityDrawer.promoCarouselPrev = (id) => {
    if (id === carouselId) prevSlide();
  };
  
  window.upsellityDrawer.promoCarouselGoTo = (id, index) => {
    if (id === carouselId) goToSlide(index);
  };

  if (settings.autoRotate !== false) {
    const rotationSpeed = settings.rotationSpeed || 5000;
    autoRotateInterval = setInterval(nextSlide, rotationSpeed);
    
    carousel.addEventListener('mouseenter', () => {
      if (autoRotateInterval) {
        clearInterval(autoRotateInterval);
      }
    });
    
    carousel.addEventListener('mouseleave', () => {
      if (settings.autoRotate !== false) {
        autoRotateInterval = setInterval(nextSlide, rotationSpeed);
      }
    });
  }

  carousel._cleanup = () => {
    if (autoRotateInterval) {
      clearInterval(autoRotateInterval);
    }
  };
}

/**
 * Render slide media (image or video)
 */
export function renderSlideMedia(slide) {
  if (slide.videoUrl && slide.videoType) {
    if (slide.videoType === 'youtube') {
      const embedUrl = getYouTubeEmbedUrl(slide.videoUrl);
      if (embedUrl) {
        return `<iframe
          src="${embedUrl}"
          style="width: 100%; height: 100%; border: none; object-fit: cover;"
          allow="autoplay; encrypted-media"
          allowfullscreen
        ></iframe>`;
      }
    } else if (slide.videoType === 'vimeo') {
      const embedUrl = getVimeoEmbedUrl(slide.videoUrl);
      if (embedUrl) {
        return `<iframe
          src="${embedUrl}"
          style="width: 100%; height: 100%; border: none; object-fit: cover;"
          allow="autoplay; encrypted-media"
          allowfullscreen
        ></iframe>`;
      }
    } else if (slide.videoType === 'mp4') {
      return `<video 
        src="${slide.videoUrl}"
        style="width: 100%; height: 100%; object-fit: cover;"
        muted
        loop
        autoplay
        playsinline
      ></video>`;
    }
  }
  return `<img 
    src="${slide.imageUrl || 'https://via.placeholder.com/400x200'}" 
    alt="Promotional slide"
    style="width: 100%; height: 100%; object-fit: cover;"
  />`;
}

/**
 * Initialize product recommendations navigation
 */
export function initializeRecommendationsNavigation() {
  const gridLayout = document.querySelector('.upsellity-recommendations-grid-layout');
  if (gridLayout) return;
  
  const grid = document.querySelector('.upsellity-recommendations-grid');
  const leftArrow = document.querySelector('.upsellity-nav-left');
  const rightArrow = document.querySelector('.upsellity-nav-right');
  
  if (!grid || !leftArrow || !rightArrow) return;
  
  const needsScrolling = grid.scrollWidth > grid.clientWidth;
  
  const updateArrows = () => {
    const maxScrollLeft = grid.scrollWidth - grid.clientWidth;
    const currentScroll = grid.scrollLeft;
    
    const showLeft = currentScroll > 0;
    const showRight = currentScroll < maxScrollLeft;
    
    leftArrow.style.display = showLeft ? 'flex' : 'none';
    rightArrow.style.display = showRight ? 'flex' : 'none';
    
    grid.style.paddingLeft = showLeft ? '40px' : '0';
    grid.style.paddingRight = showRight ? '40px' : '0';
  };
  
  if (needsScrolling) {
    updateArrows();
    grid.addEventListener('scroll', updateArrows);
  } else {
    leftArrow.style.display = 'none';
    rightArrow.style.display = 'none';
    grid.style.paddingLeft = '0';
    grid.style.paddingRight = '0';
  }
}

/**
 * Scroll product recommendations
 */
export function scrollRecommendations(direction) {
  const gridLayout = document.querySelector('.upsellity-recommendations-grid-layout');
  if (gridLayout) return;
  
  const grid = document.querySelector('.upsellity-recommendations-grid');
  if (!grid) return;
  
  const scrollAmount = 140;
  
  if (direction === 'left') {
    grid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  } else if (direction === 'right') {
    grid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
}

