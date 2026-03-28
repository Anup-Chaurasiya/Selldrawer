/**
 * Shared Savings Display Component
 * Premium redesign — works in any Shopify theme (light)
 */

import React from 'react';

interface SavingsDisplayProps {
  message: string;
  amount: number;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  isPreview?: boolean;
}

export const SavingsDisplay: React.FC<SavingsDisplayProps> = ({
  message,
  amount,
  backgroundColor = '#dcfce7',
  textColor = '#15803d',
  borderColor = '#ffffff',
}) => {
  if (amount <= 0) {
    return null;
  }

  const formatMoney = (cents: number) => {
    const rupees = Math.floor(cents / 100);
    return `₹${rupees}`;
  };

  const formattedMessage = message.replace('{amount}', formatMoney(amount));

  const keyframes = `
    @keyframes sd-savings-badge-in {
      0% { opacity: 0; transform: translateY(8px) scale(0.95); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes sd-savings-shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes sd-coin-spin {
      0% { transform: rotateY(0deg); }
      100% { transform: rotateY(360deg); }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '1.5px solid #86efac',
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: '0 4px 16px rgba(16,185,129,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
          animation: 'sd-savings-badge-in 0.4s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
        }}
      >
        {/* Shimmer overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
            animation: 'sd-savings-shimmer 3s linear infinite',
            borderRadius: '12px',
            pointerEvents: 'none',
          }}
        />

        {/* Icon */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #34d399, #10b981)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
            position: 'relative',
            zIndex: 1,
          }}
          aria-hidden="true"
        >
          💰
        </div>

        {/* Message + amount */}
        <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#166534',
              lineHeight: '1.3',
              letterSpacing: '-0.01em',
            }}
          >
            {formattedMessage}
          </div>
        </div>

        {/* Savings amount pill */}
        <div
          style={{
            flexShrink: 0,
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: 'white',
            fontSize: '12px',
            fontWeight: '800',
            padding: '4px 10px',
            borderRadius: '100px',
            letterSpacing: '-0.01em',
            boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {formatMoney(amount)} saved
        </div>
      </div>
    </>
  );
};
