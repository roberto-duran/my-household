import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Modal,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DataProvider, useData, GroceryList, GroceryItem } from '@/contexts/DataContext';
import Card from '@/components/Card';
import { Plus, ShoppingCart, MapPin, TrendingUp, CircleCheck as CheckCircle, Circle, CreditCard as Edit3, Trash2 } from 'lucide-react-native';

function GroceryContent() {
  const { groceryLists, addGroceryList, updateGroceryList, deleteGroceryList } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [selectedList, setSelectedList] = useState<GroceryList | null>(null);
  const [editingList, setEditingList] = useState<GroceryList | null>(null);

  const [listForm, setListForm] = useState({
    name: '',
    storeLocation: '',
  });

  const [itemForm, setItemForm] = useState({
    name: '',
    quantity: '1',
    pricePerUnit: '',
  });

  const [currentItems, setCurrentItems] = useState<Omit<GroceryItem, 'id'>[]>([]);

  const handleCreateList = () => {
    if (!listForm.name) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    const newList: Omit<GroceryList, 'id'> = {
      name: listForm.name,
      createdDate: new Date().toISOString(),
      items: currentItems.map((item, index) => ({
        ...item,
        id: (Date.now() + index).toString(),
        isPurchased: false,
        storeLocation: listForm.storeLocation,
        priceHistory: [{ date: new Date().toISOString(), price: item.pricePerUnit }],
      })),
      totalCost: currentItems.reduce((sum, item) => sum + item.totalCost, 0),
    };

    if (editingList) {
      updateGroceryList(editingList.id, newList);
    } else {
      addGroceryList(newList);
    }

    resetForm();
  };

  const addItemToList = () => {
    if (!itemForm.name || !itemForm.pricePerUnit) {
      Alert.alert('Error', 'Please fill in item name and price');
      return;
    }

    const quantity = parseInt(itemForm.quantity) || 1;
    const pricePerUnit = parseFloat(itemForm.pricePerUnit);
    const totalCost = quantity * pricePerUnit;

    const newItem: Omit<GroceryItem, 'id'> = {
      name: itemForm.name,
      quantity,
      pricePerUnit,
      totalCost,
      isPurchased: false,
      storeLocation: listForm.storeLocation,
      priceHistory: [],
    };

    setCurrentItems([...currentItems, newItem]);
    setItemForm({ name: '', quantity: '1', pricePerUnit: '' });
  };

  const removeItemFromList = (index: number) => {
    setCurrentItems(currentItems.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setListForm({ name: '', storeLocation: '' });
    setItemForm({ name: '', quantity: '1', pricePerUnit: '' });
    setCurrentItems([]);
    setShowAddModal(false);
    setEditingList(null);
  };

  const openListDetails = (list: GroceryList) => {
    setSelectedList(list);
    setShowListModal(true);
  };

  const toggleItemPurchased = (listId: string, itemId: string) => {
    const list = groceryLists.find(l => l.id === listId);
    if (!list) return;

    const updatedItems = list.items.map(item => 
      item.id === itemId ? { ...item, isPurchased: !item.isPurchased } : item
    );

    updateGroceryList(listId, { items: updatedItems });
    
    if (selectedList?.id === listId) {
      setSelectedList({ ...list, items: updatedItems });
    }
  };

  const handleEditList = (list: GroceryList) => {
    setEditingList(list);
    setListForm({ name: list.name, storeLocation: list.items[0]?.storeLocation || '' });
    setCurrentItems(list.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      pricePerUnit: item.pricePerUnit,
      totalCost: item.totalCost,
      isPurchased: item.isPurchased,
      storeLocation: item.storeLocation,
      priceHistory: item.priceHistory,
    })));
    setShowAddModal(true);
  };

  const handleDeleteList = (list: GroceryList) => {
    Alert.alert(
      'Delete List',
      `Are you sure you want to delete "${list.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteGroceryList(list.id) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Grocery Lists</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {groceryLists.map((list) => {
          const completedItems = list.items.filter(item => item.isPurchased).length;
          const completionPercentage = (completedItems / list.items.length) * 100;

          return (
            <Card key={list.id}>
              <TouchableOpacity onPress={() => openListDetails(list)}>
                <View style={styles.listHeader}>
                  <View style={styles.listInfo}>
                    <Text style={styles.listName}>{list.name}</Text>
                    <View style={styles.listMeta}>
                      <View style={styles.metaItem}>
                        <MapPin size={12} color="#6B7280" />
                        <Text style={styles.metaText}>
                          {list.items[0]?.storeLocation || 'No location'}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <ShoppingCart size={12} color="#6B7280" />
                        <Text style={styles.metaText}>
                          {completedItems}/{list.items.length} items
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.listStats}>
                    <Text style={styles.totalCost}>${list.totalCost.toFixed(2)}</Text>
                    <View style={styles.progressBar}>
                      <View 
                        style={[styles.progressFill, { width: `${completionPercentage}%` }]} 
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.listActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditList(list)}
                  >
                    <Edit3 size={16} color="#2563EB" />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteList(list)}
                  >
                    <Trash2 size={16} color="#DC2626" />
                    <Text style={[styles.actionText, { color: '#DC2626' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Card>
          );
        })}

        {groceryLists.length === 0 && (
          <Card>
            <View style={styles.emptyState}>
              <ShoppingCart size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No grocery lists yet</Text>
              <Text style={styles.emptySubtext}>Create your first shopping list to get started</Text>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Add/Edit List Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingList ? 'Edit List' : 'Create New List'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="List name"
              value={listForm.name}
              onChangeText={(text) => setListForm({ ...listForm, name: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Store location (optional)"
              value={listForm.storeLocation}
              onChangeText={(text) => setListForm({ ...listForm, storeLocation: text })}
            />

            <Text style={styles.sectionTitle}>Items</Text>
            
            <View style={styles.itemForm}>
              <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="Item name"
                value={itemForm.name}
                onChangeText={(text) => setItemForm({ ...itemForm, name: text })}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Qty"
                value={itemForm.quantity}
                onChangeText={(text) => setItemForm({ ...itemForm, quantity: text })}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Price"
                value={itemForm.pricePerUnit}
                onChangeText={(text) => setItemForm({ ...itemForm, pricePerUnit: text })}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.addItemButton} onPress={addItemToList}>
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
              {currentItems.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDetails}>
                    {item.quantity} × ${item.pricePerUnit.toFixed(2)} = ${item.totalCost.toFixed(2)}
                  </Text>
                  <TouchableOpacity onPress={() => removeItemFromList(index)}>
                    <Trash2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleCreateList}>
                <Text style={styles.saveButtonText}>
                  {editingList ? 'Update' : 'Create'} List
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* List Details Modal */}
      <Modal visible={showListModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedList && (
              <>
                <View style={styles.detailsHeader}>
                  <Text style={styles.modalTitle}>{selectedList.name}</Text>
                  <TouchableOpacity onPress={() => setShowListModal(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {selectedList.items.map((item) => (
                    <View key={item.id} style={styles.detailItem}>
                      <TouchableOpacity
                        style={styles.itemCheckbox}
                        onPress={() => toggleItemPurchased(selectedList.id, item.id)}
                      >
                        {item.isPurchased ? (
                          <CheckCircle size={20} color="#059669" />
                        ) : (
                          <Circle size={20} color="#6B7280" />
                        )}
                      </TouchableOpacity>
                      
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, item.isPurchased && styles.purchasedItem]}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemPrice}>
                          {item.quantity} × ${item.pricePerUnit.toFixed(2)} = ${item.totalCost.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))}
                  
                  <View style={styles.totalSection}>
                    <Text style={styles.totalLabel}>Total Cost:</Text>
                    <Text style={styles.totalAmount}>${selectedList.totalCost.toFixed(2)}</Text>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function Grocery() {
  return (
    <DataProvider>
      <GroceryContent />
    </DataProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#059669',
    borderRadius: 50,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  listMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  listStats: {
    alignItems: 'flex-end',
    gap: 8,
  },
  totalCost: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  progressBar: {
    width: 80,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 2,
  },
  listActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemForm: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 16,
  },
  addItemButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemsList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  itemDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '300',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemCheckbox: {
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  purchasedItem: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  itemPrice: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
});