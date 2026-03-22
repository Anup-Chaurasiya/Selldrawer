/**
 * FBT Widget Wrapper for use in Shopify storefront
 * This bridges the gap between the shared component and the Shopify environment
 */

import React from 'react';
import { FBTWidget } from '../../../../../app/components/shared/FBTWidget.tsx';

export const FBTWidgetWrapper = ({
  config,
  recommendations,
  parentProduct,
  onAddToCart,
  shop
}) => {
  const handleAddToCart = async (selectedIds) => {
    const items = [];
    const discountCode = config.discountCode;

    // Calculate total bundle size (selected items + parent product if it exists)
    const totalBundleSize = selectedIds.size + (parentProduct ? 1 : 0);

    console.log('FBT: Preparing bundle:', {
      selectedCount: selectedIds.size,
      hasParent: !!parentProduct,
      totalBundleSize,
      discountCode
    });

    // Add parent product first if it exists (FBT parent is always included in bundle)
    if (parentProduct) {
      try {
        const response = await fetch(`/products/${parentProduct.handle}.js`);
        if (response.ok) {
          const productData = await response.json();
          items.push({
            id: productData.variants?.[0]?.id,
            quantity: 1,
            properties: {
              _fbt_discount_code: discountCode,
              _fbt_bundle_size: totalBundleSize.toString(),
              _fbt_item_type: 'parent'
            }
          });
        }
      } catch (error) {
        console.error('Error fetching parent product:', error);
      }
    }

    // Fetch each selected product to get the variant ID and add FBT properties
    for (const rec of recommendations) {
      const variantId = rec.variantId || rec.id;
      if (selectedIds.has(variantId)) {
        try {
          const response = await fetch(`/products/${rec.handle}.js`);
          if (response.ok) {
            const productData = await response.json();
            items.push({
              id: productData.variants?.[0]?.id,
              quantity: 1,
              properties: {
                _fbt_discount_code: discountCode,
                _fbt_bundle_size: totalBundleSize.toString(),
                _fbt_item_type: 'recommendation'
              }
            });
          }
        } catch (error) {
          console.error('Error fetching product:', error);
        }
      }
    }

    console.log('FBT: Adding items to cart with properties:', items);

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

        console.log('=== FBT: Items added to cart successfully ===');
        console.log('FBT config:', config);
        console.log('Has discount code?', !!config.discountCode);
        console.log('Discount code value:', config.discountCode);

        // Open cart drawer if it exists
        if (window.selldrawerDrawer && typeof window.selldrawerDrawer.open === 'function') {
          console.log('FBT: Opening cart drawer in 1.5s...');
          setTimeout(() => {
            window.selldrawerDrawer.open();
            console.log('FBT: Cart drawer opened');

            // Apply discount code if available
            if (config.discountCode) {
              console.log('=== FBT: Attempting to apply discount code ===');
              console.log('Discount code:', config.discountCode);
              console.log('applyCouponWithCode available?', typeof window.selldrawerDrawer.applyCouponWithCode);

              if (window.selldrawerDrawer.applyCouponWithCode) {
                // Wait a bit more for cart to fully load, then apply discount
                setTimeout(() => {
                  try {
                    console.log('FBT: Calling applyCouponWithCode with:', config.discountCode);
                    window.selldrawerDrawer.applyCouponWithCode(config.discountCode);
                    console.log('=== FBT: Discount code applied successfully ===');
                  } catch (error) {
                    console.error('=== FBT: Failed to apply discount ===', error);
                  }
                }, 800);
              } else {
                console.error('FBT: applyCouponWithCode method not found on selldrawerDrawer');
              }
            } else {
              console.log('FBT: No discount code in config to apply');
            }
          }, 1500);
        } else {
          console.error('FBT: selldrawerDrawer not found or open method not available');
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
      parentProduct={parentProduct}
      onAddToCart={onAddToCart ? handleAddToCart : undefined}
      isPreview={false}
    />
  );
};

