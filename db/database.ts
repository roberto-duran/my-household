import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const expoDb = openDatabaseSync('household.db', { enableChangeListener: true });

export const db = drizzle(expoDb, { schema });

export const initializeDatabase = async () => {
  try {
    console.info('Initializing database...');

    // Create tables if they don't exist
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        due_date TEXT NOT NULL,
        is_paid INTEGER DEFAULT 0,
        is_recurring INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS budget_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        limit REAL NOT NULL,
        spent REAL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS grocery_lists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        total_cost REAL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS grocery_items (
        id TEXT PRIMARY KEY,
        list_id TEXT,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price_per_unit REAL NOT NULL,
        total_cost REAL NOT NULL,
        is_purchased INTEGER DEFAULT 0,
        store_location TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (list_id) REFERENCES grocery_lists(id) ON DELETE CASCADE
      );
    `);

    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS price_history (
        id TEXT PRIMARY KEY,
        item_id TEXT,
        price REAL NOT NULL,
        date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES grocery_items(id) ON DELETE CASCADE
      );
    `);

    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS financial_settings (
        id TEXT PRIMARY KEY,
        monthly_income REAL NOT NULL,
        savings_goal REAL NOT NULL,
        current_savings REAL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const seedDatabase = async () => {
  try {
    console.log('Seeding database...');

    // Check if financial settings exist
    const existingSettings = expoDb.getFirstSync(
      'SELECT * FROM financial_settings'
    );
    if (!existingSettings) {
      expoDb.runSync(`
        INSERT INTO financial_settings (id, monthly_income, savings_goal, current_savings)
        VALUES ('default', 4500, 800, 450)
      `);
    }

    // Check if budget categories exist
    const existingCategories = expoDb.getFirstSync(
      'SELECT * FROM budget_categories'
    );
    if (!existingCategories) {
      const categories = [
        { id: 'housing', name: 'Housing', limit: 1500, spent: 1200 },
        { id: 'utilities', name: 'Utilities', limit: 200, spent: 145 },
        { id: 'groceries', name: 'Groceries', limit: 400, spent: 280 },
        {
          id: 'transportation',
          name: 'Transportation',
          limit: 300,
          spent: 150,
        },
      ];

      for (const category of categories) {
        expoDb.runSync(
          `
          INSERT INTO budget_categories (id, name, \`limit\`, spent)
          VALUES (?, ?, ?, ?)
        `,
          [category.id, category.name, category.limit, category.spent]
        );
      }
    }

    // Check if expenses exist
    const existingExpenses = expoDb.getFirstSync('SELECT * FROM expenses');
    if (!existingExpenses) {
      const expenses = [
        {
          id: '1',
          name: 'Rent',
          amount: 1200,
          category: 'Housing',
          dueDate: '2025-01-01',
          isPaid: 1,
          isRecurring: 1,
        },
        {
          id: '2',
          name: 'Electricity',
          amount: 85,
          category: 'Utilities',
          dueDate: '2025-01-15',
          isPaid: 0,
          isRecurring: 1,
        },
        {
          id: '3',
          name: 'Internet',
          amount: 60,
          category: 'Utilities',
          dueDate: '2025-01-20',
          isPaid: 0,
          isRecurring: 1,
        },
      ];

      for (const expense of expenses) {
        expoDb.runSync(
          `
          INSERT INTO expenses (id, name, amount, category, due_date, is_paid, is_recurring)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
          [
            expense.id,
            expense.name,
            expense.amount,
            expense.category,
            expense.dueDate,
            expense.isPaid,
            expense.isRecurring,
          ]
        );
      }
    }

    // Check if grocery lists exist
    const existingLists = expoDb.getFirstSync('SELECT * FROM grocery_lists');
    if (!existingLists) {
      expoDb.runSync(`
        INSERT INTO grocery_lists (id, name, total_cost)
        VALUES ('1', 'Weekly Shopping', 127.50)
      `);

      const groceryItems = [
        {
          id: '1',
          listId: '1',
          name: 'Milk',
          quantity: 2,
          pricePerUnit: 3.99,
          totalCost: 7.98,
          isPurchased: 1,
          storeLocation: 'Walmart',
        },
        {
          id: '2',
          listId: '1',
          name: 'Bread',
          quantity: 1,
          pricePerUnit: 2.49,
          totalCost: 2.49,
          isPurchased: 0,
          storeLocation: 'Walmart',
        },
      ];

      for (const item of groceryItems) {
        expoDb.runSync(
          `
          INSERT INTO grocery_items (id, list_id, name, quantity, price_per_unit, total_cost, is_purchased, store_location)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            item.id,
            item.listId,
            item.name,
            item.quantity,
            item.pricePerUnit,
            item.totalCost,
            item.isPurchased,
            item.storeLocation,
          ]
        );

        // Add price history
        expoDb.runSync(
          `
          INSERT INTO price_history (id, item_id, price, date)
          VALUES (?, ?, ?, ?)
        `,
          [`${item.id}_history_1`, item.id, item.pricePerUnit, '2025-01-01']
        );
      }
    }

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

export * from './schema';
