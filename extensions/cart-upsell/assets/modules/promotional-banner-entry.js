/**
 * Promotional Banner Block Entry Point
 * Standalone promotional banner that can be embedded anywhere on the site
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { PromotionalBannerWrapper } from './components/PromotionalBannerWrapper.jsx';

// Version info
const VERSION = typeof __PROMOTIONAL_BANNER_VERSION__ !== 'undefined' 
  ? __PROMOTIONAL_BANNER_VERSION__ 
  : '1.0.0';

console.log(`🎨 Upsellity Promotional Banner Block v${VERSION} loaded`);

// Initialize promotional banner blocks
function initPromotionalBannerBlocks() {
  // Find all promotional banner containers
  const containers = document.querySelectorAll('.upsellity-promotional-banner-container');
  
  if (containers.length === 0) {
    console.log('No promotional banner containers found');
    return;
  }

  containers.forEach((container) => {
    const appUrl = container.getAttribute('data-app-url');
    const shop = container.getAttribute('data-shop');

    if (!appUrl || !shop) {
      console.error('Missing required attributes: data-app-url or data-shop');
      return;
    }

    // Show loading state
    container.innerHTML = `
      <div style="
        padding: 40px 20px;
        text-align: center;
        background: #f9fafb;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
      ">
        <div style="
          display: inline-block;
          width: 24px;
          height: 24px;
          border: 3px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        <p style="
          margin-top: 12px;
          color: #6b7280;
          font-size: 14px;
        ">Loading promotional banner...</p>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;

    // Fetch promotional banner data
    const apiUrl = `${appUrl}/api/promotional-banner?shop=${encodeURIComponent(shop)}`;
    
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Clear loading state
        container.innerHTML = '';

        // Check if banner is enabled and has slides
        if (!data.enabled || !data.slides || data.slides.length === 0) {
          console.log('Promotional banner is disabled or has no slides');
          container.style.display = 'none';
          return;
        }

        // Create React root and render
        const root = createRoot(container);
        root.render(
          <PromotionalBannerWrapper
            slides={data.slides}
            carouselSettings={data.carouselSettings}
            isPreview={false}
          />
        );
      })
      .catch(error => {
        console.error('Error loading promotional banner:', error);
        container.innerHTML = `
          <div style="
            padding: 20px;
            text-align: center;
            background: #fef2f2;
            border-radius: 12px;
            border: 1px solid #fecaca;
          ">
            <p style="
              color: #991b1b;
              font-size: 14px;
              margin: 0;
            ">Failed to load promotional banner</p>
          </div>
        `;
      });
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPromotionalBannerBlocks);
} else {
  initPromotionalBannerBlocks();
}

// Also watch for dynamically added containers
if (typeof MutationObserver !== 'undefined') {
  const observer = new MutationObserver((mutations) => {
    let shouldInit = false;
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          if (node.classList?.contains('upsellity-promotional-banner-container') ||
              node.querySelector?.('.upsellity-promotional-banner-container')) {
            shouldInit = true;
          }
        }
      });
    });
    if (shouldInit) {
      initPromotionalBannerBlocks();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

