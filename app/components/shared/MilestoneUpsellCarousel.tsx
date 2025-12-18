/**
 * Milestone Upsell Carousel Component - Premium Edition
 * Professional product recommendations with modern design
 */

import React, { useState, useEffect, useRef } from 'react';

export interface MilestoneUpsellProduct {
    id: string;
    title: string;
    handle: string;
    featuredImage: {
        url: string;
        altText?: string;
    } | null;
    price: number;
    variantId: string;
    availableForSale: boolean;
}

export interface MilestoneUpsellCarouselProps {
    shop: string;
    milestoneId: string;
    remaining: number;
    collectionHandle?: string | null;
    onAddToCart: (variantId: string, quantity: number) => void;
    onClose: () => void;
    isPreview?: boolean;
}

export const MilestoneUpsellCarousel: React.FC<MilestoneUpsellCarouselProps> = ({
    shop,
    milestoneId,
    remaining,
    collectionHandle,
    onAddToCart,
    onClose,
    isPreview = false,
}) => {
    const [products, setProducts] = useState<MilestoneUpsellProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [collectionUrl, setCollectionUrl] = useState<string | null>(null);
    const carouselRef = useRef<HTMLDivElement>(null);

    // Fetch products from API
    useEffect(() => {
        if (isPreview) {
            // Preview mode with sample products
            setProducts([
                {
                    id: 'sample-1',
                    title: 'Premium Product Sample',
                    handle: 'sample-1',
                    featuredImage: { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop', altText: 'Sample' },
                    price: remaining + 100,
                    variantId: 'sample-variant-1',
                    availableForSale: true,
                },
                {
                    id: 'sample-2',
                    title: 'Featured Product Sample',
                    handle: 'sample-2',
                    featuredImage: { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', altText: 'Sample' },
                    price: remaining + 200,
                    variantId: 'sample-variant-2',
                    availableForSale: true,
                },
            ]);
            setLoading(false);
            return;
        }

        // Fetch from API with cache busting
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError(null);

                const params = new URLSearchParams({
                    shop,
                    milestoneId,
                    remaining: remaining.toString(),
                    _t: Date.now().toString(), // Cache buster
                });

                // Use absolute URL when running in cart drawer
                const apiUrl = typeof window !== 'undefined' && (window as any).UPSELLITY_APP_URL
                    ? `${(window as any).UPSELLITY_APP_URL}/api/milestone-products?${params}`
                    : `/api/milestone-products?${params}`;

                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }

                const data = await response.json();

                if (data.error) {
                    throw new Error(data.message || data.error);
                }

                setProducts(data.products || []);
                setCollectionUrl(data.collectionUrl || null);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching milestone products:', err);
                setError(err instanceof Error ? err.message : 'Failed to load products');
                setLoading(false);
            }
        };

        fetchProducts();
    }, [shop, milestoneId, remaining, isPreview]);

    // Handle retry
    const handleRetry = () => {
        setError(null);
        setLoading(true);
        window.location.reload();
    };

    // Loading state with professional skeleton
    if (loading) {
        return (
            <div style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                marginTop: '16px',
                boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ height: '24px', width: '200px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '8px' }} />
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            fontSize: '20px',
                            cursor: 'pointer',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        ×
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '16px', overflowX: 'auto' }}>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} style={{ minWidth: '180px', flexShrink: 0 }}>
                            <div style={{ width: '180px', height: '180px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '12px', marginBottom: '12px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div style={{
                padding: '24px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '16px',
                marginTop: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(10px)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, color: 'white', fontSize: '16px', fontWeight: 600 }}>⚠️ {error}</h4>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            fontSize: '20px',
                            cursor: 'pointer',
                            color: 'white',
                        }}
                    >
                        ×
                    </button>
                </div>
                <button
                    onClick={handleRetry}
                    style={{
                        padding: '12px 24px',
                        background: 'white',
                        color: '#f5576c',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                        transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    🔄 Retry
                </button>
            </div>
        );
    }

    // Empty state
    if (products.length === 0) {
        return (
            <div style={{
                padding: '32px',
                background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                borderRadius: '16px',
                marginTop: '16px',
                textAlign: 'center',
            }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(0,0,0,0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            fontSize: '20px',
                            cursor: 'pointer',
                            color: '#333',
                        }}
                    >
                        ×
                    </button>
                </div>
                <p style={{ margin: 0, color: '#555', fontSize: '15px', fontWeight: 500 }}>
                    🔍 No eligible items found
                </p>
            </div>
        );
    }

    // Premium Product Carousel
    return (
        <div style={{
            padding: '28px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            marginTop: '16px',
            boxShadow: '0 20px 60px rgba(102, 126, 234, 0.4)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Decorative gradient overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
                <div>
                    <h3 style={{
                        margin: '0 0 6px 0',
                        fontSize: '20px',
                        fontWeight: 700,
                        color: 'white',
                        textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                        letterSpacing: '-0.5px',
                    }}>
                        ✨ Unlock Your Reward
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                        Add any of these items to your cart
                    </p>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'rgba(255,255,255,0.25)',
                        backdropFilter: 'blur(10px)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        fontSize: '22px',
                        cursor: 'pointer',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.35)';
                        e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                        e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                    }}
                    aria-label="Close"
                >
                    ×
                </button>
            </div>

            {/* Carousel */}
            <div
                ref={carouselRef}
                style={{
                    display: 'flex',
                    gap: '20px',
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    scrollBehavior: 'smooth',
                    paddingBottom: '12px',
                    marginBottom: '20px',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255,255,255,0.3) transparent',
                    position: 'relative',
                    zIndex: 1,
                }}
                role="list"
                aria-label="Product recommendations"
            >
                {products.map((product, index) => (
                    <div
                        key={product.id}
                        style={{
                            minWidth: '200px',
                            maxWidth: '200px',
                            flexShrink: 0,
                            scrollSnapAlign: 'start',
                            background: 'white',
                            borderRadius: '16px',
                            padding: '16px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                            animation: `slideIn 0.4s ease-out ${index * 0.1}s both`,
                        }}
                        role="listitem"
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.25)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
                        }}
                    >
                        {/* Product Image */}
                        <div style={{ position: 'relative', marginBottom: '14px', overflow: 'hidden', borderRadius: '12px' }}>
                            {product.featuredImage ? (
                                <img
                                    src={product.featuredImage.url}
                                    alt={product.featuredImage.altText || product.title}
                                    style={{
                                        width: '100%',
                                        height: '168px',
                                        objectFit: 'cover',
                                        borderRadius: '12px',
                                        transition: 'transform 0.4s',
                                    }}
                                    loading="lazy"
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                />
                            ) : (
                                <div style={{
                                    width: '100%',
                                    height: '168px',
                                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#a0aec0',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                }}>
                                    No image
                                </div>
                            )}
                            {!product.availableForSale && (
                                <div style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    background: 'rgba(239, 68, 68, 0.95)',
                                    color: 'white',
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                }}>
                                    Out of Stock
                                </div>
                            )}
                        </div>

                        {/* Product Title */}
                        < h4 style={{
                            margin: '0 0 8px 0',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#1a202c',
                            lineHeight: '1.4',
                            height: '40px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                        }}>
                            {product.title}
                        </h4>

                        {/* Product Price */}
                        <p style={{
                            margin: '0 0 14px 0',
                            fontSize: '18px',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                            ₹{product.price.toFixed(2)}
                        </p>

                        {/* Add to Cart Button */}
                        <button
                            onClick={() => onAddToCart(product.handle, 1)}
                            disabled={!product.availableForSale}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: product.availableForSale
                                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                    : 'linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: product.availableForSale ? 'pointer' : 'not-allowed',
                                fontSize: '13px',
                                fontWeight: 600,
                                transition: 'all 0.3s',
                                boxShadow: product.availableForSale ? '0 4px 15px rgba(102, 126, 234, 0.4)' : 'none',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}
                            onMouseEnter={(e) => {
                                if (product.availableForSale) {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (product.availableForSale) {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                                }
                            }}
                        >
                            {product.availableForSale ? '🛒 Add to Cart' : 'Unavailable'}
                        </button>
                    </div>
                ))
                }
            </div >

            {/* Show All Button */}
            {
                collectionUrl && (
                    <a
                        href={collectionUrl}
                        style={{
                            display: 'block',
                            textAlign: 'center',
                            padding: '16px',
                            background: 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(10px)',
                            color: '#667eea',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderRadius: '14px',
                            textDecoration: 'none',
                            fontSize: '15px',
                            fontWeight: 600,
                            transition: 'all 0.3s',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                            position: 'relative',
                            zIndex: 1,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.transform = 'scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                        }}
                    >
                        👀 View All Products →
                    </a>
                )
            }

            {/* Keyframe animations */}
            <style>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div >
    );
};
