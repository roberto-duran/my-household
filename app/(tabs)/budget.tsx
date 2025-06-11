import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDatabase } from '@/contexts/DatabaseContext'
import type { BudgetCategory } from '@/db/schema'
import Card from '@/components/Card'
import ProgressBar from '@/components/ProgressBar'
import {
  DollarSign,
  Target,
  TrendingUp,
  Plus,
  CreditCard as Edit3,
  ChartPie as PieChart
} from 'lucide-react-native'

function BudgetContent () {
  const {
    budgetCategories,
    financialSettings,
    addBudgetCategory,
    updateBudgetCategory,
    deleteBudgetCategory,
    updateFinancialSettings,
    getTotalMonthlyExpenses,
    getRemainingBudget,
    getSavingsProgress
  } = useDatabase()

  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [showSavingsModal, setShowSavingsModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(
    null
  )
  const [totalExpenses, setTotalExpenses] = useState(0)

  const [incomeForm, setIncomeForm] = useState(
    financialSettings?.monthlyIncome?.toString() || '0'
  )
  const [savingsForm, setSavingsForm] = useState({
    goal: financialSettings?.savingsGoal?.toString() || '0',
    current: financialSettings?.currentSavings?.toString() || '0'
  })
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    limit: '',
    spent: ''
  })

  useEffect(() => {
    const loadTotalExpenses = async () => {
      const total = await getTotalMonthlyExpenses()
      setTotalExpenses(total)
    }
    loadTotalExpenses()
  }, [getTotalMonthlyExpenses])

  const remainingBudget = getRemainingBudget()
  const savingsProgress = getSavingsProgress()
  const totalBudgetAllocated = budgetCategories.reduce(
    (sum: number, cat: BudgetCategory) => sum + cat.limit,
    0
  )
  const totalSpent = budgetCategories.reduce(
    (sum: number, cat: BudgetCategory) => sum + (cat.spent || 0),
    0
  )

  const handleUpdateIncome = async () => {
    const income = parseFloat(incomeForm)
    if (isNaN(income) || income < 0) {
      Alert.alert('Error', 'Please enter a valid income amount')
      return
    }
    try {
      await updateFinancialSettings({ monthlyIncome: income })
      setShowIncomeModal(false)
    } catch (error) {
      console.error('Error updating income:', error)
      Alert.alert('Error', 'Failed to update income')
    }
  }

  const handleUpdateSavings = async () => {
    const goal = parseFloat(savingsForm.goal)
    const current = parseFloat(savingsForm.current)

    if (isNaN(goal) || goal < 0 || isNaN(current) || current < 0) {
      Alert.alert('Error', 'Please enter valid amounts')
      return
    }

    try {
      await updateFinancialSettings({
        savingsGoal: goal,
        currentSavings: current
      })
      setShowSavingsModal(false)
    } catch (error) {
      console.error('Error updating savings:', error)
      Alert.alert('Error', 'Failed to update savings')
    }
  }

  const handleSaveCategory = async () => {
    if (!categoryForm.name || !categoryForm.limit) {
      Alert.alert('Error', 'Please fill in category name and limit')
      return
    }

    const limit = parseFloat(categoryForm.limit)
    const spent = parseFloat(categoryForm.spent) || 0

    if (isNaN(limit) || limit < 0 || isNaN(spent) || spent < 0) {
      Alert.alert('Error', 'Please enter valid amounts')
      return
    }

    try {
      if (editingCategory) {
        await updateBudgetCategory(editingCategory.id, {
          name: categoryForm.name,
          limit,
          spent
        })
      } else {
        await addBudgetCategory({
          name: categoryForm.name,
          limit,
          spent
        })
      }
      resetCategoryForm()
    } catch (error) {
      console.error('Error saving category:', error)
      Alert.alert('Error', 'Failed to save category')
    }
  }

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', limit: '', spent: '' })
    setEditingCategory(null)
    setShowCategoryModal(false)
  }

  const handleEditCategory = (category: BudgetCategory) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      limit: category.limit.toString(),
      spent: (category.spent || 0).toString()
    })
    setShowCategoryModal(true)
  }

  const handleDeleteCategory = async (categoryId: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this budget category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBudgetCategory(categoryId)
            } catch (error) {
              console.error('Error deleting category:', error)
              Alert.alert('Error', 'Failed to delete category')
            }
          }
        }
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Budget Planning</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCategoryModal(true)}
        >
          <Plus size={20} color='#FFFFFF' />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Financial Overview */}
        <Card>
          <Text style={styles.sectionTitle}>Financial Overview</Text>

          <TouchableOpacity
            style={styles.overviewItem}
            onPress={() => setShowIncomeModal(true)}
          >
            <View style={styles.overviewLeft}>
              <DollarSign size={20} color='#059669' />
              <View>
                <Text style={styles.overviewLabel}>Monthly Income</Text>
                <Text style={styles.overviewAmount}>
                  ${(financialSettings?.monthlyIncome || 0).toLocaleString()}
                </Text>
              </View>
            </View>
            <Edit3 size={16} color='#6B7280' />
          </TouchableOpacity>

          <View style={styles.overviewItem}>
            <View style={styles.overviewLeft}>
              <TrendingUp size={20} color='#DC2626' />
              <View>
                <Text style={styles.overviewLabel}>Total Expenses</Text>
                <Text style={styles.overviewAmount}>
                  ${totalExpenses.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.overviewItem}>
            <View style={styles.overviewLeft}>
              <PieChart size={20} color='#2563EB' />
              <View>
                <Text style={styles.overviewLabel}>
                  {remainingBudget >= 0 ? 'Available Budget' : 'Over Budget'}
                </Text>
                <Text
                  style={[
                    styles.overviewAmount,
                    { color: remainingBudget >= 0 ? '#059669' : '#DC2626' }
                  ]}
                >
                  ${Math.abs(remainingBudget).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Savings Goal */}
        <Card>
          <TouchableOpacity onPress={() => setShowSavingsModal(true)}>
            <View style={styles.savingsHeader}>
              <View style={styles.savingsLeft}>
                <Target size={20} color='#2563EB' />
                <Text style={styles.sectionTitle}>Savings Goal</Text>
              </View>
              <Edit3 size={16} color='#6B7280' />
            </View>

            <View style={styles.savingsContent}>
              <Text style={styles.savingsAmount}>
                ${financialSettings?.currentSavings || 0} / $
                {financialSettings?.savingsGoal || 0}
              </Text>
              <ProgressBar
                progress={savingsProgress}
                color='#059669'
                showPercentage={true}
              />
              <Text style={styles.savingsRemaining}>
                $
                {Math.max(
                  0,
                  (financialSettings?.savingsGoal || 0) -
                    (financialSettings?.currentSavings || 0)
                )}{' '}
                remaining
              </Text>
            </View>
          </TouchableOpacity>
        </Card>

        {/* Budget Categories */}
        <Card>
          <Text style={styles.sectionTitle}>Budget Categories</Text>

          <View style={styles.budgetSummary}>
            <Text style={styles.budgetSummaryText}>
              Total Allocated: ${totalBudgetAllocated.toLocaleString()}
            </Text>
            <Text style={styles.budgetSummaryText}>
              Total Spent: ${totalSpent.toLocaleString()}
            </Text>
          </View>

          {budgetCategories.map((category: BudgetCategory) => {
            const spent = category.spent || 0
            const progress = (spent / category.limit) * 100
            const isOverBudget = spent > category.limit
            const remaining = category.limit - spent

            return (
              <View key={category.id} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <View style={styles.categoryActions}>
                    <TouchableOpacity
                      onPress={() => handleEditCategory(category)}
                    >
                      <Edit3 size={16} color='#2563EB' />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.categoryDetails}>
                  <Text style={styles.categoryAmount}>
                    ${spent} / ${category.limit}
                  </Text>
                  <Text
                    style={[
                      styles.categoryRemaining,
                      { color: isOverBudget ? '#DC2626' : '#059669' }
                    ]}
                  >
                    {isOverBudget
                      ? `$${Math.abs(remaining)} over budget`
                      : `$${remaining} remaining`}
                  </Text>
                </View>

                <ProgressBar
                  progress={progress}
                  color={isOverBudget ? '#DC2626' : '#2563EB'}
                />
              </View>
            )
          })}

          {budgetCategories.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No budget categories yet</Text>
              <Text style={styles.emptySubtext}>
                Add categories to track your spending
              </Text>
            </View>
          )}
        </Card>
      </ScrollView>

      {/* Income Modal */}
      <Modal visible={showIncomeModal} animationType='slide' transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Monthly Income</Text>

            <TextInput
              style={styles.input}
              placeholder='Monthly income'
              value={incomeForm}
              onChangeText={setIncomeForm}
              keyboardType='numeric'
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowIncomeModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdateIncome}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Savings Modal */}
      <Modal visible={showSavingsModal} animationType='slide' transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Savings</Text>

            <TextInput
              style={styles.input}
              placeholder='Savings goal'
              value={savingsForm.goal}
              onChangeText={text =>
                setSavingsForm({ ...savingsForm, goal: text })
              }
              keyboardType='numeric'
            />

            <TextInput
              style={styles.input}
              placeholder='Current savings'
              value={savingsForm.current}
              onChangeText={text =>
                setSavingsForm({ ...savingsForm, current: text })
              }
              keyboardType='numeric'
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowSavingsModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdateSavings}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} animationType='slide' transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder='Category name'
              value={categoryForm.name}
              onChangeText={text =>
                setCategoryForm({ ...categoryForm, name: text })
              }
            />

            <TextInput
              style={styles.input}
              placeholder='Budget limit'
              value={categoryForm.limit}
              onChangeText={text =>
                setCategoryForm({ ...categoryForm, limit: text })
              }
              keyboardType='numeric'
            />

            <TextInput
              style={styles.input}
              placeholder='Amount spent (optional)'
              value={categoryForm.spent}
              onChangeText={text =>
                setCategoryForm({ ...categoryForm, spent: text })
              }
              keyboardType='numeric'
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={resetCategoryForm}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              {editingCategory && (
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: '#FEE2E2' }]}
                  onPress={() => handleDeleteCategory(editingCategory.id)}
                >
                  <Text style={[styles.cancelButtonText, { color: '#DC2626' }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveCategory}
              >
                <Text style={styles.saveButtonText}>
                  {editingCategory ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

export default function Budget () {
  return <BudgetContent />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827'
  },
  addButton: {
    backgroundColor: '#EA580C',
    borderRadius: 50,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    flex: 1,
    paddingHorizontal: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16
  },
  overviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  overviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  overviewLabel: {
    fontSize: 14,
    color: '#6B7280'
  },
  overviewAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 2
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  savingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  savingsContent: {
    gap: 12
  },
  savingsAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151'
  },
  savingsRemaining: {
    fontSize: 14,
    color: '#6B7280'
  },
  budgetSummary: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  budgetSummaryText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4
  },
  categoryCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 12
  },
  categoryDetails: {
    marginBottom: 12
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4
  },
  categoryRemaining: {
    fontSize: 12,
    fontWeight: '500'
  },
  emptyState: {
    alignItems: 'center',
    padding: 40
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center'
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center'
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280'
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#EA580C',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center'
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF'
  }
})
