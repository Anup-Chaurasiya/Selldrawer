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
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid' | 'loading'>('idle');
  const [matchedDiscount, setMatchedDiscount] = useState<Discount | null>(null);
  const [discounts, setDiscounts] = useState<Discount[]>(availableDiscounts || []);
  const [validationMessage, setValidationMessage] = useState('');

  // Update discounts when availableDiscounts prop changes
  useEffect(() => {
    if (availableDiscounts && availableDiscounts.length > 0) {
      console.log('CouponCodeField: Received available discounts', availableDiscounts.map(d => d.code));
      setDiscounts(availableDiscounts);
    }
  }, [availableDiscounts]);

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

  // Remove real-time validation - only validate on Apply button click
  useEffect(() => {
    if (!couponCode.trim()) {
      setValidationState('idle');
      setMatchedDiscount(null);
      setValidationMessage('');
      return;
    }

    // Just check if it's in the available discounts list for instant feedback
    const upperCode = couponCode.toUpperCase();
    const found = discounts.find(d => d.code === upperCode);
    
    if (found) {
      setMatchedDiscount(found);
    } else {
      setMatchedDiscount(null);
    }
  }, [couponCode, discounts]);

  // Fetch available discounts from API on mount (fallback if not passed as prop)
  useEffect(() => {
    if (isPreview || discounts.length > 0) return;

    const fetchDiscounts = async () => {
      try {
        const config = (window as any).selldrawer_config;
        const shop = config?.shop;
        const appUrl = config?.appUrl;
        
        if (!shop || !appUrl) {
          console.warn('CouponCodeField: Missing shop or appUrl in selldrawer_config');
          return;
        }

        console.log('CouponCodeField: Fetching discounts from API...');
        const response = await fetch(`${appUrl}/api/available-discounts?shop=${encodeURIComponent(shop)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.discounts && Array.isArray(data.discounts)) {
            console.log('CouponCodeField: Fetched discounts from API', data.discounts.map(d => d.code));
            setDiscounts(data.discounts);
          } else {
            console.warn('CouponCodeField: No discounts in API response', data);
          }
        } else {
          console.error('CouponCodeField: API request failed', response.status);
        }
      } catch (error) {
        console.error('CouponCodeField: Failed to fetch discounts', error);
      }
    };

    fetchDiscounts();
  }, [isPreview, discounts.length]);

  const handleApply = async (codeToApply?: string) => {
    const code = codeToApply || couponCode.trim();
    if (!code) return;

    // Validate when Apply button is clicked
    setValidationState('loading');
    setValidationMessage('Validating...');

    try {
      // ONLY accept codes that are in the available discounts list
      const upperCode = code.toUpperCase();
      const found = discounts.find(d => d.code === upperCode);
      
      if (found) {
        // Code is in the list, it's valid - apply immediately without showing message
        console.log('Coupon found in available discounts:', found);
        
        // Apply the coupon
        onApplyCoupon(code);
        
        // Close immediately without showing success message
        setCouponCode('');
        setIsSheetOpen(false);
        setValidationState('idle');
        setMatchedDiscount(null);
        setValidationMessage('');
        return;
      }

      // Code not in available discounts - reject it
      console.log('Coupon not found in available discounts. Available codes:', discounts.map(d => d.code));
      setValidationState('invalid');
      setMatchedDiscount(null);
      setValidationMessage('Invalid coupon code');
      
    } catch (error) {
      console.error('Failed to validate discount:', error);
      setValidationState('invalid');
      setMatchedDiscount(null);
      setValidationMessage('Unable to validate code');
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
      borderRadius: '10px',
      border: `1px ${isApplied ? 'solid #3b82f6' : isLocked ? 'dashed #e2e8f0' : 'solid #e5e7eb'}`,
      padding: '12px 14px',
      marginBottom: '10px',
      transition: 'all 0.2s ease',
      cursor: isLocked ? 'default' : 'pointer',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      overflow: 'hidden',
      opacity: isLocked ? 0.7 : 1,
      boxShadow: isApplied ? '0 2px 4px rgba(59, 130, 246, 0.08)' : '0 1px 2px rgba(0,0,0,0.03)'
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
        backgroundColor: '#ffffff',
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
            padding: '3px 8px',
            backgroundColor: isApplied ? '#3b82f6' : '#fff7ed',
            color: isApplied ? '#ffffff' : '#f97316',
            borderRadius: '5px',
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.3px'
          }}>
            {discount.code}
          </div>
          {isApplied && <CheckIcon size={14} color="#3b82f6" />}
        </div>
        {!isLocked && !isApplied && (
          <button style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            fontWeight: 600,
            fontSize: '12px',
            cursor: 'pointer'
          }}>
            Apply
          </button>
        )}
        {isApplied && (
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#3b82f6' }}>APPLIED</span>
        )}
      </div>

      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>
        {discount.description || `${discount.value}${discount.type === 'percentage' ? '%' : ''} off entire order`}
      </div>

      {isLocked && (
        <div style={{ marginTop: '2px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af', marginBottom: '3px' }}>
            <span>Unlocks at {discount.threshold ? `Rs. ${(discount.threshold / 100).toFixed(2)}` : ''}</span>
            <span>{discount.remaining ? `Rs. ${(discount.remaining / 100).toFixed(2)} left` : ''}</span>
          </div>
          <div style={{ width: '100%', height: '3px', backgroundColor: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
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
    <div id={id}>
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
              padding: '20px 18px',
              boxShadow: '0 -10px 25px -5px rgba(0,0,0,0.1)',
              animation: 'sd-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>Apply Coupon</h3>
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
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              >
                <XIcon size={18} />
              </button>
            </div>

                  {/* Manual Input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  placeholder={placeholder}
                  disabled={validationState === 'loading'}
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 14px',
                    border: validationState === 'valid' ? '1.5px solid #10b981' : validationState === 'invalid' ? '1.5px solid #ef4444' : '1.5px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 500,
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    color: '#111827',
                    backgroundColor: validationState === 'valid' ? '#f0fdf4' : validationState === 'invalid' ? '#fef2f2' : '#fafbfc',
                    boxSizing: 'border-box',
                    opacity: validationState === 'loading' ? 0.6 : 1
                  }}
                  onFocus={(e) => {
                    if (validationState === 'idle') {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.backgroundColor = '#ffffff';
                    }
                  }}
                  onBlur={(e) => {
                    if (validationState === 'idle') {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.backgroundColor = '#fafbfc';
                    }
                  }}
                />
                {validationState === 'valid' && (
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#10b981'
                  }}>
                    <CheckIcon size={16} color="#10b981" />
                  </div>
                )}
                {validationState === 'invalid' && (
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#ef4444'
                  }}>
                    <XIcon size={16} color="#ef4444" />
                  </div>
                )}
                {validationState === 'loading' && (
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#3b82f6'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #e5e7eb',
                      borderTop: '2px solid #3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite'
                    }} />
                  </div>
                )}
              </div>
              <button
                onClick={() => handleApply()}
                disabled={!couponCode.trim() || validationState === 'loading'}
                style={{
                  padding: '11px 20px',
                  backgroundColor: !couponCode.trim() || validationState === 'loading' ? '#e5e7eb' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: !couponCode.trim() || validationState === 'loading' ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (couponCode.trim() && validationState !== 'loading') e.currentTarget.style.backgroundColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  if (couponCode.trim() && validationState !== 'loading') e.currentTarget.style.backgroundColor = '#3b82f6';
                }}
              >
                {validationState === 'loading' ? 'Validating...' : buttonText}
              </button>
            </div>

            {/* Validation Message - Simple text only */}
            {validationState === 'invalid' && (
              <div style={{
                marginBottom: '16px',
                fontSize: '12px',
                color: '#ef4444',
                fontWeight: 500
              }}>
                {validationMessage}
              </div>
            )}

            {/* Coupons List */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px', paddingRight: '4px' }}>
              {/* Available Coupons */}
              {validDiscounts.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>
                    Available Coupons ({validDiscounts.length})
                  </div>
                  {validDiscounts.map(d => (
                    <TicketCard key={d.code} discount={d} isApplied={appliedDiscount?.code === d.code} isLocked={false} />
                  ))}
                </div>
              )}

              {/* Unavailable Coupons */}
              {invalidDiscounts.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>
                    Unavailable Coupons ({invalidDiscounts.length})
                  </div>
                  {invalidDiscounts.map(d => (
                    <TicketCard key={d.code} discount={d} isApplied={false} isLocked={true} />
                  ))}
                </div>
              )}

              {/* No Coupons */}
              {discounts.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#9ca3af'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                    No coupons available
                  </div>
                  <div style={{ fontSize: '12px', color: '#d1d5db' }}>
                    Check back later for new offers
                  </div>
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
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .sd-slide-up { animation: sd-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
          `}} />
        </>
      )}
    </div>
  );
};
