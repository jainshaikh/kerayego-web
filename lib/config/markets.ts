import { Market } from '../../types/api.types';

// Mirrors kerayego-backend/src/config/markets.config.ts exactly —
// keep both in sync if a market is added or its metadata changes.
export interface MarketMeta {
  code: Market;
  label: string;
  currencyCode: string;
  phoneCallingCode: string;
  sampleCities: string[];
}

export const MARKETS: Record<Market, MarketMeta> = {
  [Market.PK]: {
    code: Market.PK,
    label: 'Pakistan',
    currencyCode: 'PKR',
    phoneCallingCode: '+92',
    sampleCities: ['karachi', 'lahore', 'islamabad', 'rawalpindi', 'hyderabad'],
  },
  [Market.SA]: {
    code: Market.SA,
    label: 'Saudi Arabia',
    currencyCode: 'SAR',
    phoneCallingCode: '+966',
    sampleCities: ['riyadh', 'jeddah', 'dammam', 'mecca', 'medina'],
  },
  [Market.AE]: {
    code: Market.AE,
    label: 'United Arab Emirates',
    currencyCode: 'AED',
    phoneCallingCode: '+971',
    sampleCities: ['dubai', 'abu dhabi', 'sharjah'],
  },
};

// Existing data predates the Market concept entirely, so PK (the original,
// only market) is the correct default — not a placeholder to revisit.
export const DEFAULT_MARKET: Market = Market.PK;
