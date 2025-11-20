/**
 * Classic Template for FBT Widget
 * Column-wise layout with FBTProductCard components
 */

import React from 'react';
import { FBTProduct, FBTProductCard } from './FBTProductCard';

interface FBTTemplateClassicProps {
  recommendations: FBTProduct[];
  selectedProducts: Set<string>;
  config: any;
  handleToggle: (variantId: string, checked: boolean) => void;
  isPreview?: boolean;
  isAtLimit: boolean;
}

export const FBTTemplateClassic: React.FC<FBTTemplateClassicProps> = ({
  recommendations,
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
          gap: '0.5rem',
          width: '100%',
          alignItems: 'stretch',
          flexWrap: 'wrap'
        }}
      >
      {recommendations.map((product, index) => {
        const variantId = product.variantId || product.id;
        const isSelected = selectedProducts.has(variantId);
        const isDisabled = isAtLimit && !isSelected;
        
        return (
          <React.Fragment key={variantId}>
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

