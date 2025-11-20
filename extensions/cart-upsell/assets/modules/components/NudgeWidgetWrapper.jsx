/**
 * Nudge Widget Wrapper for use in Shopify storefront
 * This bridges the gap between the shared component and the Shopify environment
 */

import React from 'react';
import { NudgeWidget } from '../../../../../app/components/shared/NudgeWidget.tsx';

export const NudgeWidgetWrapper = ({
  config,
  recommendations,
  onClose,
  onContinue,
  onSelectProduct,
  onSelectAll,
  isVisible = true
}) => {
  const handleSelectProduct = async (product) => {
    if (onSelectProduct) {
      await onSelectProduct(product);
      return;
    }

    try {
      const formData = {
        items: [{
          id: product.variantId || product.id,
          quantity: 1
        }]
      };

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        document.dispatchEvent(new CustomEvent('cart:updated'));
        
        // Open cart drawer if available
        setTimeout(() => {
          const cartDrawerToggle = document.querySelector('[data-cart-drawer-toggle]') || 
                                   document.querySelector('.cart-drawer-toggle') ||
                                   document.querySelector('[aria-controls*="cart"]');
          if (cartDrawerToggle) {
            cartDrawerToggle.click();
          }
        }, 200);
      }
    } catch (error) {
      console.error('Error adding product to cart:', error);
    }
  };

  const handleSelectAll = async (products) => {
    if (onSelectAll) {
      await onSelectAll(products);
      return;
    }

    try {
      const itemsToAdd = [];
      
      for (const product of products) {
        try {
          const productResponse = await fetch(`/products/${product.handle}.js`);
          if (productResponse.ok) {
            const productData = await productResponse.json();
            if (productData.variants && productData.variants.length > 0) {
              itemsToAdd.push({
                id: productData.variants[0].id,
                quantity: 1
              });
            }
          }
        } catch (error) {
          console.error('Error fetching product:', error);
        }
      }
      
      if (itemsToAdd.length > 0) {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items: itemsToAdd })
        });
        
        if (response.ok) {
          await new Promise(resolve => setTimeout(resolve, 150));
          document.dispatchEvent(new CustomEvent('cart:updated'));
          
          setTimeout(() => {
            const cartDrawerToggle = document.querySelector('[data-cart-drawer-toggle]') || 
                                     document.querySelector('.cart-drawer-toggle') ||
                                     document.querySelector('[aria-controls*="cart"]');
            if (cartDrawerToggle) {
              cartDrawerToggle.click();
            }
          }, 200);
        }
      }
    } catch (error) {
      console.error('Error adding products to cart:', error);
    }
  };

  return (
    <NudgeWidget
      config={config}
      recommendations={recommendations}
      onClose={onClose}
      onContinue={onContinue}
      onSelectProduct={handleSelectProduct}
      onSelectAll={handleSelectAll}
      isVisible={isVisible}
      isPreview={false}
    />
  );
};

