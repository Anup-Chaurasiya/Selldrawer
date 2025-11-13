/**
 * Carousel management module - handles product recommendations carousel
 */

/**
 * Initialize product recommendations navigation
 */
export function initializeRecommendationsNavigation() {
  const gridLayout = document.querySelector('.upsellity-recommendations-grid-layout');
  if (gridLayout) return;
  
  const grid = document.querySelector('.upsellity-recommendations-grid');
  const leftArrow = document.querySelector('.upsellity-nav-left');
  const rightArrow = document.querySelector('.upsellity-nav-right');
  
  if (!grid || !leftArrow || !rightArrow) return;
  
  const needsScrolling = grid.scrollWidth > grid.clientWidth;
  
  const updateArrows = () => {
    const maxScrollLeft = grid.scrollWidth - grid.clientWidth;
    const currentScroll = grid.scrollLeft;
    
    const showLeft = currentScroll > 0;
    const showRight = currentScroll < maxScrollLeft;
    
    leftArrow.style.display = showLeft ? 'flex' : 'none';
    rightArrow.style.display = showRight ? 'flex' : 'none';
    
    grid.style.paddingLeft = showLeft ? '40px' : '0';
    grid.style.paddingRight = showRight ? '40px' : '0';
  };
  
  if (needsScrolling) {
    updateArrows();
    grid.addEventListener('scroll', updateArrows);
  } else {
    leftArrow.style.display = 'none';
    rightArrow.style.display = 'none';
    grid.style.paddingLeft = '0';
    grid.style.paddingRight = '0';
  }
}

/**
 * Scroll product recommendations
 */
export function scrollRecommendations(direction) {
  const gridLayout = document.querySelector('.upsellity-recommendations-grid-layout');
  if (gridLayout) return;
  
  const grid = document.querySelector('.upsellity-recommendations-grid');
  if (!grid) return;
  
  const scrollAmount = 140;
  
  if (direction === 'left') {
    grid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  } else if (direction === 'right') {
    grid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
}

