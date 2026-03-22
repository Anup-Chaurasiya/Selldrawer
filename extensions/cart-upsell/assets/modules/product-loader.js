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
    return;
  }

  try {
    const firstItem = cart.items[0];
    const productId = firstItem.product_id;

    if (!productId) {
      console.warn('Selldrawer: Product ID not found in cart item');
      return;
    }

    const maxProducts = recommendations.maxProducts || 4;

    // Helper function to fetch recommendations by intent
    const fetchRecommendationsByIntent = async (intent) => {
      const recommendationsUrl = `/recommendations/products.json?product_id=${productId}&intent=${intent}&limit=${maxProducts}`;
      const response = await fetch(recommendationsUrl);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const rawProducts = data.products || [];

      const shopifyRecommendations = rawProducts
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
              variant.inventory_quantity === undefined ||
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

      // Filter out products already in cart
      const filteredRecommendations = shopifyRecommendations.filter(rec => {
        const productInCart = cart.items.some(item => {
          if (item.handle && item.handle === rec.handle) {
            return true;
          }
          return false;
        });
        return !productInCart;
      });

      return filteredRecommendations;
    };

    // Determine initial intent based on recommendation type
    const primaryIntent = recommendationType === 'complementary' ? 'complementary' : 'related';

    // Fetch primary recommendations
    let finalRecommendations = await fetchRecommendationsByIntent(primaryIntent);
    let didFallback = false;

    // If complementary returns empty and we want complementary, fallback to related
    if (recommendationType === 'complementary' && (!finalRecommendations || finalRecommendations.length === 0)) {
      finalRecommendations = await fetchRecommendationsByIntent('related');
      didFallback = true;
    }

    // Set the final recommendations
    if (!recommendations.products) {
      recommendations.products = [];
    }

    if (finalRecommendations && finalRecommendations.length > 0) {
      recommendations.products = finalRecommendations.slice(0, maxProducts);
    } else {
      recommendations.products = [];
    }

  } catch (error) {
    console.error('Selldrawer: Error loading Shopify recommendations:', error);
    if (recommendations) {
      recommendations.products = [];
    }
  }
}
