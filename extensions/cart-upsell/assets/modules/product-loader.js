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
          const normalizeVariantId = (id) => {
            if (!id) return null;
            const idStr = id.toString();
            return idStr.includes('gid://') ? idStr.replace('gid://shopify/ProductVariant/', '') : idStr;
          };

          const firstVariant = product.variants?.[0];
          const firstVariantId = normalizeVariantId(firstVariant?.id);

          const isAvailable = firstVariant ? (
            firstVariant.available !== false &&
            (firstVariant.inventory_management === null ||
              firstVariant.inventory_quantity === null ||
              firstVariant.inventory_quantity === undefined ||
              firstVariant.inventory_quantity > 0)
          ) : false;

          // Map all variants for the variant picker
          const variants = (product.variants || []).map(v => ({
            id: normalizeVariantId(v.id),
            title: v.title || 'Default Title',
            available: v.available !== false &&
              (v.inventory_management === null ||
               v.inventory_quantity === null ||
               v.inventory_quantity === undefined ||
               v.inventory_quantity > 0),
            price: v.price ? Math.round(parseFloat(v.price)) : 0,
            compareAtPrice: v.compare_at_price ? Math.round(parseFloat(v.compare_at_price)) : null,
            option1: v.option1 || null,
            option2: v.option2 || null,
            option3: v.option3 || null,
            featured_image: v.featured_image ? { url: v.featured_image.url || v.featured_image } : null,
          }));

          // Shopify product.options is array of option names e.g. ['Size', 'Color']
          const options = (product.options || []).map(o => (typeof o === 'string' ? o : o.name)).filter(Boolean);

          return {
            shopifyProductId: product.handle,
            shopifyVariantId: firstVariantId,
            title: product.title,
            handle: product.handle,
            price: firstVariant?.price ? parseFloat(firstVariant.price) / 100 : 0,
            compareAtPrice: firstVariant?.compare_at_price
              ? parseFloat(firstVariant.compare_at_price) / 100
              : null,
            imageUrl: product.featured_image,
            position: 0,
            available: isAvailable,
            variants,
            options,
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

/**
 * Load dynamic Free Shipping Upsells using Shopify Recommendations API
 */
export async function loadDynamicFreeShippingUpsells(cart, config) {
  const fsb = config?.features?.freeShippingProgressBar;
  if (!fsb || !fsb.showProductUpsell) {
    return;
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return;
  }

  try {
    const firstItem = cart.items[0];
    const productId = firstItem.product_id;

    if (!productId) {
      return;
    }

    // Fetch related products (AI-driven)
    const recommendationsUrl = `/recommendations/products.json?product_id=${productId}&intent=related&limit=10`;
    console.log('[Cart Drawer] Fetching dynamic upsells from:', recommendationsUrl);

    const response = await fetch(recommendationsUrl);

    if (!response.ok) {
      console.error('[Cart Drawer] Recommendations API failed:', response.status);
      return;
    }

    const data = await response.json();
    const rawProducts = data.products || [];
    console.log(`[Cart Drawer] Shopify returned ${rawProducts.length} recommendations`);

    // Calculate gap
    const cartTotal = cart.total_price / 100;
    const threshold = fsb.thresholdAmount;
    const gap = threshold - cartTotal;
    console.log(`[Cart Drawer] Cart total: ${cartTotal}, Threshold: ${threshold}, Gap: ${gap}`);

    const dynamicUpsells = rawProducts
      .map(product => {
        const normalizeVariantId = (id) => {
          if (!id) return null;
          const idStr = id.toString();
          return idStr.includes('gid://') ? idStr.replace('gid://shopify/ProductVariant/', '') : idStr;
        };

        const firstVariant = product.variants?.[0];
        const variantId = normalizeVariantId(firstVariant?.id);
        const price = firstVariant?.price ? parseFloat(firstVariant.price) / 100 : 0;

        const isAvailable = firstVariant ? (
          firstVariant.available !== false &&
          (firstVariant.inventory_management === null ||
            firstVariant.inventory_quantity === null ||
            firstVariant.inventory_quantity === undefined ||
            firstVariant.inventory_quantity > 0)
        ) : false;

        // Map all variants for the variant picker
        const variants = (product.variants || []).map(v => ({
          id: normalizeVariantId(v.id),
          title: v.title || 'Default Title',
          available: v.available !== false &&
            (v.inventory_management === null ||
             v.inventory_quantity === null ||
             v.inventory_quantity === undefined ||
             v.inventory_quantity > 0),
          price: v.price ? Math.round(parseFloat(v.price)) : 0,
          compareAtPrice: v.compare_at_price ? Math.round(parseFloat(v.compare_at_price)) : null,
          option1: v.option1 || null,
          option2: v.option2 || null,
          option3: v.option3 || null,
          featured_image: v.featured_image ? { url: v.featured_image.url || v.featured_image } : null,
        }));

        // Shopify product.options is array of option names
        const options = (product.options || []).map(o => (typeof o === 'string' ? o : o.name)).filter(Boolean);

        return {
          id: variantId,
          variantId: variantId,
          shopifyProductId: product.id?.toString() || product.handle,
          shopifyVariantId: variantId,
          title: product.title,
          handle: product.handle,
          price: price,
          compareAtPrice: firstVariant?.compare_at_price ? parseFloat(firstVariant.compare_at_price) / 100 : null,
          imageUrl: product.featured_image,
          available: isAvailable,
          variants,
          options,
        };
      })
      .filter(p => {
        if (!p.available) return false;
        
        // Check if already in cart by variant_id or handle
        const isInCart = cart.items.some(item => {
          const itemVariantId = String(item.variant_id);
          const pVariantId = String(p.variantId);
          return itemVariantId === pVariantId || (item.handle && item.handle === p.handle);
        });
        
        return !isInCart;
      });

    // Logic: if we have products, sort them to be helpful (lowest price first to bridge gap easily)
    const sortedUpsells = dynamicUpsells.sort((a, b) => a.price - b.price);
    const finalUpsells = sortedUpsells.slice(0, 4);
    
    // Update the config object - ensure we replace the array to trigger React updates
    fsb.upsellProducts = [...finalUpsells];

    console.log('[Cart Drawer] Dynamic Free Shipping Upsells Success:', fsb.upsellProducts.length);
  } catch (error) {
    console.error('Selldrawer: Error loading dynamic free shipping upsells:', error);
  }
}


