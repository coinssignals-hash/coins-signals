import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Smart price formatter based on asset type.
 * - JPY pairs: 3 decimals
 * - Other forex pairs: 5 decimals
 * - Crypto (BTC, ETH, etc.): 2 decimals for large prices, 6 for small
 * - Stocks/indices: 2 decimals
 * - Gold/Silver: 2 decimals
 */
export function formatPrice(price: number, symbol?: string): string {
  if (!symbol) {
    // Fallback: guess by price magnitude
    if (price > 1000) return price.toFixed(2);
    if (price > 10) return price.toFixed(3);
    return price.toFixed(5);
  }

  const upper = symbol.toUpperCase().replace(/[^A-Z]/g, '');

  // Check if JPY pair
  const isJpy = upper.includes('JPY');
  // Check if crypto
  const cryptos = ['BTC', 'ETH', 'XRP', 'SOL', 'BNB', 'ADA', 'DOGE', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI', 'ATOM', 'LTC', 'SHIB', 'PEPE'];
  const isCrypto = cryptos.some(c => upper.includes(c));
  // Check if commodity/metal
  const commodities = ['XAU', 'XAG', 'OIL', 'BRENT', 'WTI', 'NATGAS', 'COPPER', 'WHEAT', 'CORN'];
  const isCommodity = commodities.some(c => upper.includes(c));
  // Check if stock or index
  const stocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'SPX', 'NDX', 'DJI'];
  const isStock = stocks.some(s => upper.includes(s));

  if (isJpy) return price.toFixed(3);
  if (isCrypto) return price > 100 ? price.toFixed(2) : price.toFixed(6);
  if (isCommodity) return price.toFixed(2);
  if (isStock) return price.toFixed(2);

  // Default forex: 5 decimals
  return price.toFixed(5);
}

/** Check if a symbol is a JPY pair */
export function isJpyPair(symbol: string): boolean {
  return symbol.toUpperCase().includes('JPY');
}

/** Get decimal count for a symbol */
export function getDecimals(symbol: string): number {
  const upper = symbol.toUpperCase().replace(/[^A-Z]/g, '');
  if (upper.includes('JPY')) return 3;
  const nonForex = ['XAU', 'XAG', 'OIL', 'BRENT', 'WTI', 'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META'];
  if (nonForex.some(s => upper.includes(s))) return 2;
  return 5;
}
