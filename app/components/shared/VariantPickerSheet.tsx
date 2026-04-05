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
    from { opacity: 0; }
    to   { opacity: 1; }
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
    40%  { transform: scale(0.93); }
    70%  { transform: scale(1.04); }
    100% { transform: scale(1); }
  }
  @keyframes sd-vps-check-in {
    from { transform: scale(0.5); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
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
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(2px)',
          zIndex: 99999,
          animation: isClosing
            ? 'sd-vps-backdrop-in 0.28s ease reverse'
            : 'sd-vps-backdrop-in 0.25s ease',
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
            borderRadius: '24px 24px 0 0',
            boxShadow: '0 -12px 60px rgba(0,0,0,0.2)',
            padding: '0 0 env(safe-area-inset-bottom, 16px)',
            animation: isClosing
              ? 'sd-vps-sheet-down 0.28s cubic-bezier(0.4,0,1,1)'
              : 'sd-vps-sheet-up 0.32s cubic-bezier(0.16,1,0.3,1)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          {/* Drag Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
            <div style={{ width: '40px', height: '4px', borderRadius: '100px', background: '#e5e7eb' }} />
          </div>

          {/* Header row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 18px 0',
          }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>
              Choose an option
            </span>
            <button
              onClick={handleClose}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                border: 'none', background: '#f3f4f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '16px', color: '#6b7280',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#e5e7eb')}
              onMouseLeave={e => (e.currentTarget.style.background = '#f3f4f6')}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Product row */}
          <div style={{ display: 'flex', gap: '14px', padding: '14px 18px', alignItems: 'flex-start' }}>
            {/* Product image */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '12px',
              overflow: 'hidden', flexShrink: 0,
              background: '#f4f4f8', border: '1.5px solid rgba(0,0,0,0.06)',
            }}>
              {imageUrl ? (
                <img src={imageUrl} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>📦</div>
              )}
            </div>

            {/* Title + price */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '14px', fontWeight: 700, color: '#111827',
                lineHeight: '1.3', marginBottom: '6px',
                letterSpacing: '-0.01em',
              }}>
                {product.title}
              </div>

              {/* Variant title pill */}
              {selectedVariant && selectedVariant.title !== 'Default Title' && (
                <div style={{
                  display: 'inline-block',
                  fontSize: '10px', fontWeight: 600, color: '#6b7280',
                  background: '#f3f4f6', border: '1px solid #e5e7eb',
                  padding: '2px 8px', borderRadius: '100px',
                  marginBottom: '6px',
                }}>
                  {selectedVariant.title}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: hasDiscount ? '#d97706' : '#111827', letterSpacing: '-0.02em' }}>
                  {fmtPrice(displayPrice, currencySymbol)}
                </span>
                {hasDiscount && (
                  <>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#d1d5db', textDecoration: 'line-through' }}>
                      {fmtPrice(displayCompareAt!, currencySymbol)}
                    </span>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, color: '#fff',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      padding: '2px 6px', borderRadius: '6px',
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
            <div style={{ height: '1px', background: '#f3f4f6', margin: '0 18px' }} />
          )}

          {/* Option selectors */}
          <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {optionValues.map(({ name, values }) => (
              <div key={name}>
                <div style={{
                  fontSize: '12px', fontWeight: 700, color: '#374151',
                  marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>
                  {name}
                  {selectedOptions[name] && (
                    <span style={{ fontWeight: 600, color: accentColor, marginLeft: '6px', textTransform: 'none', letterSpacing: 0 }}>
                      : {selectedOptions[name]}
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
                          padding: '7px 16px',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: isSelected ? 700 : 500,
                          border: isSelected
                            ? `2px solid ${accentColor}`
                            : '1.5px solid #e5e7eb',
                          background: isSelected ? `${accentColor}12` : '#fff',
                          color: !available
                            ? '#d1d5db'
                            : isSelected ? accentColor : '#374151',
                          cursor: available ? 'pointer' : 'not-allowed',
                          position: 'relative',
                          transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                          boxShadow: isSelected ? `0 0 0 3px ${accentColor}20` : 'none',
                          // Strikethrough for unavailable sizes
                          textDecoration: !available ? 'none' : 'none',
                          opacity: !available ? 0.45 : 1,
                          overflow: 'hidden',
                        }}
                        onMouseEnter={e => {
                          if (available && !isSelected) {
                            e.currentTarget.style.borderColor = `${accentColor}80`;
                            e.currentTarget.style.background = `${accentColor}08`;
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.background = '#fff';
                          }
                        }}
                      >
                        {value}
                        {/* Diagonal strikethrough line for sold-out */}
                        {!available && (
                          <span style={{
                            position: 'absolute',
                            top: '50%',
                            left: 0,
                            right: 0,
                            height: '1.5px',
                            background: '#d1d5db',
                            transform: 'rotate(-15deg)',
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
              margin: '0 18px 8px',
              padding: '8px 12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span>⚠️</span> This combination is out of stock
            </div>
          )}

          {/* Add to Cart Button */}
          <div style={{ padding: '6px 18px 20px' }}>
            <button
              onClick={handleAdd}
              disabled={!selectedVariantId || !selectedVariant?.available || adding}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '14px',
                border: 'none',
                fontSize: '15px',
                fontWeight: 800,
                cursor: (!selectedVariantId || !selectedVariant?.available || adding) ? 'not-allowed' : 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                animation: added ? 'sd-vps-add-pop 0.35s ease' : undefined,
                background: added
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : !selectedVariantId || !selectedVariant?.available
                  ? '#f3f4f6'
                  : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                color: added
                  ? '#fff'
                  : !selectedVariantId || !selectedVariant?.available
                  ? '#9ca3af'
                  : '#fff',
                boxShadow: added
                  ? '0 6px 20px rgba(16,185,129,0.35)'
                  : !selectedVariantId || !selectedVariant?.available
                  ? 'none'
                  : `0 6px 20px ${accentColor}40`,
              }}
              onMouseEnter={e => {
                if (selectedVariantId && selectedVariant?.available && !adding && !added) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 10px 30px ${accentColor}50`;
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = added
                  ? '0 6px 20px rgba(16,185,129,0.35)'
                  : !selectedVariantId || !selectedVariant?.available
                  ? 'none'
                  : `0 6px 20px ${accentColor}40`;
              }}
            >
              {adding ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ animation: 'sd-spin 0.7s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  Adding...
                </>
              ) : added ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"
                    style={{ animation: 'sd-vps-check-in 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Added to Cart!
                </>
              ) : !selectedVariantId || !selectedVariant?.available ? (
                'Select Options'
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  Add to Cart — {fmtPrice(displayPrice, currencySymbol)}
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
