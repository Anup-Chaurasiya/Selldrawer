/**
 * Shared Coupon Code Field Component
 * Used in both production cart drawer and Remix preview
 */

import React, { useState } from 'react';

// Icon Components
const CheckIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChevronDownIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const XIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface Discount {
  code: string;
  title: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
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
  isPreview?: boolean;
}

export const CouponCodeField: React.FC<CouponCodeFieldProps> = ({
  id,
  placeholder = 'Enter coupon code',
  buttonText = 'Apply',
  showAllOffers = false,
  showAllOffersButtonText = 'Show all offers',
  enableAutoApply = false,
  appliedDiscount = null,
  availableDiscounts = [],
  onApplyCoupon = () => {},
  onRemoveDiscount = () => {},
  onSwitchDiscount = () => {},
  isPreview = false
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [showingAllOffers, setShowingAllOffers] = useState(false);

  const handleApply = () => {
    if (couponCode.trim()) {
      onApplyCoupon(couponCode.trim());
      if (!isPreview) {
        setCouponCode('');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  return (
    <div id={id} style={{
      marginBottom: '16px'
    }}>
      {/* Coupon Input - Only show when no discount is applied */}
      {!appliedDiscount && (
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <div style={{
            flex: 1,
            position: 'relative'
          }}>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={isPreview}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                backgroundColor: '#ffffff',
                cursor: isPreview ? 'not-allowed' : 'text'
              }}
            />
          </div>
          <button
            onClick={handleApply}
            disabled={isPreview || !couponCode.trim()}
            style={{
              padding: '12px 24px',
              backgroundColor: !couponCode.trim() ? '#9ca3af' : '#f97316',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isPreview ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {buttonText}
          </button>
        </div>
      )}

      {/* Applied Discount */}
      {appliedDiscount && (
        <div style={{
          backgroundColor: '#d1fae5',
          border: '2px solid #059669',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#059669',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CheckIcon size={14} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#065f46',
              marginBottom: '2px'
            }}>
              {appliedDiscount.code} - {appliedDiscount.description}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#059669'
            }}>
              {enableAutoApply ? 'Best offer automatically applied' : 'Applied'}
            </div>
          </div>
          <button
            onClick={onRemoveDiscount}
            style={{
              width: '28px',
              height: '28px',
              padding: '0',
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: 'none',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            <XIcon size={16} color="#6b7280" />
          </button>
        </div>
      )}

      {/* Show All Offers */}
      {showAllOffers && availableDiscounts.length > 0 && (
        <div>
          <button
            onClick={() => setShowingAllOffers(!showingAllOffers)}
            style={{
              width: '100%',
              padding: '0 15px',
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              cursor: isPreview ? 'default' : 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: showingAllOffers ? '8px' : '0',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{showAllOffersButtonText} ({availableDiscounts.length} available)</span>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              transition: 'transform 0.3s ease',
              transform: showingAllOffers ? 'rotate(180deg)' : 'rotate(0deg)'
            }}>
              <ChevronDownIcon size={16} color="#6b7280" />
            </span>
          </button>

          {/* Offers Dropdown */}
          {showingAllOffers && (
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
            }}>
              {availableDiscounts.map((discount) => (
                <div
                  key={discount.code}
                  onClick={() => !isPreview && onSwitchDiscount(discount.code)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: isPreview ? 'default' : 'pointer',
                    transition: 'background-color 0.2s ease',
                    backgroundColor: appliedDiscount?.code === discount.code ? '#f0fdf4' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `2px solid ${appliedDiscount?.code === discount.code ? '#059669' : '#d1d5db'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {appliedDiscount?.code === discount.code && <CheckIcon size={12} color="#059669" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '2px'
                    }}>
                      {discount.code} - {discount.description}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      {discount.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

