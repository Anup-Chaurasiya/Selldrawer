"use strict";
(() => {
  // extensions/cart-upsell/assets/modules/constants.js
  var FEATURE_ORDER_SENTINEL = "__cart-items__";
  var DEFAULT_FEATURE_ORDER = [
    "free-shipping-bar",
    "promotional-banner",
    FEATURE_ORDER_SENTINEL,
    "product-recommendations",
    "savings-display",
    "free-shipping-message",
    "coupon-code"
  ];

  // extensions/cart-upsell/assets/modules/utils.js
  function normalizeFeatureOrder(order) {
    const allowed = new Set(DEFAULT_FEATURE_ORDER);
    const raw = Array.isArray(order) ? order.filter((id) => allowed.has(id)) : [];
    const missing = DEFAULT_FEATURE_ORDER.filter((id) => !raw.includes(id));
    const normalized = raw.concat(missing);
    const sentinelIndex = normalized.indexOf(FEATURE_ORDER_SENTINEL);
    if (sentinelIndex === -1) {
      const fallbackIndex = DEFAULT_FEATURE_ORDER.indexOf(FEATURE_ORDER_SENTINEL);
      if (fallbackIndex === -1) {
        normalized.push(FEATURE_ORDER_SENTINEL);
      } else {
        normalized.splice(fallbackIndex, 0, FEATURE_ORDER_SENTINEL);
      }
    } else {
      for (let i = normalized.length - 1; i > sentinelIndex; i -= 1) {
        if (normalized[i] === FEATURE_ORDER_SENTINEL) {
          normalized.splice(i, 1);
        }
      }
    }
    return normalized;
  }
  function splitFeatureOrder(order) {
    const normalized = normalizeFeatureOrder(order);
    const sentinelIndex = normalized.indexOf(FEATURE_ORDER_SENTINEL);
    if (sentinelIndex === -1) {
      return { beforeItems: normalized, afterItems: [] };
    }
    return {
      beforeItems: normalized.slice(0, sentinelIndex),
      afterItems: normalized.slice(sentinelIndex + 1)
    };
  }
  function formatMoney(cents) {
    const amount = cents / 100;
    return `\u20B9${Math.round(amount)}`;
  }
  function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `upsellity-notification upsellity-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === "success" ? "#28a745" : type === "error" ? "#dc3545" : "#007bff"};
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    animation: slideIn 0.3s ease;
  `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3e3);
  }
  function getYouTubeEmbedUrl(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0` : null;
  }
  function getVimeoEmbedUrl(url) {
    const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
    const match = url.match(regExp);
    const videoId = match ? match[1] : null;
    return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1&loop=1&muted=1&background=1` : null;
  }

  // extensions/cart-upsell/assets/modules/cart-operations.js
  async function addProductToCart(variantId, quantity = 1, loadCartCallback) {
    try {
      if (!variantId) {
        throw new Error("No variant ID provided");
      }
      if (/^\d+$/.test(variantId)) {
        const formData = new FormData();
        formData.append("id", variantId);
        formData.append("quantity", quantity.toString());
        const response = await fetch("/cart/add.js", {
          method: "POST",
          body: formData
        });
        if (response.ok) {
          await loadCartCallback();
          showNotification("Product added to cart!", "success");
        } else {
          const error = await response.json();
          console.error("Cart add error:", error);
          showNotification(error.description || "Failed to add product to cart", "error");
        }
      } else {
        await addProductToCartByHandle(variantId, null, quantity, loadCartCallback);
      }
    } catch (error) {
      console.error("Error adding product to cart:", error);
      showNotification("Failed to add product to cart", "error");
    }
  }
  async function addProductToCartByHandle(productHandle, variantId, quantity = 1, loadCartCallback) {
    try {
      let productResponse;
      if (/^\d+$/.test(productHandle)) {
        const formData2 = new FormData();
        formData2.append("id", productHandle);
        formData2.append("quantity", quantity.toString());
        const response2 = await fetch("/cart/add.js", {
          method: "POST",
          body: formData2
        });
        if (response2.ok) {
          await loadCartCallback();
          showNotification("Product added to cart!", "success");
          return;
        } else {
          const error = await response2.json();
          console.error("Failed to add product with numeric ID:", productHandle, error);
          showNotification(error.description || error.message || "Product not found", "error");
          throw new Error(error.description || error.message || "Product not found");
        }
      } else {
        productResponse = await fetch(`/products/${productHandle}.js`);
        if (!productResponse.ok) {
          console.error("Product not found for handle:", productHandle);
          throw new Error("Product not found");
        }
      }
      const product = await productResponse.json();
      const variant = variantId ? product.variants.find((v) => {
        const vId = v.id.toString().replace("gid://shopify/ProductVariant/", "");
        const pId = variantId.toString().replace("gid://shopify/ProductVariant/", "");
        return vId === pId;
      }) : product.variants[0];
      if (!variant) {
        console.error("No variant found for product:", product.title);
        throw new Error("Variant not found");
      }
      if (!variant.available) {
        console.warn("Product is not available:", product.title);
        showNotification(`The product '${product.title}' is already sold out`, "error");
        return;
      }
      if (variant.inventory_management && variant.inventory_quantity !== null && variant.inventory_quantity <= 0) {
        console.warn("Product is out of stock:", product.title);
        showNotification(`The product '${product.title}' is already sold out`, "error");
        return;
      }
      const formData = new FormData();
      formData.append("id", variant.id);
      formData.append("quantity", quantity.toString());
      const response = await fetch("/cart/add.js", {
        method: "POST",
        body: formData
      });
      if (response.ok) {
        await loadCartCallback();
        showNotification(`${product.title} added to cart!`, "success");
      } else {
        const error = await response.json();
        console.error("Cart add failed:", error);
        showNotification(error.description || error.message || "Failed to add product to cart", "error");
      }
    } catch (error) {
      console.error("Error adding product to cart:", error);
      if (error.message && !error.message.includes("Failed to add")) {
        showNotification(error.message, "error");
      } else {
        showNotification("Failed to add product to cart", "error");
      }
    }
  }
  async function updateQuantity(itemKey, newQuantity, loadCartCallback, renderCallback) {
    if (newQuantity < 0)
      return;
    const cartItem = document.querySelector(`[data-item-key="${itemKey}"]`);
    if (cartItem) {
      cartItem.classList.add("upsellity-loading");
    }
    try {
      const response = await fetch("/cart/change.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: itemKey,
          quantity: newQuantity
        })
      });
      if (response.ok) {
        const result = await response.json();
        await loadCartCallback(result);
        renderCallback();
        if (result.items) {
          const updatedItem = result.items.find((item) => item.key === itemKey);
          if (!updatedItem && newQuantity > 0) {
            showNotification("This item is no longer available and has been removed from your cart", "error");
          } else {
            showNotification("Cart updated!", "success");
          }
        } else {
          showNotification("Cart updated!", "success");
        }
      } else {
        const error = await response.json();
        console.error("Cart update error:", error);
        await loadCartCallback();
        if (error.description && error.description.includes("sold out")) {
          showNotification(error.description, "error");
          if (newQuantity !== 0) {
            showNotification("This product is out of stock. Please remove it from your cart.", "error");
          }
        } else {
          showNotification(error.description || error.message || "Failed to update cart", "error");
        }
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      showNotification("Failed to update cart", "error");
      await loadCartCallback();
    } finally {
      if (cartItem) {
        cartItem.classList.remove("upsellity-loading");
      }
    }
  }
  async function removeItem(itemKey, loadCartCallback, renderCallback) {
    const cartItem = document.querySelector(`[data-item-key="${itemKey}"]`);
    if (cartItem) {
      cartItem.classList.add("upsellity-loading");
    }
    try {
      const response = await fetch("/cart/change.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: itemKey,
          quantity: 0
        })
      });
      if (response.ok) {
        const result = await response.json();
        await loadCartCallback(result);
        renderCallback();
        showNotification("Item removed from cart", "success");
      } else {
        const error = await response.json();
        showNotification(error.description || "Failed to remove item", "error");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      showNotification("Failed to remove item", "error");
    } finally {
      if (cartItem) {
        cartItem.classList.remove("upsellity-loading");
      }
    }
  }

  // extensions/cart-upsell/assets/modules/discount-manager.js
  async function loadAvailableDiscounts(shop, config) {
    var _a, _b;
    const couponField = (_a = config == null ? void 0 : config.features) == null ? void 0 : _a.couponCodeField;
    if (!couponField || !couponField.enableAutoApply && !couponField.showAllOffers) {
      return [];
    }
    try {
      const appUrl = ((_b = document.querySelector("[data-upsellity-app-url]")) == null ? void 0 : _b.dataset.upsellityAppUrl) || "";
      const response = await fetch(`${appUrl}/api/available-discounts?shop=${shop}`);
      const data = await response.json();
      if (data.discounts && data.discounts.length > 0) {
        return data.discounts;
      } else {
        console.warn("Upsellity: No discounts available", {
          count: data.count,
          error: data.error,
          debug: data.debug
        });
        return [];
      }
    } catch (error) {
      console.error("Upsellity: Failed to load available discounts", error);
      return [];
    }
  }
  function autoApplyBestDiscount(availableDiscounts, cart, config) {
    var _a;
    if (!availableDiscounts || availableDiscounts.length === 0) {
      return null;
    }
    const couponField = (_a = config == null ? void 0 : config.features) == null ? void 0 : _a.couponCodeField;
    const strategy = (couponField == null ? void 0 : couponField.autoApplyStrategy) || "best_value";
    let bestDiscount = null;
    if (strategy === "best_value") {
      let maxSavings = 0;
      for (const discount of availableDiscounts) {
        const savings = calculateDiscountSavings(discount, cart);
        if (savings > maxSavings) {
          maxSavings = savings;
          bestDiscount = discount;
        }
      }
    } else if (strategy === "highest_percentage") {
      for (const discount of availableDiscounts) {
        if (discount.type === "percentage") {
          if (!bestDiscount || discount.value > bestDiscount.value) {
            bestDiscount = discount;
          }
        }
      }
    } else if (strategy === "first_available") {
      bestDiscount = availableDiscounts[0];
    }
    return bestDiscount;
  }
  function calculateDiscountSavings(discount, cart) {
    if (!cart)
      return 0;
    const cartTotal = cart.total_price;
    switch (discount.type) {
      case "percentage":
        return Math.round(cartTotal * discount.value / 100);
      case "fixed":
        return Math.min(discount.value * 100, cartTotal);
      case "free_shipping":
        return 1e4;
      case "bxgy":
        return 5e3;
      default:
        return 0;
    }
  }
  async function applyCoupon(shop, config, appliedDiscount, renderCallback) {
    var _a;
    const couponInput = document.getElementById("upsellity-coupon-input");
    const messageDiv = document.getElementById("upsellity-coupon-message");
    const applyBtn = document.querySelector(".upsellity-coupon-apply-btn");
    if (!couponInput || !messageDiv) {
      console.error("Upsellity: Coupon elements not found");
      return null;
    }
    const couponCode = couponInput.value.trim().toUpperCase();
    if (!couponCode) {
      messageDiv.textContent = "Please enter a coupon code";
      messageDiv.style.color = "#ef4444";
      return null;
    }
    messageDiv.textContent = "Validating coupon...";
    messageDiv.style.color = "#6b7280";
    if (applyBtn)
      applyBtn.disabled = true;
    try {
      const appUrl = ((_a = document.querySelector("[data-upsellity-app-url]")) == null ? void 0 : _a.dataset.upsellityAppUrl) || "";
      const response = await fetch(`${appUrl}/api/validate-discount?shop=${shop}&code=${encodeURIComponent(couponCode)}`);
      const data = await response.json();
      if (data.valid) {
        const newDiscount = {
          code: data.code,
          title: data.title,
          description: data.description || getDiscountDescription(data.type, data.value),
          type: data.type,
          value: data.value
        };
        const couponField = config.features.couponCodeField;
        messageDiv.textContent = couponField.successMessage || "Coupon applied successfully!";
        messageDiv.style.color = "#10b981";
        couponInput.value = "";
        renderCallback();
        const estimatedDiscount = calculateEstimatedDiscount(newDiscount, null);
        showNotification(`Coupon ${data.code} applied! You're saving ${formatMoney(estimatedDiscount)}`, "success");
        return newDiscount;
      } else {
        const couponField = config.features.couponCodeField;
        messageDiv.textContent = data.error || couponField.errorMessage || "Invalid coupon code";
        messageDiv.style.color = "#ef4444";
        return null;
      }
    } catch (error) {
      console.error("Upsellity: Error validating coupon", error);
      const couponField = config.features.couponCodeField;
      messageDiv.textContent = couponField.errorMessage || "Invalid coupon code";
      messageDiv.style.color = "#ef4444";
      return null;
    } finally {
      if (applyBtn)
        applyBtn.disabled = false;
    }
  }
  function getDiscountDescription(type, value) {
    if (!type)
      return "";
    switch (type) {
      case "percentage":
        return `${value}% off your order`;
      case "fixed":
        return `\u20B9${value} off your order`;
      case "free_shipping":
        return "Free shipping on your order";
      case "bxgy":
        return "Buy X Get Y discount";
      default:
        return "Discount will be applied at checkout";
    }
  }
  function calculateEstimatedDiscount(appliedDiscount, cart) {
    if (!appliedDiscount || !cart)
      return 0;
    const { type, value } = appliedDiscount;
    switch (type) {
      case "percentage":
        return Math.round(cart.total_price * value / 100);
      case "fixed":
        return Math.min(value * 100, cart.total_price);
      case "free_shipping":
        return 0;
      case "bxgy":
        return 0;
      default:
        return 0;
    }
  }
  function getCheckoutUrl(appliedDiscount) {
    if (appliedDiscount) {
      return `/checkout?discount=${encodeURIComponent(appliedDiscount.code)}`;
    }
    return "/checkout";
  }

  // extensions/cart-upsell/assets/modules/carousel-manager.js
  function initializePromoCarousel(carouselId, slides, settings) {
    const carousel = document.getElementById(carouselId);
    if (!carousel || slides.length <= 1)
      return;
    const track = carousel.querySelector(".upsellity-promo-carousel-track");
    const dots = carousel.querySelectorAll("[data-dot-index]");
    const prevEdge = carousel.querySelector(".upsellity-promo-prev-edge");
    const nextEdge = carousel.querySelector(".upsellity-promo-next-edge");
    const textContents = document.querySelectorAll("[data-slide-text]");
    const ctaButtons = document.querySelectorAll("[data-slide-cta]");
    if (!track)
      return;
    let currentIndex = 0;
    let autoRotateInterval;
    const updateCarousel = () => {
      const translateX = -currentIndex * 100;
      track.style.transform = `translateX(${translateX}%)`;
      dots.forEach((dot, index) => {
        if (index === currentIndex) {
          dot.style.backgroundColor = "#007bff";
        } else {
          dot.style.backgroundColor = "rgba(255,255,255,0.6)";
        }
      });
      textContents.forEach((content, index) => {
        content.style.display = index === currentIndex ? "block" : "none";
      });
      ctaButtons.forEach((button, index) => {
        button.style.display = index === currentIndex ? "block" : "none";
      });
      if (prevEdge && nextEdge) {
        const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
        const nextIndex = (currentIndex + 1) % slides.length;
        if (currentIndex > 0) {
          prevEdge.style.display = "block";
          prevEdge.innerHTML = `<img src="${slides[prevIndex].imageUrl}" alt="Previous" style="width: 100%; height: 100%; object-fit: cover;" />`;
        } else {
          prevEdge.style.display = "none";
        }
        if (currentIndex < slides.length - 1) {
          nextEdge.style.display = "block";
          nextEdge.innerHTML = `<img src="${slides[nextIndex].imageUrl}" alt="Next" style="width: 100%; height: 100%; object-fit: cover;" />`;
        } else {
          nextEdge.style.display = "none";
        }
      }
    };
    const nextSlide = () => {
      currentIndex = (currentIndex + 1) % slides.length;
      updateCarousel();
    };
    const prevSlide = () => {
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      updateCarousel();
    };
    const goToSlide = (index) => {
      currentIndex = index;
      updateCarousel();
    };
    window.upsellityDrawer.promoCarouselNext = (id) => {
      if (id === carouselId)
        nextSlide();
    };
    window.upsellityDrawer.promoCarouselPrev = (id) => {
      if (id === carouselId)
        prevSlide();
    };
    window.upsellityDrawer.promoCarouselGoTo = (id, index) => {
      if (id === carouselId)
        goToSlide(index);
    };
    if (settings.autoRotate !== false) {
      const rotationSpeed = settings.rotationSpeed || 5e3;
      autoRotateInterval = setInterval(nextSlide, rotationSpeed);
      carousel.addEventListener("mouseenter", () => {
        if (autoRotateInterval) {
          clearInterval(autoRotateInterval);
        }
      });
      carousel.addEventListener("mouseleave", () => {
        if (settings.autoRotate !== false) {
          autoRotateInterval = setInterval(nextSlide, rotationSpeed);
        }
      });
    }
    carousel._cleanup = () => {
      if (autoRotateInterval) {
        clearInterval(autoRotateInterval);
      }
    };
  }
  function renderSlideMedia(slide) {
    if (slide.videoUrl && slide.videoType) {
      if (slide.videoType === "youtube") {
        const embedUrl = getYouTubeEmbedUrl(slide.videoUrl);
        if (embedUrl) {
          return `<iframe
          src="${embedUrl}"
          style="width: 100%; height: 100%; border: none; object-fit: cover;"
          allow="autoplay; encrypted-media"
          allowfullscreen
        ></iframe>`;
        }
      } else if (slide.videoType === "vimeo") {
        const embedUrl = getVimeoEmbedUrl(slide.videoUrl);
        if (embedUrl) {
          return `<iframe
          src="${embedUrl}"
          style="width: 100%; height: 100%; border: none; object-fit: cover;"
          allow="autoplay; encrypted-media"
          allowfullscreen
        ></iframe>`;
        }
      } else if (slide.videoType === "mp4") {
        return `<video 
        src="${slide.videoUrl}"
        style="width: 100%; height: 100%; object-fit: cover;"
        muted
        loop
        autoplay
        playsinline
      ></video>`;
      }
    }
    return `<img 
    src="${slide.imageUrl || "https://via.placeholder.com/400x200"}" 
    alt="Promotional slide"
    style="width: 100%; height: 100%; object-fit: cover;"
  />`;
  }
  function initializeRecommendationsNavigation() {
    const gridLayout = document.querySelector(".upsellity-recommendations-grid-layout");
    if (gridLayout)
      return;
    const grid = document.querySelector(".upsellity-recommendations-grid");
    const leftArrow = document.querySelector(".upsellity-nav-left");
    const rightArrow = document.querySelector(".upsellity-nav-right");
    if (!grid || !leftArrow || !rightArrow)
      return;
    const needsScrolling = grid.scrollWidth > grid.clientWidth;
    const updateArrows = () => {
      const maxScrollLeft = grid.scrollWidth - grid.clientWidth;
      const currentScroll = grid.scrollLeft;
      const showLeft = currentScroll > 0;
      const showRight = currentScroll < maxScrollLeft;
      leftArrow.style.display = showLeft ? "flex" : "none";
      rightArrow.style.display = showRight ? "flex" : "none";
      grid.style.paddingLeft = showLeft ? "40px" : "0";
      grid.style.paddingRight = showRight ? "40px" : "0";
    };
    if (needsScrolling) {
      updateArrows();
      grid.addEventListener("scroll", updateArrows);
    } else {
      leftArrow.style.display = "none";
      rightArrow.style.display = "none";
      grid.style.paddingLeft = "0";
      grid.style.paddingRight = "0";
    }
  }
  function scrollRecommendations(direction) {
    const gridLayout = document.querySelector(".upsellity-recommendations-grid-layout");
    if (gridLayout)
      return;
    const grid = document.querySelector(".upsellity-recommendations-grid");
    if (!grid)
      return;
    const scrollAmount = 140;
    if (direction === "left") {
      grid.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    } else if (direction === "right") {
      grid.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  }

  // extensions/cart-upsell/assets/modules/product-loader.js
  async function loadProductCompareAtPrices(cart) {
    const productCompareAtPrices = {};
    if (!cart || !cart.items) {
      return productCompareAtPrices;
    }
    const itemsToFetch = cart.items.filter((item) => {
      const linePrice = item.line_price || item.price * item.quantity;
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
            const variant = product.variants.find((v) => {
              const variantId = v.id.toString();
              const itemVariantId = item.variant_id.toString();
              return variantId === itemVariantId || variantId.replace("gid://shopify/ProductVariant/", "") === itemVariantId || variantId === itemVariantId.replace("gid://shopify/ProductVariant/", "");
            });
            if (variant && variant.compare_at_price) {
              let compareAtPrice;
              if (typeof variant.compare_at_price === "string") {
                compareAtPrice = parseInt(variant.compare_at_price, 10);
              } else if (typeof variant.compare_at_price === "number") {
                compareAtPrice = variant.compare_at_price > 1e3 ? Math.round(variant.compare_at_price) : Math.round(variant.compare_at_price * 100);
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
        console.warn("Failed to load compare_at_price for product:", item.title, error);
      }
    }
    return productCompareAtPrices;
  }
  async function loadShopifyRecommendations(cart, config) {
    var _a;
    const recommendations = (_a = config == null ? void 0 : config.features) == null ? void 0 : _a.productRecommendations;
    if (!recommendations) {
      return;
    }
    const recommendationType = recommendations.recommendationType;
    if (recommendationType !== "related" && recommendationType !== "complementary") {
      return;
    }
    if (!cart || !cart.items || cart.items.length === 0) {
      console.log("Upsellity: No items in cart, skipping Shopify recommendations");
      return;
    }
    try {
      const firstItem = cart.items[0];
      const productId = firstItem.product_id;
      if (!productId) {
        console.warn("Upsellity: Product ID not found in cart item");
        return;
      }
      const intent = recommendationType === "complementary" ? "complementary" : "related";
      const maxProducts = recommendations.maxProducts || 4;
      const recommendationsUrl = `/recommendations/products.json?product_id=${productId}&intent=${intent}&limit=${maxProducts}`;
      console.log("Upsellity: Fetching Shopify recommendations", { productId, intent, url: recommendationsUrl });
      const response = await fetch(recommendationsUrl);
      if (response.ok) {
        const data = await response.json();
        const shopifyRecommendations = (data.products || []).map((product) => {
          var _a2, _b, _c;
          let variantId = null;
          if ((_b = (_a2 = product.variants) == null ? void 0 : _a2[0]) == null ? void 0 : _b.id) {
            const idStr = product.variants[0].id.toString();
            if (idStr.includes("gid://")) {
              variantId = idStr.replace("gid://shopify/ProductVariant/", "");
            } else {
              variantId = idStr;
            }
          }
          const variant = (_c = product.variants) == null ? void 0 : _c[0];
          const isAvailable = variant ? variant.available !== false && (variant.inventory_management === null || variant.inventory_quantity === null || variant.inventory_quantity > 0) : false;
          return {
            shopifyProductId: product.handle,
            shopifyVariantId: variantId,
            title: product.title,
            handle: product.handle,
            price: (variant == null ? void 0 : variant.price) ? parseFloat(variant.price) / 100 : 0,
            compareAtPrice: (variant == null ? void 0 : variant.compare_at_price) ? parseFloat(variant.compare_at_price) / 100 : null,
            imageUrl: product.featured_image,
            position: 0,
            available: isAvailable
          };
        }).filter((rec) => rec.available);
        const cartProductIds = new Set(cart.items.map((item) => item.product_id.toString()));
        const filteredRecommendations = shopifyRecommendations.filter((rec) => {
          const productInCart = cart.items.some((item) => {
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
      console.error("Upsellity: Error loading Shopify recommendations:", error);
      if (recommendations) {
        recommendations.products = [];
      }
    }
  }

  // extensions/cart-upsell/assets/modules/renderers/free-shipping-bar.js
  function renderFreeShippingBar(config, cart) {
    var _a;
    const bar = (_a = config == null ? void 0 : config.features) == null ? void 0 : _a.freeShippingProgressBar;
    if (!bar) {
      return "";
    }
    let threshold, progress, remaining, isComplete, message;
    if (bar.thresholdMode === "count") {
      threshold = parseInt(bar.thresholdCount);
      progress = Math.min(cart.item_count / threshold * 100, 100);
      remaining = Math.max(threshold - cart.item_count, 0);
      isComplete = progress >= 100;
      message = isComplete ? bar.afterThresholdMessage || "\u{1F389} You qualify for FREE shipping!" : bar.beforeThresholdMessage.replace("{remaining}", `${remaining} more items`);
    } else {
      threshold = parseFloat(bar.thresholdAmount);
      progress = Math.min(cart.total_price / 100 / threshold * 100, 100);
      remaining = Math.max(threshold - cart.total_price / 100, 0);
      isComplete = progress >= 100;
      message = isComplete ? bar.afterThresholdMessage || "\u{1F389} You qualify for FREE shipping!" : bar.beforeThresholdMessage.replace("{remaining}", `${bar.currency === "INR" ? "\u20B9" : "$"}${Math.round(remaining)}`);
    }
    const backgroundColor = bar.backgroundColor || "#f8fafc";
    const progressBarColor = bar.progressBarColor || "#10b981";
    const incompleteColor = bar.progressBarColor || "#f59e0b";
    const backgroundGradient = `linear-gradient(135deg, ${backgroundColor} 0%, ${backgroundColor}dd 100%)`;
    const completeGradient = `linear-gradient(135deg, #10b981 0%, #059669 100%)`;
    const incompleteGradient = `linear-gradient(135deg, ${incompleteColor} 0%, ${incompleteColor}dd 100%)`;
    const percentageGradient = isComplete ? completeGradient : `linear-gradient(135deg, ${progressBarColor} 0%, ${progressBarColor}dd 100%)`;
    return `
    <div class="upsellity-progress-bar-enhanced" style="margin-bottom: 20px; padding: 16px; background: ${backgroundGradient}; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
      <div class="upsellity-progress-bar-text-enhanced" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 14px; font-weight: 600;">
        <span class="upsellity-progress-bar-message" style="color: #374151;">
          ${message}
        </span>
        ${bar.showPercentage ? `<span class="upsellity-progress-bar-percentage" style="background: ${percentageGradient}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; box-shadow: 0 2px 4px ${progressBarColor}40;">${progress.toFixed(0)}%</span>` : ""}
      </div>
      <div class="upsellity-progress-bar-track-enhanced" style="width: 100%; height: 12px; border-radius: 8px; overflow: hidden; background: ${backgroundColor}; position: relative; box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);">
        <div class="upsellity-progress-bar-fill-enhanced ${isComplete ? "upsellity-progress-complete" : "upsellity-progress-incomplete"}" 
             style="width: ${progress}%; height: 100%; display: block; background: ${isComplete ? completeGradient : incompleteGradient}; border-radius: 8px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);"></div>
      </div>
    </div>
  `;
  }

  // extensions/cart-upsell/assets/modules/renderers/promotional-banner.js
  function renderPromotionalBanner(config, initCarouselCallback) {
    if (!config.features.promotionalBanner) {
      return "";
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
          `).join("")}
        </div>
        
        ${slides.length > 1 && carouselSettings.showArrows !== false ? renderArrows(carouselId) : ""}
        ${slides.length > 1 && carouselSettings.showDots !== false ? renderDots(carouselId, slides) : ""}
        ${slides.length > 1 ? renderEdgePreviews(slides) : ""}
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
    >\u2039</button>
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
    >\u203A</button>
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
            background-color: ${index === 0 ? "#007bff" : "rgba(255,255,255,0.6)"};
            border: 2px solid rgba(255,255,255,0.9);
            transition: all 0.3s ease;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            padding: 0;
          "
        ></button>
      `).join("")}
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
            style="display: ${index === 0 ? "block" : "none"};"
          >
            ${slide.title ? `
              <div style="
                font-weight: 700;
                font-size: 18px;
                color: #1f2937;
                margin-bottom: ${slide.description ? "2px" : "0"};
                line-height: 1.2;
              ">${slide.title}</div>
            ` : ""}
            ${slide.description ? `
              <div style="
                font-size: 14px;
                color: #6b7280;
                line-height: 1.4;
              ">${slide.description}</div>
            ` : ""}
          </div>
        `).join("")}
      </div>
      
      <div class="upsellity-promo-cta-container" style="flex-shrink: 0;">
        ${slides.map((slide, index) => `
          <button 
            class="upsellity-promo-cta-btn"
            data-slide-cta="${index}"
            onclick="window.upsellityDrawer.handleSlideCtaClick('${slide.ctaUrl || ""}')"
            style="
              display: ${index === 0 ? "block" : "none"};
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
              ${!slide.ctaText ? "visibility: hidden;" : ""}
            "
          >${slide.ctaText || "Shop Now"}</button>
        `).join("")}
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

  // extensions/cart-upsell/assets/modules/renderers/cart-items.js
  function renderCartItems(cart, productCompareAtPrices, appliedDiscount) {
    let html = "";
    cart.items.forEach((item) => {
      var _a;
      const linePrice = item.line_price || item.price * item.quantity;
      const itemPrice = item.price || item.final_price || 0;
      let originalLinePrice = null;
      if (item.original_line_price && item.original_line_price > linePrice) {
        originalLinePrice = item.original_line_price;
      }
      if (!originalLinePrice) {
        const compareAtPrice = productCompareAtPrices[item.variant_id];
        if (compareAtPrice && compareAtPrice > itemPrice) {
          originalLinePrice = compareAtPrice * item.quantity;
        }
      }
      if (!originalLinePrice && item.original_price) {
        const originalItemPrice2 = item.original_price;
        if (originalItemPrice2 > itemPrice) {
          originalLinePrice = originalItemPrice2 * item.quantity;
        }
      }
      if (!originalLinePrice || originalLinePrice <= linePrice) {
        originalLinePrice = linePrice;
      }
      const originalItemPrice = originalLinePrice / item.quantity;
      const hasItemDiscount = originalItemPrice > itemPrice && originalLinePrice > linePrice;
      const itemDiscountAmount = hasItemDiscount ? originalLinePrice - linePrice : 0;
      const itemDiscountPercent = hasItemDiscount && originalLinePrice > 0 ? Math.round((originalLinePrice - linePrice) / originalLinePrice * 100) : 0;
      const itemSubtotal = linePrice;
      let itemPriceWithCoupon = itemSubtotal;
      if (appliedDiscount && appliedDiscount.type === "percentage") {
        itemPriceWithCoupon = Math.round(itemSubtotal * (1 - appliedDiscount.value / 100));
      } else if (appliedDiscount && appliedDiscount.type === "fixed") {
        const itemProportion = itemSubtotal / cart.total_price;
        const itemCouponDiscount = Math.round(appliedDiscount.value * 100 * itemProportion);
        itemPriceWithCoupon = Math.max(0, itemSubtotal - itemCouponDiscount);
      }
      const hasCouponDiscount = appliedDiscount && (appliedDiscount.type === "percentage" || appliedDiscount.type === "fixed");
      html += `
      <div class="upsellity-cart-item" data-item-key="${item.key}">
        <img src="${((_a = item.featured_image) == null ? void 0 : _a.url) || item.image}" alt="${item.title}" class="upsellity-cart-item-image" />
        <div class="upsellity-cart-item-details">
          <div class="upsellity-cart-item-title">${item.title}</div>
          <div class="upsellity-cart-item-variant">${item.variant_title || ""}</div>
          <div class="upsellity-cart-item-price">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              ${renderItemPrice(hasItemDiscount, hasCouponDiscount, originalLinePrice, itemSubtotal, itemPriceWithCoupon, itemDiscountPercent)}
            </div>
            ${hasCouponDiscount ? `
              <div style="font-size: 11px; color: #059669; margin-top: 2px;">
                Coupon discount applied
              </div>
            ` : ""}
          </div>
          <div class="upsellity-cart-item-controls">
            <div class="upsellity-quantity-controls">
              <button class="upsellity-quantity-btn" onclick="window.upsellityDrawer.updateQuantity('${item.key}', ${item.quantity - 1})" ${item.quantity <= 1 ? "disabled" : ""}>\u2212</button>
              <span class="upsellity-quantity-display">${item.quantity}</span>
              <button class="upsellity-quantity-btn" onclick="window.upsellityDrawer.updateQuantity('${item.key}', ${item.quantity + 1})">+</button>
            </div>
            <button class="upsellity-remove-btn" onclick="window.upsellityDrawer.removeItem('${item.key}')" title="Remove item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
    });
    return html;
  }
  function renderItemPrice(hasItemDiscount, hasCouponDiscount, originalLinePrice, itemSubtotal, itemPriceWithCoupon, itemDiscountPercent) {
    if (hasItemDiscount && !hasCouponDiscount) {
      return `
      <span style="text-decoration: line-through; color: #9ca3af; font-size: 13px;">
        ${formatMoney(originalLinePrice)}
      </span>
      <span style="font-weight: 700; font-size: 16px; color: #f59e0b;">
        ${formatMoney(itemSubtotal)}
      </span>
      <span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">
        ${itemDiscountPercent}% OFF
      </span>
    `;
    } else if (hasCouponDiscount) {
      return `
      <span style="text-decoration: line-through; color: #9ca3af; font-size: 13px;">
        ${formatMoney(itemSubtotal)}
      </span>
      <span style="font-weight: 700; font-size: 16px; color: #059669;">
        ${formatMoney(itemPriceWithCoupon)}
      </span>
    `;
    } else if (hasItemDiscount) {
      return `
      <span style="text-decoration: line-through; color: #9ca3af; font-size: 13px;">
        ${formatMoney(originalLinePrice)}
      </span>
      <span style="font-weight: 700; font-size: 16px; color: #f59e0b;">
        ${formatMoney(itemSubtotal)}
      </span>
      <span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">
        ${itemDiscountPercent}% OFF
      </span>
    `;
    } else {
      return `
      <span style="font-weight: 700; font-size: 16px; color: #111827;">
        ${formatMoney(itemSubtotal)}
      </span>
    `;
    }
  }

  // extensions/cart-upsell/assets/modules/renderers/product-recommendations.js
  function renderProductRecommendations(config) {
    if (!config.features.productRecommendations) {
      return "";
    }
    const recommendations = config.features.productRecommendations;
    const recommendedProducts = recommendations.products || [];
    const layout = recommendations.layout || "carousel";
    const isGrid = layout === "grid";
    let html = `
    <div class="upsellity-recommendations">
      <div class="upsellity-recommendations-title">${recommendations.title}</div>
      <div class="upsellity-recommendations-container" style="position: relative;">
        ${!isGrid ? renderNavigationArrows() : ""}
        
        <div class="${isGrid ? "upsellity-recommendations-grid-layout" : "upsellity-recommendations-grid"}" ${isGrid ? 'style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;"' : ""}>
          ${recommendedProducts.slice(0, recommendations.maxProducts || 4).map((product) => renderProductCard(product, recommendations, isGrid)).join("")}
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
      <span>\u2039</span>
    </button>
    
    <button class="upsellity-nav-arrow upsellity-nav-right" 
            onclick="window.upsellityDrawer.scrollRecommendations('right')"
            style="display: none;">
      <span>\u203A</span>
    </button>
  `;
  }
  function renderProductCard(product, recommendations, isGrid) {
    const productPrice = product.price || 0;
    const productCompareAtPrice = product.compareAtPrice || null;
    const originalPrice = productCompareAtPrice || productPrice;
    const discount = productCompareAtPrice && productCompareAtPrice > productPrice ? Math.round((productCompareAtPrice - productPrice) / productCompareAtPrice * 100) : 0;
    const isOutOfStock = false;
    return `
    <div class="upsellity-recommendation-card" ${isGrid ? "" : 'style="min-width: 140px; flex-shrink: 0;"'}>
      <div class="upsellity-recommendation-image" style="position: relative;">
        ${product.imageUrl ? `
          <img src="${product.imageUrl}" alt="${product.title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px; ${isOutOfStock ? "opacity: 0.5; filter: grayscale(50%);" : ""}" />
        ` : `
          <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 24px; ${isOutOfStock ? "opacity: 0.5;" : ""}">\u{1F4E6}</div>
        `}
        ${isOutOfStock ? `
          <div style="position: absolute; top: 8px; left: 8px; background-color: #ef4444; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; z-index: 10;">
            Sold Out
          </div>
        ` : recommendations.showDiscountBadge && discount > 0 ? `
          <div style="position: absolute; top: 8px; right: 8px; background-color: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; z-index: 10;">
            ${discount}% off
          </div>
        ` : ""}
      </div>
      <div style="font-size: 13px; font-weight: 500; margin-bottom: 4px; line-height: 1.3;">
        ${product.title.length > 20 ? product.title.substring(0, 20) + "..." : product.title}
      </div>
      <div style="margin-bottom: 4px;">
        ${recommendations.showDiscount && productCompareAtPrice && productCompareAtPrice > productPrice ? `
          <span style="text-decoration: line-through; color: #9ca3af; font-size: 12px; margin-right: 4px;">
            \u20B9${Math.round(productCompareAtPrice)}
          </span>
        ` : ""}
        <span style="font-weight: 600; font-size: 12px;">\u20B9${Math.round(productPrice)}</span>
      </div>
      ${recommendations.showAddButton ? isOutOfStock ? `
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
        ` : ""}
    </div>
  `;
  }

  // extensions/cart-upsell/assets/modules/renderers/other-features.js
  function renderSavingsDisplay(config, cart, appliedDiscount) {
    if (!config.features.savingsDisplay) {
      return "";
    }
    const savingsCfg = config.features.savingsDisplay;
    const itemLevelSavings = cart.items.reduce((sum, item) => {
      return sum + Math.max(0, item.original_price - item.final_price) * item.quantity;
    }, 0);
    const discountSavings = appliedDiscount ? calculateEstimatedDiscount(appliedDiscount, cart) : 0;
    const totalSavings = Math.max(itemLevelSavings, discountSavings);
    if (totalSavings > 0) {
      return `
      <div class="upsellity-savings-display" style="background-color: ${savingsCfg.backgroundColor}; color: ${savingsCfg.textColor}">
        ${savingsCfg.message.replace("{amount}", formatMoney(totalSavings))}
      </div>
    `;
    }
    return "";
  }
  function renderFreeShippingMessage(config, cart) {
    if (!config.features.freeShippingMessage) {
      return "";
    }
    const msg = config.features.freeShippingMessage;
    const threshold = parseFloat(msg.thresholdAmount);
    const remaining = Math.max(threshold - cart.total_price / 100, 0);
    console.log("Upsellity: Free shipping message debug:", {
      msg,
      threshold,
      remaining,
      cartTotal: cart.total_price,
      cartTotalInRupees: cart.total_price / 100
    });
    return `
    <div class="upsellity-shipping-message" style="background-color: ${msg.backgroundColor}; color: ${msg.textColor}; border: 2px solid ${msg.textColor}; padding: 14px 18px; border-radius: 12px; display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 700; margin-bottom: 8px; box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1); position: relative; overflow: hidden;">
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, rgba(255,255,255,0.2) 0%, transparent 50%); pointer-events: none;"></div>
      <div style="font-size: 20px; flex-shrink: 0; position: relative; z-index: 1;">\u{1F69A}</div>
      <span style="position: relative; z-index: 1; text-shadow: 0 1px 2px rgba(0,0,0,0.1); flex: 1;">
        ${remaining > 0 ? msg.beforeThresholdMessage.replace("{threshold}", `${msg.currency === "INR" ? "\u20B9" : "$"}${Math.round(threshold)}`).replace("{remaining}", `${msg.currency === "INR" ? "\u20B9" : "$"}${Math.round(remaining)}`) : msg.achievedMessage}
      </span>
    </div>
  `;
  }
  function renderCouponCodeField(config, appliedDiscount, availableDiscounts, showingAllOffers) {
    if (!config.features.couponCodeField) {
      return "";
    }
    const couponField = config.features.couponCodeField;
    return `
    <div class="upsellity-coupon-field">
      <div class="upsellity-coupon-input-container">
        <div class="upsellity-coupon-input-wrapper">
          <input 
            type="text" 
            id="upsellity-coupon-input" 
            class="upsellity-coupon-input"
            placeholder="${couponField.placeholder || "Enter coupon code"}"
            onkeypress="if(event.key === 'Enter') window.upsellityDrawer.applyCoupon()"
          />
        </div>
        <button 
          class="upsellity-coupon-apply-btn"
          onclick="window.upsellityDrawer.applyCoupon()"
        >
          ${couponField.buttonText || "Apply"}
        </button>
      </div>
      <div id="upsellity-coupon-message" class="upsellity-coupon-message"></div>

      ${appliedDiscount ? renderAppliedDiscount(appliedDiscount, couponField) : ""}

      ${couponField.showAllOffers && availableDiscounts.length > 0 ? renderAllOffers(couponField, availableDiscounts, appliedDiscount, showingAllOffers) : ""}
    </div>
  `;
  }
  function renderAppliedDiscount(appliedDiscount, couponField) {
    return `
    <div class="upsellity-applied-discount">
      <div class="upsellity-applied-discount-content">
        <div class="upsellity-discount-checkmark">\u2713</div>
        <div class="upsellity-discount-info">
          <div class="upsellity-discount-title">
            ${appliedDiscount.code} - ${appliedDiscount.description}
          </div>
          <div class="upsellity-discount-subtitle">
            ${couponField.enableAutoApply ? "Best offer automatically applied" : "Applied"}
          </div>
        </div>
        <button 
          class="upsellity-discount-remove"
          onclick="window.upsellityDrawer.removeDiscount()"
        >
          Remove
        </button>
      </div>
    </div>
  `;
  }
  function renderAllOffers(couponField, availableDiscounts, appliedDiscount, showingAllOffers) {
    return `
    <button 
      class="upsellity-show-offers-btn"
      onclick="window.upsellityDrawer.toggleAllOffers()"
    >
      <span style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">\u{1F381}</span>
        <span>${couponField.showAllOffersButtonText || "Show all offers"} (${availableDiscounts.length} available)</span>
      </span>
      <span style="font-size: 12px; color: #6b7280; transition: transform 0.3s ease;" id="upsellity-offers-arrow">${showingAllOffers ? "\u25B2" : "\u25BC"}</span>
    </button>

    <div id="upsellity-all-offers-dropdown" class="upsellity-offers-list" style="display: ${showingAllOffers ? "block" : "none"};">
      ${availableDiscounts.map((discount) => `
        <div 
          class="upsellity-offer-item ${(appliedDiscount == null ? void 0 : appliedDiscount.code) === discount.code ? "selected" : ""}"
          onclick="window.upsellityDrawer.switchDiscount('${discount.code}')"
        >
          <div class="upsellity-offer-content">
            <div class="upsellity-offer-checkbox">
              ${(appliedDiscount == null ? void 0 : appliedDiscount.code) === discount.code ? "\u2713" : ""}
            </div>
            <div class="upsellity-offer-details">
              <div class="upsellity-offer-code">
                ${discount.code} - ${discount.description}
              </div>
              <div class="upsellity-offer-description">
                ${discount.title}
              </div>
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
  }
  function renderCartTotals(cart, appliedDiscount) {
    const originalTotal = cart.items.reduce((sum, item) => {
      return sum + item.original_price * item.quantity;
    }, 0);
    const subtotal = cart.total_price;
    const itemLevelSavings = originalTotal - subtotal;
    const couponDiscount = calculateEstimatedDiscount(appliedDiscount, cart);
    const estimatedTotal = Math.max(0, subtotal - couponDiscount);
    const totalSavings = itemLevelSavings + couponDiscount;
    return `
    <div style="border-top: 2px solid #e5e7eb; padding-top: 16px; margin-top: 20px;">
      ${itemLevelSavings > 0 || couponDiscount > 0 ? `
        <div style="font-size: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; color: #6b7280;">
          <span>Original Price</span>
          <span style="text-decoration: line-through;">${formatMoney(originalTotal)}</span>
        </div>
      ` : ""}
      
      ${itemLevelSavings > 0 ? renderItemDiscounts(itemLevelSavings) : ""}
      
      <div style="font-size: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; ${itemLevelSavings > 0 ? "font-weight: 600;" : ""}">
        <span style="color: #374151;">Subtotal</span>
        <span style="color: #111827;">${formatMoney(subtotal)}</span>
      </div>
      
      ${appliedDiscount && couponDiscount > 0 ? renderCouponDiscount(appliedDiscount, couponDiscount) : ""}
      
      <div style="font-size: 20px; font-weight: 700; padding-top: 12px; border-top: 2px solid #e5e7eb; display: flex; justify-content: space-between; color: #111827;">
        <span>Total</span>
        <span style="color: ${totalSavings > 0 ? "#059669" : "#111827"};">${formatMoney(estimatedTotal)}</span>
      </div>
      
      <div style="font-size: 12px; color: #6b7280; margin-top: 8px; text-align: right;">
        Taxes and shipping calculated at checkout
      </div>
    </div>
  `;
  }
  function renderItemDiscounts(itemLevelSavings) {
    return `
    <div style="font-size: 14px; margin-bottom: 10px; display: flex; justify-content: space-between; color: #f59e0b;">
      <span style="display: flex; align-items: center; gap: 6px;">
        <span>Item Discounts</span>
        <span style="background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">
          SALE
        </span>
      </span>
      <span style="font-weight: 600;">-${formatMoney(itemLevelSavings)}</span>
    </div>
  `;
  }
  function renderCouponDiscount(appliedDiscount, couponDiscount) {
    return `
    <div style="font-size: 15px; margin-bottom: 12px; display: flex; justify-content: space-between; color: #059669;">
      <span style="display: flex; align-items: center; gap: 6px;">
        <span>Coupon (${appliedDiscount.code})</span>
        <span style="background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">
          ${appliedDiscount.type === "percentage" ? `${appliedDiscount.value}%` : "FIXED"}
        </span>
      </span>
      <span style="font-weight: 600;">-${formatMoney(couponDiscount)}</span>
    </div>
  `;
  }

  // extensions/cart-upsell/assets/modules/cart-drawer-class.js
  var UpsellityCartDrawer = class {
    constructor() {
      var _a;
      this.shop = ((_a = window.Shopify) == null ? void 0 : _a.shop) || null;
      this.config = null;
      this.isOpen = false;
      this.cart = null;
      this.appliedDiscount = null;
      this.availableDiscounts = [];
      this.showingAllOffers = false;
      this.productAvailability = {};
      this.productCompareAtPrices = {};
      this.init();
    }
    async init() {
      if (!this.shop) {
        console.error("Upsellity: Shop not detected");
        return;
      }
      this.createDrawer();
      await this.loadConfig();
      this.interceptAddToCart();
      this.attachCartTriggers();
      await this.loadCart();
    }
    async loadConfig() {
      var _a, _b;
      try {
        const appUrl = (_a = document.querySelector("[data-upsellity-app-url]")) == null ? void 0 : _a.dataset.upsellityAppUrl;
        if (!appUrl) {
          console.warn("Upsellity: App URL not configured");
          this.config = { enabled: false, features: {} };
          return;
        }
        const timestamp = (/* @__PURE__ */ new Date()).getTime();
        const response = await fetch(`${appUrl}/api/cart-drawer?shop=${this.shop}&_t=${timestamp}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        });
        this.config = await response.json();
        console.log("Upsellity: Loaded config:", this.config);
        console.log("Upsellity: Free shipping message config:", (_b = this.config.features) == null ? void 0 : _b.freeShippingMessage);
      } catch (error) {
        console.error("Upsellity: Failed to load config", error);
        this.config = { enabled: false, features: {} };
      }
    }
    async loadCart(cartData = null) {
      var _a, _b, _c;
      try {
        if (cartData) {
          this.cart = cartData;
        } else {
          const response = await fetch("/cart.js");
          this.cart = await response.json();
        }
        this.productCompareAtPrices = await loadProductCompareAtPrices(this.cart);
        this.availableDiscounts = await loadAvailableDiscounts(this.shop, this.config);
        if (((_c = (_b = (_a = this.config) == null ? void 0 : _a.features) == null ? void 0 : _b.couponCodeField) == null ? void 0 : _c.enableAutoApply) && !this.appliedDiscount && this.availableDiscounts.length > 0) {
          this.appliedDiscount = autoApplyBestDiscount(this.availableDiscounts, this.cart, this.config);
        }
        await loadShopifyRecommendations(this.cart, this.config);
        this.render();
      } catch (error) {
        console.error("Upsellity: Failed to load cart", error);
        this.cart = {
          item_count: 0,
          total_price: 0,
          items: []
        };
        this.render();
      }
    }
    interceptAddToCart() {
      document.addEventListener("submit", async (e) => {
        const form = e.target;
        if (form.getAttribute("action") === "/cart/add") {
          e.preventDefault();
          const formData = new FormData(form);
          try {
            const response = await fetch("/cart/add.js", {
              method: "POST",
              body: formData
            });
            if (response.ok) {
              await this.loadCart();
              this.open();
            }
          } catch (error) {
            console.error("Upsellity: Failed to add to cart", error);
          }
        }
      });
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        var _a;
        const response = await originalFetch(...args);
        if ((_a = args[0]) == null ? void 0 : _a.includes("/cart/add")) {
          await this.loadCart();
          this.open();
        }
        return response;
      };
    }
    attachCartTriggers() {
      document.addEventListener("click", (e) => {
        const cartTrigger = e.target.closest('a[href="/cart"], a[href*="/cart"]');
        if (cartTrigger && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          this.open();
        }
      });
      document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === "C") {
          e.preventDefault();
          this.open();
        }
      });
    }
    createDrawer() {
      const drawer = document.createElement("div");
      drawer.id = "upsellity-cart-drawer";
      drawer.className = "upsellity-drawer";
      drawer.innerHTML = `
      <div class="upsellity-drawer-overlay"></div>
      <div class="upsellity-drawer-content">
        <div class="upsellity-drawer-inner"></div>
      </div>
    `;
      document.body.appendChild(drawer);
      this.loadStyles();
    }
    loadStyles() {
      if (document.querySelector("#upsellity-cart-drawer-styles")) {
        return;
      }
    }
    render() {
      var _a;
      if (!this.cart)
        return;
      const drawer = document.getElementById("upsellity-cart-drawer");
      if (!drawer) {
        console.error("Upsellity: Drawer element not found");
        return;
      }
      const inner = drawer.querySelector(".upsellity-drawer-inner");
      if (!inner) {
        console.error("Upsellity: Drawer inner element not found");
        return;
      }
      let html = `
      <button class="upsellity-close-btn" onclick="window.upsellityDrawer.close()">\xD7</button>
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 20px;">
        Your Cart (${this.cart.item_count} items)
      </h2>
    `;
      const sections = {
        "free-shipping-bar": renderFreeShippingBar(this.config, this.cart),
        "promotional-banner": renderPromotionalBanner(this.config, this.initializePromoCarousel.bind(this)),
        [FEATURE_ORDER_SENTINEL]: renderCartItems(this.cart, this.productCompareAtPrices, this.appliedDiscount),
        "product-recommendations": renderProductRecommendations(this.config),
        "savings-display": renderSavingsDisplay(this.config, this.cart, this.appliedDiscount),
        "free-shipping-message": renderFreeShippingMessage(this.config, this.cart),
        "coupon-code": renderCouponCodeField(this.config, this.appliedDiscount, this.availableDiscounts, this.showingAllOffers)
      };
      const { beforeItems, afterItems } = splitFeatureOrder((_a = this.config) == null ? void 0 : _a.featureOrder);
      beforeItems.forEach((id) => {
        if (sections[id])
          html += sections[id];
      });
      if (sections[FEATURE_ORDER_SENTINEL]) {
        html += sections[FEATURE_ORDER_SENTINEL];
      }
      afterItems.forEach((id) => {
        if (sections[id])
          html += sections[id];
      });
      html += renderCartTotals(this.cart, this.appliedDiscount);
      html += `
      <button class="upsellity-checkout-btn" onclick="window.location.href='${getCheckoutUrl(this.appliedDiscount)}'">
        Checkout
      </button>
      <div style="text-align: center; font-size: 12px; color: #6b7280; margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 12px;">
        <span style="display: flex; align-items: center; gap: 4px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          Secure Checkout
        </span>
        <span>\u2022</span>
        <span>Free Returns</span>
      </div>
    `;
      inner.innerHTML = html;
      setTimeout(() => {
        initializeRecommendationsNavigation();
      }, 100);
    }
    async open() {
      const drawer = document.getElementById("upsellity-cart-drawer");
      drawer.classList.add("open");
      this.isOpen = true;
      await this.loadConfig();
      await this.loadCart();
    }
    close() {
      const drawer = document.getElementById("upsellity-cart-drawer");
      drawer.classList.remove("open");
      this.isOpen = false;
    }
    // Carousel initialization
    initializePromoCarousel(carouselId, slides, settings) {
      initializePromoCarousel(carouselId, slides, settings);
    }
    handleSlideCtaClick(url) {
      if (url) {
        window.location.href = url;
      }
    }
    // Cart operations
    async addProductToCart(variantId, quantity = 1) {
      await addProductToCart(variantId, quantity, this.loadCart.bind(this));
    }
    async addProductToCartByHandle(productHandle, variantId, quantity = 1) {
      await addProductToCartByHandle(productHandle, variantId, quantity, this.loadCart.bind(this));
    }
    async updateQuantity(itemKey, newQuantity) {
      await updateQuantity(itemKey, newQuantity, this.loadCart.bind(this), this.render.bind(this));
    }
    async removeItem(itemKey) {
      await removeItem(itemKey, this.loadCart.bind(this), this.render.bind(this));
    }
    // Discount management
    async applyCoupon() {
      const newDiscount = await applyCoupon(this.shop, this.config, this.appliedDiscount, this.render.bind(this));
      if (newDiscount) {
        this.appliedDiscount = newDiscount;
      }
    }
    removeDiscount() {
      this.appliedDiscount = null;
      this.render();
      showNotification("Discount removed", "info");
    }
    toggleAllOffers() {
      this.showingAllOffers = !this.showingAllOffers;
      const dropdown = document.getElementById("upsellity-all-offers-dropdown");
      const arrow = document.getElementById("upsellity-offers-arrow");
      if (dropdown) {
        dropdown.style.display = this.showingAllOffers ? "block" : "none";
      }
      if (arrow) {
        arrow.textContent = this.showingAllOffers ? "\u25B2" : "\u25BC";
      }
    }
    async switchDiscount(discountCode) {
      const discount = this.availableDiscounts.find((d) => d.code === discountCode);
      if (!discount) {
        console.error("Upsellity: Discount not found", discountCode);
        return;
      }
      this.appliedDiscount = discount;
      this.showingAllOffers = false;
      this.render();
      showNotification(`${discount.code} applied!`, "success");
    }
    // Navigation
    scrollRecommendations(direction) {
      scrollRecommendations(direction);
    }
  };

  // extensions/cart-upsell/assets/modules/cart-drawer-entry.js
  function initializeCartDrawer() {
    if (typeof window !== "undefined") {
      window.upsellityDrawer = new UpsellityCartDrawer();
    }
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initializeCartDrawer);
    } else {
      initializeCartDrawer();
    }
  }
})();
