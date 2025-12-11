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
 * Toast Notification Manager
 * Modern, top-notch toast notification system with stacking, icons, and progress bars
 */

// Toast container singleton
let toastContainer = null;

/**
 * Initialize toast container if it doesn't exist
 */
function initToastContainer() {
  if (toastContainer) return toastContainer;
  
  toastContainer = document.createElement('div');
  toastContainer.className = 'upsellity-toast-container';
  toastContainer.setAttribute('aria-live', 'polite');
  toastContainer.setAttribute('aria-atomic', 'true');
  
  // Inject styles if not already present
  if (!document.getElementById('upsellity-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'upsellity-toast-styles';
    style.textContent = `
      .upsellity-toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 100000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
        width: auto;
        max-width: min(380px, calc(100vw - 40px));
      }
      
      .upsellity-toast {
        position: relative;
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border-radius: 10px;
        padding: 14px 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        max-width: 100%;
        pointer-events: auto;
        overflow: hidden;
        border-left: 4px solid;
        animation: toastSlideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        transition: all 0.25s ease;
        backdrop-filter: blur(12px);
      }
      
      .upsellity-toast:hover {
        transform: translateX(-4px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.12);
      }
      
      .upsellity-toast-success {
        border-left-color: #22c55e;
        background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
      }
      
      .upsellity-toast-success:hover {
        border-left-color: #16a34a;
      }
      
      .upsellity-toast-error {
        border-left-color: #f43f5e;
        background: linear-gradient(135deg, #fff1f2 0%, #ffffff 100%);
      }
      
      .upsellity-toast-error:hover {
        border-left-color: #e11d48;
      }
      
      .upsellity-toast-info {
        border-left-color: #3b82f6;
        background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
      }
      
      .upsellity-toast-info:hover {
        border-left-color: #2563eb;
      }
      
      .upsellity-toast-icon {
        flex-shrink: 0;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
        line-height: 1;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
      
      .upsellity-toast-success .upsellity-toast-icon {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        color: white;
      }
      
      .upsellity-toast-error .upsellity-toast-icon {
        background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
        color: white;
      }
      
      .upsellity-toast-info .upsellity-toast-icon {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
      }
      
      .upsellity-toast-content {
        flex: 1;
        display: flex;
        align-items: center;
        min-width: 0;
      }
      
      .upsellity-toast-message {
        font-size: 13px;
        font-weight: 500;
        line-height: 1.5;
        color: #1e293b;
        margin: 0;
        word-wrap: break-word;
      }
      
      .upsellity-toast-close {
        flex-shrink: 0;
        background: none;
        border: none;
        width: 20px;
        height: 20px;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
        border-radius: 5px;
        transition: all 0.2s ease;
        opacity: 0.6;
        margin-left: 4px;
      }
      
      .upsellity-toast-close:hover {
        opacity: 1;
        background: rgba(0, 0, 0, 0.08);
        color: #475569;
        transform: rotate(90deg);
      }
      
      .upsellity-toast-close::before {
        content: '×';
        font-size: 22px;
        line-height: 1;
        font-weight: 300;
      }
      
      .upsellity-toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 0 0 10px 10px;
        overflow: hidden;
      }
      
      .upsellity-toast-progress-bar {
        height: 100%;
        transition: width linear;
        border-radius: 0 0 10px 10px;
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
      }
      
      .upsellity-toast-success .upsellity-toast-progress-bar {
        background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
      }
      
      .upsellity-toast-error .upsellity-toast-progress-bar {
        background: linear-gradient(90deg, #f43f5e 0%, #e11d48 100%);
      }
      
      .upsellity-toast-info .upsellity-toast-progress-bar {
        background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
      }
      
      @keyframes toastSlideInRight {
        from {
          opacity: 0;
          transform: translateX(100%) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }
      
      @keyframes toastSlideOutRight {
        from {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        to {
          opacity: 0;
          transform: translateX(100%) scale(0.95);
        }
      }
      
      .upsellity-toast.exiting {
        animation: toastSlideOutRight 0.3s cubic-bezier(0.4, 0, 1, 1) forwards;
      }
      
      @media (max-width: 640px) {
        .upsellity-toast-container {
          right: 12px;
          left: 12px;
          max-width: none;
          top: 12px;
        }
        
        .upsellity-toast {
          min-width: auto;
          padding: 12px 14px;
        }
        
        .upsellity-toast-message {
          font-size: 12px;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(toastContainer);
  return toastContainer;
}

/**
 * Get icon for toast type
 */
function getToastIcon(type) {
  const icons = {
    success: '✓',
    error: '✕',
    info: 'i'
  };
  return icons[type] || icons.info;
}

/**
 * Show notification toast
 * @param {string} message - Toast message
 * @param {string} type - Toast type: 'success', 'error', 'info'
 * @param {number} duration - Duration in milliseconds (default: 4000)
 */
export function showNotification(message, type = 'info', duration = 4000) {
  // Initialize container
  const container = initToastContainer();
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `upsellity-toast upsellity-toast-${type}`;
  toast.setAttribute('role', 'alert');
  
  // Icon
  const icon = document.createElement('div');
  icon.className = 'upsellity-toast-icon';
  icon.textContent = getToastIcon(type);
  icon.setAttribute('aria-hidden', 'true');
  
  // Content
  const content = document.createElement('div');
  content.className = 'upsellity-toast-content';
  
  const messageEl = document.createElement('p');
  messageEl.className = 'upsellity-toast-message';
  messageEl.textContent = message;
  
  content.appendChild(messageEl);
  
  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'upsellity-toast-close';
  closeBtn.setAttribute('aria-label', 'Close notification');
  closeBtn.setAttribute('type', 'button');
  
  // Progress bar
  const progressContainer = document.createElement('div');
  progressContainer.className = 'upsellity-toast-progress';
  
  const progressBar = document.createElement('div');
  progressBar.className = 'upsellity-toast-progress-bar';
  progressBar.style.width = '100%';
  progressBar.style.transitionDuration = `${duration}ms`;
  
  progressContainer.appendChild(progressBar);
  
  // Assemble toast
  toast.appendChild(icon);
  toast.appendChild(content);
  toast.appendChild(closeBtn);
  toast.appendChild(progressContainer);
  
  // Add to container
  container.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });
  
  // Start progress bar animation
  requestAnimationFrame(() => {
    progressBar.style.width = '0%';
  });
  
  // Remove function
  const removeToast = () => {
    // Clear timeout if still active
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    toast.classList.add('exiting');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      // Remove container if empty
      if (container.children.length === 0 && container.parentNode) {
        container.parentNode.removeChild(container);
        toastContainer = null;
      }
    }, 300);
  };
  
  // Close button handler
  closeBtn.addEventListener('click', () => {
    isPaused = false; // Prevent hover resume
    removeToast();
  });
  
  // Auto remove after duration
  let timeoutId = setTimeout(removeToast, duration);
  let startTime = Date.now();
  let remainingTime = duration;
  
  // Pause progress on hover
  let isPaused = false;
  toast.addEventListener('mouseenter', () => {
    if (isPaused) return;
    isPaused = true;
    
    // Calculate remaining time
    const elapsed = Date.now() - startTime;
    remainingTime = duration - elapsed;
    
    // Pause progress bar
    const currentWidth = progressBar.offsetWidth;
    const containerWidth = progressContainer.offsetWidth;
    const percentage = (currentWidth / containerWidth) * 100;
    progressBar.style.width = `${percentage}%`;
    progressBar.style.transitionDuration = '0ms';
    
    // Clear timeout
    clearTimeout(timeoutId);
  });
  
  toast.addEventListener('mouseleave', () => {
    if (!isPaused) return;
    isPaused = false;
    
    // Resume progress bar
    progressBar.style.transitionDuration = `${remainingTime}ms`;
    requestAnimationFrame(() => {
      progressBar.style.width = '0%';
    });
    
    // Resume timeout
    startTime = Date.now();
    timeoutId = setTimeout(removeToast, remainingTime);
  });
  
  return toast;
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

