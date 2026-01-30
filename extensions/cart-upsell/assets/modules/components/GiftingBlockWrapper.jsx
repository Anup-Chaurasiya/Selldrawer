/**
 * Gifting Block Wrapper Component
 * React wrapper that renders the free gift selector for the gifting block
 * 
 * NOTE: Cannot import from app/components since this is built separately
 * So we inline the FreeGiftSelector logic here
 */

import React, { useEffect } from 'react';

export function GiftingBlockWrapper({
    gift,
    selectedGiftId,
    shop,
    isPreview = false,
    onSelectGift,
    onImpression
}) {
    // Track impression on mount
    useEffect(() => {
        if (!isPreview && onImpression) {
            onImpression();
        }
    }, [isPreview, onImpression]);

    if (!gift || !gift.qualified) {
        return null;
    }

    const { giftProducts, customerLimit, name } = gift;

    // If only one gift product, don't show any UI (auto-applied by the manager)
    if (giftProducts.length === 1) {
        return null;
    }

    // Multiple gift products - show compact selection UI
    const hasSelectedGift = giftProducts.some(p => selectedGiftId === p.id);

    return (
        <div className="upsellity-gifting-block" style={{
            padding: '12px 14px',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #86efac',
            marginBottom: '12px',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
            }}>
                <span style={{ fontSize: '20px' }}>🎁</span>
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#166534',
                        marginBottom: '2px',
                    }}>
                        {name}
                    </div>
                    <div style={{
                        fontSize: '12px',
                        color: '#15803d',
                    }}>
                        {hasSelectedGift
                            ? 'Gift selected - FREE at checkout!'
                            : `Choose ${customerLimit} free gift${customerLimit > 1 ? 's' : ''}`
                        }
                    </div>
                </div>
                <div style={{
                    padding: '6px 12px',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                }}>
                    FREE
                </div>
            </div>

            {/* Compact Gift Products Carousel */}
            <div style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '4px',
                scrollbarWidth: 'thin',
                marginTop: '12px',
            }}>
                {giftProducts.map((product) => {
                    const isSelected = selectedGiftId === product.id;

                    return (
                        <div
                            key={product.id}
                            onClick={() => {
                                if (!isPreview) {
                                    onSelectGift(product.id, product.shopifyVariantId || product.shopifyProductId);
                                }
                            }}
                            style={{
                                minWidth: '110px',
                                maxWidth: '110px',
                                border: isSelected ? '2px solid #16a34a' : '1px solid #d1d5db',
                                borderRadius: '8px',
                                padding: '8px',
                                backgroundColor: '#ffffff',
                                cursor: isPreview ? 'default' : 'pointer',
                                transition: 'all 0.2s',
                                position: 'relative',
                                boxShadow: isSelected ? '0 2px 8px rgba(22, 101, 52, 0.2)' : 'none',
                            }}
                            onMouseEnter={(e) => {
                                if (!isPreview) {
                                    e.currentTarget.style.borderColor = '#16a34a';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isPreview && !isSelected) {
                                    e.currentTarget.style.borderColor = '#d1d5db';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                } else if (isSelected) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(22, 101, 52, 0.2)';
                                }
                            }}
                        >
                            {/* Selected Badge */}
                            {isSelected && (
                                <div style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    backgroundColor: '#16a34a',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    zIndex: 1,
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                }}>
                                    ✓
                                </div>
                            )}

                            {/* Product Image */}
                            <div style={{
                                width: '100%',
                                aspectRatio: '1',
                                backgroundColor: '#f9fafb',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                marginBottom: '6px',
                            }}>
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.title}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '28px',
                                    }}>
                                        🎁
                                    </div>
                                )}
                            </div>

                            {/* Product Title */}
                            <div style={{
                                fontSize: '11px',
                                fontWeight: '600',
                                color: '#111827',
                                marginBottom: '4px',
                                lineHeight: '1.2',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                minHeight: '26px',
                            }}>
                                {product.title}
                            </div>

                            {/* Price */}
                            <div style={{
                                fontSize: '10px',
                                color: '#16a34a',
                                fontWeight: '700',
                                textAlign: 'center',
                            }}>
                                FREE
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
