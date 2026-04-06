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
    // Find the first valid product ID in the cart (skipping gifts and shipping protection)
    let productId = null;
    let fallbackProductId = null;
    
    for (const item of cart.items) {
      if (item.product_id && !item.properties?.['_selldrawer_gift_source'] && !item.title.toLowerCase().includes('protection')) {
        productId = item.product_id;
        break;
      }
      if (!fallbackProductId && item.product_id) {
        fallbackProductId = item.product_id;
      }
    }

    productId = productId || fallbackProductId;

    if (!productId) {
      console.warn('[Selldrawer] No valid Product ID found in cart items for recommendations');
      return;
    }

    const maxProducts = recommendations.maxProducts || 4;
    
    // Get recommendations URL with potential locale prefix
    const getRecommendationsUrl = (intent) => {
      // Try to detect locale from URL
      const pathPrefix = window.Shopify?.routes?.root || '/';
      const cleanPrefix = pathPrefix.endsWith('/') ? pathPrefix : pathPrefix + '/';
      return `${cleanPrefix}recommendations/products.json?product_id=${productId}&intent=${intent}&limit=${maxProducts}`;
    };

    // Helper function to fetch recommendations by intent
    const fetchRecommendationsByIntent = async (intent) => {
      const url = getRecommendationsUrl(intent);
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`[Selldrawer] Recommendations API (${intent}) returned ${response.status}`);
          return null;
        }

        const data = await response.json();
        const rawProducts = data.products || [];
        
        if (rawProducts.length === 0) {
          return [];
        }

        const shopifyRecommendations = rawProducts
          .map(product => {
            const normalizeVariantId = (id) => {
              if (!id) return null;
              const idStr = id.toString();
              return idStr.includes('gid://') ? idStr.replace('gid://shopify/ProductVariant/', '') : idStr;
            };

            const firstVariant = product.variants?.[0];
            const firstVariantId = normalizeVariantId(firstVariant?.id);

            // Robust availability check
            const isAvailable = firstVariant ? (
              firstVariant.available !== false && 
              (firstVariant.inventory_management === null || 
               firstVariant.inventory_quantity === undefined || 
               firstVariant.inventory_quantity === null || 
               firstVariant.inventory_quantity > 0)
            ) : false;

            // Map all variants for the variant picker
            const variants = (product.variants || []).map(v => ({
              id: normalizeVariantId(v.id),
              title: v.title || 'Default Title',
              available: v.available !== false,
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
              id: product.handle, // Use handle as ID for consistency with app logic
              shopifyProductId: product.id?.toString() || product.handle,
              shopifyVariantId: firstVariantId,
              title: product.title,
              handle: product.handle,
              price: firstVariant?.price ? parseFloat(firstVariant.price) / 100 : 0,
              compareAtPrice: firstVariant?.compare_at_price
                ? parseFloat(firstVariant.compare_at_price) / 100
                : null,
              imageUrl: product.featured_image || (product.images && product.images[0]),
              position: 0,
              available: isAvailable,
              variants,
              options,
            };
          })
          .filter(rec => rec.available);

        // Filter out products already in cart
        return shopifyRecommendations.filter(rec => {
          return !cart.items.some(item => (item.handle && item.handle === rec.handle) || (String(item.product_id) === String(rec.shopifyProductId)));
        });
      } catch (e) {
        console.error(`[Selldrawer] Failed to fetch ${intent} recommendations:`, e);
        return null;
      }
    };

    // Robust Fetching Strategy:
    // 1. Try primary intent
    // 2. If empty and was complementary, try related
    // 3. If still empty, try whatever was NOT tried
    
    const primaryIntent = recommendationType === 'complementary' ? 'complementary' : 'related';
    let finalRecommendations = await fetchRecommendationsByIntent(primaryIntent);

    if (!finalRecommendations || finalRecommendations.length === 0) {
      const secondaryIntent = primaryIntent === 'complementary' ? 'related' : 'complementary';
      console.log(`[Selldrawer] Primary recommendations (${primaryIntent}) empty, trying ${secondaryIntent}...`);
      finalRecommendations = await fetchRecommendationsByIntent(secondaryIntent);
    }

    // Set the final recommendations
    if (!recommendations.products) {
      recommendations.products = [];
    }

    if (finalRecommendations && finalRecommendations.length > 0) {
      recommendations.products = finalRecommendations.slice(0, maxProducts);
    } else {
      // If dynamic recommendations are empty, keep the manual ones if any exist
      // This provides a robust fallback when Shopify AI has no data
      console.log('Selldrawer: Dynamic recommendations empty, falling back to manual selection');
      // recommendations.products already contains the manual products from the API call
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


