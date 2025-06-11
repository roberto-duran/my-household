import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { initializeDatabase, seedDatabase } from '@/db/database';
import { initializeWebDatabase } from '@/db/database-web';
import {
  expenseService,
  budgetCategoryService,
  groceryListService,
  groceryItemService,
  financialSettingsService,
} from '@/db/services';
import {
  webExpenseService,
  webBudgetCategoryService,
  webGroceryListService,
  webGroceryItemService,
  webFinancialSettingsService,
} from '@/db/services-web';
import type {
  Expense,
  BudgetCategory,
  GroceryList,
  GroceryItem,
  FinancialSettings,
} from '@/db/schema';

const isWeb = Platform.OS === 'web';

// Platform-aware service selection
const getExpenseService = () => isWeb ? webExpenseService : expenseService;
const getBudgetCategoryService = () => isWeb ? webBudgetCategoryService : budgetCategoryService;
const getGroceryListService = () => isWeb ? webGroceryListService : groceryListService;
const getGroceryItemService = () => isWeb ? webGroceryItemService : groceryItemService;
const getFinancialSettingsService = () => isWeb ? webFinancialSettingsService : financialSettingsService;

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
      console.log('🔄 Loading data from database...');
      setIsLoading(true);
      
      const [expensesData, categoriesData, listsData, settingsData] = await Promise.all([
        getExpenseService().getAll(),
        getBudgetCategoryService().getAll(),
        getGroceryListService().getAll(),
        getFinancialSettingsService().getOrCreate(),
      ]);
      
      console.log('📊 Data loaded:', {
        expenses: expensesData.length,
        categories: categoriesData.length,
        lists: listsData.length,
        settings: !!settingsData
      });
      
      setExpenses(expensesData);
      setBudgetCategories(categoriesData);
      setGroceryLists(listsData);
      setFinancialSettings(settingsData as FinancialSettings);
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initDbAndLoadData = async () => {
    try {
      if (isWeb) {
        console.log('🌐 Initializing web database (IndexedDB)...');
        await initializeWebDatabase();
      } else {
        console.log('📱 Initializing native database (SQLite)...');
        await initializeDatabase();
        await seedDatabase();
      }
      console.log('✅ Database ready, loading data...');
      await loadData();
    } catch (error) {
      console.error('❌ Error initializing database:', error);
    }
  };

  useEffect(() => {
    initDbAndLoadData();
  }, []);

  // Expense methods
  const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('💰 Adding expense:', expense);
    try {
      await getExpenseService().create(expense);
      console.log('✅ Expense added successfully');
      await loadData();
    } catch (error) {
      console.error('❌ Error adding expense:', error);
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    console.log('📝 Updating expense:', id, updates);
    try {
      await getExpenseService().update(id, updates);
      console.log('✅ Expense updated successfully');
      await loadData();
    } catch (error) {
      console.error('❌ Error updating expense:', error);
    }
  };

  const deleteExpense = async (id: string) => {
    console.log('🗑️ Deleting expense:', id);
    try {
      await getExpenseService().delete(id);
      console.log('✅ Expense deleted successfully');
      await loadData();
    } catch (error) {
      console.error('❌ Error deleting expense:', error);
    }
  };

  // Budget category methods
  const addBudgetCategory = async (category: Omit<BudgetCategory, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('📊 Adding budget category:', category);
    try {
      await getBudgetCategoryService().create(category);
      console.log('✅ Budget category added successfully');
      await loadData();
    } catch (error) {
      console.error('❌ Error adding budget category:', error);
    }
  };

  const updateBudgetCategory = async (id: string, updates: Partial<BudgetCategory>) => {
    console.log('📝 Updating budget category:', id, updates);
    try {
      await getBudgetCategoryService().update(id, updates);
      console.log('✅ Budget category updated successfully');
      await loadData();
    } catch (error) {
      console.error('❌ Error updating budget category:', error);
    }
  };

  const deleteBudgetCategory = async (id: string) => {
    console.log('🗑️ Deleting budget category:', id);
    try {
      await getBudgetCategoryService().delete(id);
      console.log('✅ Budget category deleted successfully');
      await loadData();
    } catch (error) {
      console.error('❌ Error deleting budget category:', error);
    }
  };

  // Grocery list methods
  const addGroceryList = async (list: Omit<GroceryList, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('🛒 Adding grocery list:', list);
    try {
      await getGroceryListService().create(list);
      console.log('✅ Grocery list added successfully');
      await loadData();
    } catch (error) {
      console.error('❌ Error adding grocery list:', error);
    }
  };

  const updateGroceryList = async (id: string, updates: Partial<GroceryList>) => {
    console.log('📝 Updating grocery list:', id, updates);
    try {
      await getGroceryListService().update(id, updates);
      console.log('✅ Grocery list updated successfully');
      await loadData();
    } catch (error) {
      console.error('❌ Error updating grocery list:', error);
    }
  };

  const deleteGroceryList = async (id: string) => {
    console.log('🗑️ Deleting grocery list:', id);
    try {
      await getGroceryListService().delete(id);
      console.log('✅ Grocery list deleted successfully');
      await loadData();
    } catch (error) {
      console.error('❌ Error deleting grocery list:', error);
    }
  };

  // Grocery item methods
  const addGroceryItem = async (item: Omit<GroceryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('🥕 Adding grocery item:', item);
    try {
      await getGroceryItemService().create(item);
      console.log('✅ Grocery item added successfully');
      await loadData();
    } catch (error) {
      console.error('❌ Error adding grocery item:', error);
    }
  };

  const updateGroceryItem = async (id: string, updates: Partial<GroceryItem>) => {
    console.log('📝 Updating grocery item:', id, updates);
    try {
      await getGroceryItemService().update(id, updates);
      console.log('✅ Grocery item updated successfully');
      await loadData();
    } catch (error) {
      console.error('❌ Error updating grocery item:', error);
    }
  };

  const deleteGroceryItem = async (id: string) => {
    console.log('🗑️ Deleting grocery item:', id);
    try {
      await getGroceryItemService().delete(id);
      console.log('✅ Grocery item deleted successfully');
      await loadData();
    } catch (error) {
      console.error('❌ Error deleting grocery item:', error);
    }
  };

  const toggleGroceryItemPurchased = async (id: string) => {
    console.log('✅ Toggling grocery item purchased:', id);
    try {
      await getGroceryItemService().togglePurchased(id);
      console.log('✅ Grocery item toggled successfully');
      await loadData();
    } catch (error) {
      console.error('❌ Error toggling grocery item:', error);
    }
  };

  // Financial settings methods
  const updateFinancialSettings = async (updates: Partial<FinancialSettings>) => {
    console.log('💼 Updating financial settings:', updates);
    try {
      await getFinancialSettingsService().update(updates);
      console.log('✅ Financial settings updated successfully');
      await loadData();
    } catch (error) {
      console.error('❌ Error updating financial settings:', error);
    }
  };

  // Analytics methods
  const getTotalMonthlyExpenses = async () => {
    try {
      return await getExpenseService().getTotalMonthlyExpenses();
    } catch (error) {
      console.error('❌ Error getting total monthly expenses:', error);
      return 0;
    }
  };

  const getRemainingBudget = () => {
    if (!financialSettings) return 0;
    const totalSpent = budgetCategories.reduce((sum, cat) => sum + (cat.spent || 0), 0);
    const totalLimit = budgetCategories.reduce((sum, cat) => sum + cat.limit, 0);
    return totalLimit - totalSpent;
  };

  const getSavingsProgress = () => {
    if (!financialSettings) return 0;
    return ((financialSettings.currentSavings || 0) / financialSettings.savingsGoal) * 100;
  };

  const refreshData = async () => {
    console.log('🔄 Refreshing data...');
    await loadData();
  };

  return (
    <DatabaseContext.Provider
      value={{
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
      }}
    >
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