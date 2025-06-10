// Web fallback using localStorage
import * as schema from './schema';

const STORAGE_KEYS = {
  expenses: 'household_expenses',
  budgetCategories: 'household_budget_categories',
  groceryLists: 'household_grocery_lists',
  financialSettings: 'household_financial_settings',
};

// Mock database for web
export const webDb = {
  expenses: {
    getAll: () =>
      JSON.parse(localStorage.getItem(STORAGE_KEYS.expenses) || '[]'),
    create: (expense: any) => {
      const expenses = webDb.expenses.getAll();
      const newExpense = { ...expense, id: Date.now().toString() };
      expenses.push(newExpense);
      localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses));
      return newExpense;
    },
    update: (id: string, updates: any) => {
      const expenses = webDb.expenses.getAll();
      const index = expenses.findIndex((e: any) => e.id === id);
      if (index !== -1) {
        expenses[index] = { ...expenses[index], ...updates };
        localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses));
      }
    },
    delete: (id: string) => {
      const expenses = webDb.expenses.getAll();
      const filtered = expenses.filter((e: any) => e.id !== id);
      localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(filtered));
    },
  },
};

export const initializeWebDatabase = () => {
  // Initialize with demo data if empty
  if (!localStorage.getItem(STORAGE_KEYS.expenses)) {
    const demoData = [
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
    ];
    localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(demoData));
  }
};

export const isWeb = typeof window !== 'undefined' && window.localStorage;
