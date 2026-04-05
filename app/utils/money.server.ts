/**
 * Server-side money formatting utility for Shopify
 */

/**
 * Formats a cent amount into a localized currency string based on the shop's currency.
 * @param amount - Amount in cents
 * @param currencyCode - The ISO currency code (e.g., 'USD', 'EUR')
 * @returns Formatted string
 */
export function formatMoney(amount: number, currencyCode: string = 'USD'): string {
  const value = amount / 100;
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch (e) {
    // Fallback for cases where Intl.NumberFormat might fail
    const symbolMap: Record<string, string> = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    const symbol = symbolMap[currencyCode] || '$';
    return `${symbol}${value.toLocaleString()}`;
  }
}
