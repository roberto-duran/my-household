import { eq, desc, sum } from 'drizzle-orm';
import { getDb } from './database';
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
    const db = await getDb();
    return await db.select().from(expenses).orderBy(desc(expenses.createdAt));
  },

  async getById(id: string) {
    const db = await getDb();
    const result = await db.select().from(expenses).where(eq(expenses.id, id));
    return result[0] || null;
  },

  async create(expense: Omit<NewExpense, 'id'>) {
    const db = await getDb();
    const id = Date.now().toString();
    const newExpense = { ...expense, id };
    await db.insert(expenses).values(newExpense);
    return await this.getById(id);
  },

  async update(id: string, updates: Partial<NewExpense>) {
    const db = await getDb();
    const updateData = { ...updates, updatedAt: new Date().toISOString() };
    await db.update(expenses).set(updateData).where(eq(expenses.id, id));
    return await this.getById(id);
  },

  async delete(id: string) {
    const db = await getDb();
    await db.delete(expenses).where(eq(expenses.id, id));
  },

  async getRecurringExpenses() {
    const db = await getDb();
    return await db
      .select()
      .from(expenses)
      .where(eq(expenses.isRecurring, true));
  },

  async getTotalMonthlyExpenses() {
    const db = await getDb();
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
    const db = await getDb();
    return await db
      .select()
      .from(budgetCategories)
      .orderBy(budgetCategories.name);
  },

  async getById(id: string) {
    const db = await getDb();
    const result = await db
      .select()
      .from(budgetCategories)
      .where(eq(budgetCategories.id, id));
    return result[0] || null;
  },

  async create(category: Omit<NewBudgetCategory, 'id'>) {
    const db = await getDb();
    const id = category.name.toLowerCase().replace(/\s+/g, '_');
    const newCategory = { ...category, id };
    await db.insert(budgetCategories).values(newCategory);
    return await this.getById(id);
  },

  async update(id: string, updates: Partial<NewBudgetCategory>) {
    const db = await getDb();
    const updateData = { ...updates, updatedAt: new Date().toISOString() };
    await db
      .update(budgetCategories)
      .set(updateData)
      .where(eq(budgetCategories.id, id));
    return await this.getById(id);
  },

  async delete(id: string) {
    const db = await getDb();
    await db.delete(budgetCategories).where(eq(budgetCategories.id, id));
  },

  async updateSpent(id: string, amount: number) {
    const db = await getDb();
    await db
      .update(budgetCategories)
      .set({ spent: amount })
      .where(eq(budgetCategories.id, id));
  },
};

// Grocery List Services
export const groceryListService = {
  async getAll() {
    const db = await getDb();
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
    const db = await getDb();
    const result = await db
      .select()
      .from(groceryLists)
      .where(eq(groceryLists.id, id));
    if (!result[0]) return null;

    const items = await groceryItemService.getByListId(id);
    return { ...result[0], items };
  },

  async create(list: Omit<NewGroceryList, 'id'>) {
    const db = await getDb();
    const id = Date.now().toString();
    const newList = { ...list, id };
    await db.insert(groceryLists).values(newList);
    return await this.getById(id);
  },

  async update(id: string, updates: Partial<NewGroceryList>) {
    const db = await getDb();
    const updateData = { ...updates, updatedAt: new Date().toISOString() };
    await db
      .update(groceryLists)
      .set(updateData)
      .where(eq(groceryLists.id, id));
    return await this.getById(id);
  },

  async delete(id: string) {
    const db = await getDb();
    await db.delete(groceryLists).where(eq(groceryLists.id, id));
  },

  async updateTotalCost(id: string) {
    const db = await getDb();
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
    const db = await getDb();
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
    const db = await getDb();
    const result = await db
      .select()
      .from(groceryItems)
      .where(eq(groceryItems.id, id));
    if (!result[0]) return null;

    const history = await priceHistoryService.getByItemId(id);
    return { ...result[0], priceHistory: history };
  },

  async create(item: Omit<NewGroceryItem, 'id'>) {
    const db = await getDb();
    const id = Date.now().toString();
    const newItem = { ...item, id };
    await db.insert(groceryItems).values(newItem);

    // Add price history entry
    await priceHistoryService.create({
      itemId: id,
      price: item.pricePerUnit,
      date: new Date().toISOString().split('T')[0],
    });

    // Update list total cost
    if (item.listId) {
      await groceryListService.updateTotalCost(item.listId);
    }

    return await this.getById(id);
  },

  async update(id: string, updates: Partial<NewGroceryItem>) {
    const db = await getDb();
    const updateData = { ...updates, updatedAt: new Date().toISOString() };
    await db
      .update(groceryItems)
      .set(updateData)
      .where(eq(groceryItems.id, id));

    // Update list total cost if item belongs to a list
    const item = await this.getById(id);
    if (item?.listId) {
      await groceryListService.updateTotalCost(item.listId);
    }

    return await this.getById(id);
  },

  async delete(id: string) {
    const db = await getDb();
    const item = await this.getById(id);
    await db.delete(groceryItems).where(eq(groceryItems.id, id));

    // Update list total cost if item belonged to a list
    if (item?.listId) {
      await groceryListService.updateTotalCost(item.listId);
    }
  },

  async togglePurchased(id: string) {
    const db = await getDb();
    const item = await this.getById(id);
    if (!item) return null;

    const updatedItem = await this.update(id, {
      isPurchased: !item.isPurchased,
    });
    return updatedItem;
  },
};

