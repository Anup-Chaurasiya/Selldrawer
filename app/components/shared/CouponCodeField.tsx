/**
 * Shared Coupon Code Field Component - Redesigned for Premium Experience
 * Used in both production cart drawer and Remix preview
 */

import React, { useState, useEffect } from 'react';

// Icon Components
const CheckIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChevronRightIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const XIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const TicketIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <line x1="13" y1="5" x2="13" y2="19" />
  </svg>
);

interface Discount {
  code: string;
  amount?: number;
  title?: string;
  description?: string;
  type?: string;
  value?: number;
  threshold?: number; // Minimum amount to unlock in cents
  remaining?: number; // How much more needed in cents
}

interface CouponCodeFieldProps {
  id?: string;
  placeholder?: string;
  buttonText?: string;
  showAllOffers?: boolean;
  showAllOffersButtonText?: string;
  enableAutoApply?: boolean;
  appliedDiscount?: Discount | null;
  availableDiscounts?: Discount[];
  onApplyCoupon?: (code: string) => void;
  onRemoveDiscount?: () => void;
  onSwitchDiscount?: (code: string) => void;
  backgroundColor?: string;
  textColor?: string;
  couponCodeColor?: string;
  borderColor?: string;
  appliedDiscountText?: string;
  isPreview?: boolean;
  cartTotal?: number; // In cents
}

