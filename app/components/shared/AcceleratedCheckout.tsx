import React, { useEffect, useRef } from 'react';

interface AcceleratedCheckoutConfig {
  isActive?: boolean;
}

interface AcceleratedCheckoutProps {
  config: AcceleratedCheckoutConfig;
}

export const AcceleratedCheckout: React.FC<AcceleratedCheckoutProps> = ({ config }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // When rendered in a Shopify storefront, standard Liquid themes inject additional checkout buttons.
  // The cart drawer script often tries to capture those or render them.
  // In a React context, we can attempt to grab the native buttons from the DOM and move them here.
  useEffect(() => {
    if (!config || config.isActive === false) return;

    if (containerRef.current) {
      // Look for the native additional checkout buttons on the page
      const nativeButtons = document.querySelector('.additional-checkout-buttons');
      
      if (nativeButtons && nativeButtons.innerHTML.trim() !== '') {
        // Clone the content into our drawer safely
        const cloned = nativeButtons.cloneNode(true) as HTMLElement;
        
        // Clear any previous cloned children to avoid duplication
        containerRef.current.innerHTML = '';
        
        // Append the cloned buttons
        containerRef.current.appendChild(cloned);
      }
    }
  }, [config]);

  if (!config || config.isActive === false) return null;

  return (
    <div 
      className="selldrawer-accelerated-checkout" 
      ref={containerRef}
      style={{
        marginTop: '12px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      {/* If native buttons are grabbed from DOM, they will be injected here. */}
      {/* Fallback styling for testing/previews */}
      {typeof window === 'undefined' || !document.querySelector('.additional-checkout-buttons') ? (
        <div style={{ padding: '10px', background: '#5A31F4', color: 'white', textAlign: 'center', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>
          Shop <span style={{ opacity: 0.8 }}>Pay</span>
        </div>
      ) : null}
    </div>
  );
};
