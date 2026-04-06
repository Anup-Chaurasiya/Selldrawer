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
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: isEnabled ? '#f0f7ff' : '#ffffff',
        borderRadius: '16px',
        border: `1px solid ${isEnabled ? '#3b82f6' : '#e2e8f0'}`,
        marginBottom: '16px',
        cursor: isPending ? 'wait' : 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isPending ? 0.7 : 1,
        boxShadow: isEnabled 
          ? '0 10px 15px -3px rgba(59, 130, 246, 0.1), 0 4px 6px -2px rgba(59, 130, 246, 0.05)'
          : '0 1px 3px rgba(0,0,0,0.05)',
        overflow: 'hidden'
      }}
      onClick={() => !isPending && onToggle(!isEnabled)}
    >
      {/* Background Decor */}
      {isEnabled && (
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '100px',
          height: '100px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          backgroundColor: isEnabled ? '#3b82f6' : '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isEnabled ? '#ffffff' : '#64748b',
          transition: 'all 0.3s ease',
          boxShadow: isEnabled ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
          position: 'relative'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          {isEnabled && (
            <div style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '12px',
              height: '12px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              border: '2px solid #ffffff',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
            }} />
          )}
        </div>
        <div>
          <div style={{ 
            fontSize: '15px', 
            fontWeight: 700, 
            color: isEnabled ? '#1e40af' : '#1e293b',
            transition: 'color 0.3s ease'
          }}>
            {title}
          </div>
          <div style={{ fontSize: '12px', color: isEnabled ? '#60a5fa' : '#64748b', fontWeight: 500 }}>
            Against loss, theft, or damage
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
        <div style={{ 
          fontSize: '15px', 
          fontWeight: 800, 
          color: isEnabled ? '#3b82f6' : '#64748b',
          transition: 'color 0.3s ease'
        }}>
          {price > 0 ? formatPrice(price) : 'FREE'}
        </div>
        <div style={{
          width: '42px',
          height: '24px',
          backgroundColor: isEnabled ? '#3b82f6' : '#e2e8f0',
          borderRadius: '12px',
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isEnabled ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : 'none'
        }}>
          <div style={{
            width: '18px',
            height: '18px',
            backgroundColor: 'white',
            borderRadius: '50%',
            position: 'absolute',
            top: '3px',
            left: isEnabled ? '21px' : '3px',
            transition: 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
          }} />
        </div>
      </div>
    </div>
  );
};
