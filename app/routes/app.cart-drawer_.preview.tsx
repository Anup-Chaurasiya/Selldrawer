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

  const cartDrawer = await prisma.cartDrawer.findUnique({
    where: { shop },
    include: {
      freeShippingBars: { where: { isActive: true }, orderBy: { priority: 'desc' } },
      promotionalBanners: { where: { isActive: true }, orderBy: { priority: 'desc' } },
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

  // Sample cart data for preview
  const sampleCart = {
    items: [
      {
        id: 1,
        title: "Classic Runner",
        variant: "8 / Beige and Brown",
        price: 2699.00,
        originalPrice: 5999.00,
        quantity: 1,
        image: "https://via.placeholder.com/80",
      }
    ],
    total: 2699.00,
    originalTotal: 5999.00,
    savings: 3300.00,
    itemCount: 1,
  };

  const freeShippingBar = cartDrawer?.freeShippingBars[0];
  const promotionalBanner = cartDrawer?.promotionalBanners[0];
  const productRecommendation = cartDrawer?.productRecommendations[0];
  const savingsDisplay = cartDrawer?.savingsDisplays[0];
  const freeShippingMessage = cartDrawer?.freeShippingMessages[0];

  // Calculate free shipping progress
  const calculateProgress = () => {
    if (!freeShippingBar) return 0;
    const threshold = Number(freeShippingBar.thresholdAmount);
    return Math.min((sampleCart.total / threshold) * 100, 100);
  };

  const calculateRemaining = () => {
    if (!freeShippingBar) return 0;
    const threshold = Number(freeShippingBar.thresholdAmount);
    return Math.max(threshold - sampleCart.total, 0);
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
                Your Cart ({sampleCart.itemCount} items)
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
                <div style={{ 
                  marginBottom: '20px',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
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
                      Add ₹{calculateRemaining().toFixed(2)} for FREE shipping
                    </span>
                    <span style={{ 
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '700',
                      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                    }}>
                      {calculateProgress().toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: '12px', 
                    backgroundColor: '#e5e7eb',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
                    position: 'relative'
                  }}>
                    <div style={{ 
                      width: `${calculateProgress()}%`, 
                      height: '100%',
                      display: 'block',
                      background: calculateProgress() >= 100 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      borderRadius: '8px',
                      transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      minWidth: '2px'
                    }} />
                  </div>
                </div>

                {/* Promotional Banner */}
                {cartDrawer?.promotionalBannerEnabled && promotionalBanner && (
                  <div style={{ 
                    backgroundColor: promotionalBanner.backgroundColor,
                    color: promotionalBanner.textColor,
                    padding: '16px',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
                      {promotionalBanner.title}
                    </div>
                    {promotionalBanner.subtitle && (
                      <div style={{ fontSize: '14px' }}>
                        {promotionalBanner.subtitle}
                      </div>
                    )}
                  </div>
                )}

                {/* Cart Items with Enhanced Controls */}
                <div>
                  {sampleCart.items.map((item) => (
                    <div key={item.id} style={{ 
                      display: 'flex', 
                      gap: '12px',
                      padding: '12px 0',
                      borderBottom: '1px solid #f3f4f6',
                      position: 'relative'
                    }}>
                      <img 
                        src={item.image} 
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
                            ₹{item.originalPrice.toFixed(2)}
                          </span>
                          <span style={{ fontWeight: '600', fontSize: '16px' }}>
                            ₹{item.price.toFixed(2)}
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
                            <button style={{ 
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
                            }}>−</button>
                            <span style={{ 
                              minWidth: '40px',
                              textAlign: 'center',
                              fontWeight: '600',
                              fontSize: '14px',
                              color: '#374151',
                              padding: '0 8px'
                            }}>{item.quantity}</span>
                            <button style={{ 
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
                            }}>+</button>
                          </div>
                          <button style={{ 
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
                          }} title="Remove item">🗑</button>
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
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px'
                    }}>
                      {/* Sample recommendations */}
                      {[
                        { title: 'Sport Elite', price: 2699, originalPrice: 5999, discount: '55% off' },
                        { title: 'Urban Style', price: 2699, originalPrice: 5999, discount: '55% off' },
                      ].map((product, idx) => (
                        <div key={idx} style={{ 
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          padding: '12px',
                          textAlign: 'center'
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
                            fontSize: '32px'
                          }}>
                            👟
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                            {product.title}
                          </div>
                          <div style={{ marginBottom: '4px' }}>
                            <span style={{ 
                              textDecoration: 'line-through',
                              color: '#9ca3af',
                              fontSize: '12px',
                              marginRight: '4px'
                            }}>
                              ₹{product.originalPrice}
                            </span>
                            <span style={{ fontWeight: '600' }}>₹{product.price}</span>
                          </div>
                          {productRecommendation.showDiscountBadge && (
                            <div style={{ 
                              display: 'inline-block',
                              backgroundColor: '#10b981',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              marginBottom: '8px'
                            }}>
                              {product.discount}
                            </div>
                          )}
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
                              fontWeight: '500'
                            }}>
                              + Add
                            </button>
                          )}
                        </div>
                      ))}
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
                    ₹{sampleCart.savings.toFixed(2)} Saved so far!
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
                    <strong>Add ₹{calculateRemaining().toFixed(2)} more for FREE shipping</strong>
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
                        ₹{sampleCart.originalTotal.toFixed(2)}
                      </span>
                      <span>₹{sampleCart.total.toFixed(2)}</span>
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
                  cursor: 'pointer'
                }}>
                  Checkout →
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

