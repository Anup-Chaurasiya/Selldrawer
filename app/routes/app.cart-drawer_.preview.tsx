import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, BlockStack, Text } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

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

  const shopDataResponse = await admin.graphql(`
    query getShopCurrency {
      shop {
        currencyCode
        currencyFormats {
          moneyFormat
        }
      }
    }
  `);
  const shopDataJson = await shopDataResponse.json();
  const currencyCode = shopDataJson.data?.shop?.currencyCode || 'USD';
  const moneyFormat = shopDataJson.data?.shop?.currencyFormats?.moneyFormat || '{{amount}}';
  const currencySymbol = moneyFormat.replace('{{amount}}', '').trim();

  return json({ cartDrawer, currencyCode, currencySymbol });
};

export default function CartDrawerPreview() {
  const { cartDrawer, currencyCode, currencySymbol } = useLoaderData<typeof loader>();
  
  const averageItemPrice = 25;

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
            price: averageItemPrice * 2,
            originalPrice: averageItemPrice * 3,
            quantity: 1,
            image: null,
          }
        ],
        total: averageItemPrice * 2,
        originalTotal: averageItemPrice * 3,
        savings: averageItemPrice,
        itemCount: 1,
      };
    }

    // Create realistic sample data based on configuration
    let sampleTotal: number, sampleItemCount: number;
    
    if (freeShippingBar.thresholdMode === "amount") {
      const threshold = Number(freeShippingBar.thresholdAmount);
      sampleTotal = threshold * 0.75;
      sampleItemCount = Math.max(1, Math.floor(sampleTotal / averageItemPrice));
    } else {
      const threshold = Number(freeShippingBar.thresholdCount);
      sampleItemCount = Math.max(1, Math.floor(threshold * 0.75));
      sampleTotal = sampleItemCount * averageItemPrice;
    }

    return {
      items: [
        {
          id: 1,
          title: "Premium Running Shoes",
          variant: "Size 8 / Navy Blue",
          price: sampleTotal / sampleItemCount,
          originalPrice: (sampleTotal / sampleItemCount) * 1.67,
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

  const activeFreeShippingBar = cartDrawer?.freeShippingBars[0];
  const productRecommendation = cartDrawer?.productRecommendations[0];
  const savingsDisplay = cartDrawer?.savingsDisplays[0];
  const freeShippingMessage = cartDrawer?.freeShippingMessages[0];

  // Calculate free shipping progress
  const calculateProgress = () => {
    if (!activeFreeShippingBar) return 0;
    
    if (activeFreeShippingBar.thresholdMode === "amount") {
      const threshold = Number(activeFreeShippingBar.thresholdAmount);
      return Math.min((sampleCart.total / threshold) * 100, 100);
    } else {
      const threshold = Number(activeFreeShippingBar.thresholdCount);
      return Math.min((sampleCart.itemCount / threshold) * 100, 100);
    }
  };

  const calculateRemaining = () => {
    if (!activeFreeShippingBar) return 0;
    
    if (activeFreeShippingBar.thresholdMode === "amount") {
      const threshold = Number(activeFreeShippingBar.thresholdAmount);
      return Math.max(threshold - sampleCart.total, 0);
    } else {
      const threshold = Number(activeFreeShippingBar.thresholdCount);
      return Math.max(threshold - sampleCart.itemCount, 0);
    }
  };

  const getProgressMessage = () => {
    if (!activeFreeShippingBar) return null;
    
    const progress = calculateProgress();
    const remaining = calculateRemaining();
    
    if (progress >= 100) {
      return activeFreeShippingBar.afterThresholdMessage || "You've unlocked FREE shipping!";
    } else {
      let message = activeFreeShippingBar.beforeThresholdMessage || "Add {remaining} for FREE shipping";
      if (activeFreeShippingBar.thresholdMode === "amount") {
        message = message.replace('{remaining}', `${currencySymbol}${Math.round(remaining)}`);
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
                This preview simulates a cart with a value tailored to your currency settings ({currencyCode}).
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
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
              <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>

            <div style={{ padding: '16px 20px' }}>
              <BlockStack gap="400">
                {cartDrawer?.freeShippingProgressBarEnabled && activeFreeShippingBar && getProgressMessage() && (
                  <div style={{ 
                    marginBottom: '20px',
                    padding: '16px',
                    background: activeFreeShippingBar.backgroundColor 
                      ? `linear-gradient(135deg, ${activeFreeShippingBar.backgroundColor} 0%, ${activeFreeShippingBar.backgroundColor}dd 100%)`
                      : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
                      <span style={{ color: '#374151' }}>{getProgressMessage()}</span>
                      {(activeFreeShippingBar.showPercentage ?? true) && (
                        <span style={{ 
                          background: calculateProgress() >= 100 ? '#10b981' : activeFreeShippingBar.progressBarColor || '#f59e0b',
                          color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700'
                        }}>
                          {calculateProgress().toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      width: '100%', height: '12px', backgroundColor: activeFreeShippingBar.backgroundColor || '#e5e7eb',
                      borderRadius: '8px', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)', position: 'relative'
                    }}>
                      <div 
                        className="progress-bar-fill"
                        style={{ 
                          width: `${calculateProgress()}%`, height: '100%', display: 'block',
                          background: calculateProgress() >= 100 ? '#10b981' : activeFreeShippingBar.progressBarColor || '#f59e0b',
                          borderRadius: '8px', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)', minWidth: '2px'
                        }} 
                      />
                    </div>
                  </div>
                )}

                <div>
                  {sampleCart.items.map((item: any) => (
                    <div key={item.id} className="cart-item" data-item-id={item.id} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ width: '80px', height: '80px', backgroundColor: '#f3f4f6', borderRadius: '4px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{item.title}</div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>{item.variant}</div>
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '14px', marginRight: '8px' }}>
                            {currencySymbol}{Math.round(item.originalPrice * item.quantity)}
                          </span>
                          <span style={{ fontWeight: '600', fontSize: '16px' }}>
                            {currencySymbol}{Math.round(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {cartDrawer?.productRecommendationsEnabled && productRecommendation && (
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>{productRecommendation.title}</div>
                    <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                      {productRecommendation.products.slice(0, productRecommendation.maxProducts).map((product: any, idx: number) => (
                        <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px', textAlign: 'center', minWidth: '140px', flexShrink: 0 }}>
                          <div style={{ width: '100%', height: '100px', backgroundColor: '#f3f4f6', borderRadius: '4px', marginBottom: '8px' }} />
                          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>{product.title}</div>
                          <div style={{ fontWeight: '600' }}>{currencySymbol}{Math.round(Number(product.price))}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {cartDrawer?.savingsDisplayEnabled && savingsDisplay && (
                  <div style={{ backgroundColor: savingsDisplay.backgroundColor, color: savingsDisplay.textColor, padding: '12px 16px', borderRadius: '6px', textAlign: 'center', fontWeight: '600' }}>
                    {currencySymbol}{Math.round(sampleCart.savings)} Saved so far!
                  </div>
                )}

                {cartDrawer?.freeShippingMessageEnabled && freeShippingMessage && (
                  <div style={{ backgroundColor: freeShippingMessage.backgroundColor, color: freeShippingMessage.textColor, padding: '12px 16px', borderRadius: '6px', textAlign: 'center', fontSize: '14px' }}>
                    Free shipping on orders over {currencySymbol}{Number(freeShippingMessage.thresholdAmount).toFixed(0)}<br/>
                    <strong>Add {currencySymbol}{Math.round(calculateRemaining())} more for FREE shipping</strong>
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '600' }}>
                    <span>Estimated Total</span>
                    <span>{currencySymbol}{Math.round(sampleCart.total)}</span>
                  </div>
                </div>

                <button style={{ width: '100%', padding: '14px', backgroundColor: '#1f2937', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
                  Checkout
                </button>
              </BlockStack>
            </div>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
