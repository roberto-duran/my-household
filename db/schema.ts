import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  category: text('category').notNull(),
  dueDate: text('due_date').notNull(),
  isPaid: integer('is_paid', { mode: 'boolean' }).default(false),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const budgetCategories = sqliteTable('budget_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  limit: real('limit').notNull(),
  spent: real('spent').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const groceryLists = sqliteTable('grocery_lists', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  totalCost: real('total_cost').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const groceryItems = sqliteTable('grocery_items', {
  id: text('id').primaryKey(),
  listId: text('list_id').references(() => groceryLists.id, {
    onDelete: 'cascade',
  }),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull(),
  pricePerUnit: real('price_per_unit').notNull(),
  totalCost: real('total_cost').notNull(),
  isPurchased: integer('is_purchased', { mode: 'boolean' }).default(false),
  storeLocation: text('store_location'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const priceHistory = sqliteTable('price_history', {
  id: text('id').primaryKey(),
  itemId: text('item_id').references(() => groceryItems.id, {
    onDelete: 'cascade',
  }),
  price: real('price').notNull(),
  date: text('date').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const financialSettings = sqliteTable('financial_settings', {
  id: text('id').primaryKey(),
  monthlyIncome: real('monthly_income').notNull(),
  savingsGoal: real('savings_goal').notNull(),
  currentSavings: real('current_savings').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Relations
export const groceryListsRelations = relations(groceryLists, ({ many }) => ({
  items: many(groceryItems),
}));

export const groceryItemsRelations = relations(
  groceryItems,
  ({ one, many }) => ({
    list: one(groceryLists, {
      fields: [groceryItems.listId],
      references: [groceryLists.id],
    }),
    priceHistory: many(priceHistory),
  })
);

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  item: one(groceryItems, {
    fields: [priceHistory.itemId],
    references: [groceryItems.id],
  }),
}));

// Types
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type NewBudgetCategory = typeof budgetCategories.$inferInsert;

export type GroceryList = typeof groceryLists.$inferSelect;
export type NewGroceryList = typeof groceryLists.$inferInsert;

export type GroceryItem = typeof groceryItems.$inferSelect;
export type NewGroceryItem = typeof groceryItems.$inferInsert;

export type PriceHistory = typeof priceHistory.$inferSelect;
export type NewPriceHistory = typeof priceHistory.$inferInsert;

export type FinancialSettings = typeof financialSettings.$inferSelect;
export type NewFinancialSettings = typeof financialSettings.$inferInsert;
