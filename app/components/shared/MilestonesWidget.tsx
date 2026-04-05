import React, { useEffect, useRef, useState } from 'react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface UpsellProduct {
  id: string;
  title: string;
  price: number;       // in smallest currency unit (paise / cents)
  imageUrl?: string;
  handle?: string;
  variantId?: string;  // Shopify variant GID for Add to Cart operations
}

export interface Milestone {
  id: string;
  title: string;
  targetAmount: number;
  rewardType: string;
  rewardValue: number | null;
  icon?: string;
  status: 'unlocked' | 'in_progress' | 'locked';
  progress: number;
  remaining: number;
  message: string;
  showProgressBar?: boolean;
  iconColor?: string;
  titleColor?: string;
  unlockButtonColor?: string;
  amountColor?: string;
  description?: string;
  upsellProducts?: UpsellProduct[];
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const getDefaultIcon = (rewardType: string): string => {
  switch (rewardType) {
    case 'free_shipping': return '🚚';
    case 'discount_percentage': return '🏷️';
    case 'discount_fixed': return '💰';
    case 'gift_wrapping': return '🎁';
    default: return '🎁';
  }
};

const fmt = (cents: number, currencyCode = 'USD') => {
  const amount = cents / 100;
  // @ts-ignore
  const isoCode = (typeof window !== 'undefined' && window.selldrawer_config?.currency?.isoCode) 
    // @ts-ignore
    ? window.selldrawer_config.currency.isoCode 
    : currencyCode;
    
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: isoCode,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2
    }).format(amount);
  } catch (e) {
    // Fallback if Intl.NumberFormat fails
    const symbol = (typeof window !== 'undefined' && (window as any).selldrawer_config?.currency?.symbol) || '';
    return `${symbol}${amount.toLocaleString()}`;
  }
};

/**
 * Returns a 0-100 fill percent for the progress track.
 * Maps cartTotal linearly across [0 … max milestone].
 */
const calcProgress = (total: number, sorted: Milestone[]): number => {
  if (!sorted.length) return 0;
  const n = sorted.length;
  // We divide the bar into (n + 1) segments. 
  // Milestone 1 will be at 1/(n+1), Milestone 2 at 2/(n+1), etc.
  const segmentWidth = 100 / (n + 1);

  let prevAmount = 0;
  for (let i = 0; i < n; i++) {
    const milestone = sorted[i];
    if (total <= milestone.targetAmount) {
      const rangeProgress = (total - prevAmount) / (milestone.targetAmount - prevAmount);
      // Progress within this segment: ends at (i + 1) * segmentWidth
      // Segment starts at i * segmentWidth
      return (i * segmentWidth) + (rangeProgress * segmentWidth);
    }
    prevAmount = milestone.targetAmount;
  }

  // Final segment: beyond the last milestone to 100%
  // We'll reach 100% when total is 10% more than the last milestone (or a fixed buffer)
  const lastTarget = sorted[n - 1].targetAmount;
  const ratio = Math.min(1, (total - lastTarget) / (lastTarget * 0.1 || 1000));
  return (n * segmentWidth) + (ratio * segmentWidth);
};

// ─────────────────────────────────────────────
// MilestonesWidget
// ─────────────────────────────────────────────
interface MilestonesWidgetProps {
  milestones: Milestone[];
  cartTotal: number;
  isPreview?: boolean;
  layout?: 'vertical' | 'horizontal';
  progressBarColor?: string;
  allUnlockedMessage?: string;
  currency?: string;
  onAddToCart?: (product: UpsellProduct) => void;
}

