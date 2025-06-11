// Simple web-compatible database using IndexedDB
import type {
  Expense,
  BudgetCategory,
  GroceryList,
  GroceryItem,
  PriceHistory,
  FinancialSettings,
  NewExpense,
  NewBudgetCategory,
  NewGroceryList,
  NewGroceryItem,
  NewPriceHistory,
  NewFinancialSettings,
} from './schema';

const DB_NAME = 'HouseholdDB';
const DB_VERSION = 1;

const STORES = {
  expenses: 'expenses',
  budgetCategories: 'budgetCategories',
  groceryLists: 'groceryLists',
  groceryItems: 'groceryItems',
  priceHistory: 'priceHistory',
  financialSettings: 'financialSettings',
};

class WebDatabase {
  private db: IDBDatabase | null = null;

  async init() {
    if (this.db) return this.db;

    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = () => {
        const db = request.result;

        // Create object stores
        if (!db.objectStoreNames.contains(STORES.expenses)) {
          db.createObjectStore(STORES.expenses, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.budgetCategories)) {
          db.createObjectStore(STORES.budgetCategories, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.groceryLists)) {
          db.createObjectStore(STORES.groceryLists, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.groceryItems)) {
          db.createObjectStore(STORES.groceryItems, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.priceHistory)) {
          db.createObjectStore(STORES.priceHistory, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.financialSettings)) {
          db.createObjectStore(STORES.financialSettings, { keyPath: 'id' });
        }
      };
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async get<T>(storeName: string, id: string): Promise<T | null> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async put<T>(storeName: string, data: T): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async filter<T>(
    storeName: string,
    predicate: (item: T) => boolean
  ): Promise<T[]> {
    const items = await this.getAll<T>(storeName);
    return items.filter(predicate);
  }
}

export const webDb = new WebDatabase();

export const initializeWebDatabase = async () => {
  console.log('🌐 Initializing web database (IndexedDB)...');
  await webDb.init();
  await seedWebDatabase();
  console.log('✅ Web database initialized');
};

const seedWebDatabase = async () => {
  console.log('🌱 Seeding web database...');

  // Check if data already exists
  const existingSettings = await webDb.getAll<FinancialSettings>(
    STORES.financialSettings
  );
  if (existingSettings.length > 0) {
    console.log('📊 Database already seeded');
    return;
  }

  // Seed financial settings
  await webDb.put<FinancialSettings>(STORES.financialSettings, {
    id: 'default',
    monthlyIncome: 4500,
    savingsGoal: 800,
    currentSavings: 450,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Seed budget categories
  const categories: BudgetCategory[] = [
    {
      id: 'housing',
      name: 'Housing',
      limit: 1500,
      spent: 1200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'utilities',
      name: 'Utilities',
      limit: 200,
      spent: 145,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'groceries',
      name: 'Groceries',
      limit: 400,
      spent: 280,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'transportation',
      name: 'Transportation',
      limit: 300,
      spent: 150,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const category of categories) {
    await webDb.put<BudgetCategory>(STORES.budgetCategories, category);
  }

  // Seed expenses
  const expenses: Expense[] = [
    {
      id: '1',
      name: 'Rent',
      amount: 1200,
      category: 'Housing',
      dueDate: '2025-01-01',
      isPaid: true,
      isRecurring: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Electricity',
      amount: 85,
      category: 'Utilities',
      dueDate: '2025-01-15',
      isPaid: false,
      isRecurring: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Internet',
      amount: 60,
      category: 'Utilities',
      dueDate: '2025-01-20',
      isPaid: false,
      isRecurring: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const expense of expenses) {
    await webDb.put<Expense>(STORES.expenses, expense);
  }

  // Seed grocery list
  const groceryList: GroceryList = {
    id: '1',
    name: 'Weekly Shopping',
    totalCost: 127.5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await webDb.put<GroceryList>(STORES.groceryLists, groceryList);

  // Seed grocery items
  const groceryItems: GroceryItem[] = [
    {
      id: '1',
      listId: '1',
      name: 'Milk',
      quantity: 2,
      pricePerUnit: 3.99,
      totalCost: 7.98,
      isPurchased: true,
      storeLocation: 'Walmart',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      listId: '1',
      name: 'Bread',
      quantity: 1,
      pricePerUnit: 2.49,
      totalCost: 2.49,
      isPurchased: false,
      storeLocation: 'Walmart',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const item of groceryItems) {
    await webDb.put<GroceryItem>(STORES.groceryItems, item);
  }

  console.log('✅ Web database seeded');
};

// Export the store names for use in services
export { STORES };