// Price History Services
export const priceHistoryService = {
  async getByItemId(itemId: string) {
    const db = await getDb();
    return await db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.itemId, itemId))
      .orderBy(desc(priceHistory.date));
  },

  async create(history: Omit<NewPriceHistory, 'id'>) {
    const db = await getDb();
    const id = Date.now().toString();
    const newHistory = { ...history, id };
    await db.insert(priceHistory).values(newHistory);
    return newHistory;
  },

  async delete(id: string) {
    const db = await getDb();
    await db.delete(priceHistory).where(eq(priceHistory.id, id));
  },
};

// Financial Settings Services
export const financialSettingsService = {
  async get() {
    const db = await getDb();
    const result = await db.select().from(financialSettings).limit(1);
    return result[0] || null;
  },

  async create(settings: Omit<NewFinancialSettings, 'id'>) {
    const db = await getDb();
    const id = 'default';
    const newSettings = {
      id,
      monthlyIncome: settings.monthlyIncome,
      savingsGoal: settings.savingsGoal,
      currentSavings: settings.currentSavings ?? 0,
      createdAt: null,
      updatedAt: null,
    };
    await db.insert(financialSettings).values(newSettings);
    return newSettings;
  },

  async update(updates: Partial<NewFinancialSettings>) {
    const db = await getDb();
    const updateData = { ...updates, updatedAt: new Date().toISOString() };
    await db
      .update(financialSettings)
      .set(updateData)
      .where(eq(financialSettings.id, 'default'));
    return await this.get();
  },

  async updateSavings(amount: number) {
    return await this.update({ currentSavings: amount });
  },

  async getOrCreate() {
    let settings = await this.get();
    if (!settings) {
      settings = await this.create({
        monthlyIncome: 0,
        savingsGoal: 0,
        currentSavings: 0,
      });
    }
    return settings;
  },

  async getDashboardData() {
    const db = await getDb();
    const settings = await this.getOrCreate();
    const totalExpenses = await expenseService.getTotalMonthlyExpenses();

    const budgetResult = await db
      .select({
        totalLimit: sum(budgetCategories.limit),
        totalSpent: sum(budgetCategories.spent),
      })
      .from(budgetCategories);

    const totalBudgetLimit = Number(budgetResult[0]?.totalLimit || 0);
    const totalBudgetSpent = Number(budgetResult[0]?.totalSpent || 0);

    return {
      monthlyIncome: settings.monthlyIncome,
      totalExpenses,
      remainingIncome: settings.monthlyIncome - totalExpenses,
      savingsGoal: settings.savingsGoal,
      currentSavings: settings.currentSavings || 0,
      savingsProgress:
        settings.savingsGoal > 0
          ? ((settings.currentSavings || 0) / settings.savingsGoal) * 100
          : 0,
      totalBudgetLimit,
      totalBudgetSpent,
      remainingBudget: totalBudgetLimit - totalBudgetSpent,
    };
  },

  async getExpensesByCategory() {
    const db = await getDb();
    const result = await db
      .select({
        category: expenses.category,
        total: sum(expenses.amount),
      })
      .from(expenses)
      .where(eq(expenses.isRecurring, true))
      .groupBy(expenses.category);

    return result.map((row) => ({
      category: row.category,
      total: Number(row.total || 0),
    }));
  },
};
