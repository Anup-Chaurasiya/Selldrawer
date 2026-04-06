/**
 * Shared Variant Picker Bottom Sheet
 * Used by all upsell features: Free Shipping Bar, Product Recommendations,
 * Milestones Upsell, and Free Gifts.
 *
 * Pattern: If a product has 1 variant → add directly.
 *          If multiple variants → show this sheet to let the customer pick.
 */

import React, { useEffect, useRef, useState } from 'react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface ProductVariant {
  id: string;            // Numeric Shopify variant ID (string form)
  title: string;         // e.g. "Red / Large"
  available: boolean;
  price: number;         // in cents
  compareAtPrice?: number | null; // in cents
  option1?: string | null;
  option2?: string | null;
  option3?: string | null;
  featured_image?: { url: string } | null;
}

export interface VariantPickerProduct {
  id?: string;
  title: string;
  imageUrl?: string | null;
  price: number;         // in smallest unit (cents / paise)
  compareAtPrice?: number | null;
  variants: ProductVariant[];
  options?: string[];    // e.g. ["Size", "Color"]
}

interface VariantPickerSheetProps {
  product: VariantPickerProduct | null;
  onClose: () => void;
  onAddToCart: (variantId: string) => void;
  currency?: string;
  accentColor?: string;
}

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────
const fmtPrice = (cents: number, symbol?: string) => {
  const amount = cents / 100;
  // @ts-ignore
  const isoCode = (typeof window !== 'undefined' && window.selldrawer_config?.currency?.isoCode) 
    // @ts-ignore
    ? window.selldrawer_config.currency.isoCode 
    : (typeof window !== 'undefined' && (window as any).selldrawer_config?.currency?.code) || 'USD';
    
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: isoCode,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2
    }).format(amount);
  } catch (e) {
    // Fallback if Intl.NumberFormat fails
    const s = symbol || (typeof window !== 'undefined' && (window as any).selldrawer_config?.currency?.symbol) || '';
    return `${s}${amount.toLocaleString()}`;
  }
};

