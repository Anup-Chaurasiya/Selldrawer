/**
 * Utility functions for cart drawer
 */

import { FEATURE_ORDER_SENTINEL, DEFAULT_FEATURE_ORDER } from './constants.js';

/**
 * Normalize feature order array
 */
export function normalizeFeatureOrder(order) {
  const allowed = new Set(DEFAULT_FEATURE_ORDER);
  const raw = Array.isArray(order) ? order.filter((id) => allowed.has(id)) : [];
  const missing = DEFAULT_FEATURE_ORDER.filter((id) => !raw.includes(id));
  const normalized = raw.concat(missing);

  const sentinelIndex = normalized.indexOf(FEATURE_ORDER_SENTINEL);
  if (sentinelIndex === -1) {
    const fallbackIndex = DEFAULT_FEATURE_ORDER.indexOf(FEATURE_ORDER_SENTINEL);
    if (fallbackIndex === -1) {
      normalized.push(FEATURE_ORDER_SENTINEL);
    } else {
      normalized.splice(fallbackIndex, 0, FEATURE_ORDER_SENTINEL);
    }
  } else {
    for (let i = normalized.length - 1; i > sentinelIndex; i -= 1) {
      if (normalized[i] === FEATURE_ORDER_SENTINEL) {
        normalized.splice(i, 1);
      }
    }
  }

  return normalized;
}

/**
 * Split feature order into before and after cart items
 */
export function splitFeatureOrder(order) {
  const normalized = normalizeFeatureOrder(order);
  const sentinelIndex = normalized.indexOf(FEATURE_ORDER_SENTINEL);

  if (sentinelIndex === -1) {
    return { beforeItems: normalized, afterItems: [] };
  }

  return {
    beforeItems: normalized.slice(0, sentinelIndex),
    afterItems: normalized.slice(sentinelIndex + 1),
  };
}

/**
 * Format money in cents to currency string
 */
export function formatMoney(cents) {
  const amount = cents / 100;
  return `₹${Math.round(amount)}`;
}

/**
 * Show notification toast
 */
export function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `upsellity-notification upsellity-notification-${type}`;
  notification.textContent = message;
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

/**
 * Get YouTube embed URL from various YouTube URL formats
 */
export function getYouTubeEmbedUrl(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0` : null;
}

/**
 * Get Vimeo embed URL from Vimeo URL
 */
export function getVimeoEmbedUrl(url) {
  const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
  const match = url.match(regExp);
  const videoId = match ? match[1] : null;
  return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1&loop=1&muted=1&background=1` : null;
}

