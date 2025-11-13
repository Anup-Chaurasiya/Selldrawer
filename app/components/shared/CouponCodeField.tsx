/**
 * Shared Coupon Code Field Component
 * Used in both production cart drawer and Remix preview
 */

import React, { useState } from 'react';

interface Discount {
  code: string;
  title: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
}

interface CouponCodeFieldProps {
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
    <div style={{
      marginBottom: isPreview ? '12px' : '16px'
    }}>
      {/* Coupon Input */}
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
              padding: isPreview ? '10px 14px' : '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: isPreview ? '13px' : '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease',
              backgroundColor: isPreview ? '#f9fafb' : '#ffffff',
              cursor: isPreview ? 'not-allowed' : 'text'
            }}
          />
        </div>
        <button
          onClick={handleApply}
          disabled={isPreview || !couponCode.trim()}
          style={{
            padding: isPreview ? '10px 20px' : '12px 24px',
            backgroundColor: isPreview || !couponCode.trim() ? '#9ca3af' : '#f97316',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: isPreview ? '13px' : '14px',
            fontWeight: '600',
            cursor: isPreview ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          {buttonText}
        </button>
      </div>

      {/* Applied Discount */}
      {appliedDiscount && (
        <div style={{
          backgroundColor: '#d1fae5',
          border: '2px solid #059669',
          borderRadius: '10px',
          padding: isPreview ? '10px 14px' : '12px 16px',
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
            fontSize: '14px',
            fontWeight: '700',
            flexShrink: 0
          }}>
            ✓
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: isPreview ? '13px' : '14px',
              fontWeight: '600',
              color: '#065f46',
              marginBottom: '2px'
            }}>
              {appliedDiscount.code} - {appliedDiscount.description}
            </div>
            <div style={{
              fontSize: isPreview ? '11px' : '12px',
              color: '#059669'
            }}>
              {enableAutoApply ? 'Best offer automatically applied' : 'Applied'}
            </div>
          </div>
          {!isPreview && (
            <button
              onClick={onRemoveDiscount}
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                color: '#dc2626',
                border: '1px solid #dc2626',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Remove
            </button>
          )}
        </div>
      )}

      {/* Show All Offers */}
      {showAllOffers && availableDiscounts.length > 0 && (
        <div>
          <button
            onClick={() => setShowingAllOffers(!showingAllOffers)}
            style={{
              width: '100%',
              padding: isPreview ? '10px 14px' : '12px 16px',
              backgroundColor: '#fef3c7',
              border: '2px solid #fbbf24',
              borderRadius: '8px',
              fontSize: isPreview ? '13px' : '14px',
              fontWeight: '600',
              color: '#92400e',
              cursor: isPreview ? 'default' : 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: showingAllOffers ? '8px' : '0',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>🎁</span>
              <span>{showAllOffersButtonText} ({availableDiscounts.length} available)</span>
            </span>
            <span style={{
              fontSize: '12px',
              color: '#6b7280',
              transition: 'transform 0.3s ease',
              transform: showingAllOffers ? 'rotate(180deg)' : 'rotate(0deg)'
            }}>
              ▼
            </span>
          </button>

          {/* Offers Dropdown */}
          {showingAllOffers && (
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              {availableDiscounts.map((discount) => (
                <div
                  key={discount.code}
                  onClick={() => !isPreview && onSwitchDiscount(discount.code)}
                  style={{
                    padding: isPreview ? '10px 14px' : '12px 16px',
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
                    fontSize: '12px',
                    color: '#059669',
                    fontWeight: '700',
                    flexShrink: 0
                  }}>
                    {appliedDiscount?.code === discount.code ? '✓' : ''}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: isPreview ? '13px' : '14px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '2px'
                    }}>
                      {discount.code} - {discount.description}
                    </div>
                    <div style={{
                      fontSize: isPreview ? '11px' : '12px',
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

