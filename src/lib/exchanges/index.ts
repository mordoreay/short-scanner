import { Exchange, ExchangeAPI } from '@/types/scanner';
import { BybitAPI } from './bybit';
import { BinanceAPI } from './binance';
import { OKXAPI } from './okx';
import { BitgetAPI } from './bitget';
import { GateAPI } from './gate';
import { KuCoinAPI } from './kucoin';
import { MEXCAPI } from './mexc';

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
    case 'bitget':
      return new BitgetAPI();
    case 'gate':
      return new GateAPI();
    case 'kucoin':
      return new KuCoinAPI();
    case 'mexc':
      return new MEXCAPI();
    default:
      return new BybitAPI();
  }
}

/**
 * Get all available exchanges
 */
export function getAvailableExchanges(): Exchange[] {
  return ['bybit', 'binance', 'okx', 'bitget', 'gate', 'kucoin', 'mexc'];
}

/**
 * Get exchange display name
 */
export function getExchangeName(exchange: Exchange): string {
  const names: Record<Exchange, string> = {
    bybit: 'Bybit',
    binance: 'Binance',
    okx: 'OKX',
    bitget: 'Bitget',
    gate: 'Gate.io',
    kucoin: 'KuCoin',
    mexc: 'MEXC',
  };
  return names[exchange];
}

export {
  BybitAPI,
  BinanceAPI,
  OKXAPI,
  BitgetAPI,
  GateAPI,
  KuCoinAPI,
  MEXCAPI,
};