const SHEET_KEYFRAMES = `
  @keyframes sd-vps-backdrop-in {
    from { opacity: 0; backdrop-filter: blur(0px); }
    to   { opacity: 1; backdrop-filter: blur(8px); }
  }
  @keyframes sd-vps-sheet-up {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);   opacity: 1; }
  }
  @keyframes sd-vps-sheet-down {
    from { transform: translateY(0);   opacity: 1; }
    to   { transform: translateY(100%); opacity: 0; }
  }
  @keyframes sd-vps-add-pop {
    0%   { transform: scale(1); }
    40%  { transform: scale(0.95); }
    70%  { transform: scale(1.02); }
    100% { transform: scale(1); }
  }
  @keyframes sd-vps-check-in {
    from { transform: scale(0.5); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
  }
  @keyframes sd-vps-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export const VariantPickerSheet: React.FC<VariantPickerSheetProps> = ({
  product,
  onClose,
  onAddToCart,
  currency = 'USD',
  accentColor = '#7c3aed',
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  // Per-option selected values
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  const getCurrencySymbol = () => {
    // @ts-ignore
    return (typeof window !== 'undefined' && (window as any).selldrawer_config?.currency?.symbol) || '';
  };

  const currencySymbol = getCurrencySymbol();

  // Initialize option selections from the first available variant
  useEffect(() => {
    if (!product) return;
    const first = product.variants?.find(v => v.available) || product.variants?.[0];
    if (first) {
      const opts: Record<string, string> = {};
      const names = product.options || deriveOptionNames(product.variants);
      if (names[0] && first.option1) opts[names[0]] = first.option1;
      if (names[1] && first.option2) opts[names[1]] = first.option2;
      if (names[2] && first.option3) opts[names[2]] = first.option3;
      setSelectedOptions(opts);
      setSelectedVariantId(first.id);
    }
    setAdded(false);
    setAdding(false);
  }, [product]);

  // Re-compute selected variant when options change
  useEffect(() => {
    if (!product?.variants?.length) return;
    const names = product.options || deriveOptionNames(product.variants);
    const match = product.variants.find(v => {
      const o1 = names[0] ? selectedOptions[names[0]] : undefined;
      const o2 = names[1] ? selectedOptions[names[1]] : undefined;
      const o3 = names[2] ? selectedOptions[names[2]] : undefined;
      return (
        (!o1 || v.option1 === o1) &&
        (!o2 || v.option2 === o2) &&
        (!o3 || v.option3 === o3)
      );
    });
    setSelectedVariantId(match?.id ?? null);
  }, [selectedOptions, product]);

  if (!product) return null;

  const variants = product.variants || [];
  const optionNames = product.options || deriveOptionNames(variants);

  // Group unique values per option
  const optionValues = (optionNames || []).map((name, idx) => {
    const key = `option${idx + 1}` as 'option1' | 'option2' | 'option3';
    const seen = new Set<string>();
    const values: { value: string; available: boolean }[] = [];
    variants.forEach(v => {
      const val = v[key];
      if (val && !seen.has(val)) {
        seen.add(val);
        // A value is available if there's at least one variant with that option value that is available
        const isAvail = variants.some(vv => vv[key] === val && vv.available);
        values.push({ value: val, available: isAvail });
      }
    });
    return { name, values };
  });

  const selectedVariant = variants.find(v => v.id === selectedVariantId) || null;
  const displayPrice = selectedVariant?.price ?? product.price;
  const displayCompareAt = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const imageUrl = selectedVariant?.featured_image?.url || product.imageUrl;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 280);
  };

  const handleAdd = async () => {
    if (!selectedVariantId || adding || !selectedVariant?.available) return;
    setAdding(true);
    try {
      onAddToCart(selectedVariantId);
      await new Promise(r => setTimeout(r, 600));
      setAdded(true);
      setTimeout(() => {
        handleClose();
      }, 900);
    } finally {
      setAdding(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleClose();
  };

  const hasDiscount = displayCompareAt && displayCompareAt > displayPrice;
  const discountPct = hasDiscount
    ? Math.round(((displayCompareAt! - displayPrice) / displayCompareAt!) * 100)
    : 0;

  return (
    <>
      <style>{SHEET_KEYFRAMES}</style>

      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          animation: isClosing
            ? 'sd-vps-backdrop-in 0.28s ease reverse'
            : 'sd-vps-backdrop-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Sheet */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            maxWidth: '480px',
            margin: '0 auto',
            background: '#ffffff',
            borderRadius: '28px 28px 0 0',
            boxShadow: '0 -20px 60px rgba(0,0,0,0.15)',
            padding: '0 0 env(safe-area-inset-bottom, 20px)',
            animation: isClosing
              ? 'sd-vps-sheet-down 0.3s cubic-bezier(0.4,0,1,1)'
              : 'sd-vps-sheet-up 0.5s cubic-bezier(0.16,1,0.3,1)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '92vh',
            overflowY: 'auto',
          }}
        >
          {/* Drag Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '16px', paddingBottom: '6px' }}>
            <div style={{ width: '44px', height: '5px', borderRadius: '100px', background: '#E5E7EB' }} />
          </div>

          {/* Header row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 20px 0',
          }}>
            <span style={{ fontSize: '15px', fontWeight: 850, color: '#111827', letterSpacing: '-0.02em' }}>
              Select Options
            </span>
            <button
              onClick={handleClose}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                border: 'none', background: '#F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '18px', color: '#6B7280',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#E5E7EB';
                e.currentTarget.style.color = '#111827';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#F3F4F6';
                e.currentTarget.style.color = '#6B7280';
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Product row */}
          <div style={{ display: 'flex', gap: '16px', padding: '16px 20px', alignItems: 'flex-start' }}>
            {/* Product image */}
            <div style={{
              width: '80px', height: '80px', borderRadius: '12px',
              overflow: 'hidden', flexShrink: 0,
              background: '#F9FAFB', border: '1px solid rgba(0,0,0,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {imageUrl ? (
                <img src={imageUrl} alt={product.title} style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>📦</div>
              )}
            </div>

            {/* Title + price */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '15px', fontWeight: '850', color: '#111827',
                lineHeight: '1.2', marginBottom: '8px',
                letterSpacing: '-0.02em',
              }}>
                {product.title}
              </div>

              {/* Variant title pill */}
              {selectedVariant && selectedVariant.title !== 'Default Title' && (
                <div style={{
                  display: 'inline-block',
                  fontSize: '10px', fontWeight: 800, color: accentColor,
                  background: `${accentColor}10`,
                  padding: '2px 8px', borderRadius: '6px',
                  marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.02em'
                }}>
                  {selectedVariant.title}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '17px', fontWeight: 900, color: '#111827', letterSpacing: '-0.03em' }}>
                  {fmtPrice(displayPrice, currencySymbol)}
                </span>
                {hasDiscount && (
                  <>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#9CA3AF', textDecoration: 'line-through' }}>
                      {fmtPrice(displayCompareAt!, currencySymbol)}
                    </span>
                    <span style={{
                      fontSize: '10px', fontWeight: 850, color: '#DC2626',
                      background: '#FEF2F2', padding: '2px 6px', borderRadius: '4px',
                    }}>
                      {discountPct}% OFF
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          {optionValues.length > 0 && (
            <div style={{ height: '1px', background: '#F3F4F6', margin: '0 20px' }} />
          )}

          {/* Option selectors */}
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {optionValues.map(({ name, values }) => (
              <div key={name}>
                <div style={{
                  fontSize: '11px', fontWeight: '850', color: '#6B7280',
                  marginBottom: '10px', letterSpacing: '0.05em', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  {name}
                  {selectedOptions[name] && (
                    <span style={{ color: '#111827', textTransform: 'none', letterSpacing: 0, fontWeight: 700 }}>
                      · {selectedOptions[name]}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {values.map(({ value, available }) => {
                    const isSelected = selectedOptions[name] === value;
                    return (
                      <button
                        key={value}
                        onClick={() => {
                          if (!available) return;
                          setSelectedOptions(prev => ({ ...prev, [name]: value }));
                        }}
                        disabled={!available}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontWeight: isSelected ? '800' : '600',
                          border: '2px solid',
                          borderColor: isSelected ? '#111827' : '#E5E7EB',
                          background: isSelected ? '#111827' : '#ffffff',
                          color: !available
                            ? '#D1D5DB'
                            : isSelected ? '#ffffff' : '#1F2937',
                          cursor: available ? 'pointer' : 'not-allowed',
                          position: 'relative',
                          transition: 'all 0.3s cubic-bezier(0.2, 1, 0.3, 1)',
                          opacity: !available ? 0.4 : 1,
                          overflow: 'hidden',
                          transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                        }}
                        onMouseEnter={e => {
                          if (available && !isSelected) {
                            e.currentTarget.style.borderColor = '#111827';
                            e.currentTarget.style.transform = 'scale(1.02)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#E5E7EB';
                            e.currentTarget.style.transform = 'scale(1)';
                          }
                        }}
                      >
                        {value}
                        {!available && (
                          <span style={{
                            position: 'absolute',
                            top: '50%',
                            left: 0,
                            right: 0,
                            height: '1.5px',
                            background: '#D1D5DB',
                            transform: 'rotate(-20deg)',
                            pointerEvents: 'none',
                          }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Availability notice */}
          {selectedVariant && !selectedVariant.available && (
            <div style={{
              margin: '0 20px 8px',
              padding: '10px 14px',
              background: '#FFF5F5',
              border: '1px solid #FED7D7',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#C53030',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span>🚫</span> This combination is currently unavailable
            </div>
          )}

          {/* Add to Cart Button */}
          <div style={{ padding: '8px 20px 24px' }}>
            <button
              onClick={handleAdd}
              disabled={!selectedVariantId || !selectedVariant?.available || adding}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '14px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '900',
                cursor: (!selectedVariantId || !selectedVariant?.available || adding) ? 'not-allowed' : 'pointer',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                animation: added ? 'sd-vps-add-pop 0.5s forwards' : undefined,
                background: added
                  ? '#10B981'
                  : !selectedVariantId || !selectedVariant?.available
                  ? '#F3F4F6'
                  : '#111827',
                color: added
                  ? '#ffffff'
                  : !selectedVariantId || !selectedVariant?.available
                  ? '#9CA3AF'
                  : '#ffffff',
                boxShadow: added
                  ? '0 10px 25px rgba(16,185,129,0.3)'
                  : !selectedVariantId || !selectedVariant?.available
                  ? 'none'
                  : (selectedVariantId && selectedVariant?.available) ? '0 12px 24px rgba(17,24,39,0.2)' : 'none',
              }}
              onMouseEnter={e => {
                if (selectedVariantId && selectedVariant?.available && !adding && !added) {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                  e.currentTarget.style.background = '#000000';
                }
              }}
              onMouseLeave={e => {
                if (!added) {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.background = !selectedVariantId || !selectedVariant?.available ? '#F3F4F6' : '#111827';
                }
              }}
            >
              {adding ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                    style={{ animation: 'sd-spin 0.7s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  Processing...
                </>
              ) : added ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"
                    style={{ animation: 'sd-vps-check-in 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Added to Cart!
                </>
              ) : !selectedVariantId || !selectedVariant?.available ? (
                'Select Options'
              ) : (
                <>
                  Add to Cart · {fmtPrice(displayPrice, currencySymbol)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Spin keyframe (shared via global) */}
      <style>{`@keyframes sd-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </>
  );
};

// ─────────────────────────────────────────────
// Utility: derive option names from variant titles when product.options is absent
// e.g.  "Red / Large" → ["Color", "Size"] won't work, but we use generic names
// ─────────────────────────────────────────────
function deriveOptionNames(variants: ProductVariant[]): string[] {
  const names: string[] = [];
  if (!variants?.length) return names;
  const first = variants[0];
  if (first.option1 != null) names.push('Option 1');
  if (first.option2 != null) names.push('Option 2');
  if (first.option3 != null) names.push('Option 3');
  return names;
}

export default VariantPickerSheet;
