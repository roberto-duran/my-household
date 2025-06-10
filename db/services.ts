import { eq, desc, sum } from 'drizzle-orm';
import { db } from './database';
import {
  expenses,
  budgetCategories,
  groceryLists,
  groceryItems,
  priceHistory,
  financialSettings,
  type NewExpense,
  type NewBudgetCategory,
  type NewGroceryList,
  type NewGroceryItem,
  type NewPriceHistory,
  type NewFinancialSettings,
} from './schema';

// Expense Services
export const expenseService = {
  async getAll() {
    return await db.select().from(expenses).orderBy(desc(expenses.createdAt));
  },

  async getById(id: string) {
    const result = await db.select().from(expenses).where(eq(expenses.id, id));
    return result[0] || null;
  },

  async create(expense: Omit<NewExpense, 'id'>) {
    const id = Date.now().toString();
    const newExpense = { ...expense, id };
    await db.insert(expenses).values(newExpense);
    return await this.getById(id);
  },

  async update(id: string, updates: Partial<NewExpense>) {
    const updateData = { ...updates, updatedAt: new Date().toISOString() };
    await db.update(expenses).set(updateData).where(eq(expenses.id, id));
    return await this.getById(id);
  },

  async delete(id: string) {
    await db.delete(expenses).where(eq(expenses.id, id));
  },

  async getRecurringExpenses() {
    return await db
      .select()
      .from(expenses)
      .where(eq(expenses.isRecurring, true));
  },

  async getTotalMonthlyExpenses() {
    const result = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(eq(expenses.isRecurring, true));
    return Number(result[0]?.total || 0);
  },
};

// Budget Category Services
export const budgetCategoryService = {
  async getAll() {
    return await db
      .select()
      .from(budgetCategories)
      .orderBy(budgetCategories.name);
  },

  async getById(id: string) {
    const result = await db
      .select()
      .from(budgetCategories)
      .where(eq(budgetCategories.id, id));
    return result[0] || null;
  },

  async create(category: Omit<NewBudgetCategory, 'id'>) {
    const id = category.name.toLowerCase().replace(/\s+/g, '_');
    const newCategory = { ...category, id };
    await db.insert(budgetCategories).values(newCategory);
    return await this.getById(id);
  },

  async update(id: string, updates: Partial<NewBudgetCategory>) {
    const updateData = { ...updates, updatedAt: new Date().toISOString() };
    await db
      .update(budgetCategories)
      .set(updateData)
      .where(eq(budgetCategories.id, id));
    return await this.getById(id);
  },

  async delete(id: string) {
    await db.delete(budgetCategories).where(eq(budgetCategories.id, id));
  },

  async updateSpent(id: string, amount: number) {
    await db
      .update(budgetCategories)
      .set({ spent: amount })
      .where(eq(budgetCategories.id, id));
  },
};

// Grocery List Services
export const groceryListService = {
  async getAll() {
    const lists = await db
      .select()
      .from(groceryLists)
      .orderBy(desc(groceryLists.createdAt));

    // Get items for each list
    const listsWithItems = await Promise.all(
      lists.map(async (list) => {
        const items = await groceryItemService.getByListId(list.id);
        return { ...list, items };
      })
    );

    return listsWithItems;
  },

  async getById(id: string) {
    const result = await db
      .select()
      .from(groceryLists)
      .where(eq(groceryLists.id, id));
    if (!result[0]) return null;

    const items = await groceryItemService.getByListId(id);
    return { ...result[0], items };
  },

  async create(list: Omit<NewGroceryList, 'id'>) {
    const id = Date.now().toString();
    const newList = { ...list, id };
    await db.insert(groceryLists).values(newList);
    return await this.getById(id);
  },

  async update(id: string, updates: Partial<NewGroceryList>) {
    const updateData = { ...updates, updatedAt: new Date().toISOString() };
    await db
      .update(groceryLists)
      .set(updateData)
      .where(eq(groceryLists.id, id));
    return await this.getById(id);
  },

  async delete(id: string) {
    await db.delete(groceryLists).where(eq(groceryLists.id, id));
  },

  async updateTotalCost(id: string) {
    const items = await groceryItemService.getByListId(id);
    const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);
    await db
      .update(groceryLists)
      .set({ totalCost })
      .where(eq(groceryLists.id, id));
  },
};

