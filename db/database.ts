import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync, openDatabaseAsync } from 'expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { eq } from 'drizzle-orm';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as schema from './schema';
import migrations from './migrations/migrations';

const isWeb = Platform.OS === 'web';

let db: ReturnType<typeof drizzle>;

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`;
};

const initDb = async () => {
  if (db) return db;

  // Log database path for debugging
  if (!isWeb) {
    const dbPath = `${FileSystem.documentDirectory}SQLite/household.db`;
    console.log('📂 SQLite database location:', dbPath);
    console.log('💡 You can open this file in TablePlus or any SQLite browser');
  }

  const expoDb = isWeb
    ? await openDatabaseAsync('household.db')
    : openDatabaseSync('household.db', { enableChangeListener: true });

  db = drizzle(expoDb, { schema });
  return db;
};

export const getDb = async () => {
  if (!db) {
    await initDb();
  }
  return db;
};

export const resetDatabase = async () => {
  try {
    console.log('🔄 Resetting database...');
    const database = await getDb();

    // Drop all tables
    await database.run(`DROP TABLE IF EXISTS monthly_savings;`);
    await database.run(`DROP TABLE IF EXISTS price_history;`);
    await database.run(`DROP TABLE IF EXISTS grocery_items;`);
    await database.run(`DROP TABLE IF EXISTS grocery_lists;`);
    await database.run(`DROP TABLE IF EXISTS expenses;`);
    await database.run(`DROP TABLE IF EXISTS budget_categories;`);
    await database.run(`DROP TABLE IF EXISTS financial_settings;`);

    console.log('✅ Database reset complete');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
};

export const initializeDatabase = async () => {
  try {
    console.info('Initializing database with migrations...');
    const database = await getDb();
    await migrate(database, migrations);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    // If migration fails, try resetting and re-running
    console.log('🔄 Migration failed, attempting database reset...');
    await resetDatabase();
    const database = await getDb();
    await migrate(database, migrations);
    console.log('Database initialized successfully after reset');
  }
};

export const seedDatabase = async () => {
  try {
    console.log('Seeding database...');
    const database = await getDb();
    const currentMonth = getCurrentMonth();

    // Check if financial settings exist
    const existingSettings = await database
      .select()
      .from(schema.financialSettings)
      .limit(1);
    if (existingSettings.length === 0) {
      await database.insert(schema.financialSettings).values({
        id: 'default',
        monthlyIncome: 4500,
        savingsGoal: 800,
        currentSavings: 450,
      });
    }

    // Check if budget categories exist
    const existingCategories = await database
      .select()
      .from(schema.budgetCategories)
      .limit(1);
    if (existingCategories.length === 0) {
      const categories = [
        {
          id: 'housing_' + currentMonth,
          name: 'Housing',
          limit: 1500,
          spent: 1200,
          month: currentMonth,
        },
        {
          id: 'utilities_' + currentMonth,
          name: 'Utilities',
          limit: 200,
          spent: 145,
          month: currentMonth,
        },
        {
          id: 'groceries_' + currentMonth,
          name: 'Groceries',
          limit: 400,
          spent: 280,
          month: currentMonth,
        },
        {
          id: 'transportation_' + currentMonth,
          name: 'Transportation',
          limit: 300,
          spent: 150,
          month: currentMonth,
        },
      ];

      await database.insert(schema.budgetCategories).values(categories);
    }

    // Check if expenses exist
    const existingExpenses = await database
      .select()
      .from(schema.expenses)
      .limit(1);
    if (existingExpenses.length === 0) {
      const expensesData = [
        {
          id: '1',
          name: 'Rent',
          amount: 1200,
          category: 'Housing',
          dueDate: '2025-01-01',
          month: currentMonth,
          chargeDay: 1,
          isPaid: true,
          isRecurring: true,
        },
        {
          id: '2',
          name: 'Electricity',
          amount: 85,
          category: 'Utilities',
          dueDate: '2025-01-15',
          month: currentMonth,
          chargeDay: 15,
          isPaid: false,
          isRecurring: true,
        },
        {
          id: '3',
          name: 'Internet',
          amount: 60,
          category: 'Utilities',
          dueDate: '2025-01-20',
          month: currentMonth,
          chargeDay: 20,
          isPaid: false,
          isRecurring: true,
        },
      ];

      await database.insert(schema.expenses).values(expensesData);
    }

    // Check if grocery lists exist
    const existingLists = await database
      .select()
      .from(schema.groceryLists)
      .limit(1);
    if (existingLists.length === 0) {
      await database.insert(schema.groceryLists).values({
        id: '1',
        name: 'Weekly Shopping',
        totalCost: 127.5,
      });

      const groceryItemsData = [
        {
          id: '1',
          listId: '1',
          name: 'Milk',
          quantity: 2,
          pricePerUnit: 3.99,
          totalCost: 7.98,
          isPurchased: true,
          storeLocation: 'Walmart',
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
        },
      ];

      await database.insert(schema.groceryItems).values(groceryItemsData);

      // Add price history
      const priceHistoryData = [
        {
          id: '1_history_1',
          itemId: '1',
          price: 3.99,
          date: '2025-01-01',
        },
        {
          id: '2_history_1',
          itemId: '2',
          price: 2.49,
          date: '2025-01-01',
        },
      ];

      await database.insert(schema.priceHistory).values(priceHistoryData);
    }

    // Create initial monthly savings record
    const existingMonthlySavings = await database
      .select()
      .from(schema.monthlySavings)
      .limit(1);
    if (existingMonthlySavings.length === 0) {
      await database.insert(schema.monthlySavings).values({
        id: currentMonth + '_savings',
        month: currentMonth,
        income: 4500,
        totalExpenses: 1345,
        totalSaved: 3155,
        savingsGoal: 800,
      });
    }

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

export * from './schema';
