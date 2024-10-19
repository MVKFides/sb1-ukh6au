export enum EU_COUNTRIES {
  NL = 'Netherlands',
  DE = 'Germany',
  FR = 'France',
  BE = 'Belgium',
  IT = 'Italy',
  ES = 'Spain',
  SE = 'Sweden',
  DK = 'Denmark',
  IE = 'Ireland',
  AT = 'Austria',
  CH = 'Switzerland',
  UK = 'United Kingdom',
  NO = 'Norway',
  AU = 'Australia',
  CA = 'Canada',
  US = 'United States',
}

export enum ProductType {
  STANDARD = 'Standard',
  FOOD = 'Food',
  BOOKS = 'Books',
  DIGITAL = 'Digital',
}

export enum VATType {
  STANDARD = 'Standard',
  REDUCED = 'Reduced',
  ZERO = 'Zero',
  EXEMPT = 'Exempt',
  REVERSE_CHARGE = 'Reverse Charge',
}

export const EU_VAT_RATES: Record<EU_COUNTRIES, Record<ProductType, number>> = {
  [EU_COUNTRIES.NL]: {
    [ProductType.STANDARD]: 0.21,
    [ProductType.FOOD]: 0.09,
    [ProductType.BOOKS]: 0.09,
    [ProductType.DIGITAL]: 0.21,
  },
  [EU_COUNTRIES.DE]: {
    [ProductType.STANDARD]: 0.19,
    [ProductType.FOOD]: 0.07,
    [ProductType.BOOKS]: 0.07,
    [ProductType.DIGITAL]: 0.19,
  },
  [EU_COUNTRIES.FR]: {
    [ProductType.STANDARD]: 0.20,
    [ProductType.FOOD]: 0.055,
    [ProductType.BOOKS]: 0.055,
    [ProductType.DIGITAL]: 0.20,
  },
  [EU_COUNTRIES.BE]: {
    [ProductType.STANDARD]: 0.21,
    [ProductType.FOOD]: 0.06,
    [ProductType.BOOKS]: 0.06,
    [ProductType.DIGITAL]: 0.21,
  },
  [EU_COUNTRIES.IT]: {
    [ProductType.STANDARD]: 0.22,
    [ProductType.FOOD]: 0.04,
    [ProductType.BOOKS]: 0.04,
    [ProductType.DIGITAL]: 0.22,
  },
  [EU_COUNTRIES.ES]: {
    [ProductType.STANDARD]: 0.21,
    [ProductType.FOOD]: 0.10,
    [ProductType.BOOKS]: 0.04,
    [ProductType.DIGITAL]: 0.21,
  },
  [EU_COUNTRIES.SE]: {
    [ProductType.STANDARD]: 0.25,
    [ProductType.FOOD]: 0.12,
    [ProductType.BOOKS]: 0.06,
    [ProductType.DIGITAL]: 0.25,
  },
  [EU_COUNTRIES.DK]: {
    [ProductType.STANDARD]: 0.25,
    [ProductType.FOOD]: 0.25,
    [ProductType.BOOKS]: 0.25,
    [ProductType.DIGITAL]: 0.25,
  },
  [EU_COUNTRIES.IE]: {
    [ProductType.STANDARD]: 0.23,
    [ProductType.FOOD]: 0.00,
    [ProductType.BOOKS]: 0.09,
    [ProductType.DIGITAL]: 0.23,
  },
  [EU_COUNTRIES.AT]: {
    [ProductType.STANDARD]: 0.20,
    [ProductType.FOOD]: 0.10,
    [ProductType.BOOKS]: 0.10,
    [ProductType.DIGITAL]: 0.20,
  },
  [EU_COUNTRIES.CH]: {
    [ProductType.STANDARD]: 0.077,
    [ProductType.FOOD]: 0.025,
    [ProductType.BOOKS]: 0.025,
    [ProductType.DIGITAL]: 0.077,
  },
  [EU_COUNTRIES.UK]: {
    [ProductType.STANDARD]: 0.20,
    [ProductType.FOOD]: 0.00,
    [ProductType.BOOKS]: 0.00,
    [ProductType.DIGITAL]: 0.20,
  },
  [EU_COUNTRIES.NO]: {
    [ProductType.STANDARD]: 0.25,
    [ProductType.FOOD]: 0.15,
    [ProductType.BOOKS]: 0.00,
    [ProductType.DIGITAL]: 0.25,
  },
  [EU_COUNTRIES.AU]: {
    [ProductType.STANDARD]: 0.10,
    [ProductType.FOOD]: 0.10,
    [ProductType.BOOKS]: 0.10,
    [ProductType.DIGITAL]: 0.10,
  },
  [EU_COUNTRIES.CA]: {
    [ProductType.STANDARD]: 0.15,
    [ProductType.FOOD]: 0.15,
    [ProductType.BOOKS]: 0.15,
    [ProductType.DIGITAL]: 0.15,
  },
  [EU_COUNTRIES.US]: {
    [ProductType.STANDARD]: 0.10,
    [ProductType.FOOD]: 0.10,
    [ProductType.BOOKS]: 0.10,
    [ProductType.DIGITAL]: 0.10,
  },
};

export const VAT_THRESHOLDS: Record<EU_COUNTRIES, number> = {
  [EU_COUNTRIES.NL]: 100000,
  [EU_COUNTRIES.DE]: 100000,
  [EU_COUNTRIES.FR]: 100000,
  [EU_COUNTRIES.BE]: 100000,
  [EU_COUNTRIES.IT]: 100000,
  [EU_COUNTRIES.ES]: 100000,
  [EU_COUNTRIES.SE]: 100000,
  [EU_COUNTRIES.DK]: 100000,
  [EU_COUNTRIES.IE]: 100000,
  [EU_COUNTRIES.AT]: 100000,
  [EU_COUNTRIES.CH]: 100000,
  [EU_COUNTRIES.UK]: 85000,
  [EU_COUNTRIES.NO]: 50000,
  [EU_COUNTRIES.AU]: 75000,
  [EU_COUNTRIES.CA]: 30000,
  [EU_COUNTRIES.US]: 100000,
};

export function calculateVAT(salePrice: number, vatRate: number): number {
  return salePrice - (salePrice / (1 + vatRate));
}

export function isOverVATThreshold(country: EU_COUNTRIES, totalSales: number): boolean {
  return totalSales > VAT_THRESHOLDS[country];
}

export const COUNTRY_NOTES: Record<EU_COUNTRIES, string> = {
  [EU_COUNTRIES.CA]: 'GST/HST rates differ by province (5%-15%)',
  [EU_COUNTRIES.US]: 'Sales tax varies by state (0%-10%)',
  [EU_COUNTRIES.CH]: 'MwSt (VAT equivalent)',
  [EU_COUNTRIES.AU]: 'GST (Goods and Services Tax)',
};