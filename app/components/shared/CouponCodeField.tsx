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
  amount?: number; // Discount amount in cents from Shopify cart
  title?: string; // Optional, for display purposes
  description?: string; // Optional, for display purposes
  type?: string;
  value?: number;
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
  onApplyCoupon = () => { },
  onRemoveDiscount = () => { },
  onSwitchDiscount = () => { },
  backgroundColor = '#d1fae5',
  textColor = '#065f46',
  couponCodeColor,
  borderColor = '#059669',
  appliedDiscountText,
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
          backgroundColor: '#f0fdf4', // Emerald 50
          border: '1px solid #bbf7d0', // Emerald 200
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px', // Increased margin
          display: 'flex',
          alignItems: 'flex-start', // Align to top for better multi-line handling
          gap: '12px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#16a34a', // Emerald 600
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '1px' // Align with text
          }}>
            <CheckIcon size={12} color="white" />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#15803d', // Emerald 700
                letterSpacing: '-0.01em'
              }}>
                {appliedDiscount.code}
              </span>
              <span style={{
                fontSize: '11px',
                color: '#166534', // Emerald 800
                backgroundColor: '#dcfce7', // Emerald 100
                padding: '1px 6px',
                borderRadius: '10px',
                fontWeight: '600'
              }}>
                APPLIED
              </span>
            </div>


          </div>

          <button
            onClick={onRemoveDiscount}
            style={{
              padding: '4px 8px',
              backgroundColor: 'white',
              color: '#dc2626', // Red 600
              border: '1px solid #fee2e2', // Red 100
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 1px 1px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f2';
              e.currentTarget.style.borderColor = '#fecaca';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#fee2e2';
            }}
          >
            <span>Remove</span>
            <XIcon size={12} color="#dc2626" />
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
              marginTop: '4px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
              {availableDiscounts.map((discount, index) => {
                const isSelected = appliedDiscount?.code === discount.code;
                const isLast = index === availableDiscounts.length - 1;

                return (
                  <div
                    key={discount.code}
                    onClick={() => {
                      if (!isPreview) {
                        onSwitchDiscount(discount.code);
                        setShowingAllOffers(false);
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    style={{
                      padding: '12px 16px',
                      borderBottom: isLast ? 'none' : '1px solid #f3f4f6',
                      cursor: isPreview ? 'default' : 'pointer',
                      transition: 'background-color 0.2s ease',
                      backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    {/* Custom Radio Button */}
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: `1.5px solid ${isSelected ? borderColor : '#d1d5db'}`,
                      backgroundColor: isSelected ? borderColor : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.2s ease'
                    }}>
                      {isSelected && (
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: 'white'
                        }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginBottom: discount.title && discount.title !== discount.code ? '2px' : '0'
                      }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          color: '#111827',
                          letterSpacing: '-0.01em'
                        }}>
                          {discount.code}
                        </span>
                        {discount.description && (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '600',
                            color: isSelected ? '#065f46' : '#6b7280',
                            backgroundColor: isSelected ? '#d1fae5' : '#f3f4f6',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            letterSpacing: '0.02em',
                            textTransform: 'uppercase'
                          }}>
                            {discount.description.replace(/^-\s*/, '')}
                          </span>
                        )}
                      </div>
                      {discount.title && discount.title !== discount.code && (
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          lineHeight: '1.4'
                        }}>
                          {discount.title}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