// Grocery Item Services
export const groceryItemService = {
  async getByListId(listId: string) {
    const items = await db
      .select()
      .from(groceryItems)
      .where(eq(groceryItems.listId, listId));

    // Get price history for each item
    const itemsWithHistory = await Promise.all(
      items.map(async (item) => {
        const history = await priceHistoryService.getByItemId(item.id);
        return { ...item, priceHistory: history };
      })
    );

    return itemsWithHistory;
  },

  async getById(id: string) {
    const result = await db
      .select()
      .from(groceryItems)
      .where(eq(groceryItems.id, id));
    if (!result[0]) return null;

    const history = await priceHistoryService.getByItemId(id);
    return { ...result[0], priceHistory: history };
  },

  async create(item: Omit<NewGroceryItem, 'id'>) {
    const id = Date.now().toString();
    const newItem = { ...item, id };
    await db.insert(groceryItems).values(newItem);

    // Update list total cost
    if (item.listId) {
      await groceryListService.updateTotalCost(item.listId);
    }

    return await this.getById(id);
  },

  async update(id: string, updates: Partial<NewGroceryItem>) {
    const updateData = { ...updates, updatedAt: new Date().toISOString() };
    await db
      .update(groceryItems)
      .set(updateData)
      .where(eq(groceryItems.id, id));

    // Update list total cost if needed
    const item = await this.getById(id);
    if (item?.listId) {
      await groceryListService.updateTotalCost(item.listId);
    }

    return await this.getById(id);
  },

  async delete(id: string) {
    const item = await this.getById(id);
    await db.delete(groceryItems).where(eq(groceryItems.id, id));

    // Update list total cost
    if (item?.listId) {
      await groceryListService.updateTotalCost(item.listId);
    }
  },

  async togglePurchased(id: string) {
    const item = await this.getById(id);
    if (item) {
      await this.update(id, { isPurchased: !item.isPurchased });
    }
  },
};

// Price History Services
export const priceHistoryService = {
  async getByItemId(itemId: string) {
    return await db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.itemId, itemId))
      .orderBy(desc(priceHistory.date));
  },

  async create(history: Omit<NewPriceHistory, 'id'>) {
    const id = Date.now().toString();
    const newHistory = { ...history, id };
    await db.insert(priceHistory).values(newHistory);
    return newHistory;
  },

  async delete(id: string) {
    await db.delete(priceHistory).where(eq(priceHistory.id, id));
  },
};

// Financial Settings Services
export const financialSettingsService = {
  async get() {
    const result = await db.select().from(financialSettings).limit(1);
    return result[0] || null;
  },

  async create(settings: Omit<NewFinancialSettings, 'id'>) {
    const id = 'default';
    const newSettings = { ...settings, id };
    await db.insert(financialSettings).values(newSettings);
    return newSettings;
  },

  async update(updates: Partial<NewFinancialSettings>) {
    const existing = await this.get();
    if (!existing) {
      throw new Error('Financial settings not found. Create settings first.');
    }

    const updateData = { ...updates, updatedAt: new Date().toISOString() };
    await db
      .update(financialSettings)
      .set(updateData)
      .where(eq(financialSettings.id, existing.id));
    return await this.get();
  },

  async updateSavings(amount: number) {
    return await this.update({ currentSavings: amount });
  },

  async getOrCreate() {
    const existing = await this.get();
    if (existing) return existing;

    return await this.create({
      monthlyIncome: 0,
      savingsGoal: 0,
      currentSavings: 0,
    });
  },
};

// Analytics Services
export const analyticsService = {
  async getDashboardData() {
    const [allExpenses, categories, settings] = await Promise.all([
      expenseService.getAll(),
      budgetCategoryService.getAll(),
      financialSettingsService.getOrCreate(),
    ]);

    const totalMonthlyExpenses = await expenseService.getTotalMonthlyExpenses();
    const remainingBudget =
      (settings.monthlyIncome || 0) -
      (totalMonthlyExpenses || 0) -
      (settings.savingsGoal || 0);
    const savingsProgress =
      (settings.savingsGoal || 0) > 0
        ? ((settings.currentSavings || 0) / (settings.savingsGoal || 0)) * 100
        : 0;
    const upcomingPayments = allExpenses.filter(
      (expense) => !expense.isPaid
    ).length;

    return {
      monthlyIncome: settings.monthlyIncome,
      totalExpenses: totalMonthlyExpenses,
      remainingBudget,
      savingsGoal: settings.savingsGoal,
      currentSavings: settings.currentSavings,
      savingsProgress,
      upcomingPayments,
      budgetCategories: categories,
      recentExpenses: allExpenses.slice(0, 5),
    };
  },

  async getExpensesByCategory() {
    const expenses = await expenseService.getAll();
    const categoryTotals: Record<string, number> = {};

    expenses.forEach((expense) => {
      categoryTotals[expense.category] =
        (categoryTotals[expense.category] || 0) + expense.amount;
    });

    return categoryTotals;
  },
};
