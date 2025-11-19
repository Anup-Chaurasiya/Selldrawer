/**
 * FBT Widget Wrapper for use in Shopify storefront
 * This bridges the gap between the shared component and the Shopify environment
 */

import React from 'react';
import { FBTWidget } from '../../../../../app/components/shared/FBTWidget.tsx';

export const FBTWidgetWrapper = ({
  config,
  recommendations,
  onAddToCart,
  shop
}) => {
  const handleAddToCart = async (selectedIds) => {
    const items = [];
    
    // Fetch each product to get the variant ID
    for (const rec of recommendations) {
      const variantId = rec.variantId || rec.id;
      if (selectedIds.has(variantId)) {
        try {
          const response = await fetch(`/products/${rec.handle}.js`);
          if (response.ok) {
            const productData = await response.json();
            items.push({
              id: productData.variants?.[0]?.id,
              quantity: 1
            });
          }
        } catch (error) {
          console.error('Error fetching product:', error);
        }
      }
    }

    // Add items to cart
    if (items.length > 0) {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items })
      });

      if (response.ok) {
        // Trigger cart update event
        document.dispatchEvent(new CustomEvent('cart:updated'));
        
        // Open cart drawer if it exists
        if (window.upsellityDrawer && typeof window.upsellityDrawer.open === 'function') {
          setTimeout(() => {
            window.upsellityDrawer.open();
          }, 1500);
        }
        
        return true;
      } else {
        throw new Error('Failed to add items to cart');
      }
    }
    
    return false;
  };

  return (
    <FBTWidget
      config={config}
      recommendations={recommendations}
      onAddToCart={onAddToCart ? handleAddToCart : undefined}
      isPreview={false}
    />
  );
};

