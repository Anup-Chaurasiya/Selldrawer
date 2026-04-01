/**
 * Selldrawer Cart Drawer - Entry Point for Build
 * This file serves as the entry point for bundling all modules
 */

import { SelldrawerCartDrawer } from './cart-drawer-class.js';
import './fbt-cart-monitor.js'; // Import FBT cart monitor (initializes automatically)

// App URL is injected at build time from config.js
const APP_URL = typeof __APP_URL__ !== 'undefined' ? __APP_URL__ : 'https://app.selldrawer.com';

// Initialize on page load
function initializeCartDrawer() {
  if (typeof window !== 'undefined') {
    // Make APP_URL available globally for React components
    window.UPSELLITY_APP_URL = APP_URL;
    window.selldrawerDrawer = new SelldrawerCartDrawer(APP_URL);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCartDrawer);
  } else {
    initializeCartDrawer();
  }
}

