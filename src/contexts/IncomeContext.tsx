import React, { createContext, useContext, useState, ReactNode } from 'react';
import { EU_COUNTRIES, ProductType } from '../utils/euVatUtils';

interface Income {
  id: number;
  date: Date;
  product: string;
  productType: ProductType;
  quantity: number;
  costPrice: number;
  salePrice: number;
  adSpend: number;
  addedBy: string;
  customerCountry: EU_COUNTRIES;
  vatRate: number;
}

interface IncomeContextType {
  incomes: Income[];
  addIncome: (income: Income) => void;
  deleteIncome: (id: number) => void;
  updateIncome: (income: Income) => void;
}

const IncomeContext = createContext<IncomeContextType | undefined>(undefined);

export const useIncomes = () => {
  const context = useContext(IncomeContext);
  if (!context) {
    throw new Error('useIncomes must be used within an IncomeProvider');
  }
  return context;
};

export const IncomeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [incomes, setIncomes] = useState<Income[]>([]);

  const addIncome = (income: Income) => {
    setIncomes(prevIncomes => [...prevIncomes, income]);
  };

  const deleteIncome = (id: number) => {
    setIncomes(prevIncomes => prevIncomes.filter(income => income.id !== id));
  };

  const updateIncome = (updatedIncome: Income) => {
    setIncomes(prevIncomes => prevIncomes.map(income => 
      income.id === updatedIncome.id ? updatedIncome : income
    ));
  };

  return (
    <IncomeContext.Provider value={{ incomes, addIncome, deleteIncome, updateIncome }}>
      {children}
    </IncomeContext.Provider>
  );
};