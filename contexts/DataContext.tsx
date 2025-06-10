import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  dueDate: string;
  isPaid: boolean;
  isRecurring: boolean;
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  totalCost: number;
  isPurchased: boolean;
  storeLocation: string;
  priceHistory: { date: string; price: number }[];
}

export interface GroceryList {
  id: string;
  name: string;
  items: GroceryItem[];
  totalCost: number;
  createdDate: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  limit: number;
  spent: number;
}

export interface FinancialData {
  monthlyIncome: number;
  savingsGoal: number;
  currentSavings: number;
  budgetCategories: BudgetCategory[];
}

interface DataContextType {
  expenses: Expense[];
  groceryLists: GroceryList[];
  financialData: FinancialData;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addGroceryList: (list: Omit<GroceryList, 'id'>) => void;
  updateGroceryList: (id: string, updates: Partial<GroceryList>) => void;
  deleteGroceryList: (id: string) => void;
  updateFinancialData: (data: Partial<FinancialData>) => void;
  getTotalMonthlyExpenses: () => number;
  getRemainingBudget: () => number;
  getSavingsProgress: () => number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: '1',
      name: 'Rent',
      amount: 1200,
      category: 'Housing',
      dueDate: '2025-01-01',
      isPaid: true,
      isRecurring: true,
    },
    {
      id: '2',
      name: 'Electricity',
      amount: 85,
      category: 'Utilities',
      dueDate: '2025-01-15',
      isPaid: false,
      isRecurring: true,
    },
    {
      id: '3',
      name: 'Internet',
      amount: 60,
      category: 'Utilities',
      dueDate: '2025-01-20',
      isPaid: false,
      isRecurring: true,
    },
  ]);

  const [groceryLists, setGroceryLists] = useState<GroceryList[]>([
    {
      id: '1',
      name: 'Weekly Shopping',
      createdDate: '2025-01-01',
      totalCost: 127.50,
      items: [
        {
          id: '1',
          name: 'Milk',
          quantity: 2,
          pricePerUnit: 3.99,
          totalCost: 7.98,
          isPurchased: true,
          storeLocation: 'Walmart',
          priceHistory: [{ date: '2025-01-01', price: 3.99 }],
        },
        {
          id: '2',
          name: 'Bread',
          quantity: 1,
          pricePerUnit: 2.49,
          totalCost: 2.49,
          isPurchased: false,
          storeLocation: 'Walmart',
          priceHistory: [{ date: '2025-01-01', price: 2.49 }],
        },
      ],
    },
  ]);

  const [financialData, setFinancialData] = useState<FinancialData>({
    monthlyIncome: 4500,
    savingsGoal: 800,
    currentSavings: 450,
    budgetCategories: [
      { id: '1', name: 'Housing', limit: 1500, spent: 1200 },
      { id: '2', name: 'Utilities', limit: 200, spent: 145 },
      { id: '3', name: 'Groceries', limit: 400, spent: 280 },
      { id: '4', name: 'Transportation', limit: 300, spent: 150 },
    ],
  });

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = {
      ...expense,
      id: Date.now().toString(),
    };
    setExpenses([...expenses, newExpense]);
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses(expenses.map(expense => 
      expense.id === id ? { ...expense, ...updates } : expense
    ));
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
  };

  const addGroceryList = (list: Omit<GroceryList, 'id'>) => {
    const newList = {
      ...list,
      id: Date.now().toString(),
    };
    setGroceryLists([...groceryLists, newList]);
  };

  const updateGroceryList = (id: string, updates: Partial<GroceryList>) => {
    setGroceryLists(groceryLists.map(list => 
      list.id === id ? { ...list, ...updates } : list
    ));
  };

  const deleteGroceryList = (id: string) => {
    setGroceryLists(groceryLists.filter(list => list.id !== id));
  };

  const updateFinancialData = (data: Partial<FinancialData>) => {
    setFinancialData({ ...financialData, ...data });
  };

  const getTotalMonthlyExpenses = () => {
    return expenses.reduce((total, expense) => {
      return expense.isRecurring ? total + expense.amount : total;
    }, 0);
  };

  const getRemainingBudget = () => {
    const totalExpenses = getTotalMonthlyExpenses();
    return financialData.monthlyIncome - totalExpenses - financialData.savingsGoal;
  };

  const getSavingsProgress = () => {
    return (financialData.currentSavings / financialData.savingsGoal) * 100;
  };

  return (
    <DataContext.Provider value={{
      expenses,
      groceryLists,
      financialData,
      addExpense,
      updateExpense,
      deleteExpense,
      addGroceryList,
      updateGroceryList,
      deleteGroceryList,
      updateFinancialData,
      getTotalMonthlyExpenses,
      getRemainingBudget,
      getSavingsProgress,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}