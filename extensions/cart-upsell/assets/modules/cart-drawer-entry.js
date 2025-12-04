/**
 * Upsellity Cart Drawer - Entry Point for Build
 * This file serves as the entry point for bundling all modules
 */

import { UpsellityCartDrawer } from './cart-drawer-class.js';

// App URL is injected at build time from config.js
const APP_URL = typeof __APP_URL__ !== 'undefined' ? __APP_URL__ : 'https://app.upsellity.com';

// Version is injected at build time
const CART_DRAWER_VERSION = typeof __CART_DRAWER_VERSION__ !== 'undefined' ? __CART_DRAWER_VERSION__ : 'dev';

// Initialize on page load
function initializeCartDrawer() {
  if (typeof window !== 'undefined') {
    window.upsellityDrawer = new UpsellityCartDrawer(APP_URL);
    window.upsellityDrawer.version = CART_DRAWER_VERSION;
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCartDrawer);
  } else {
    initializeCartDrawer();
  }
}

