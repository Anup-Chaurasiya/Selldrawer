import React, { useEffect, useState } from 'react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface UpsellProduct {
  id: string;
  title: string;
  price: number;       // in smallest currency unit (paise / cents)
  imageUrl?: string;
  handle?: string;
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

const fmt = (amount: number, currency = '₹') =>
  `${currency}${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

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
  currency = '₹',
  onAddToCart,
}: MilestonesWidgetProps) {
  if (!milestones || milestones.length === 0) return null;

  const sorted = [...milestones].sort((a, b) => a.targetAmount - b.targetAmount);
  const allUnlocked = sorted.every(m => m.status === 'unlocked');
  const fillPct = calcProgress(cartTotal, sorted);

  useEffect(() => {
    console.log("fillPct", fillPct);
  }, [fillPct])

  // Debug logging
  console.log('MilestonesWidget Debug:', {
    cartTotal,
    milestones: sorted.map(m => ({ target: m.targetAmount, status: m.status })),
    maxMilestone: sorted[sorted.length - 1]?.targetAmount,
    fillPct
  });

  const nextMilestone = sorted.find(m => m.status !== 'unlocked');
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
          const isUnlocked = m.status === 'unlocked';
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
  currency = '₹',
  onAddToCart,
}: MilestoneUpsellProductsProps) {
  const [idx, setIdx] = useState(0);

  // Resolve product list: either passed directly, or derived from milestones
  let products: UpsellProduct[] = directProducts ?? [];
  if (!directProducts && milestones) {
    const sorted = [...milestones].sort((a, b) => a.targetAmount - b.targetAmount);
    const next = sorted.find(m => cartTotal < m.targetAmount);
    products = next?.upsellProducts ?? [];
  }

  if (products.length === 0) return null;

  const visible = 2;
  const maxIdx = Math.max(0, products.length - visible);

  const ArrowBtn = ({
    dir, disabled, onClick,
  }: { dir: 'left' | 'right'; disabled: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'left' ? 'Previous' : 'Next'}
      style={{
        flexShrink: 0,
        width: '26px',
        height: '26px',
        borderRadius: '50%',
        border: '1px solid #e5e7eb',
        background: '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.35 : 1,
        transition: 'all 0.2s',
        padding: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
        stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {dir === 'left'
          ? <polyline points="15 18 9 12 15 6" />
          : <polyline points="9 18 15 12 9 6" />}
      </svg>
    </button>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', boxSizing: 'border-box' }}>
      <ArrowBtn dir="left" disabled={idx === 0} onClick={() => setIdx(i => Math.max(0, i - 1))} />

      {/* Viewport */}
      <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          transform: `translateX(calc(-${idx * (100 / visible)}% - ${idx * 4}px))`,
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {products.map(p => (
            <div
              key={p.id}
              style={{
                minWidth: `calc(${100 / visible}% - 4px)`,
                flexShrink: 0,
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                padding: '8px',
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                boxSizing: 'border-box',
              }}
            >
              {/* Image */}
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '7px',
                overflow: 'hidden',
                flexShrink: 0,
                backgroundColor: '#f3f4f6',
              }}>
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🛍️</div>
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0,
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#111827',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {p.title}
                </p>
                <p style={{ margin: '2px 0 5px', fontSize: '11px', color: '#374151', fontWeight: 500 }}>
                  {currency} {(p.price / 100).toFixed(2)}
                </p>
                <button
                  onClick={() => onAddToCart?.(p)}
                  style={{
                    width: '100%',
                    padding: '4px 0',
                    backgroundColor: '#1c1c3b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    letterSpacing: '0.3px',
                  }}
                >
                  Add to cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ArrowBtn dir="right" disabled={idx >= maxIdx} onClick={() => setIdx(i => Math.min(maxIdx, i + 1))} />
    </div>
  );
}
