/**
 * Product Recommendations Renderer
 */

export function renderProductRecommendations(config) {
  if (!config.features.productRecommendations) {
    return '';
  }

  const recommendations = config.features.productRecommendations;
  const recommendedProducts = recommendations.products || [];
  const layout = recommendations.layout || 'carousel';
  const isGrid = layout === 'grid';
  
  let html = `
    <div class="upsellity-recommendations">
      <div class="upsellity-recommendations-title">${recommendations.title}</div>
      <div class="upsellity-recommendations-container" style="position: relative;">
        ${!isGrid ? renderNavigationArrows() : ''}
        
        <div class="${isGrid ? 'upsellity-recommendations-grid-layout' : 'upsellity-recommendations-grid'}" ${isGrid ? 'style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;"' : ''}>
          ${recommendedProducts
            .slice(0, recommendations.maxProducts || 4)
            .map(product => renderProductCard(product, recommendations, isGrid))
            .join('')}
        </div>
      </div>
    </div>
  `;

  return html;
}

function renderNavigationArrows() {
  return `
    <button class="upsellity-nav-arrow upsellity-nav-left" 
            onclick="window.upsellityDrawer.scrollRecommendations('left')"
            style="display: none;">
      <span>‹</span>
    </button>
    
    <button class="upsellity-nav-arrow upsellity-nav-right" 
            onclick="window.upsellityDrawer.scrollRecommendations('right')"
            style="display: none;">
      <span>›</span>
    </button>
  `;
}

function renderProductCard(product, recommendations, isGrid) {
  const productPrice = product.price || 0;
  const productCompareAtPrice = product.compareAtPrice || null;

  const originalPrice = productCompareAtPrice || productPrice;
  const discount = productCompareAtPrice && productCompareAtPrice > productPrice 
    ? Math.round(((productCompareAtPrice - productPrice) / productCompareAtPrice) * 100) 
    : 0;
  
  const isOutOfStock = false;
  
  return `
    <div class="upsellity-recommendation-card" ${isGrid ? '' : 'style="min-width: 140px; flex-shrink: 0;"'}>
      <div class="upsellity-recommendation-image" style="position: relative;">
        ${product.imageUrl ? `
          <img src="${product.imageUrl}" alt="${product.title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px; ${isOutOfStock ? 'opacity: 0.5; filter: grayscale(50%);' : ''}" />
        ` : `
          <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 24px; ${isOutOfStock ? 'opacity: 0.5;' : ''}">📦</div>
        `}
        ${isOutOfStock ? `
          <div style="position: absolute; top: 8px; left: 8px; background-color: #ef4444; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; z-index: 10;">
            Sold Out
          </div>
        ` : recommendations.showDiscountBadge && discount > 0 ? `
          <div style="position: absolute; top: 8px; right: 8px; background-color: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; z-index: 10;">
            ${discount}% off
          </div>
        ` : ''}
      </div>
      <div style="font-size: 13px; font-weight: 500; margin-bottom: 4px; line-height: 1.3;">
        ${product.title.length > 20 ? product.title.substring(0, 20) + '...' : product.title}
      </div>
      <div style="margin-bottom: 4px;">
        ${recommendations.showDiscount && productCompareAtPrice && productCompareAtPrice > productPrice ? `
          <span style="text-decoration: line-through; color: #9ca3af; font-size: 12px; margin-right: 4px;">
            ₹${Math.round(productCompareAtPrice)}
          </span>
        ` : ''}
        <span style="font-weight: 600; font-size: 12px;">₹${Math.round(productPrice)}</span>
      </div>
      ${recommendations.showAddButton ? (
        isOutOfStock ? `
          <button class="upsellity-add-recommendation-btn" 
                  disabled
                  style="width: 100%; padding: 4px 8px; border: 1px solid #d1d5db; background: #f3f4f6; color: #9ca3af; border-radius: 4px; cursor: not-allowed; font-size: 12px; font-weight: 500;">
            Sold Out
          </button>
        ` : `
          <button class="upsellity-add-recommendation-btn" 
                  onclick="window.upsellityDrawer.addProductToCart('${product.shopifyVariantId || product.shopifyProductId}')"
                  style="width: 100%; padding: 4px 8px; border: 1px solid #f97316; background: white; color: #f97316; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.2s ease;">
            + Add
          </button>
        `
      ) : ''}
    </div>
  `;
}

