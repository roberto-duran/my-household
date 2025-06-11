// Web-compatible services using IndexedDB
import { webDb, STORES } from './database-web';
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

// Expense Services
export const webExpenseService = {
  async getAll() {
    const expenses = await webDb.getAll<Expense>(STORES.expenses);
    return expenses.sort(
      (a, b) =>
        new Date(b.createdAt || '').getTime() -
        new Date(a.createdAt || '').getTime()
    );
  },

  async getById(id: string) {
    return await webDb.get<Expense>(STORES.expenses, id);
  },

  async create(expense: Omit<NewExpense, 'id'>) {
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newExpense: Expense = {
      id,
      name: expense.name,
      amount: expense.amount,
      category: expense.category,
      dueDate: expense.dueDate,
      isPaid: expense.isPaid ?? false,
      isRecurring: expense.isRecurring ?? false,
      createdAt: now,
      updatedAt: now,
    };
    await webDb.put(STORES.expenses, newExpense);
    return newExpense;
  },

  async update(id: string, updates: Partial<NewExpense>) {
    const existing = await webDb.get<Expense>(STORES.expenses, id);
    if (!existing) return null;

    const updated: Expense = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await webDb.put(STORES.expenses, updated);
    return updated;
  },

  async delete(id: string) {
    await webDb.delete(STORES.expenses, id);
  },

  async getRecurringExpenses() {
    return await webDb.filter<Expense>(
      STORES.expenses,
      (expense) => expense.isRecurring === true
    );
  },

  async getTotalMonthlyExpenses() {
    const recurringExpenses = await this.getRecurringExpenses();
    return recurringExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  },
};

