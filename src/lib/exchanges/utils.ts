/**
 * API Utilities for exchange requests
 * Provides retry logic, timeouts, and error handling
 */

export interface FetchOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Fetch with timeout and retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeout = 15000,
    retries = 2,
    retryDelay = 1000,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on abort (timeout)
      if (lastError.name === 'AbortError') {
        console.warn(`Request timeout for ${url}`);
        throw lastError;
      }

      // Wait before retry
      if (attempt < retries) {
        console.warn(`Retry ${attempt + 1}/${retries} for ${url} after ${retryDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Safe JSON parse with error handling
 */
export async function safeParseJson<T>(response: Response): Promise<T | null> {
  try {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (error) {
    console.error('JSON parse error:', error);
    return null;
  }
}

/**
 * Calculate price change percentage
 */
export function calculateChangePercent(current: number, open: number): number {
  if (open === 0) return 0;
  return ((current - open) / open) * 100;
}

/**
 * Format symbol for different exchanges
 */
export function formatSymbol(symbol: string, exchange: string): string {
  const baseName = symbol
    .replace('USDT', '')
    .replace('-USDT-SWAP', '')
    .replace('-USDT', '')
    .replace('_USDT', '');

  switch (exchange.toLowerCase()) {
    case 'okx':
      return `${baseName}-USDT-SWAP`;
    case 'bitget':
    case 'bybit':
    case 'binance':
    case 'gate':
    case 'kucoin':
    case 'mexc':
      return `${baseName}USDT`;
    default:
      return symbol;
  }
}

/**
 * Convert interval to exchange-specific format
 */
export function convertInterval(interval: string, exchange: string): string {
  const intervalMap: Record<string, Record<string, string>> = {
    'okx': {
      '15m': '15m',
      '1h': '1H',
      '4h': '4H',
      '1d': '1Dutc',
    },
    'bitget': {
      '15m': '15m',
      '1h': '1H',
      '4h': '4H',
      '1d': '1D',
    },
    'bybit': {
      '15m': '15',
      '1h': '60',
      '4h': '240',
      '1d': 'D',
    },
    'binance': {
      '15m': '15m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d',
    },
    'gate': {
      '15m': '15m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d',
    },
    'kucoin': {
      '15m': '15min',
      '1h': '1hour',
      '4h': '4hour',
      '1d': '1day',
    },
    'mexc': {
      '15m': '15m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d',
    },
  };

  return intervalMap[exchange.toLowerCase()]?.[interval] || interval;
}
