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
import type { Expense } from '@/db/schema'
import Card from '@/components/Card'
import {
  Plus,
  CreditCard as Edit3,
  Trash2,
  Calendar,
  CircleCheck as CheckCircle,
  Circle,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react-native'

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

function ExpensesContent () {
  const { expenses, addExpense, updateExpense, deleteExpense } = useDatabase()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [filterCategory, setFilterCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'Utilities',
    dueDate: '',
    chargeDay: '',
    isRecurring: false
  })

  const categories = [
    'All',
    'Housing',
    'Utilities',
    'Groceries',
    'Transportation',
    'Entertainment',
    'Healthcare',
    'Other'
  ]

  // Filter expenses by current month
  const monthlyExpenses = expenses.filter(
    expense => expense.month === currentMonth
  )

  const filteredExpenses = monthlyExpenses.filter(expense => {
    const matchesCategory =
      filterCategory === 'All' || expense.category === filterCategory
    const matchesSearch = expense.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

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

  const handleSave = () => {
    if (!formData.name || !formData.amount) {
      Alert.alert('Error', 'Please fill in name and amount')
      return
    }

    if (formData.isRecurring && !formData.chargeDay) {
      Alert.alert('Error', 'Please set charge day for recurring expenses')
      return
    }

    if (!formData.isRecurring && !formData.dueDate) {
      Alert.alert('Error', 'Please set due date for one-time expenses')
      return
    }

    let dueDate = formData.dueDate

    // For recurring expenses, calculate due date from charge day
    if (formData.isRecurring && formData.chargeDay) {
      const [year, month] = currentMonth.split('-').map(Number)
      const chargeDate = new Date(year, month - 1, parseInt(formData.chargeDay))
      dueDate = chargeDate.toISOString().split('T')[0]
    }

    const expenseData = {
      name: formData.name,
      amount: parseFloat(formData.amount),
      category: formData.category,
      dueDate,
      month: currentMonth,
      chargeDay: formData.isRecurring ? parseInt(formData.chargeDay) : null,
      isPaid: false,
      isRecurring: formData.isRecurring
    }

    if (editingExpense) {
      updateExpense(editingExpense.id, expenseData)
    } else {
      addExpense(expenseData)
    }

    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      category: 'Utilities',
      dueDate: '',
      chargeDay: '',
      isRecurring: false
    })
    setShowAddModal(false)
    setEditingExpense(null)
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      name: expense.name,
      amount: expense.amount.toString(),
      category: expense.category,
      dueDate: expense.dueDate,
      chargeDay: expense.chargeDay?.toString() || '',
      isRecurring: Boolean(expense.isRecurring)
    })
    setShowAddModal(true)
  }

  const togglePaidStatus = (expense: Expense) => {
    updateExpense(expense.id, { isPaid: !expense.isPaid })
  }

  const handleDelete = (expense: Expense) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteExpense(expense.id)
        }
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color='#FFFFFF' />
        </TouchableOpacity>
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

      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder='Search expenses...'
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                filterCategory === category && styles.activeFilterChip
              ]}
              onPress={() => setFilterCategory(category)}
            >
              <Text
                style={[
                  styles.filterText,
                  filterCategory === category && styles.activeFilterText
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredExpenses.map(expense => (
          <Card key={expense.id}>
            <View style={styles.expenseItem}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => togglePaidStatus(expense)}
              >
                {expense.isPaid ? (
                  <CheckCircle size={24} color='#059669' />
                ) : (
                  <Circle size={24} color='#6B7280' />
                )}
              </TouchableOpacity>

              <View style={styles.expenseInfo}>
                <Text
                  style={[
                    styles.expenseName,
                    expense.isPaid && styles.paidText
                  ]}
                >
                  {expense.name}
                </Text>
                <View style={styles.expenseDetails}>
                  <Text style={styles.expenseCategory}>{expense.category}</Text>
                  <View style={styles.dateContainer}>
                    <Calendar size={12} color='#6B7280' />
                    <Text style={styles.expenseDate}>
                      Due: {new Date(expense.dueDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                {expense.isRecurring && (
                  <Text style={styles.recurringBadge}>Recurring</Text>
                )}
              </View>

              <View style={styles.expenseActions}>
                <Text
                  style={[
                    styles.expenseAmount,
                    expense.isPaid && styles.paidAmount
                  ]}
                >
                  ${expense.amount.toFixed(2)}
                </Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEdit(expense)}
                  >
                    <Edit3 size={16} color='#2563EB' />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(expense)}
                  >
                    <Trash2 size={16} color='#DC2626' />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Card>
        ))}

        {filteredExpenses.length === 0 && (
          <Card>
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No expenses found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || filterCategory !== 'All'
                  ? 'Try adjusting your search or filters'
                  : 'Add your first expense to get started'}
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} animationType='slide' transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder='Expense name'
              value={formData.name}
              onChangeText={text => setFormData({ ...formData, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder='Amount'
              value={formData.amount}
              onChangeText={text => setFormData({ ...formData, amount: text })}
              keyboardType='numeric'
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.slice(1).map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      formData.category === category && styles.selectedCategory
                    ]}
                    onPress={() => setFormData({ ...formData, category })}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        formData.category === category &&
                          styles.selectedCategoryText
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={styles.recurringToggle}
              onPress={() =>
                setFormData({ ...formData, isRecurring: !formData.isRecurring })
              }
            >
              <View
                style={[
                  styles.checkbox,
                  formData.isRecurring && styles.checkedBox
                ]}
              >
                {formData.isRecurring && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.recurringText}>
                Recurring monthly expense
              </Text>
            </TouchableOpacity>

            {formData.isRecurring ? (
              <View>
                <Text style={styles.inputLabel}>
                  Charge day of month (1-31)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder='15'
                  value={formData.chargeDay}
                  onChangeText={text =>
                    setFormData({ ...formData, chargeDay: text })
                  }
                  keyboardType='numeric'
                />
              </View>
            ) : (
              <View>
                <Text style={styles.inputLabel}>Due date</Text>
                <TextInput
                  style={styles.input}
                  placeholder='YYYY-MM-DD'
                  value={formData.dueDate}
                  onChangeText={text =>
                    setFormData({ ...formData, dueDate: text })
                  }
                />
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editingExpense ? 'Update' : 'Add'} Expense
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

export default function Expenses () {
  return <ExpensesContent />
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
    backgroundColor: '#2563EB',
    borderRadius: 50,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6'
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827'
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 10
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  filterScroll: {
    flexDirection: 'row'
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  activeFilterChip: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB'
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500'
  },
  activeFilterText: {
    color: '#FFFFFF'
  },
  content: {
    flex: 1,
    paddingHorizontal: 20
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  checkboxContainer: {
    padding: 4
  },
  expenseInfo: {
    flex: 1
  },
  expenseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4
  },
  paidText: {
    textDecorationLine: 'line-through',
    color: '#6B7280'
  },
  expenseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  expenseCategory: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  expenseDate: {
    fontSize: 12,
    color: '#6B7280'
  },
  recurringBadge: {
    fontSize: 10,
    color: '#059669',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  expenseActions: {
    alignItems: 'flex-end'
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8
  },
  paidAmount: {
    color: '#6B7280'
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6'
  },
  emptyState: {
    alignItems: 'center',
    padding: 40
  },
  emptyText: {
    fontSize: 18,
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
    maxHeight: '80%'
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  pickerContainer: {
    marginBottom: 16
  },
  categoryOption: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8
  },
  selectedCategory: {
    backgroundColor: '#2563EB'
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500'
  },
  selectedCategoryText: {
    color: '#FFFFFF'
  },
  recurringToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkedBox: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB'
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  recurringText: {
    fontSize: 16,
    color: '#374151'
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
    backgroundColor: '#2563EB',
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