// Budget Category Services
export const webBudgetCategoryService = {
  async getAll() {
    const categories = await webDb.getAll<BudgetCategory>(
      STORES.budgetCategories
    );
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getById(id: string) {
    return await webDb.get<BudgetCategory>(STORES.budgetCategories, id);
  },

  async create(category: Omit<NewBudgetCategory, 'id'>) {
    const id = category.name.toLowerCase().replace(/\s+/g, '_');
    const now = new Date().toISOString();
    const newCategory: BudgetCategory = {
      ...category,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await webDb.put(STORES.budgetCategories, newCategory);
    return newCategory;
  },

  async update(id: string, updates: Partial<NewBudgetCategory>) {
    const existing = await webDb.get<BudgetCategory>(
      STORES.budgetCategories,
      id
    );
    if (!existing) return null;

    const updated: BudgetCategory = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await webDb.put(STORES.budgetCategories, updated);
    return updated;
  },

  async delete(id: string) {
    await webDb.delete(STORES.budgetCategories, id);
  },

  async updateSpent(id: string, amount: number) {
    return await this.update(id, { spent: amount });
  },
};

// Grocery List Services
export const webGroceryListService = {
  async getAll() {
    const lists = await webDb.getAll<GroceryList>(STORES.groceryLists);

    // Get items for each list
    const listsWithItems = await Promise.all(
      lists.map(async (list) => {
        const items = await webGroceryItemService.getByListId(list.id);
        return { ...list, items };
      })
    );

    return listsWithItems.sort(
      (a, b) =>
        new Date(b.createdAt || '').getTime() -
        new Date(a.createdAt || '').getTime()
    );
  },

  async getById(id: string) {
    const list = await webDb.get<GroceryList>(STORES.groceryLists, id);
    if (!list) return null;

    const items = await webGroceryItemService.getByListId(id);
    return { ...list, items };
  },

  async create(list: Omit<NewGroceryList, 'id'>) {
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newList: GroceryList = {
      ...list,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await webDb.put(STORES.groceryLists, newList);
    return newList;
  },

  async update(id: string, updates: Partial<NewGroceryList>) {
    const existing = await webDb.get<GroceryList>(STORES.groceryLists, id);
    if (!existing) return null;

    const updated: GroceryList = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await webDb.put(STORES.groceryLists, updated);
    return updated;
  },

  async delete(id: string) {
    await webDb.delete(STORES.groceryLists, id);
  },

  async updateTotalCost(id: string) {
    const items = await webGroceryItemService.getByListId(id);
    const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);
    await this.update(id, { totalCost });
  },
};

// Grocery Item Services
export const webGroceryItemService = {
  async getByListId(listId: string) {
    const items = await webDb.filter<GroceryItem>(
      STORES.groceryItems,
      (item) => item.listId === listId
    );

    // Get price history for each item
    const itemsWithHistory = await Promise.all(
      items.map(async (item) => {
        const history = await webPriceHistoryService.getByItemId(item.id);
        return { ...item, priceHistory: history };
      })
    );

    return itemsWithHistory;
  },

  async getById(id: string) {
    const item = await webDb.get<GroceryItem>(STORES.groceryItems, id);
    if (!item) return null;

    const history = await webPriceHistoryService.getByItemId(id);
    return { ...item, priceHistory: history };
  },

  async create(item: Omit<NewGroceryItem, 'id'>) {
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newItem: GroceryItem = {
      ...item,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await webDb.put(STORES.groceryItems, newItem);

    // Add price history entry
    await webPriceHistoryService.create({
      itemId: id,
      price: item.pricePerUnit,
      date: new Date().toISOString().split('T')[0],
    });

    // Update list total cost
    if (item.listId) {
      await webGroceryListService.updateTotalCost(item.listId);
    }

    return newItem;
  },

  async update(id: string, updates: Partial<NewGroceryItem>) {
    const existing = await webDb.get<GroceryItem>(STORES.groceryItems, id);
    if (!existing) return null;

    const updated: GroceryItem = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await webDb.put(STORES.groceryItems, updated);

    // Update list total cost if item belongs to a list
    if (updated.listId) {
      await webGroceryListService.updateTotalCost(updated.listId);
    }

    return updated;
  },

  async delete(id: string) {
    const item = await webDb.get<GroceryItem>(STORES.groceryItems, id);
    await webDb.delete(STORES.groceryItems, id);

    // Update list total cost if item belonged to a list
    if (item?.listId) {
      await webGroceryListService.updateTotalCost(item.listId);
    }
  },

  async togglePurchased(id: string) {
    const item = await webDb.get<GroceryItem>(STORES.groceryItems, id);
    if (!item) return null;

    const updatedItem = await this.update(id, {
      isPurchased: !item.isPurchased,
    });
    return updatedItem;
  },
};

// Price History Services
export const webPriceHistoryService = {
  async getByItemId(itemId: string) {
    const history = await webDb.filter<PriceHistory>(
      STORES.priceHistory,
      (item) => item.itemId === itemId
    );
    return history.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  async create(history: Omit<NewPriceHistory, 'id'>) {
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newHistory: PriceHistory = {
      ...history,
      id,
      createdAt: now,
    };
    await webDb.put(STORES.priceHistory, newHistory);
    return newHistory;
  },

  async delete(id: string) {
    await webDb.delete(STORES.priceHistory, id);
  },
};

// Financial Settings Services
export const webFinancialSettingsService = {
  async get() {
    return await webDb.get<FinancialSettings>(
      STORES.financialSettings,
      'default'
    );
  },

  async create(settings: Omit<NewFinancialSettings, 'id'>) {
    const now = new Date().toISOString();
    const newSettings: FinancialSettings = {
      ...settings,
      id: 'default',
      currentSavings: settings.currentSavings ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    await webDb.put(STORES.financialSettings, newSettings);
    return newSettings;
  },

  async update(updates: Partial<NewFinancialSettings>) {
    const existing = await this.get();
    if (!existing) {
      return await this.create({
        monthlyIncome: updates.monthlyIncome ?? 0,
        savingsGoal: updates.savingsGoal ?? 0,
        currentSavings: updates.currentSavings ?? 0,
      });
    }

    const updated: FinancialSettings = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await webDb.put(STORES.financialSettings, updated);
    return updated;
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
    const settings = await this.getOrCreate();
    const totalExpenses = await webExpenseService.getTotalMonthlyExpenses();

    const categories = await webBudgetCategoryService.getAll();
    const totalBudgetLimit = categories.reduce(
      (sum, cat) => sum + cat.limit,
      0
    );
    const totalBudgetSpent = categories.reduce(
      (sum, cat) => sum + (cat.spent || 0),
      0
    );

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
    const expenses = await webExpenseService.getRecurringExpenses();
    const categoryTotals: Record<string, number> = {};

    expenses.forEach((expense) => {
      categoryTotals[expense.category] =
        (categoryTotals[expense.category] || 0) + expense.amount;
    });

    return Object.entries(categoryTotals).map(([category, total]) => ({
      category,
      total,
    }));
  },
};
