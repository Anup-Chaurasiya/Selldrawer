/**
 * Classic Template for FBT Widget
 * Column-wise layout with FBTProductCard components
 */

import React from 'react';
import { FBTProduct, FBTProductCard } from './FBTProductCard';

interface FBTTemplateClassicProps {
  recommendations: FBTProduct[];
  parentProduct?: FBTProduct | null;
  selectedProducts: Set<string>;
  config: any;
  handleToggle: (variantId: string, checked: boolean) => void;
  isPreview?: boolean;
  isAtLimit: boolean;
}

export const FBTTemplateClassic: React.FC<FBTTemplateClassicProps> = ({
  recommendations,
  parentProduct,
  selectedProducts,
  config,
  handleToggle,
  isPreview,
  isAtLimit
}) => {
  return (
    <div
      className="upsellity-fbt-template-classic"
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '0.25em',
        flex: 1,
        alignItems: 'center',
        flexWrap: 'wrap',
        minWidth: 350
      }}
    >
      {/* Render Parent Product First */}
      {parentProduct && (() => {
        const variantId = parentProduct.variantId || parentProduct.id;
        const isSelected = selectedProducts.has(variantId);

        return (
          <React.Fragment key={`parent-${variantId}`}>
            <div style={{ position: 'relative', flex: '0 0 140px' }}>
              <FBTProductCard
                product={parentProduct}
                isSelected={isSelected}
                isDisabled={false}
                showCheckbox={false}
                showDiscount={config.showDiscount ?? true}
                showIndividualPrices={config.showIndividualPrices ?? true}
                showReviews={config.showProductReviews ?? false}
                onToggle={handleToggle}
                isPreview={isPreview}
              />
              {/* "This Item" Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '-6px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#3b82f6',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '0.5625rem',
                  fontWeight: '600',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  whiteSpace: 'nowrap',
                  zIndex: 20,
                  letterSpacing: '0.3px'
                }}
              >
                THIS ITEM
              </div>
            </div>
            <div
              className="upsellity-fbt-plus"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                color: '#6b7280',
                fontWeight: '600',
                minWidth: '20px',
                flexShrink: 0
              }}
            >
              +
            </div>
          </React.Fragment>
        );
      })()}

      {/* Render Recommendation Products */}
      {recommendations.map((product, index) => {
        const variantId = product.variantId || product.id;
        const isSelected = selectedProducts.has(variantId);
        const isDisabled = isAtLimit && !isSelected;

        return (
          <React.Fragment key={variantId}>
            <div style={{ position: 'relative', flex: '0 0 140px' }}>
              <FBTProductCard
                product={product}
                isSelected={isSelected}
                isDisabled={isDisabled}
                showCheckbox={config.showCheckboxes ?? true}
                showDiscount={config.showDiscount ?? true}
                showIndividualPrices={config.showIndividualPrices ?? true}
                showReviews={config.showProductReviews ?? false}
                onToggle={handleToggle}
                isPreview={isPreview}
              />
            </div>
            {index < recommendations.length - 1 && (
              <div
                className="upsellity-fbt-plus"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  color: '#6b7280',
                  fontWeight: '600',
                  minWidth: '20px',
                  flexShrink: 0
                }}
              >
                +
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

