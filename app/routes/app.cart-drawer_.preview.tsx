import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, BlockStack, Text } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);

  const cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop },
    include: {
      freeShippingBars: { where: { isActive: true }, orderBy: { priority: 'desc' } },
      productRecommendations: { 
        where: { isActive: true }, 
        orderBy: { priority: 'desc' },
        include: { products: { orderBy: { position: 'asc' } } }
      },
      savingsDisplays: { where: { isActive: true } },
      freeShippingMessages: { where: { isActive: true } },
    },
  });

  return json({ cartDrawer });
};

export default function CartDrawerPreview() {
  const { cartDrawer } = useLoaderData<typeof loader>();

  // Dynamic sample cart data based on configuration
  const getSampleCart = () => {
    const freeShippingBar = cartDrawer?.freeShippingBars[0];
    
    if (!freeShippingBar) {
      return {
        items: [
          {
            id: 1,
            title: "Premium Running Shoes",
            variant: "Size 8 / Navy Blue",
            price: 2999.00,
            originalPrice: 4999.00,
            quantity: 1,
            image: null,
          }
        ],
        total: 2999.00,
        originalTotal: 4999.00,
        savings: 2000.00,
        itemCount: 1,
      };
    }

    // Create realistic sample data based on configuration
    let sampleTotal, sampleItemCount;
    
    if (freeShippingBar.thresholdMode === "amount") {
      const threshold = Number(freeShippingBar.thresholdAmount);
      // Show 75% progress for preview (more realistic)
      sampleTotal = threshold * 0.75;
      sampleItemCount = Math.max(1, Math.floor(sampleTotal / 1500)); // Assume average item price of ₹1500
    } else {
      const threshold = Number(freeShippingBar.thresholdCount);
      // Show 75% progress for preview (more realistic)
      sampleItemCount = Math.max(1, Math.floor(threshold * 0.75));
      sampleTotal = sampleItemCount * 1500; // Assume average item price of ₹1500
    }

    return {
      items: [
        {
          id: 1,
          title: "Premium Running Shoes",
          variant: "Size 8 / Navy Blue",
          price: sampleTotal / sampleItemCount,
          originalPrice: (sampleTotal / sampleItemCount) * 1.67, // 40% discount
          quantity: sampleItemCount,
          image: null,
        }
      ],
      total: sampleTotal,
      originalTotal: sampleTotal * 1.67,
      savings: sampleTotal * 0.67,
      itemCount: sampleItemCount,
    };
  };

  const sampleCart = getSampleCart();

  const freeShippingBar = cartDrawer?.freeShippingBars[0];
  const productRecommendation = cartDrawer?.productRecommendations[0];
  const savingsDisplay = cartDrawer?.savingsDisplays[0];
  const freeShippingMessage = cartDrawer?.freeShippingMessages[0];

  // Calculate free shipping progress
  const calculateProgress = () => {
    if (!freeShippingBar) return 0;
    
    if (freeShippingBar.thresholdMode === "amount") {
      const threshold = Number(freeShippingBar.thresholdAmount);
      return Math.min((sampleCart.total / threshold) * 100, 100);
    } else {
      const threshold = Number(freeShippingBar.thresholdCount);
      return Math.min((sampleCart.itemCount / threshold) * 100, 100);
    }
  };

  const calculateRemaining = () => {
    if (!freeShippingBar) return 0;
    
    if (freeShippingBar.thresholdMode === "amount") {
      const threshold = Number(freeShippingBar.thresholdAmount);
      return Math.max(threshold - sampleCart.total, 0);
    } else {
      const threshold = Number(freeShippingBar.thresholdCount);
      return Math.max(threshold - sampleCart.itemCount, 0);
    }
  };

  const getProgressMessage = () => {
    if (!freeShippingBar) {
      return null; // Don't show free shipping bar if not configured
    }
    
    const progress = calculateProgress();
    const remaining = calculateRemaining();
    
    if (progress >= 100) {
      return freeShippingBar.afterThresholdMessage || "You've unlocked FREE shipping!";
    } else {
      let message = freeShippingBar.beforeThresholdMessage || "Add {remaining} for FREE shipping";
      if (freeShippingBar.thresholdMode === "amount") {
        message = message.replace('{remaining}', `₹${Math.round(remaining)}`);
      } else {
        message = message.replace('{remaining}', `${Math.round(remaining)} more items`);
      }
      return message;
    }
  };

  return (
    <Page>
      <TitleBar title="Cart Drawer Preview" />
      <Layout>
        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Live Preview
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                This is how your cart drawer will look to customers
              </Text>
              
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          {/* Cart Drawer Preview */}
          <div style={{ 
            maxWidth: '400px', 
            margin: '0 auto',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
          }}>
            {/* Header */}
            <div style={{ 
              padding: '16px 20px', 
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
                Your Cart (<span className="cart-item-count">{sampleCart.itemCount}</span> items)
              </h2>
              <button style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7280'
              }}>×</button>
            </div>

            <div style={{ padding: '16px 20px' }}>
              <BlockStack gap="400">
                {/* Enhanced Free Shipping Progress Bar */}
                {cartDrawer?.freeShippingProgressBarEnabled && freeShippingBar && getProgressMessage() && (
                  <div style={{ 
                    marginBottom: '20px',
                    padding: '16px',
                    background: freeShippingBar.backgroundColor 
                      ? `linear-gradient(135deg, ${freeShippingBar.backgroundColor} 0%, ${freeShippingBar.backgroundColor}dd 100%)`
                      : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '12px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      <span style={{ color: '#374151' }}>
                        {getProgressMessage()}
                      </span>
                      {(freeShippingBar.showPercentage ?? true) && (
                        <span style={{ 
                          background: calculateProgress() >= 100 
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : freeShippingBar.progressBarColor 
                              ? `linear-gradient(135deg, ${freeShippingBar.progressBarColor} 0%, ${freeShippingBar.progressBarColor}dd 100%)`
                              : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '700',
                          boxShadow: calculateProgress() >= 100 
                            ? '0 2px 4px rgba(16, 185, 129, 0.3)'
                            : freeShippingBar.progressBarColor 
                              ? `0 2px 4px ${freeShippingBar.progressBarColor}40`
                              : '0 2px 4px rgba(245, 158, 11, 0.3)'
                        }}>
                          {calculateProgress().toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '12px', 
                      backgroundColor: freeShippingBar.backgroundColor || '#e5e7eb',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
                      position: 'relative'
                    }}>
                      <div 
                        className="progress-bar-fill"
                        style={{ 
                          width: `${calculateProgress()}%`, 
                          height: '100%',
                          display: 'block',
                          background: calculateProgress() >= 100 
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : freeShippingBar.progressBarColor 
                              ? `linear-gradient(135deg, ${freeShippingBar.progressBarColor} 0%, ${freeShippingBar.progressBarColor}dd 100%)`
                              : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          borderRadius: '8px',
                          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                          minWidth: '2px'
                        }} 
                      />
                    </div>
                  </div>
                )}

                {/* Cart Items with Enhanced Controls */}
                <div>
                  {sampleCart.items.map((item) => (
                    <div key={item.id} className="cart-item" data-item-id={item.id} style={{ 
                      display: 'flex', 
                      gap: '12px',
                      padding: '12px 0',
                      borderBottom: '1px solid #f3f4f6',
                      position: 'relative'
                    }}>
                      <img 
                        src={item.image ?? ''} 
                        alt={item.title}
                        style={{ 
                          width: '80px', 
                          height: '80px', 
                          objectFit: 'cover',
                          borderRadius: '4px'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                          {item.variant}
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ 
                            textDecoration: 'line-through', 
                            color: '#9ca3af',
                            fontSize: '14px',
                            marginRight: '8px'
                          }}>
                            ₹{Math.round(item.originalPrice * item.quantity)}
                          </span>
                          <span style={{ fontWeight: '600', fontSize: '16px' }}>
                            ₹{Math.round(item.price * item.quantity)}
                          </span>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            background: 'white'
                          }}>
                            <button 
                              onClick={() => {
                                const newQuantity = Math.max(1, item.quantity - 1);
                                // Update the sample cart state
                                const updatedItems = sampleCart.items.map(i => 
                                  i.id === item.id ? { ...i, quantity: newQuantity } : i
                                );
                                const newTotal = updatedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
                                const newOriginalTotal = updatedItems.reduce((sum, i) => sum + (i.originalPrice * i.quantity), 0);
                                const newItemCount = updatedItems.reduce((sum, i) => sum + i.quantity, 0);
                                
                                // Update the display
                                const quantitySpan = document.querySelector(`[data-item-id="${item.id}"] .quantity-display`);
                                const totalSpan = document.querySelector('.cart-total');
                                const itemCountSpan = document.querySelector('.cart-item-count');
                                
                                if (quantitySpan) quantitySpan.textContent = newQuantity.toString();
                                if (totalSpan) totalSpan.textContent = `₹${Math.round(newTotal)}`;
                                if (itemCountSpan) itemCountSpan.textContent = `${newItemCount} items`;
                                
                                // Update progress bar if it exists
                                const progressBar = document.querySelector('.progress-bar-fill') as HTMLElement;
                                if (progressBar && freeShippingBar) {
                                  let progress;
                                  if (freeShippingBar.thresholdMode === "amount") {
                                    const threshold = Number(freeShippingBar.thresholdAmount);
                                    progress = Math.min((newTotal / threshold) * 100, 100);
                                  } else {
                                    const threshold = Number(freeShippingBar.thresholdCount);
                                    progress = Math.min((newItemCount / threshold) * 100, 100);
                                  }
                                  progressBar.style.width = `${progress}%`;
                                }
                              }}
                              style={{ 
                                width: '32px', 
                                height: '32px',
                                border: 'none',
                                background: '#f8f9fa',
                                color: '#374151',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                                transition: 'all 0.2s ease'
                              }}
                            >−</button>
                            <span 
                              className="quantity-display"
                              data-item-id={item.id}
                              style={{ 
                                minWidth: '40px',
                                textAlign: 'center',
                                fontWeight: '600',
                                fontSize: '14px',
                                color: '#374151',
                                padding: '0 8px'
                              }}
                            >{item.quantity}</span>
                            <button 
                              onClick={() => {
                                const newQuantity = item.quantity + 1;
                                // Update the sample cart state
                                const updatedItems = sampleCart.items.map(i => 
                                  i.id === item.id ? { ...i, quantity: newQuantity } : i
                                );
                                const newTotal = updatedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
                                const newOriginalTotal = updatedItems.reduce((sum, i) => sum + (i.originalPrice * i.quantity), 0);
                                const newItemCount = updatedItems.reduce((sum, i) => sum + i.quantity, 0);
                                
                                // Update the display
                                const quantitySpan = document.querySelector(`[data-item-id="${item.id}"] .quantity-display`);
                                const totalSpan = document.querySelector('.cart-total');
                                const itemCountSpan = document.querySelector('.cart-item-count');
                                
                                if (quantitySpan) quantitySpan.textContent = newQuantity.toString();
                                if (totalSpan) totalSpan.textContent = `₹${Math.round(newTotal)}`;
                                if (itemCountSpan) itemCountSpan.textContent = `${newItemCount} items`;
                                
                                // Update progress bar if it exists
                                const progressBar = document.querySelector('.progress-bar-fill') as HTMLElement;
                                if (progressBar && freeShippingBar) {
                                  let progress;
                                  if (freeShippingBar.thresholdMode === "amount") {
                                    const threshold = Number(freeShippingBar.thresholdAmount);
                                    progress = Math.min((newTotal / threshold) * 100, 100);
                                  } else {
                                    const threshold = Number(freeShippingBar.thresholdCount);
                                    progress = Math.min((newItemCount / threshold) * 100, 100);
                                  }
                                  progressBar.style.width = `${progress}%`;
                                }
                              }}
                              style={{ 
                                width: '32px', 
                                height: '32px',
                                border: 'none',
                                background: '#f8f9fa',
                                color: '#374151',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                                transition: 'all 0.2s ease'
                              }}
                            >+</button>
                          </div>
                          <button 
                            onClick={() => {
                              // Remove item from cart
                              const updatedItems = sampleCart.items.filter(i => i.id !== item.id);
                              const newTotal = updatedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
                              const newOriginalTotal = updatedItems.reduce((sum, i) => sum + (i.originalPrice * i.quantity), 0);
                              const newItemCount = updatedItems.reduce((sum, i) => sum + i.quantity, 0);
                              
                              // Update the display
                              const totalSpan = document.querySelector('.cart-total');
                              const itemCountSpan = document.querySelector('.cart-item-count');
                              const cartItem = document.querySelector(`[data-item-id="${item.id}"]`)?.closest('.cart-item') as HTMLElement;
                              
                              if (totalSpan) totalSpan.textContent = `₹${Math.round(newTotal)}`;
                              if (itemCountSpan) itemCountSpan.textContent = `${newItemCount} items`;
                              if (cartItem) cartItem.style.display = 'none';
                              
                              // Update progress bar if it exists
                              const progressBar = document.querySelector('.progress-bar-fill') as HTMLElement;
                              if (progressBar && freeShippingBar) {
                                let progress;
                                if (freeShippingBar.thresholdMode === "amount") {
                                  const threshold = Number(freeShippingBar.thresholdAmount);
                                  progress = Math.min((newTotal / threshold) * 100, 100);
                                } else {
                                  const threshold = Number(freeShippingBar.thresholdCount);
                                  progress = Math.min((newItemCount / threshold) * 100, 100);
                                }
                                progressBar.style.width = `${progress}%`;
                              }
                            }}
                            style={{ 
                              width: '32px', 
                              height: '32px',
                              border: 'none',
                              background: '#ef4444',
                              color: 'white',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              transition: 'all 0.2s ease'
                            }} 
                            title="Remove item"
                          >🗑</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Product Recommendations */}
                {cartDrawer?.productRecommendationsEnabled && productRecommendation && (
                  <div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      marginBottom: '12px' 
                    }}>
                      {productRecommendation.title}
                    </div>
                    <div style={{ 
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        display: 'flex',
                        gap: '12px',
                        overflowX: 'auto',
                        scrollBehavior: 'smooth',
                        paddingBottom: '8px',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 #f1f5f9'
                      }}>
                        {/* Actual selected products */}
                        {productRecommendation.products.length > 0 ? (
                          productRecommendation.products.slice(0, productRecommendation.maxProducts).map((product, idx) => {
                            const compareAtPrice = Number(product.compareAtPrice);
                            const price = Number(product.price);
                            const discountPercent = product.compareAtPrice && compareAtPrice > price 
                              ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) 
                              : 0;
                            
                            return (
                          <div key={idx} style={{ 
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            padding: '12px',
                            textAlign: 'center',
                            minWidth: '140px',
                            flexShrink: 0,
                            backgroundColor: '#ffffff',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                          }}>
                            <div style={{ 
                              width: '100%',
                              height: '100px',
                              backgroundColor: '#f3f4f6',
                              borderRadius: '4px',
                              marginBottom: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '32px',
                              position: 'relative',
                              backgroundImage: product.imageUrl ? `url(${product.imageUrl})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}>
                              {!product.imageUrl && '📦'}
                              {productRecommendation.showDiscountBadge && discountPercent > 0 && (
                                <div style={{ 
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  backgroundColor: '#10b981',
                                  color: 'white',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  zIndex: 10
                                }}>
                                  {discountPercent}% off
                                </div>
                              )}
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', lineHeight: '1.3' }}>
                              {product.title}
                            </div>
                            <div style={{ marginBottom: '4px' }}>
                              {productRecommendation.showDiscount && product.compareAtPrice && compareAtPrice > price ? (
                                <>
                                  <span style={{ 
                                    textDecoration: 'line-through',
                                    color: '#9ca3af',
                                    fontSize: '12px',
                                    marginRight: '4px'
                                  }}>
                                    ₹{Math.round(compareAtPrice)}
                                  </span>
                                  <span style={{ fontWeight: '600' }}>₹{Math.round(price)}</span>
                                </>
                              ) : (
                                <span style={{ fontWeight: '600' }}>₹{Math.round(price)}</span>
                              )}
                            </div>
                            {productRecommendation.showAddButton && (
                              <button style={{ 
                                width: '100%',
                                padding: '6px',
                                border: '1px solid #f97316',
                                background: 'white',
                                color: '#f97316',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                              }}>
                                + Add
                              </button>
                            )}
                          </div>
                            );
                          })
                        ) : (
                          <div style={{ 
                            minWidth: '100%',
                            textAlign: 'center',
                            padding: '40px 20px',
                            color: '#6b7280',
                            fontSize: '14px'
                          }}>
                            No products selected. Configure product recommendations to see them here.
                          </div>
                        )}
                      </div>
                      {/* Scroll indicator */}
                      <div style={{
                        position: 'absolute',
                        right: '0',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,1) 100%)',
                        width: '20px',
                        height: '100%',
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{
                          width: '4px',
                          height: '20px',
                          background: '#cbd5e1',
                          borderRadius: '2px',
                          opacity: '0.6'
                        }}></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Savings Display */}
                {cartDrawer?.savingsDisplayEnabled && savingsDisplay && (
                  <div style={{ 
                    backgroundColor: savingsDisplay.backgroundColor,
                    color: savingsDisplay.textColor,
                    padding: '12px 16px',
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '16px'
                  }}>
                    ₹{Math.round(sampleCart.savings)} Saved so far!
                  </div>
                )}

                {/* Free Shipping Message */}
                {cartDrawer?.freeShippingMessageEnabled && freeShippingMessage && (
                  <div style={{ 
                    backgroundColor: freeShippingMessage.backgroundColor,
                    color: freeShippingMessage.textColor,
                    padding: '12px 16px',
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontSize: '14px'
                  }}>
                    Free shipping on orders over ₹{Number(freeShippingMessage.thresholdAmount).toFixed(0)}<br/>
                    <strong>Add ₹{Math.round(calculateRemaining())} more for FREE shipping</strong>
                  </div>
                )}

                {/* Coupon Code Field */}
                {cartDrawer?.couponCodeFieldEnabled && (
                  <div style={{ 
                    margin: '16px 0', 
                    padding: '16px', 
                    background: '#f8fafc', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0' 
                  }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          background: 'white',
                          outline: 'none'
                        }}
                      />
                      <button style={{
                        padding: '10px 16px',
                        background: '#1f2937',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}>
                        Apply
                      </button>
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    <span>Estimated Total</span>
                    <div>
                      <span style={{ 
                        textDecoration: 'line-through',
                        color: '#9ca3af',
                        fontSize: '14px',
                        marginRight: '8px'
                      }}>
                        ₹{Math.round(sampleCart.originalTotal)}
                      </span>
                      <span className="cart-total">₹{Math.round(sampleCart.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <button style={{ 
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px -2px rgba(31, 41, 55, 0.3)',
                  transition: 'all 0.2s'
                }}>
                  <span>Checkout</span>
                </button>

                {/* Footer */}
                <div style={{ 
                  textAlign: 'center',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  Secure Checkout • Free Returns
                </div>
              </BlockStack>
            </div>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

