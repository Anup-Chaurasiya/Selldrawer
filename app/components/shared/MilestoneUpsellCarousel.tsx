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
    upsellHeaderText?: string;
    viewAllLinkText?: string;
}

export const MilestoneUpsellCarousel: React.FC<MilestoneUpsellCarouselProps> = ({
    shop,
    milestoneId,
    remaining,
    collectionHandle,
    onAddToCart,
    onClose,
    isPreview = false,
    upsellHeaderText = "Unlock Your Reward",
    viewAllLinkText = "View All",
}) => {
    const [products, setProducts] = useState<MilestoneUpsellProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [collectionUrl, setCollectionUrl] = useState<string | null>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
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

    // Check scroll position to show/hide arrows
    const checkScroll = () => {
        if (carouselRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    // Update arrows when products load
    useEffect(() => {
        if (products.length > 0) {
            setTimeout(checkScroll, 100);
        }
    }, [products]);

    // Scroll handlers
    const scrollLeft = () => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({ left: -120, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({ left: 120, behavior: 'smooth' });
        }
    };

    // Handle retry
    const handleRetry = () => {
        setError(null);
        setLoading(true);
        window.location.reload();
    };

    // Loading state - compact and minimal
    if (loading) {
        return (
            <div style={{
                padding: '8px',
                backgroundColor: '#ffffff',
                borderRadius: '6px',
                marginTop: '8px',
                border: '1px solid #e5e7eb',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ height: '14px', width: '120px', backgroundColor: '#f3f4f6', borderRadius: '4px' }} />
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            width: '20px',
                            height: '20px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            color: '#6b7280',
                            padding: 0,
                        }}
                    >
                        ×
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} style={{ minWidth: '100px', flexShrink: 0 }}>
                            <div style={{ width: '100px', height: '100px', backgroundColor: '#f9fafb', borderRadius: '4px', marginBottom: '4px' }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Error state - compact
    if (error) {
        return (
            <div style={{
                padding: '12px',
                backgroundColor: '#ffffff',
                borderRadius: '6px',
                marginTop: '8px',
                border: '1px solid #e5e7eb',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ margin: 0, color: '#6b7280', fontSize: '11px', fontWeight: 500 }}>Error: {error}</span>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            width: '20px',
                            height: '20px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            color: '#6b7280',
                            padding: 0,
                        }}
                    >
                        ×
                    </button>
                </div>
                <button
                    onClick={handleRetry}
                    style={{
                        padding: '6px 12px',
                        background: '#ffffff',
                        color: '#111827',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '10px',
                        fontWeight: 500,
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    // Empty state - compact
    if (products.length === 0) {
        return null;
    }

    // Ultra-compact Product Carousel
    return (
        <div style={{
            padding: '8px',
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            marginTop: '8px',
            border: '1px solid #e5e7eb',
        }}>
            {/* Header - minimal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h4 style={{
                    margin: 0,
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#111827',
                    letterSpacing: '-0.01em',
                }}>
                    {upsellHeaderText}
                </h4>
                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        width: '20px',
                        height: '20px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        color: '#6b7280',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    aria-label="Close"
                >
                    ×
                </button>
            </div>

            {/* Carousel Container with Arrows */}
            <div style={{ position: 'relative' }}>
                {/* Left Arrow */}
                {showLeftArrow && (
                    <button
                        onClick={scrollLeft}
                        style={{
                            position: 'absolute',
                            left: '-8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 10,
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#ffffff',
                            border: '1px solid #d1d5db',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                            fontSize: '14px',
                            color: '#374151',
                            padding: 0,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                            e.currentTarget.style.borderColor = '#9ca3af';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.borderColor = '#d1d5db';
                        }}
                        aria-label="Scroll left"
                    >
                        ‹
                    </button>
                )}

                {/* Right Arrow */}
                {showRightArrow && (
                    <button
                        onClick={scrollRight}
                        style={{
                            position: 'absolute',
                            right: '-8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 10,
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#ffffff',
                            border: '1px solid #d1d5db',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                            fontSize: '14px',
                            color: '#374151',
                            padding: 0,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                            e.currentTarget.style.borderColor = '#9ca3af';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.borderColor = '#d1d5db';
                        }}
                        aria-label="Scroll right"
                    >
                        ›
                    </button>
                )}

                {/* Carousel - ultra-compact */}
                <div
                    ref={carouselRef}
                    onScroll={checkScroll}
                    style={{
                        display: 'flex',
                        gap: '6px',
                        overflowX: 'auto',
                        scrollSnapType: 'x mandatory',
                        scrollBehavior: 'smooth',
                        paddingBottom: '4px',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    }}
                    role="list"
                    aria-label="Product recommendations"
                >
                    {products.map((product) => (
                        <div
                            key={product.id}
                            style={{
                                minWidth: '100px',
                                maxWidth: '100px',
                                flexShrink: 0,
                                scrollSnapAlign: 'start',
                                border: '1px solid #e5e7eb',
                                borderRadius: '4px',
                                padding: '6px',
                                backgroundColor: '#ffffff',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer',
                            }}
                            role="listitem"
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                                e.currentTarget.style.borderColor = '#d1d5db';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                                e.currentTarget.style.borderColor = '#e5e7eb';
                            }}
                        >
                            {/* Product Image */}
                            <div style={{ position: 'relative', marginBottom: '4px', overflow: 'hidden', borderRadius: '4px' }}>
                                {product.featuredImage ? (
                                    <img
                                        src={product.featuredImage.url}
                                        alt={product.featuredImage.altText || product.title}
                                        style={{
                                            width: '100%',
                                            height: '88px',
                                            objectFit: 'cover',
                                            borderRadius: '4px',
                                            display: 'block',
                                        }}
                                        loading="lazy"
                                    />
                                ) : (
                                    <div style={{
                                        width: '100%',
                                        height: '88px',
                                        background: '#f3f4f6',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#9ca3af',
                                        fontSize: '20px',
                                    }}>
                                        📦
                                    </div>
                                )}
                                {!product.availableForSale && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '3px',
                                        right: '3px',
                                        background: '#ef4444',
                                        color: 'white',
                                        padding: '2px 4px',
                                        borderRadius: '3px',
                                        fontSize: '7px',
                                        fontWeight: 600,
                                    }}>
                                        Out
                                    </div>
                                )}
                            </div>

                            {/* Product Title */}
                            <div style={{
                                fontSize: '9px',
                                fontWeight: 500,
                                marginBottom: '2px',
                                lineHeight: '1.2',
                                color: '#111827',
                                minHeight: '22px',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                letterSpacing: '-0.01em',
                            }}>
                                {product.title}
                            </div>

                            {/* Product Price */}
                            <div style={{
                                marginBottom: '4px',
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#111827',
                                letterSpacing: '-0.01em',
                            }}>
                                ₹{Math.round(product.price)}
                            </div>

                            {/* Add to Cart Button */}
                            <button
                                onClick={() => onAddToCart(product.handle, 1)}
                                disabled={!product.availableForSale}
                                style={{
                                    width: '100%',
                                    padding: '4px 6px',
                                    background: product.availableForSale ? '#111827' : '#e5e7eb',
                                    color: product.availableForSale ? 'white' : '#9ca3af',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: product.availableForSale ? 'pointer' : 'not-allowed',
                                    fontSize: '8px',
                                    fontWeight: 600,
                                    transition: 'all 0.2s',
                                    letterSpacing: '0.2px',
                                }}
                                onMouseEnter={(e) => {
                                    if (product.availableForSale) {
                                        e.currentTarget.style.background = '#1f2937';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (product.availableForSale) {
                                        e.currentTarget.style.background = '#111827';
                                    }
                                }}
                            >
                                {product.availableForSale ? 'ADD' : 'N/A'}
                            </button>
                        </div>
                    ))
                    }
                </div>
            </div>

            {/* Show All Link - minimal */}
            {
                collectionUrl && (
                    <a
                        href={collectionUrl}
                        style={{
                            display: 'block',
                            textAlign: 'center',
                            padding: '6px',
                            marginTop: '6px',
                            color: '#6b7280',
                            textDecoration: 'none',
                            fontSize: '9px',
                            fontWeight: 500,
                            transition: 'color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#111827';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#6b7280';
                        }}
                    >
                        {viewAllLinkText} →
                    </a>
                )
            }

            {/* Hide scrollbar */}
            <style>{`
                div[role="list"]::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};
