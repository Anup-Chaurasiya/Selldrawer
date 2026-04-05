import React from 'react';

interface ShippingProtectionProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  price?: number;
  currency?: string;
  title?: string;
  isPending?: boolean;
}

export const ShippingProtection: React.FC<ShippingProtectionProps> = ({
  isEnabled,
  onToggle,
  price = 0,
  currency = 'USD',
  title = 'Shipping Protection',
  isPending = false
}) => {
  const formatPrice = (cents: number) => {
    const amount = cents / 100;
    // @ts-ignore
    const isoCode = (typeof window !== 'undefined' && window.selldrawer_config?.currency?.isoCode) 
      // @ts-ignore
      ? window.selldrawer_config.currency.isoCode 
      : currency;
      
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

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: `1px solid ${isEnabled ? '#3b82f6' : '#e2e8f0'}`,
        marginBottom: '16px',
        cursor: isPending ? 'wait' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: isPending ? 0.7 : 1,
      }}
      onClick={() => !isPending && onToggle(!isEnabled)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: isEnabled ? '#dbeafe' : '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isEnabled ? '#2563eb' : '#64748b',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{title}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Against loss, theft, or damage</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>
          {price > 0 ? formatPrice(price) : 'FREE'}
        </div>
        <div style={{
          width: '36px',
          height: '20px',
          backgroundColor: isEnabled ? '#3b82f6' : '#cbd5e1',
          borderRadius: '10px',
          position: 'relative',
          transition: 'background-color 0.2s',
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            backgroundColor: 'white',
            borderRadius: '50%',
            position: 'absolute',
            top: '2px',
            left: isEnabled ? '18px' : '2px',
            transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }} />
        </div>
      </div>
    </div>
  );
};