export const CouponCodeField: React.FC<CouponCodeFieldProps> = ({
  id,
  placeholder = 'Enter coupon code',
  buttonText = 'Apply',
  showAllOffers = true,
  showAllOffersButtonText = 'View Offers',
  appliedDiscount = null,
  availableDiscounts = [],
  onApplyCoupon = () => { },
  onRemoveDiscount = () => { },
  onSwitchDiscount = () => { },
  isPreview = false,
  cartTotal = 0
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  // Simplified available/unavailable logic for demonstration/preview
  const processedDiscounts = availableDiscounts.map(d => ({
    ...d,
    // Mock thresholds if not present
    threshold: d.threshold || (d.code === 'FLAT10' ? 5000 : 0),
    remaining: Math.max(0, (d.threshold || 0) - cartTotal)
  }));

  const validDiscounts = processedDiscounts.filter(d => d.remaining === 0);
  const invalidDiscounts = processedDiscounts.filter(d => d.remaining > 0);

  useEffect(() => {
    if (isSheetOpen) {
      setAnimationClass('sd-slide-up');
    } else {
      setAnimationClass('sd-slide-down');
    }
  }, [isSheetOpen]);

  const handleApply = (codeToApply?: string) => {
    const code = codeToApply || couponCode.trim();
    if (code) {
      onApplyCoupon(code);
      if (!isPreview) {
        setCouponCode('');
        setIsSheetOpen(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleApply();
  };

  // Ticket Edge Design Helper
  const TicketCard: React.FC<{ discount: Discount; isApplied: boolean; isLocked: boolean }> = ({ discount, isApplied, isLocked }) => (
    <div style={{
      position: 'relative',
      backgroundColor: isApplied ? '#f0f9ff' : isLocked ? '#f8fafc' : '#ffffff',
      borderRadius: '12px',
      border: `1.5px ${isApplied ? 'solid #3b82f6' : isLocked ? 'dashed #e2e8f0' : 'solid #f1f5f9'}`,
      padding: '16px',
      marginBottom: '12px',
      transition: 'all 0.2s ease',
      cursor: isLocked ? 'default' : 'pointer',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      overflow: 'hidden',
      opacity: isLocked ? 0.7 : 1,
      boxShadow: isApplied ? '0 4px 6px -1px rgba(59, 130, 246, 0.1)' : '0 1px 2px rgba(0,0,0,0.05)'
    }}
      onClick={() => !isLocked && !isApplied && handleApply(discount.code)}
    >
      {/* Ticket Cutouts */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '-8px',
        transform: 'translateY(-50%)',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: '#ffffff', // Match parent sheet background
        boxShadow: 'inset -2px 0 2px rgba(0,0,0,0.02)',
        zIndex: 2
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        right: '-8px',
        transform: 'translateY(-50%)',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: '#ffffff',
        boxShadow: 'inset 2px 0 2px rgba(0,0,0,0.02)',
        zIndex: 2
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            padding: '4px 10px',
            backgroundColor: isApplied ? '#3b82f6' : '#fff7ed',
            color: isApplied ? '#ffffff' : '#f97316',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {discount.code}
          </div>
          {isApplied && <CheckIcon size={16} color="#3b82f6" />}
        </div>
        {!isLocked && !isApplied && (
          <button style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer'
          }}>
            Apply
          </button>
        )}
        {isApplied && (
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#3b82f6' }}>APPLIED</span>
        )}
      </div>

      <div style={{ fontSize: '13px', color: '#4b5563', fontWeight: 500 }}>
        {discount.description || `${discount.value}${discount.type === 'percentage' ? '%' : ''} off entire order`}
      </div>

      {isLocked && (
        <div style={{ marginTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
            <span>Unlocks at {discount.threshold ? `Rs. ${(discount.threshold / 100).toFixed(2)}` : ''}</span>
            <span>{discount.remaining ? `Rs. ${(discount.remaining / 100).toFixed(2)} left` : ''}</span>
          </div>
          <div style={{ width: '100%', height: '4px', backgroundColor: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${Math.min(100, (cartTotal / (discount.threshold || 1)) * 100)}%`, 
              height: '100%', 
              backgroundColor: '#ffa07a',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div id={id} style={{ marginBottom: '16px' }}>
      {/* Main Bar */}
      {!appliedDiscount ? (
        <div 
          onClick={() => setIsSheetOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.backgroundColor = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.backgroundColor = '#f8fafc';
          }}
        >
          <div style={{ color: '#64748b' }}><TicketIcon /></div>
          <div style={{ flex: 1, fontSize: '14px', color: '#64748b', fontWeight: 500 }}>
            Apply Coupon Code
          </div>
          <div style={{ color: '#3b82f6', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            {showAllOffersButtonText}
            <ChevronRightIcon size={14} />
          </div>
        </div>
      ) : (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1.5px solid #bfdbfe',
          borderRadius: '12px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'sd-fade-in 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <CheckIcon size={14} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e40af', letterSpacing: '0.5px' }}>
                {appliedDiscount.code}
              </div>
              <div style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 600 }}>COUPON APPLIED</div>
            </div>
          </div>
          <button
            onClick={onRemoveDiscount}
            style={{
              padding: '6px 12px',
              backgroundColor: '#ffffff',
              color: '#ef4444',
              border: '1px solid #fee2e2',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Remove
          </button>
        </div>
      )}

      {/* Offers Sheet Overlay */}
      {isSheetOpen && (
        <>
          <div 
            onClick={() => setIsSheetOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 9998,
              animation: 'sd-fade-in 0.3s ease'
            }} 
          />
          <div 
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#ffffff',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '85vh',
              padding: '24px 20px',
              boxShadow: '0 -10px 25px -5px rgba(0,0,0,0.1)',
              animation: 'sd-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111827' }}>Apply Coupon</h3>
              <button 
                onClick={() => setIsSheetOpen(false)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Manual Input */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                style={{
                  flex: 1,
                  padding: '14px 18px',
                  border: '2.5px solid #f3f4f6',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  color: '#111827'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#f3f4f6'}
              />
              <button
                onClick={() => handleApply()}
                disabled={!couponCode.trim()}
                style={{
                  padding: '0 24px',
                  backgroundColor: !couponCode.trim() ? '#e5e7eb' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: !couponCode.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {buttonText}
              </button>
            </div>

            {/* Coupons List */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px', paddingRight: '4px' }}>
              {/* Available Coupons */}
              {validDiscounts.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>
                    Available Coupons
                  </div>
                  {validDiscounts.map(d => (
                    <TicketCard key={d.code} discount={d} isApplied={appliedDiscount?.code === d.code} isLocked={false} />
                  ))}
                </div>
              )}

              {/* Unavailable Coupons */}
              {invalidDiscounts.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>
                    Unavailable Coupons
                  </div>
                  {invalidDiscounts.map(d => (
                    <TicketCard key={d.code} discount={d} isApplied={false} isLocked={true} />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes sd-slide-up {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
            @keyframes sd-fade-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .sd-slide-up { animation: sd-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
          `}} />
        </>
      )}
    </div>
  );
};
