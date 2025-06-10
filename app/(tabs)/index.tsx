import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseProvider, useDatabaseLegacy } from '@/contexts/DatabaseContext';
import Card from '@/components/Card';
import ProgressBar from '@/components/ProgressBar';
import { TrendingUp, TrendingDown, DollarSign, Target, CircleAlert as AlertCircle } from 'lucide-react-native';

function DashboardContent() {
  const { 
    expenses, 
    financialData, 
    getTotalMonthlyExpenses, 
    getRemainingBudget, 
    getSavingsProgress 
  } = useDatabaseLegacy();

  const totalExpenses = getTotalMonthlyExpenses();
  const remainingBudget = getRemainingBudget();
  const savingsProgress = getSavingsProgress();
  const upcomingPayments = expenses.filter(expense => !expense.isPaid).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>My Household</Text>
          <Text style={styles.subtitle}>Financial Overview</Text>
        </View>

        {/* Financial Summary Cards */}
        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <DollarSign size={24} color="#059669" />
              <View style={styles.summaryText}>
                <Text style={styles.summaryAmount}>${financialData.monthlyIncome.toLocaleString()}</Text>
                <Text style={styles.summaryLabel}>Monthly Income</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <TrendingDown size={24} color="#DC2626" />
              <View style={styles.summaryText}>
                <Text style={styles.summaryAmount}>${totalExpenses.toLocaleString()}</Text>
                <Text style={styles.summaryLabel}>Total Expenses</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <TrendingUp size={24} color="#2563EB" />
              <View style={styles.summaryText}>
                <Text style={[styles.summaryAmount, { color: remainingBudget >= 0 ? '#059669' : '#DC2626' }]}>
                  ${Math.abs(remainingBudget).toLocaleString()}
                </Text>
                <Text style={styles.summaryLabel}>
                  {remainingBudget >= 0 ? 'Remaining' : 'Over Budget'}
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <AlertCircle size={24} color="#EA580C" />
              <View style={styles.summaryText}>
                <Text style={styles.summaryAmount}>{upcomingPayments}</Text>
                <Text style={styles.summaryLabel}>Pending Payments</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Savings Progress */}
        <Card>
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Target size={20} color="#2563EB" />
              <Text style={styles.progressTitle}>Savings Goal Progress</Text>
            </View>
            <View style={styles.progressDetails}>
              <Text style={styles.progressAmount}>
                ${financialData.currentSavings} / ${financialData.savingsGoal}
              </Text>
              <ProgressBar 
                progress={savingsProgress} 
                color="#059669" 
                showPercentage={true}
              />
            </View>
          </View>
        </Card>

        {/* Budget Categories */}
        <Card>
          <Text style={styles.sectionTitle}>Budget Categories</Text>
          {financialData.budgetCategories.map((category) => {
            const progress = ((category.spent || 0) / category.limit) * 100;
            const isOverBudget = (category.spent || 0) > category.limit;
            
            return (
              <View key={category.id} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={[styles.categoryAmount, isOverBudget && styles.overBudget]}>
                    ${category.spent} / ${category.limit}
                  </Text>
                </View>
                <ProgressBar 
                  progress={progress} 
                  color={isOverBudget ? '#DC2626' : '#2563EB'}
                />
              </View>
            );
          })}
        </Card>

        {/* Recent Expenses */}
        <Card>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          {expenses.slice(0, 5).map((expense) => (
            <View key={expense.id} style={styles.expenseItem}>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseName}>{expense.name}</Text>
                <Text style={styles.expenseCategory}>{expense.category}</Text>
              </View>
              <View style={styles.expenseRight}>
                <Text style={styles.expenseAmount}>${expense.amount}</Text>
                <View style={[styles.statusBadge, expense.isPaid ? styles.paidBadge : styles.pendingBadge]}>
                  <Text style={[styles.statusText, expense.isPaid ? styles.paidText : styles.pendingText]}>
                    {expense.isPaid ? 'Paid' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function Dashboard() {
  return (
    <DatabaseProvider>
      <DashboardContent />
    </DatabaseProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: '47%',
    padding: 12,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryText: {
    flex: 1,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  progressSection: {
    gap: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  progressDetails: {
    gap: 8,
  },
  progressAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  categoryItem: {
    marginBottom: 16,
    gap: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  overBudget: {
    color: '#DC2626',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  expenseCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  paidBadge: {
    backgroundColor: '#D1FAE5',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  paidText: {
    color: '#059669',
  },
  pendingText: {
    color: '#D97706',
  },
});