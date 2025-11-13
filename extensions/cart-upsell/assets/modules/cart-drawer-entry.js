/**
 * Upsellity Cart Drawer - Entry Point for Build
 * This file serves as the entry point for bundling all modules
 */

import { UpsellityCartDrawer } from './cart-drawer-class.js';

// Initialize on page load
function initializeCartDrawer() {
  if (typeof window !== 'undefined') {
    window.upsellityDrawer = new UpsellityCartDrawer();
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCartDrawer);
  } else {
    initializeCartDrawer();
  }
}

