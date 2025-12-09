/**
 * Nudge Add Together Widget Wrapper for use in Shopify storefront
 * This bridges the gap between the shared component and the Shopify environment
 * Uses the same NudgeWidget component but with add-together logic
 */

import React, { useState } from 'react';
import { NudgeWidget } from '../../../../../app/components/shared/NudgeWidget.tsx';

export const NudgeAddTogetherWidgetWrapper = ({
  config,
  recommendations,
  originalProduct,
  onClose,
  onAddSelected,
  isVisible = true
}) => {
  const [selectedProducts, setSelectedProducts] = useState(new Set());

  const handleProductClick = (product) => {
    // Toggle selection instead of immediately adding
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(product.id)) {
        newSet.delete(product.id);
      } else {
        newSet.add(product.id);
      }
      return newSet;
    });
  };

  const handleSelectAllCheckbox = () => {
    const allIds = recommendations.map(p => p.id);
    if (selectedProducts.size === allIds.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(allIds));
    }
  };

  const handleAddSelected = async (selectedProductsArray) => {
    if (!onAddSelected) return;
    
    // onSelectAll is called with filtered array from NudgeWidget
    // Use that array directly
    const selected = selectedProductsArray && selectedProductsArray.length > 0 
      ? selectedProductsArray 
      : recommendations.filter(p => selectedProducts.has(p.id));
    
    if (selected.length === 0) return;
    
    await onAddSelected(selected);
  };

  // Modify config to show checkboxes and change button behavior
  const modifiedConfig = {
    ...config,
    // Change button text to indicate add selected
    selectButtonText: config.addSelectedButtonText || 'Add Selected to Cart',
    selectButtonColor: config.addSelectedButtonColor || config.selectButtonColor,
    selectButtonTextColor: config.addSelectedButtonTextColor || config.selectButtonTextColor,
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Show original product as included */}
      {originalProduct && (
        <div style={{
          width: '100%',
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          border: '2px solid #3b82f6',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            flexShrink: 0
          }}>
            ✓
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
              {originalProduct.title}
            </p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
              Included in cart
            </p>
          </div>
        </div>
      )}

      {/* Select All Checkbox */}
      {recommendations.length > 0 && (
        <div style={{
          width: '100%',
          marginBottom: '1rem',
          padding: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <input
            type="checkbox"
            checked={selectedProducts.size === recommendations.length && recommendations.length > 0}
            ref={(input) => {
              if (input) {
                input.indeterminate = selectedProducts.size > 0 && selectedProducts.size < recommendations.length;
              }
            }}
            onChange={handleSelectAllCheckbox}
            style={{
              width: '18px',
              height: '18px',
              cursor: 'pointer'
            }}
          />
          <label
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              color: config.subtitleColor || '#666666'
            }}
            onClick={handleSelectAllCheckbox}
          >
            Select All ({recommendations.length} products)
          </label>
        </div>
      )}

      {/* Use the same NudgeWidget but with checkbox mode enabled */}
      <NudgeWidget
        config={modifiedConfig}
        recommendations={recommendations}
        onClose={onClose}
        onContinue={undefined} // No continue button for add-together
        onSelectProduct={handleProductClick} // Toggle selection instead of immediate add
        onSelectAll={handleAddSelected} // Add selected products
        isVisible={isVisible}
        isPreview={false}
        checkboxMode={true}
        selectedProductIds={selectedProducts}
      />
    </div>
  );
};

