import React, { createContext, useContext, useState, useEffect } from 'react';
import { currencies, convertCurrency } from '../utils/currencyUtils';

interface CurrencyContextType {
  currency: string;
  changeCurrency: (newCurrency: string) => void;
  convertAmount: (amount: number, fromCurrency: string) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState('EUR');

  useEffect(() => {
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency && currencies.includes(savedCurrency)) {
      setCurrency(savedCurrency);
    }
  }, []);

  const changeCurrency = (newCurrency: string) => {
    setCurrency(newCurrency);
    localStorage.setItem('preferredCurrency', newCurrency);
  };

  const convertAmount = (amount: number, fromCurrency: string) => {
    return convertCurrency(amount, fromCurrency, currency);
  };

  return (
    <CurrencyContext.Provider value={{ currency, changeCurrency, convertAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
};