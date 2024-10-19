import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Balance {
  [key: string]: number;
}

interface BalanceContextType {
  balances: Balance;
  updateBalances: (expense: { amount: number; paidBy: string; sharedWith?: string[] }, isDeleting?: boolean) => void;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export const useBalances = () => {
  const context = useContext(BalanceContext);
  if (!context) {
    throw new Error('useBalances must be used within a BalanceProvider');
  }
  return context;
};

export const BalanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [balances, setBalances] = useState<Balance>({});

  const updateBalances = (expense: { amount: number; paidBy: string; sharedWith?: string[] }, isDeleting: boolean = false) => {
    const { amount, paidBy, sharedWith } = expense;
    const multiplier = isDeleting ? -1 : 1;

    setBalances(prevBalances => {
      const newBalances = { ...prevBalances };
      
      if (sharedWith && sharedWith.length > 0) {
        const sharedAmount = amount / (sharedWith.length + 1);
        newBalances[paidBy] = (newBalances[paidBy] || 0) + multiplier * (amount - sharedAmount);
        sharedWith.forEach(user => {
          newBalances[user] = (newBalances[user] || 0) - multiplier * sharedAmount;
        });
      } else {
        newBalances[paidBy] = (newBalances[paidBy] || 0) + multiplier * amount;
      }

      return newBalances;
    });
  };

  return (
    <BalanceContext.Provider value={{ balances, updateBalances }}>
      {children}
    </BalanceContext.Provider>
  );
};