import { eq, desc, sum, and } from 'drizzle-orm';
import { getDb } from './database';
import {
  expenses,
  budgetCategories,
  groceryLists,
  groceryItems,
  priceHistory,
  financialSettings,
  monthlySavings,
  type NewExpense,
  type NewBudgetCategory,
  type NewGroceryList,
  type NewGroceryItem,
  type NewPriceHistory,
  type NewFinancialSettings,
  type NewMonthlySavings,
} from './schema';

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`;
};

// Monthly Savings Services - Defined first to avoid circular dependencies
export const monthlySavingsService = {
  async getByMonth(month: string) {
    const db = await getDb();
    const result = await db
      .select()
      .from(monthlySavings)
      .where(eq(monthlySavings.month, month));
    return result[0] || null;
  },

  async getAll() {
    const db = await getDb();
    return await db
      .select()
      .from(monthlySavings)
      .orderBy(desc(monthlySavings.month));
  },

  async create(data: Omit<NewMonthlySavings, 'id'>) {
    const db = await getDb();
    const id = `${data.month}-${Date.now()}`;
    const newData = { ...data, id };
    await db.insert(monthlySavings).values(newData);
    return await this.getByMonth(data.month);
  },

  async update(month: string, updates: Partial<NewMonthlySavings>) {
    const db = await getDb();
    const updateData = { ...updates, updatedAt: new Date().toISOString() };
    await db
      .update(monthlySavings)
      .set(updateData)
      .where(eq(monthlySavings.month, month));
    return await this.getByMonth(month);
  },

  async getOrCreateForMonth(month: string) {
    let monthData = await this.getByMonth(month);
    if (!monthData) {
      // Get settings directly to avoid circular dependency
      const db = await getDb();
      const settings = await db.select().from(financialSettings).limit(1);
      const settingsData = settings[0];

      monthData = await this.create({
        month,
        income: settingsData?.monthlyIncome || 0,
        savingsGoal: settingsData?.savingsGoal || 0,
        totalExpenses: 0,
        totalSaved: 0,
      });
    }
    return monthData;
  },

  async getSavingsByMonths(limit = 12) {
    const db = await getDb();
    return await db
      .select()
      .from(monthlySavings)
      .orderBy(desc(monthlySavings.month))
      .limit(limit);
  },

  async updateMonthlyExpenses(month: string) {
    // This will be properly implemented after expenseService methods are available
    // For now, just create a placeholder that works
    const db = await getDb();
    const result = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(eq(expenses.month, month));

    const totalExpenses = Number(result[0]?.total || 0);
    const monthData = await this.getOrCreateForMonth(month);
    const totalSaved = monthData.income - totalExpenses;

    await this.update(month, {
      totalExpenses,
      totalSaved: Math.max(0, totalSaved),
    });
  },

  async initializeCurrentMonth() {
    const currentMonth = getCurrentMonth();
    await this.getOrCreateForMonth(currentMonth);
    return currentMonth;
  },
};

// Expense Services
export const expenseService = {
  async getAll() {
    const db = await getDb();
    return await db.select().from(expenses).orderBy(desc(expenses.createdAt));
  },

  async getByMonth(month?: string) {
    const db = await getDb();
    const targetMonth = month || getCurrentMonth();
    return await db
      .select()
      .from(expenses)
      .where(eq(expenses.month, targetMonth))
      .orderBy(desc(expenses.createdAt));
  },

  async getById(id: string) {
    const db = await getDb();
    const result = await db.select().from(expenses).where(eq(expenses.id, id));
    return result[0] || null;
  },

  async create(expense: Omit<NewExpense, 'id'>) {
    const db = await getDb();
    const id = Date.now().toString();
    const month = expense.month || getCurrentMonth();
    const newExpense = { ...expense, id, month };
    await db.insert(expenses).values(newExpense);
    await monthlySavingsService.updateMonthlyExpenses(month);
    return await this.getById(id);
  },

  async update(id: string, updates: Partial<NewExpense>) {
    const db = await getDb();
    const updateData = { ...updates, updatedAt: new Date().toISOString() };
    const expense = await this.getById(id);
    await db.update(expenses).set(updateData).where(eq(expenses.id, id));
    if (expense) {
      await monthlySavingsService.updateMonthlyExpenses(expense.month);
    }
    return await this.getById(id);
  },

  async delete(id: string) {
    const db = await getDb();
    const expense = await this.getById(id);
    await db.delete(expenses).where(eq(expenses.id, id));
    if (expense) {
      await monthlySavingsService.updateMonthlyExpenses(expense.month);
    }
  },

  async getRecurringExpenses() {
    const db = await getDb();
    return await db
      .select()
      .from(expenses)
      .where(eq(expenses.isRecurring, true));
  },

  async getTotalMonthlyExpenses(month?: string) {
    const db = await getDb();
    const targetMonth = month || getCurrentMonth();
    const result = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(eq(expenses.month, targetMonth));
    return Number(result[0]?.total || 0);
  },

  async createRecurringExpensesForMonth(month: string) {
    const recurringExpenses = await this.getRecurringExpenses();
    const existingExpenses = await this.getByMonth(month);

    for (const recurring of recurringExpenses) {
      const exists = existingExpenses.some(
        (exp) =>
          exp.name === recurring.name && exp.category === recurring.category
      );

      if (!exists && recurring.chargeDay) {
        const [year, monthNum] = month.split('-').map(Number);
        const dueDate = new Date(year, monthNum - 1, recurring.chargeDay);

        await this.create({
          name: recurring.name,
          amount: recurring.amount,
          category: recurring.category,
          dueDate: dueDate.toISOString().split('T')[0],
          month,
          chargeDay: recurring.chargeDay,
          isPaid: false,
          isRecurring: false, // Monthly instance, not the recurring template
        });
      }
    }
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

  async getByMonth(month?: string) {
    const db = await getDb();
    const targetMonth = month || getCurrentMonth();
    return await db
      .select()
      .from(budgetCategories)
      .where(eq(budgetCategories.month, targetMonth))
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
    const month = category.month || getCurrentMonth();
    const id = `${category.name.toLowerCase().replace(/\s+/g, '_')}_${month}`;
    const newCategory = { ...category, id, month };
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

  async createMonthlyBudgets(month: string, previousMonth?: string) {
    if (previousMonth) {
      const previousCategories = await this.getByMonth(previousMonth);
      for (const category of previousCategories) {
        const existingCategory = await this.getByMonth(month);
        const exists = existingCategory.some((c) => c.name === category.name);

        if (!exists) {
          await this.create({
            name: category.name,
            limit: category.limit,
            spent: 0,
            month,
          });
        }
      }
    }
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
    const currentMonth = getCurrentMonth();
    const totalExpenses = await expenseService.getTotalMonthlyExpenses(
      currentMonth
    );

    const budgetResult = await db
      .select({
        totalLimit: sum(budgetCategories.limit),
        totalSpent: sum(budgetCategories.spent),
      })
      .from(budgetCategories)
      .where(eq(budgetCategories.month, currentMonth));

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

  async getExpensesByCategory(month?: string) {
    const db = await getDb();
    const targetMonth = month || getCurrentMonth();
    const result = await db
      .select({
        category: expenses.category,
        total: sum(expenses.amount),
      })
      .from(expenses)
      .where(eq(expenses.month, targetMonth))
      .groupBy(expenses.category);

    return result.map((row) => ({
      category: row.category,
      total: Number(row.total || 0),
    }));
  },
};
