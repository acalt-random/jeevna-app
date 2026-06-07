import { DesktopShell } from '@/components/DesktopShell';
import { EmptyState } from '@/components/EmptyState';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { SectionCard } from '@/components/SectionCard';
import { Category, useAppData } from '@/context/AppDataContext';
import { useDeviceType } from '@/hooks/useDeviceType';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CategoryManagerScreen() {
  const [categoryName, setCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteBlockedMessage, setDeleteBlockedMessage] = useState('');
  const { categories, addCategory, updateCategory, deleteCategory } = useAppData();

  const clearForm = () => {
    setCategoryName('');
    setEditingId(null);
  };

  const handleStartEdit = (item: Category) => {
    setDeleteBlockedMessage('');
    setCategoryName(item.name);
    setEditingId(item.id);
  };

  const handleCancelEdit = () => {
    clearForm();
  };

  const handleSaveOrAddCategory = () => {
    if (!categoryName.trim()) {
      return;
    }
    if (editingId) {
      updateCategory(editingId, categoryName);
    } else {
      addCategory(categoryName);
    }
    clearForm();
  };

  const handleDeleteCategory = (id: string) => {
    setDeleteBlockedMessage('');
    if (editingId === id) {
      clearForm();
    }
    const deleted = deleteCategory(id);
    if (!deleted) {
      setDeleteBlockedMessage('Cannot delete category because KPIs are linked to it');
    }
  };

  const deviceType = useDeviceType();

  const pageContent = (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <PageContainer>
        <PageHeader
          title="Categories"
          subtitle="Create and manage categories for your KPIs."
        />
        <SectionCard>
          <TextInput
            style={styles.input}
            value={categoryName}
            onChangeText={setCategoryName}
            placeholder="Enter category name"
            placeholderTextColor="#888"
          />
          <TouchableOpacity style={styles.button} onPress={handleSaveOrAddCategory}>
            <Text style={styles.buttonText}>{editingId ? 'Save Category' : 'Add Category'}</Text>
          </TouchableOpacity>
          {editingId ? (
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit} activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>Cancel Edit</Text>
            </TouchableOpacity>
          ) : null}
        </SectionCard>
        {deleteBlockedMessage ? (
          <Text style={styles.blockedMessage}>{deleteBlockedMessage}</Text>
        ) : null}
        {categories.length === 0 ? (
          <EmptyState
            title="No Categories Yet"
            message="Create your first category to organize your KPIs."
          />
        ) : (
          categories.map((item) => (
            <SectionCard key={item.id}>
              <Text style={styles.categoryText}>{item.name}</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleStartEdit(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteCategory(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </SectionCard>
          ))
        )}
      </PageContainer>
    </ScrollView>
  );

  if (deviceType === 'desktop') {
    return (
      <DesktopShell title="Categories">
        {pageContent}
      </DesktopShell>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {pageContent}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: 'white',
    backgroundColor: '#1e293b',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 10,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#64748b',
    backgroundColor: '#1e293b',
  },
  cancelButtonText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '600',
  },
  blockedMessage: {
    fontSize: 15,
    color: '#fca5a5',
    marginBottom: 12,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  categoryText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    flex: 1,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    backgroundColor: '#172554',
  },
  editButtonText: {
    color: '#93c5fd',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    flex: 1,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc2626',
    backgroundColor: '#450a0a',
  },
  deleteButtonText: {
    color: '#fca5a5',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
