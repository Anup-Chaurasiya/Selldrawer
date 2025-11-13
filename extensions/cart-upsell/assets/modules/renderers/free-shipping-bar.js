/**
 * Free Shipping Progress Bar Renderer
 */

export function renderFreeShippingBar(config, cart) {
  const bar = config?.features?.freeShippingProgressBar;
  
  if (!bar) {
    return '';
  }

  let threshold, progress, remaining, isComplete, message;
  
  if (bar.thresholdMode === 'count') {
    threshold = parseInt(bar.thresholdCount);
    progress = Math.min((cart.item_count / threshold) * 100, 100);
    remaining = Math.max(threshold - cart.item_count, 0);
    isComplete = progress >= 100;
    message = isComplete 
      ? (bar.afterThresholdMessage || '🎉 You qualify for FREE shipping!')
      : bar.beforeThresholdMessage.replace('{remaining}', `${remaining} more items`);
  } else {
    threshold = parseFloat(bar.thresholdAmount);
    progress = Math.min((cart.total_price / 100 / threshold) * 100, 100);
    remaining = Math.max(threshold - (cart.total_price / 100), 0);
    isComplete = progress >= 100;
    message = isComplete 
      ? (bar.afterThresholdMessage || '🎉 You qualify for FREE shipping!')
      : bar.beforeThresholdMessage.replace('{remaining}', `${bar.currency === 'INR' ? '₹' : '$'}${Math.round(remaining)}`);
  }

  const backgroundColor = bar.backgroundColor || '#f8fafc';
  const progressBarColor = bar.progressBarColor || '#10b981';
  const incompleteColor = bar.progressBarColor || '#f59e0b';
  
  const backgroundGradient = `linear-gradient(135deg, ${backgroundColor} 0%, ${backgroundColor}dd 100%)`;
  const completeGradient = `linear-gradient(135deg, #10b981 0%, #059669 100%)`;
  const incompleteGradient = `linear-gradient(135deg, ${incompleteColor} 0%, ${incompleteColor}dd 100%)`;
  const percentageGradient = isComplete ? completeGradient : `linear-gradient(135deg, ${progressBarColor} 0%, ${progressBarColor}dd 100%)`;
  
  return `
    <div class="upsellity-progress-bar-enhanced" style="margin-bottom: 20px; padding: 16px; background: ${backgroundGradient}; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
      <div class="upsellity-progress-bar-text-enhanced" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 14px; font-weight: 600;">
        <span class="upsellity-progress-bar-message" style="color: #374151;">
          ${message}
        </span>
        ${bar.showPercentage ? `<span class="upsellity-progress-bar-percentage" style="background: ${percentageGradient}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; box-shadow: 0 2px 4px ${progressBarColor}40;">${progress.toFixed(0)}%</span>` : ''}
      </div>
      <div class="upsellity-progress-bar-track-enhanced" style="width: 100%; height: 12px; border-radius: 8px; overflow: hidden; background: ${backgroundColor}; position: relative; box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);">
        <div class="upsellity-progress-bar-fill-enhanced ${isComplete ? 'upsellity-progress-complete' : 'upsellity-progress-incomplete'}" 
             style="width: ${progress}%; height: 100%; display: block; background: ${isComplete ? completeGradient : incompleteGradient}; border-radius: 8px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);"></div>
      </div>
    </div>
  `;
}

