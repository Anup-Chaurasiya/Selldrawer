/**
 * Promotional Banner Carousel Renderer
 */

import { renderSlideMedia } from '../carousel-manager.js';

export function renderPromotionalBanner(config, initCarouselCallback) {
  if (!config.features.promotionalBanner) {
    return '';
  }

  const banner = config.features.promotionalBanner;
  const slides = banner.images || [];
  const carouselSettings = banner.carouselSettings || {};
  
  if (slides.length === 0) {
    return renderDefaultBanner();
  }

  const carouselId = `upsellity-promo-carousel-${Date.now()}`;
  
  const html = `
    <div class="upsellity-promo-carousel-wrapper" style="
      margin-bottom: 16px;
      border-radius: 10px;
      overflow: hidden;
      background-color: #fff;
      border: 1px solid #e5e7eb;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    ">
      <div class="upsellity-promo-carousel" id="${carouselId}" style="
        position: relative;
        overflow: hidden;
        height: 160px;
        background-color: #000;
      ">
        <div class="upsellity-promo-carousel-track" style="
          display: flex;
          height: 100%;
          transition: transform 0.5s ease;
        ">
          ${slides.map((slide, index) => `
            <div class="upsellity-promo-slide" data-slide-index="${index}" style="
              min-width: 100%;
              height: 100%;
              position: relative;
            ">
              ${renderSlideMedia(slide)}
            </div>
          `).join('')}
        </div>
        
        ${slides.length > 1 && carouselSettings.showArrows !== false ? renderArrows(carouselId) : ''}
        ${slides.length > 1 && carouselSettings.showDots !== false ? renderDots(carouselId, slides) : ''}
        ${slides.length > 1 ? renderEdgePreviews(slides) : ''}
      </div>
      
      ${renderTextSection(slides)}
    </div>
  `;
  
  setTimeout(() => {
    initCarouselCallback(carouselId, slides, carouselSettings);
  }, 100);
  
  return html;
}

function renderArrows(carouselId) {
  return `
    <button 
      onclick="window.upsellityDrawer.promoCarouselPrev('${carouselId}')"
      style="
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        background-color: rgba(255,255,255,0.9);
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border: none;
        font-size: 18px;
        font-weight: bold;
        color: #333;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
        z-index: 10;
      "
    >‹</button>
    <button 
      onclick="window.upsellityDrawer.promoCarouselNext('${carouselId}')"
      style="
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background-color: rgba(255,255,255,0.9);
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border: none;
        font-size: 18px;
        font-weight: bold;
        color: #333;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
        z-index: 10;
      "
    >›</button>
  `;
}

function renderDots(carouselId, slides) {
  return `
    <div style="
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 8px;
      z-index: 10;
    ">
      ${slides.map((_, index) => `
        <button 
          onclick="window.upsellityDrawer.promoCarouselGoTo('${carouselId}', ${index})"
          data-dot-index="${index}"
          style="
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: ${index === 0 ? '#007bff' : 'rgba(255,255,255,0.6)'};
            border: 2px solid rgba(255,255,255,0.9);
            transition: all 0.3s ease;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            padding: 0;
          "
        ></button>
      `).join('')}
    </div>
  `;
}

function renderEdgePreviews(slides) {
  return `
    <div class="upsellity-promo-prev-edge" style="
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 5%;
      overflow: hidden;
      opacity: 0.5;
      pointer-events: none;
      display: none;
    "></div>
    <div class="upsellity-promo-next-edge" style="
      position: absolute;
      right: 0;
      top: 0;
      height: 100%;
      width: 5%;
      overflow: hidden;
      opacity: 0.5;
      pointer-events: none;
      display: block;
    ">
      ${renderSlideMedia(slides[1])}
    </div>
  `;
}

function renderTextSection(slides) {
  return `
    <div class="upsellity-promo-text-section" style="
      background-color: #fff;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 60px;
    ">
      <div class="upsellity-promo-text-container" style="
        flex: 1;
        text-align: left;
        min-width: 0;
      ">
        ${slides.map((slide, index) => `
          <div 
            class="upsellity-promo-text-content"
            data-slide-text="${index}"
            style="display: ${index === 0 ? 'block' : 'none'};"
          >
            ${slide.title ? `
              <div style="
                font-weight: 700;
                font-size: 18px;
                color: #1f2937;
                margin-bottom: ${slide.description ? '2px' : '0'};
                line-height: 1.2;
              ">${slide.title}</div>
            ` : ''}
            ${slide.description ? `
              <div style="
                font-size: 14px;
                color: #6b7280;
                line-height: 1.4;
              ">${slide.description}</div>
            ` : ''}
          </div>
        `).join('')}
      </div>
      
      <div class="upsellity-promo-cta-container" style="flex-shrink: 0;">
        ${slides.map((slide, index) => `
          <button 
            class="upsellity-promo-cta-btn"
            data-slide-cta="${index}"
            onclick="window.upsellityDrawer.handleSlideCtaClick('${slide.ctaUrl || ''}')"
            style="
              display: ${index === 0 ? 'block' : 'none'};
              background-color: #f3f4f6;
              color: #374151;
              border: 1px solid #e5e7eb;
              padding: 8px 16px;
              border-radius: 6px;
              font-weight: 600;
              cursor: pointer;
              font-size: 14px;
              box-shadow: 0 1px 2px rgba(0,0,0,0.05);
              transition: all 0.2s ease;
              min-width: 110px;
              ${!slide.ctaText ? 'visibility: hidden;' : ''}
            "
          >${slide.ctaText || 'Shop Now'}</button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderDefaultBanner() {
  return `
    <div class="upsellity-promo-carousel-wrapper" style="
      margin-bottom: 16px;
      border-radius: 10px;
      overflow: hidden;
      background-color: #fff;
      border: 1px solid #e5e7eb;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    ">
      <div style="
        position: relative;
        overflow: hidden;
        height: 160px;
        background-color: #000;
      ">
        <img 
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=160&fit=crop&crop=center" 
          alt="Sample promotional banner"
          style="width: 100%; height: 100%; object-fit: cover;"
        />
      </div>
      <div style="
        background-color: #fff;
        padding: 10px 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-height: 60px;
      ">
        <div style="flex: 1; text-align: left;">
          <div style="font-weight: 700; font-size: 18px; color: #1f2937; margin-bottom: 2px;">Summer Sale</div>
          <div style="font-size: 14px; color: #6b7280;">Get 20% Off on Summer Items</div>
        </div>
        <button style="
          background-color: #ff6b35;
          color: #ffffff;
          border: none;
          padding: 6px 14px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        ">shop</button>
      </div>
    </div>
  `;
}

