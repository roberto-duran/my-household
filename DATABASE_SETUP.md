# Household App - Drizzle Database Setup

This document explains the Drizzle ORM integration in your household financial management app.

## Database Schema

The app uses SQLite with Drizzle ORM for data persistence. The schema includes:

### Tables

1. **expenses** - Tracks income and expenses

   - `id`, `name`, `amount`, `category`, `dueDate`, `isPaid`, `isRecurring`

2. **budget_categories** - Budget categories with limits and spent amounts

   - `id`, `name`, `limit`, `spent`

3. **grocery_lists** - Shopping lists

   - `id`, `name`, `totalCost`

4. **grocery_items** - Items within grocery lists

   - `id`, `listId`, `name`, `quantity`, `pricePerUnit`, `totalCost`, `isPurchased`, `storeLocation`

5. **price_history** - Track price changes for grocery items

   - `id`, `itemId`, `price`, `date`

6. **financial_settings** - Global financial settings
   - `id`, `monthlyIncome`, `savingsGoal`, `currentSavings`

## Usage

### Database Context

The app provides `DatabaseProvider` and `useDatabase()` hook for accessing data:

```tsx
import { DatabaseProvider, useDatabase } from '@/contexts/DatabaseContext';

// Wrap your app
<DatabaseProvider>
  <YourComponent />
</DatabaseProvider>;

// In your component
const { expenses, addExpense, updateExpense, deleteExpense } = useDatabase();
```

### Service Layer

Direct database operations are available through service functions:

```tsx
import { expenseService } from '@/db/services';

// Get all expenses
const expenses = await expenseService.getAll();

// Create new expense
const newExpense = await expenseService.create({
  name: 'Rent',
  amount: 1200,
  category: 'Housing',
  dueDate: '2025-02-01',
  isPaid: false,
  isRecurring: true,
});
```

### Migration from DataContext

For backward compatibility, use `useDatabaseLegacy()`:

```tsx
// Replace DataProvider with DatabaseProvider
// Replace useData() with useDatabaseLegacy()
const data = useDatabaseLegacy(); // Same interface as old useData()
```

## Key Features

1. **Type Safety** - Full TypeScript support with inferred types
2. **Relations** - Proper foreign key relationships
3. **Automatic Calculations** - Total costs, remaining budgets, etc.
4. **Data Persistence** - SQLite storage with expo-sqlite
5. **Seeding** - Automatic initial data population

## Commands

```bash
# Generate migrations (if schema changes)
npm run db:generate
```

**Note**: Expo SQLite doesn't support the `drizzle-kit migrate` command. Instead, migrations are handled manually in the `initializeDatabase()` function in `db/database.ts`.

### Schema Changes

When you modify the schema:

1. Update `db/schema.ts` with your changes
2. Optionally run `npm run db:generate` to generate migration files (for reference)
3. Manually update the SQL in `initializeDatabase()` function in `db/database.ts`
4. Consider adding version checks or `ALTER TABLE` statements for existing users

Example of handling schema changes:

```typescript
// In db/database.ts
export const initializeDatabase = async () => {
  try {
    // Check database version
    const version = expoDb.getFirstSync('PRAGMA user_version') as {
      user_version: number;
    } | null;
    const currentVersion = version?.user_version || 0;

    if (currentVersion < 1) {
      // Create initial tables
      expoDb.execSync(`CREATE TABLE IF NOT EXISTS expenses (...);`);
      expoDb.execSync('PRAGMA user_version = 1');
    }

    if (currentVersion < 2) {
      // Add new column or table for version 2
      expoDb.execSync(`ALTER TABLE expenses ADD COLUMN new_field TEXT;`);
      expoDb.execSync('PRAGMA user_version = 2');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};
```

## Files Structure

```
db/
├── schema.ts        # Database schema definitions
├── database.ts      # Database connection & initialization
└── services.ts      # CRUD operations & business logic

contexts/
├── DataContext.tsx     # Original context (deprecated)
└── DatabaseContext.tsx # New database context
```

The database is automatically initialized and seeded when the app starts, so no manual setup is required.
