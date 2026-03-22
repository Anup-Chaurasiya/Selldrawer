/**
 * Auto-Apply Storage Manager
 * Manages localStorage for tracking user's discount removal preferences
 * with 15-minute expiration
 */

const STORAGE_KEY = 'selldrawer_discount_removed';
const EXPIRATION_MINUTES = 15;

/**
 * Mark that user has removed auto-applied discount
 */
export function markDiscountRemoved() {
  const expirationTime = Date.now() + (EXPIRATION_MINUTES * 60 * 1000);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      removed: true,
      expiresAt: expirationTime
    }));
  } catch (error) {
    console.warn('Selldrawer: Failed to save discount removal preference', error);
  }
}

/**
 * Check if user has recently removed auto-applied discount
 * Returns true if user removed it and the preference hasn't expired
 */
export function wasDiscountRemoved() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (!stored) {
      return false;
    }
    
    const data = JSON.parse(stored);
    const now = Date.now();
    
    // Check if the preference has expired
    if (now >= data.expiresAt) {
      // Clean up expired data
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    
    return data.removed === true;
  } catch (error) {
    console.warn('Selldrawer: Failed to read discount removal preference', error);
    return false;
  }
}

/**
 * Clear the discount removal preference
 * (called when user manually applies a discount)
 */
export function clearDiscountRemoval() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Selldrawer: Failed to clear discount removal preference', error);
  }
}

