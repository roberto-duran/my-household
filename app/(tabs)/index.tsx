import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDatabase } from '@/contexts/DatabaseContext'
import { monthlySavingsService } from '@/db/services'
import type { MonthlySavings } from '@/db/schema'
import Card from '@/components/Card'
import ProgressBar from '@/components/ProgressBar'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  CircleAlert as AlertCircle,
  Wallet,
  Calendar,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react-native'

const { width } = Dimensions.get('window')

const getCurrentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`
}

const getMonthName = (monthStr: string) => {
  const [year, month] = monthStr.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function DashboardContent () {
  const {
    expenses,
    budgetCategories,
    financialSettings,
    getTotalMonthlyExpenses,
    getRemainingBudget,
    getSavingsProgress,
    refreshData
  } = useDatabase()
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
  const [monthlyData, setMonthlyData] = useState<MonthlySavings | null>(null)
  const [savingsHistory, setSavingsHistory] = useState<MonthlySavings[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadTotalExpenses = async () => {
      const total = await getTotalMonthlyExpenses()
      setTotalExpenses(total)
    }
    loadTotalExpenses()
  }, [getTotalMonthlyExpenses])

  useEffect(() => {
    loadMonthlyData()
  }, [currentMonth])

  const loadMonthlyData = async () => {
    try {
      setIsLoading(true)

      // Initialize current month if needed
      await monthlySavingsService.initializeCurrentMonth()

      // Get current month data
      const monthData = await monthlySavingsService.getByMonth(currentMonth)
      setMonthlyData(monthData)

      // Get savings history
      const history = await monthlySavingsService.getSavingsByMonths(6)
      setSavingsHistory(history)

      // Refresh dashboard data
      await refreshData()
    } catch (error) {
      console.error('Error loading monthly data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number)
    const date = new Date(year, month - 1)

    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1)
    } else {
      date.setMonth(date.getMonth() + 1)
    }

    const newMonth = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`
    setCurrentMonth(newMonth)
  }

  const remainingBudget = getRemainingBudget()
  const savingsProgress = getSavingsProgress()
  const upcomingPayments = expenses.filter(expense => !expense.isPaid).length

  const currentMonthSavings = monthlyData?.totalSaved || 0
  const savingsGoal =
    monthlyData?.savingsGoal || financialSettings?.savingsGoal || 0
  const currentMonthSavingsProgress =
    savingsGoal > 0 ? (currentMonthSavings / savingsGoal) * 100 : 0

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>My Household</Text>
          <Text style={styles.subtitle}>Financial Overview</Text>
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNavigation}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateMonth('prev')}
          >
            <ChevronLeft size={20} color='#2563EB' />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{getMonthName(currentMonth)}</Text>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateMonth('next')}
          >
            <ChevronRight size={20} color='#2563EB' />
          </TouchableOpacity>
        </View>

        {/* Financial Summary Cards */}
        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <DollarSign size={24} color='#059669' />
              <View style={styles.summaryText}>
                <Text style={styles.summaryAmount}>
                  ${(financialSettings?.monthlyIncome || 0).toLocaleString()}
                </Text>
                <Text style={styles.summaryLabel}>Monthly Income</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <TrendingDown size={24} color='#DC2626' />
              <View style={styles.summaryText}>
                <Text style={styles.summaryAmount}>
                  ${totalExpenses.toLocaleString()}
                </Text>
                <Text style={styles.summaryLabel}>Total Expenses</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <TrendingUp size={24} color='#2563EB' />
              <View style={styles.summaryText}>
                <Text
                  style={[
                    styles.summaryAmount,
                    { color: remainingBudget >= 0 ? '#059669' : '#DC2626' }
                  ]}
                >
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
              <AlertCircle size={24} color='#EA580C' />
              <View style={styles.summaryText}>
                <Text style={styles.summaryAmount}>{upcomingPayments}</Text>
                <Text style={styles.summaryLabel}>Pending Payments</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Current Month Summary */}
        <Card>
          <View style={styles.summaryHeader}>
            <Text style={styles.cardTitle}>Monthly Summary</Text>
            <Calendar size={20} color='#6B7280' />
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconContainer}>
                <DollarSign size={20} color='#059669' />
              </View>
              <Text style={styles.summaryValue}>
                ${monthlyData?.income?.toFixed(2) || '0.00'}
              </Text>
              <Text style={styles.summaryLabel}>Income</Text>
            </View>

            <View style={styles.summaryItem}>
              <View
                style={[
                  styles.summaryIconContainer,
                  { backgroundColor: '#FEE2E2' }
                ]}
              >
                <ArrowDown size={20} color='#DC2626' />
              </View>
              <Text style={styles.summaryValue}>
                ${monthlyData?.totalExpenses?.toFixed(2) || '0.00'}
              </Text>
              <Text style={styles.summaryLabel}>Expenses</Text>
            </View>

            <View style={styles.summaryItem}>
              <View
                style={[
                  styles.summaryIconContainer,
                  { backgroundColor: '#DBEAFE' }
                ]}
              >
                <TrendingUp size={20} color='#2563EB' />
              </View>
              <Text
                style={[
                  styles.summaryValue,
                  { color: currentMonthSavings >= 0 ? '#059669' : '#DC2626' }
                ]}
              >
                ${currentMonthSavings.toFixed(2)}
              </Text>
              <Text style={styles.summaryLabel}>Saved</Text>
            </View>
          </View>
        </Card>

        {/* Savings Progress */}
        <Card>
          <View style={styles.progressHeader}>
            <View style={styles.progressTitle}>
              <Wallet size={20} color='#2563EB' />
              <Text style={styles.cardTitle}>Savings Goal Progress</Text>
            </View>
            <Text style={styles.progressPercentage}>
              {currentMonthSavingsProgress.toFixed(1)}%
            </Text>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, currentMonthSavingsProgress)}%` }
              ]}
            />
          </View>

          <View style={styles.progressDetails}>
            <Text style={styles.progressText}>
              ${currentMonthSavings.toFixed(2)} of ${savingsGoal.toFixed(2)}
            </Text>
            <Text style={styles.progressRemaining}>
              ${Math.max(0, savingsGoal - currentMonthSavings).toFixed(2)}{' '}
              remaining
            </Text>
          </View>
        </Card>

        {/* Savings History */}
        <Card>
          <Text style={styles.cardTitle}>Savings History</Text>
          <View style={styles.historyContainer}>
            {savingsHistory.map((item, index) => {
              const isPositive = (item.totalSaved || 0) >= 0
              return (
                <View key={item.month} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyMonth}>
                      {getMonthName(item.month)}
                    </Text>
                    <Text style={styles.historyIncome}>
                      Income: ${item.income.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text
                      style={[
                        styles.historySaved,
                        { color: isPositive ? '#059669' : '#DC2626' }
                      ]}
                    >
                      {isPositive ? '+' : ''}$
                      {(item.totalSaved || 0).toFixed(2)}
                    </Text>
                    <View
                      style={[
                        styles.historyIcon,
                        { backgroundColor: isPositive ? '#D1FAE5' : '#FEE2E2' }
                      ]}
                    >
                      {isPositive ? (
                        <ArrowUp size={16} color='#059669' />
                      ) : (
                        <ArrowDown size={16} color='#DC2626' />
                      )}
                    </View>
                  </View>
                </View>
              )
            })}

            {savingsHistory.length === 0 && (
              <Text style={styles.noHistory}>No savings history available</Text>
            )}
          </View>
        </Card>

        {/* Quick Actions */}
        <Card>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={loadMonthlyData}
            >
              <Text style={styles.quickActionText}>Refresh Data</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Budget Categories */}
        <Card>
          <Text style={styles.sectionTitle}>Budget Categories</Text>
          {budgetCategories.map((category: any) => {
            const progress = ((category.spent || 0) / category.limit) * 100
            const isOverBudget = (category.spent || 0) > category.limit

            return (
              <View key={category.id} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text
                    style={[
                      styles.categoryAmount,
                      isOverBudget && styles.overBudget
                    ]}
                  >
                    ${category.spent} / ${category.limit}
                  </Text>
                </View>
                <ProgressBar
                  progress={progress}
                  color={isOverBudget ? '#DC2626' : '#2563EB'}
                />
              </View>
            )
          })}
        </Card>

        {/* Recent Expenses */}
        <Card>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          {expenses.slice(0, 5).map(expense => (
            <View key={expense.id} style={styles.expenseItem}>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseName}>{expense.name}</Text>
                <Text style={styles.expenseCategory}>{expense.category}</Text>
              </View>
              <View style={styles.expenseRight}>
                <Text style={styles.expenseAmount}>${expense.amount}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    expense.isPaid ? styles.paidBadge : styles.pendingBadge
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      expense.isPaid ? styles.paidText : styles.pendingText
                    ]}
                  >
                    {expense.isPaid ? 'Paid' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

export default function Dashboard () {
  return <DashboardContent />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  header: {
    padding: 20,
    paddingBottom: 10
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280'
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12
  },
  summaryCard: {
    flex: 1,
    minWidth: '47%',
    padding: 12
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  summaryText: {
    flex: 1
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827'
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  progressTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 6
  },
  progressDetails: {
    gap: 8
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  progressRemaining: {
    fontSize: 12,
    color: '#6B7280'
  },
  historyContainer: {
    gap: 12
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  historyLeft: {
    flex: 1
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 4
  },
  historyMonth: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  historyIncome: {
    fontSize: 12,
    color: '#6B7280'
  },
  historySaved: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  historyIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  noHistory: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16
  },
  categoryItem: {
    marginBottom: 16,
    gap: 8
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280'
  },
  overBudget: {
    color: '#DC2626'
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  expenseInfo: {
    flex: 1
  },
  expenseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  expenseCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: 4
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12
  },
  paidBadge: {
    backgroundColor: '#D1FAE5'
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7'
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600'
  },
  paidText: {
    color: '#059669'
  },
  pendingText: {
    color: '#D97706'
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#E5E7EB'
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  summaryIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  quickAction: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E5E7EB'
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  }
})
