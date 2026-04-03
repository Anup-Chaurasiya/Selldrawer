/**
 * Selldrawer Cart Drawer - Entry Point for Build
 */

import { SelldrawerCartDrawer } from './cart-drawer-class.js';
import './fbt-cart-monitor.js';

// APP_URL is injected at build time from config.js
const APP_URL = typeof __APP_URL__ !== 'undefined' ? __APP_URL__ : 'https://app.selldrawer.com';

async function initializeCartDrawer() {
  if (typeof window === 'undefined') return;

  console.log('[Selldrawer] Entry point executing. APP_URL:', APP_URL);
  window.UPSELLITY_APP_URL = APP_URL;

  // Create the drawer instance (init() is called in constructor, non-blocking)
  window.selldrawerDrawer = new SelldrawerCartDrawer(APP_URL);

  // If the user clicked the cart BEFORE this script loaded, open now
  if (window.selldrawerPendingOpen) {
    console.log('[Selldrawer] Opening drawer for queued click.');
    window.selldrawerPendingOpen = false;
    // Small delay to let init() attach triggers and create the DOM
    setTimeout(() => {
      if (window.selldrawerDrawer && typeof window.selldrawerDrawer.open === 'function') {
        window.selldrawerDrawer.open();
      }
    }, 100);
  }
}

// Run immediately — the inline liquid script handles DOMContentLoaded timing
initializeCartDrawer().catch(e => {
  console.error('[Selldrawer] Entry point failed:', e);
});
