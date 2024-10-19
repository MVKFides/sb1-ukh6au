import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Expense {
  id: number;
  date: Date;
  category: string;
  amount: number;
  paidBy: string;
  description: string;
  isShared: boolean;
  sharedWith: string[];
  taxRelevant: boolean;
  proofFile?: File;
  proofUrl?: string;
  isRecurring: boolean;  // New field for recurring expenses
}

interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Expense) => void;
  deleteExpense: (id: number) => void;
  updateExpense: (expense: Expense) => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};

export const ExpenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const addExpense = (expense: Expense) => {
    setExpenses(prevExpenses => [...prevExpenses, expense]);
  };

  const deleteExpense = (id: number) => {
    setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));
  };

  const updateExpense = (updatedExpense: Expense) => {
    setExpenses(prevExpenses => prevExpenses.map(expense => 
      expense.id === updatedExpense.id ? updatedExpense : expense
    ));
  };

  return (
    <ExpenseContext.Provider value={{ expenses, addExpense, deleteExpense, updateExpense }}>
      {children}
    </ExpenseContext.Provider>
  );
};