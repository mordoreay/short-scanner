import { Exchange, ExchangeAPI } from '@/types/scanner';
import { BybitAPI } from './bybit';
import { BinanceAPI } from './binance';
import { OKXAPI } from './okx';

/**
 * Get exchange API instance by name
 */
export function getExchangeAPI(exchange: Exchange): ExchangeAPI {
  switch (exchange) {
    case 'bybit':
      return new BybitAPI();
    case 'binance':
      return new BinanceAPI();
    case 'okx':
      return new OKXAPI();
    default:
      return new BybitAPI();
  }
}

/**
 * Get all available exchanges
 */
export function getAvailableExchanges(): Exchange[] {
  return ['bybit', 'binance', 'okx'];
}

/**
 * Get exchange display name
 */
export function getExchangeName(exchange: Exchange): string {
  const names: Record<Exchange, string> = {
    bybit: 'Bybit',
    binance: 'Binance',
    okx: 'OKX',
  };
  return names[exchange];
}

export {
  BybitAPI,
  BinanceAPI,
  OKXAPI,
};
