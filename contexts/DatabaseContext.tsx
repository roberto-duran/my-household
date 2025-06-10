import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeDatabase, seedDatabase } from '@/db/database';
import {
  expenseService,
  budgetCategoryService,
  groceryListService,
  groceryItemService,
  financialSettingsService,
} from '@/db/services';
import type {
  Expense,
  BudgetCategory,
  GroceryList,
  GroceryItem,
  FinancialSettings,
} from '@/db/schema';

interface DatabaseContextType {
  // Data
  expenses: Expense[];
  budgetCategories: BudgetCategory[];
  groceryLists: (GroceryList & { items: (GroceryItem & { priceHistory: any[] })[] })[];
  financialSettings: FinancialSettings | null;
  
  // Loading state
  isLoading: boolean;
  
  // Expense methods
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Budget category methods
  addBudgetCategory: (category: Omit<BudgetCategory, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBudgetCategory: (id: string, updates: Partial<BudgetCategory>) => Promise<void>;
  deleteBudgetCategory: (id: string) => Promise<void>;
  
  // Grocery list methods
  addGroceryList: (list: Omit<GroceryList, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateGroceryList: (id: string, updates: Partial<GroceryList>) => Promise<void>;
  deleteGroceryList: (id: string) => Promise<void>;
  
  // Grocery item methods
  addGroceryItem: (item: Omit<GroceryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateGroceryItem: (id: string, updates: Partial<GroceryItem>) => Promise<void>;
  deleteGroceryItem: (id: string) => Promise<void>;
  toggleGroceryItemPurchased: (id: string) => Promise<void>;
  
  // Financial settings methods
  updateFinancialSettings: (updates: Partial<FinancialSettings>) => Promise<void>;
  
  // Analytics methods
  getTotalMonthlyExpenses: () => Promise<number>;
  getRemainingBudget: () => number;
  getSavingsProgress: () => number;
  
  // Refresh data
  refreshData: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [groceryLists, setGroceryLists] = useState<(GroceryList & { items: (GroceryItem & { priceHistory: any[] })[] })[]>([]);
  const [financialSettings, setFinancialSettings] = useState<FinancialSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [expensesData, categoriesData, listsData, settingsData] = await Promise.all([
        expenseService.getAll(),
        budgetCategoryService.getAll(),
        groceryListService.getAll(),
        financialSettingsService.getOrCreate(),
      ]);
      
      setExpenses(expensesData);
      setBudgetCategories(categoriesData);
      setGroceryLists(listsData);
      setFinancialSettings(settingsData as FinancialSettings);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initDatabase = async () => {
    try {
      await initializeDatabase();
      await seedDatabase();
      await loadData();
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  };

  useEffect(() => {
    initDatabase();
  }, []);

  // Expense methods
  const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    await expenseService.create(expense);
    await loadData();
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    await expenseService.update(id, updates);
    await loadData();
  };

  const deleteExpense = async (id: string) => {
    await expenseService.delete(id);
    await loadData();
  };

  // Budget category methods
  const addBudgetCategory = async (category: Omit<BudgetCategory, 'id' | 'createdAt' | 'updatedAt'>) => {
    await budgetCategoryService.create(category);
    await loadData();
  };

  const updateBudgetCategory = async (id: string, updates: Partial<BudgetCategory>) => {
    await budgetCategoryService.update(id, updates);
    await loadData();
  };

  const deleteBudgetCategory = async (id: string) => {
    await budgetCategoryService.delete(id);
    await loadData();
  };

  // Grocery list methods
  const addGroceryList = async (list: Omit<GroceryList, 'id' | 'createdAt' | 'updatedAt'>) => {
    await groceryListService.create(list);
    await loadData();
  };

  const updateGroceryList = async (id: string, updates: Partial<GroceryList>) => {
    await groceryListService.update(id, updates);
    await loadData();
  };

  const deleteGroceryList = async (id: string) => {
    await groceryListService.delete(id);
    await loadData();
  };

  // Grocery item methods
  const addGroceryItem = async (item: Omit<GroceryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    await groceryItemService.create(item);
    await loadData();
  };

  const updateGroceryItem = async (id: string, updates: Partial<GroceryItem>) => {
    await groceryItemService.update(id, updates);
    await loadData();
  };

  const deleteGroceryItem = async (id: string) => {
    await groceryItemService.delete(id);
    await loadData();
  };

  const toggleGroceryItemPurchased = async (id: string) => {
    await groceryItemService.togglePurchased(id);
    await loadData();
  };

  // Financial settings methods
  const updateFinancialSettings = async (updates: Partial<FinancialSettings>) => {
    await financialSettingsService.update(updates);
    await loadData();
  };

  // Analytics methods
  const getTotalMonthlyExpenses = async () => {
    return await expenseService.getTotalMonthlyExpenses();
  };

  const getRemainingBudget = () => {
    if (!financialSettings) return 0;
    const totalExpenses = expenses
      .filter(expense => expense.isRecurring)
      .reduce((sum, expense) => sum + expense.amount, 0);
    return financialSettings.monthlyIncome - totalExpenses - financialSettings.savingsGoal;
  };

  const getSavingsProgress = () => {
    if (!financialSettings || financialSettings.savingsGoal === 0) return 0;
    return ((financialSettings.currentSavings || 0) / financialSettings.savingsGoal) * 100;
  };

  const refreshData = async () => {
    await loadData();
  };

  const value: DatabaseContextType = {
    expenses,
    budgetCategories,
    groceryLists,
    financialSettings,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    addBudgetCategory,
    updateBudgetCategory,
    deleteBudgetCategory,
    addGroceryList,
    updateGroceryList,
    deleteGroceryList,
    addGroceryItem,
    updateGroceryItem,
    deleteGroceryItem,
    toggleGroceryItemPurchased,
    updateFinancialSettings,
    getTotalMonthlyExpenses,
    getRemainingBudget,
    getSavingsProgress,
    refreshData,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}

// Helper hook for backward compatibility with existing DataContext usage
export function useDatabaseLegacy() {
  const db = useDatabase();
  
  return {
    expenses: db.expenses,
    groceryLists: db.groceryLists,
    financialData: {
      monthlyIncome: db.financialSettings?.monthlyIncome || 0,
      savingsGoal: db.financialSettings?.savingsGoal || 0,
      currentSavings: db.financialSettings?.currentSavings || 0,
      budgetCategories: db.budgetCategories,
    },
    addExpense: db.addExpense,
    updateExpense: db.updateExpense,
    deleteExpense: db.deleteExpense,
    addGroceryList: db.addGroceryList,
    updateGroceryList: db.updateGroceryList,
    deleteGroceryList: db.deleteGroceryList,
    updateFinancialData: async (data: any) => {
      await db.updateFinancialSettings(data);
    },
    getTotalMonthlyExpenses: async () => {
      return await db.getTotalMonthlyExpenses();
    },
    getRemainingBudget: db.getRemainingBudget,
    getSavingsProgress: db.getSavingsProgress,
  };
} 