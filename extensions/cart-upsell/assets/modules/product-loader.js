/**
 * Product data loading module
 */

/**
 * Load product compare_at_prices for cart items
 */
export async function loadProductCompareAtPrices(cart) {
  const productCompareAtPrices = {};
  
  if (!cart || !cart.items) {
    return productCompareAtPrices;
  }

  const itemsToFetch = cart.items.filter(item => {
    const linePrice = item.line_price || (item.price * item.quantity);
    const hasOriginalLinePrice = item.original_line_price && item.original_line_price > linePrice;
    return !hasOriginalLinePrice && (item.handle || item.product_id) && item.variant_id;
  });

  for (const item of itemsToFetch) {
    try {
      let productHandle = item.handle;
      
      if (!productHandle && item.url) {
        const urlMatch = item.url.match(/\/products\/([^\/]+)/);
        if (urlMatch) {
          productHandle = urlMatch[1];
        }
      }
      
      if (productHandle) {
        const productResponse = await fetch(`/products/${productHandle}.js`);
        if (productResponse.ok) {
          const product = await productResponse.json();
          const variant = product.variants.find(v => {
            const variantId = v.id.toString();
            const itemVariantId = item.variant_id.toString();
            return variantId === itemVariantId || 
                   variantId.replace('gid://shopify/ProductVariant/', '') === itemVariantId ||
                   variantId === itemVariantId.replace('gid://shopify/ProductVariant/', '');
          });
          
          if (variant && variant.compare_at_price) {
            let compareAtPrice;
            if (typeof variant.compare_at_price === 'string') {
              compareAtPrice = parseInt(variant.compare_at_price, 10);
            } else if (typeof variant.compare_at_price === 'number') {
              compareAtPrice = variant.compare_at_price > 1000 
                ? Math.round(variant.compare_at_price) 
                : Math.round(variant.compare_at_price * 100);
            } else {
              compareAtPrice = Math.round(parseFloat(variant.compare_at_price) * 100);
            }
            
            if (compareAtPrice > 0) {
              productCompareAtPrices[item.variant_id] = compareAtPrice;
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load compare_at_price for product:', item.title, error);
    }
  }
  
  return productCompareAtPrices;
}

/**
 * Load Shopify product recommendations
 */
export async function loadShopifyRecommendations(cart, config) {
  const recommendations = config?.features?.productRecommendations;
  if (!recommendations) {
    return;
  }

  const recommendationType = recommendations.recommendationType;
  
  if (recommendationType !== 'related' && recommendationType !== 'complementary') {
    return;
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    console.log('Upsellity: No items in cart, skipping Shopify recommendations');
    return;
  }

  try {
    const firstItem = cart.items[0];
    const productId = firstItem.product_id;
    
    if (!productId) {
      console.warn('Upsellity: Product ID not found in cart item');
      return;
    }

    const intent = recommendationType === 'complementary' ? 'complementary' : 'related';
    const maxProducts = recommendations.maxProducts || 4;
    
    const recommendationsUrl = `/recommendations/products.json?product_id=${productId}&intent=${intent}&limit=${maxProducts}`;
    console.log('Upsellity: Fetching Shopify recommendations', { productId, intent, url: recommendationsUrl });
    
    const response = await fetch(recommendationsUrl);
    
    if (response.ok) {
      const data = await response.json();
      const shopifyRecommendations = (data.products || [])
        .map(product => {
          let variantId = null;
          if (product.variants?.[0]?.id) {
            const idStr = product.variants[0].id.toString();
            if (idStr.includes('gid://')) {
              variantId = idStr.replace('gid://shopify/ProductVariant/', '');
            } else {
              variantId = idStr;
            }
          }
          
          const variant = product.variants?.[0];
          const isAvailable = variant ? (
            variant.available !== false && 
            (variant.inventory_management === null || 
             variant.inventory_quantity === null || 
             variant.inventory_quantity > 0)
          ) : false;
          
          return {
            shopifyProductId: product.handle,
            shopifyVariantId: variantId,
            title: product.title,
            handle: product.handle,
            price: variant?.price ? parseFloat(variant.price) / 100 : 0,
            compareAtPrice: variant?.compare_at_price 
              ? parseFloat(variant.compare_at_price) / 100 
              : null,
            imageUrl: product.featured_image,
            position: 0,
            available: isAvailable
          };
        })
        .filter(rec => rec.available);

      const cartProductIds = new Set(cart.items.map(item => item.product_id.toString()));
      const filteredRecommendations = shopifyRecommendations.filter(rec => {
        const productInCart = cart.items.some(item => {
          if (item.handle && item.handle === rec.handle) {
            return true;
          }
          return false;
        });
        return !productInCart;
      });

      if (!recommendations.products) {
        recommendations.products = [];
      }
      recommendations.products = filteredRecommendations.slice(0, maxProducts);
      
      console.log(`Upsellity: Loaded ${filteredRecommendations.length} Shopify recommendations (${intent}), filtered from ${shopifyRecommendations.length} total`);
    } else {
      console.warn(`Upsellity: Failed to fetch Shopify recommendations (${response.status} ${response.statusText}). Shopify recommendations may not be enabled for your store.`);
      recommendations.products = [];
    }
  } catch (error) {
    console.error('Upsellity: Error loading Shopify recommendations:', error);
    if (recommendations) {
      recommendations.products = [];
    }
  }
}
