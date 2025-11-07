import { CurrencyRate } from '../types';

const CURRENCY_API_BASE = import.meta.env.VITE_CURRENCY_API_BASE || 'https://api.exchangerate-api.com/v4';
const CURRENCY_API_KEY = import.meta.env.VITE_CURRENCY_API_KEY || '';
const USE_API = import.meta.env.VITE_USE_CURRENCY_API !== 'false'; 


const currencySymbols: Record<string, string> = {
  'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CAD': 'C$', 'AUD': 'A$',
  'CHF': 'Fr', 'CNY': '¥', 'SEK': 'kr', 'NZD': 'NZ$', 'MXN': '$', 'SGD': 'S$',
  'HKD': 'HK$', 'NOK': 'kr', 'TRY': '₺', 'RUB': '₽', 'INR': '₹', 'BRL': 'R$',
  'ZAR': 'R', 'KRW': '₩', 'DKK': 'kr', 'PLN': 'zł', 'THB': '฿', 'IDR': 'Rp',
  'HUF': 'Ft', 'CZK': 'Kč', 'ILS': '₪', 'CLP': '$', 'PHP': '₱', 'AED': 'د.إ',
  'SAR': '﷼', 'MYR': 'RM', 'BGN': 'лв', 'RON': 'lei'
};

const getMockRate = (from: string, to: string): number => {
  const mockRates: Record<string, Record<string, number>> = {
    'USD': { 'EUR': 0.85, 'GBP': 0.73, 'JPY': 110, 'CAD': 1.25, 'AUD': 1.35 },
    'EUR': { 'USD': 1.18, 'GBP': 0.86, 'JPY': 130, 'CAD': 1.47, 'AUD': 1.59 },
    'GBP': { 'USD': 1.37, 'EUR': 1.16, 'JPY': 151, 'CAD': 1.71, 'AUD': 1.85 },
    'JPY': { 'USD': 0.009, 'EUR': 0.0077, 'GBP': 0.0066, 'CAD': 0.011, 'AUD': 0.012 }
  };
  return mockRates[from]?.[to] || 1;
};

let ratesCache: { data: Record<string, number>; base: string; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export class CurrencyService {
  
  private static async fetchExchangeRates(base: string): Promise<Record<string, number> | null> {
    if (!USE_API) {
      return null;
    }

    try {
      
      if (ratesCache && ratesCache.base === base && 
          Date.now() - ratesCache.timestamp < CACHE_DURATION) {
        return ratesCache.data;
      }

      let apiUrl = `${CURRENCY_API_BASE}/latest/${base}`;
      if (CURRENCY_API_KEY) {
        
        apiUrl += `?apikey=${CURRENCY_API_KEY}`;
      }

      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Currency API returned ${response.status}`);
      }

      const data = await response.json();
      
      
      const rates = data.rates || data.conversion_rates || data;
      
      
      ratesCache = {
        data: rates,
        base,
        timestamp: Date.now()
      };

      return rates;
    } catch (error) {
      console.warn('Failed to fetch exchange rates from API, using fallback:', error);
      return null;
    }
  }

  static async getExchangeRate(from: string, to: string): Promise<CurrencyRate> {
    try {
      
      if (from === to) {
        return {
          from,
          to,
          rate: 1,
          symbol: currencySymbols[to] || to
        };
      }

      
      const rates = await this.fetchExchangeRates(from);
      
      let rate: number;
      if (rates && rates[to]) {
        
        rate = rates[to];
      } else if (rates && from !== 'USD') {
        
        const usdRates = await this.fetchExchangeRates('USD');
        if (usdRates && usdRates[from] && usdRates[to]) {
          rate = usdRates[to] / usdRates[from];
        } else {
          rate = getMockRate(from, to);
        }
      } else {
        // Fallback to mock data
        rate = getMockRate(from, to);
      }

      return {
        from,
        to,
        rate: Number(rate.toFixed(6)), // Round to 6 decimal places
        symbol: currencySymbols[to] || to
      };
    } catch (error) {
      console.error('Currency API error:', error);
      // Return fallback data
      return {
        from,
        to,
        rate: getMockRate(from, to),
        symbol: currencySymbols[to] || '$'
      };
    }
  }

  /**
   * Gets list of supported currencies dynamically from API or returns default list
   */
  static async getSupportedCurrencies(): Promise<string[]> {
    try {
      if (!USE_API) {
        return Object.keys(currencySymbols);
      }

      // Try to fetch from API
      const rates = await this.fetchExchangeRates('USD');
      
      if (rates && Object.keys(rates).length > 0) {
        // Return currencies from API response plus the base currency
        const currencies = ['USD', ...Object.keys(rates)];
        return [...new Set(currencies)].sort();
      }

      // Fallback to currencies we have symbols for
      return Object.keys(currencySymbols).sort();
    } catch (error) {
      console.warn('Failed to fetch supported currencies, using fallback:', error);
      return Object.keys(currencySymbols).sort();
    }
  }

  /**
   * Gets currency symbol for a currency code
   */
  static getCurrencySymbol(currency: string): string {
    return currencySymbols[currency] || currency;
  }

  /**
   * Converts an amount from one currency to another
   */
  static async convertAmount(amount: number, from: string, to: string): Promise<number> {
    if (from === to) {
      return amount;
    }
    
    const rate = await this.getExchangeRate(from, to);
    return Math.round(amount * rate.rate * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Formats currency amount with symbol
   */
  static formatCurrency(amount: number, currency: string): string {
    const symbol = this.getCurrencySymbol(currency);
    // For currencies like JPY that don't use decimals, format differently
    if (['JPY', 'KRW', 'VND'].includes(currency)) {
      return `${symbol}${Math.round(amount).toLocaleString()}`;
    }
    return `${symbol}${amount.toFixed(2)}`;
  }

  /**
   * Detect a likely currency code from a formatted address string (best-effort)
   */
  static detectCurrencyFromAddress(address: string): string {
    const lower = (address || '').toLowerCase();
    const pairs: Array<[string[], string]> = [
      [["united states","usa","u.s.","new york","california"], 'USD'],
      [["canada","toronto","vancouver"], 'CAD'],
      [["united kingdom","uk","england","scotland","wales","london"], 'GBP'],
      [["euro","france","germany","italy","spain","netherlands","belgium","portugal","greece","austria","ireland"], 'EUR'],
      [["japan","tokyo","osaka"], 'JPY'],
      [["india","mumbai","delhi","bangalore"], 'INR'],
      [["australia","sydney","melbourne"], 'AUD'],
      [["new zealand","auckland","wellington"], 'NZD'],
      [["switzerland","zurich","geneva"], 'CHF'],
      [["sweden","stockholm"], 'SEK'],
      [["norway","oslo"], 'NOK'],
      [["denmark","copenhagen"], 'DKK'],
      [["china","beijing","shanghai","hong kong"], 'CNY'],
      [["singapore"], 'SGD'],
      [["south korea","seoul"], 'KRW'],
      [["mexico","mexico city"], 'MXN'],
      [["brazil","rio de janeiro","são paulo","sao paulo"], 'BRL'],
      [["uae","dubai","abu dhabi","united arab emirates"], 'AED']
    ];
    for (const [needles, code] of pairs) {
      if (needles.some(n => lower.includes(n))) return code;
    }
    return 'USD';
  }

  /**
   * Clears the exchange rate cache (useful for testing or forcing refresh)
   */
  static clearCache(): void {
    ratesCache = null;
  }
}