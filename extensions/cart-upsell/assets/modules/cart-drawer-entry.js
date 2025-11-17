/**
 * Upsellity Cart Drawer - Entry Point for Build
 * This file serves as the entry point for bundling all modules
 */

import { UpsellityCartDrawer } from './cart-drawer-class.js';

// Version is injected at build time
const CART_DRAWER_VERSION = typeof __CART_DRAWER_VERSION__ !== 'undefined' ? __CART_DRAWER_VERSION__ : 'dev';

// Initialize on page load
function initializeCartDrawer() {
  if (typeof window !== 'undefined') {
    window.upsellityDrawer = new UpsellityCartDrawer();
    window.upsellityDrawer.version = CART_DRAWER_VERSION;
    console.log(`Upsellity Cart Drawer v${CART_DRAWER_VERSION} initialized`);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCartDrawer);
  } else {
    initializeCartDrawer();
  }
}

