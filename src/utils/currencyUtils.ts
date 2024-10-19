export const currencies = ['EUR', 'USD', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NZD'];

// This is a mock exchange rate. In a real application, you'd fetch this from an API.
const mockExchangeRates: { [key: string]: number } = {
  EUR: 1,
  USD: 1.18,
  GBP: 0.86,
  JPY: 130.55,
  CAD: 1.48,
  AUD: 1.61,
  CHF: 1.08,
  CNY: 7.63,
  SEK: 10.18,
  NZD: 1.69,
};

export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) return amount;
  const euroAmount = amount / mockExchangeRates[fromCurrency];
  return euroAmount * mockExchangeRates[toCurrency];
};

export const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }).format(amount);
};

export const getCurrencySymbol = (currency: string): string => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: currency, 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }).format(0).replace(/\d/g, '').trim();
};