export function MilestonesWidget({
  milestones,
  cartTotal,
  progressBarColor = '#1c1c3b',
  allUnlockedMessage = '🎉 Congratulations! All rewards unlocked!',
  currency = 'USD',
  onAddToCart,
}: MilestonesWidgetProps) {
  if (!milestones || milestones.length === 0) return null;

  const sorted = [...milestones].sort((a, b) => a.targetAmount - b.targetAmount);
  const allUnlocked = sorted.every(m => Math.round(cartTotal) >= Math.round(m.targetAmount));
  const fillPct = calcProgress(cartTotal, sorted);

  const nextMilestone = sorted.find(m => Math.round(cartTotal) < Math.round(m.targetAmount));
  const statusMsg = allUnlocked ? allUnlockedMessage : nextMilestone?.message ?? null;

  const n = sorted.length;
  const segmentWidth = 100 / (n + 1);

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }}>

      {/* Status message */}
      {statusMsg && (
        <p style={{
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: 600,
          color: '#1e1b4b',
          margin: '0 0 10px',
          lineHeight: 1.5,
          padding: '0 4px',
          display: 'block'
        }}>
          {statusMsg}
        </p>
      )}

      {/* Track + Nodes wrapper */}
      <div style={{ position: 'relative', width: '100%', height: '85px', boxSizing: 'border-box' }}>

        {/* Background track — full width from left to right edge */}
        <div style={{
          position: 'absolute',
          top: '38px',
          left: '0',
          right: '0',
          height: '5px',
          backgroundColor: '#e2e8f0',
          borderRadius: '3px',
          zIndex: 0,
          display: 'block'
        }} />

        {/* Fill track — full width animated */}
        <div
          data-fill-pct={fillPct.toFixed(2)}
          style={{
            position: 'absolute',
            top: '38px',
            left: '0',
            width: `${fillPct}%`,
            height: '5px',
            background: `linear-gradient(90deg, ${progressBarColor}, ${progressBarColor}cc)`,
            borderRadius: '3px',
            zIndex: 1,
            transition: 'width 0.6s ease',
            display: 'block'
          }}
        />

        {/* Nodes layer — absolutely positioned based on segments */}
        {sorted.map((m, i) => {
          const isUnlocked = Math.round(cartTotal) >= Math.round(m.targetAmount);
          const pos = (i + 1) * segmentWidth;
          return (
            <div
              key={m.id}
              style={{
                position: 'absolute',
                left: `${pos}%`,
                top: 0,
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                width: '80px', // fixed width for labeling
                zIndex: 2,
              }}
            >
              {/* Amount label */}
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#6b7280',
                lineHeight: '16px',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}>
                {fmt(m.targetAmount, currency)}
              </span>

              {/* Circle */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: isUnlocked ? progressBarColor : '#fff',
                border: `2px solid ${isUnlocked ? progressBarColor : '#cbd5e1'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '17px',
                flexShrink: 0,
                boxShadow: isUnlocked
                  ? `0 0 0 3px ${progressBarColor}25, 0 3px 8px rgba(0,0,0,0.15)`
                  : '0 2px 6px rgba(0,0,0,0.07)',
                transition: 'all 0.3s ease',
                position: 'relative',
              }}>
                {m.icon || getDefaultIcon(m.rewardType)}
              </div>

              {/* Title */}
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: isUnlocked ? progressBarColor : '#6b7280',
                textAlign: 'center',
                lineHeight: '14px',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                padding: '0 2px',
              }}>
                {m.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Upsell carousel (when products attached to next milestone) */}
      {(nextMilestone?.upsellProducts?.length ?? 0) > 0 && (
        <div style={{ marginTop: '12px' }}>
          <MilestoneUpsellProducts
            products={nextMilestone!.upsellProducts!}
            currency={currency}
            onAddToCart={onAddToCart}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MilestoneUpsellProducts — standalone carousel
// Shows products from the next locked milestone
// ─────────────────────────────────────────────
interface MilestoneUpsellProductsProps {
  milestones?: Milestone[];    // pass milestones + cartTotal for auto-selection
  cartTotal?: number;
  products?: UpsellProduct[];  // OR pass products directly
  currency?: string;
  onAddToCart?: (product: UpsellProduct) => void;
}

export function MilestoneUpsellProducts({
  milestones,
  cartTotal = 0,
  products: directProducts,
  currency = 'USD',
  onAddToCart,
}: MilestoneUpsellProductsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Resolve product list
  let products: UpsellProduct[] = directProducts ?? [];
  let buttonColor = '#1c1c3b';
  let targetMilestone = null;

  if (!directProducts && milestones) {
    const sorted = [...milestones].sort((a, b) => a.targetAmount - b.targetAmount);
    targetMilestone = sorted.find(m => Math.round(cartTotal) < Math.round(m.targetAmount));
    products = targetMilestone?.upsellProducts ?? [];
    buttonColor = targetMilestone?.unlockButtonColor || buttonColor;
  }

  // Update arrow visibility on scroll
  const updateArrows = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    updateArrows();
  }, [products]);

  if (products.length === 0) return null;

  const upsellHeader = (targetMilestone as any)?.upsellHeaderText || "Unlock Your Reward";

  const ArrowBtn = ({
    dir, visible, onClick,
  }: { dir: 'left' | 'right'; visible: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      aria-label={dir === 'left' ? 'Previous' : 'Next'}
      style={{
        flexShrink: 0,
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        border: '1px solid rgba(0,0,0,0.08)',
        background: '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: 0,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        position: 'relative',
        zIndex: 10,
        marginLeft: dir === 'left' ? '0' : '-16px',
        marginRight: dir === 'right' ? '0' : '-16px',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="#1e293b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {dir === 'left'
          ? <polyline points="15 18 9 12 15 6" />
          : <polyline points="9 18 15 12 9 6" />}
      </svg>
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1e293b', letterSpacing: '-0.3px' }}>
          {upsellHeader}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', width: '100%', boxSizing: 'border-box', position: 'relative' }}>
        <ArrowBtn dir="left" visible={showLeftArrow} onClick={() => scrollRef.current?.scrollBy({ left: -220, behavior: 'smooth' })} />

        {/* Viewport */}
        <div 
          ref={scrollRef}
          onScroll={updateArrows}
          style={{ 
            flex: 1, 
            overflowX: 'auto', 
            overflowY: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            minWidth: 0, 
            padding: '4px 0',
            cursor: 'default',
            WebkitOverflowScrolling: 'touch',
            display: 'flex',
            gap: '10px'
          }}
        >
          {/* Hidden scrollbar trick for Chrome/Safari/Edge */}
          <style>{`
            div::-webkit-scrollbar { display: none; }
          `}</style>
          
          {products.map(p => (
            <div
              key={p.id}
              style={{
                minWidth: '220px',
                width: '220px',
                flexShrink: 0,
                border: '1px solid rgba(0,0,0,0.05)',
                borderRadius: '14px',
                padding: '10px',
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
                boxSizing: 'border-box',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.04)';
              }}
            >
              {/* Image */}
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '10px',
                overflow: 'hidden',
                flexShrink: 0,
                backgroundColor: '#f8fafc',
                border: '1px solid rgba(0,0,0,0.04)',
              }}>
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🛍️</div>
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <p style={{
                  margin: '0',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0f172a',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: '1.3',
                  letterSpacing: '-0.2px'
                }}>
                  {p.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                  <p style={{ margin: '0', fontSize: '13px', color: '#1e293b', fontWeight: 800 }}>
                    {currency}{(p.price / 100).toLocaleString()}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart?.(p);
                    }}
                    style={{
                      padding: '5px 12px',
                      backgroundColor: buttonColor,
                      color: '#fff',
                      border: 'none',
                      borderRadius: '100px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: `0 3px 6px ${buttonColor}30`,
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <ArrowBtn dir="right" visible={showRightArrow} onClick={() => scrollRef.current?.scrollBy({ left: 220, behavior: 'smooth' })} />
      </div>
    </div>
  );
}

