import { DesktopShell } from '@/components/DesktopShell';
import { EmptyState } from '@/components/EmptyState';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { ResponsiveGrid, ResponsiveGridItem } from '@/components/ResponsiveGrid';
import { SectionCard } from '@/components/SectionCard';
import { useAppData } from '@/context/AppDataContext';
import { useTheme } from '@/context/ThemeContext';
import { useDeviceType } from '@/hooks/useDeviceType';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CategoryManagerScreen() {
  const { categories, kpis, entries, latestActuals, addCategory, updateCategory, deleteCategory } =
    useAppData();
  const { theme } = useTheme();
  const deviceType = useDeviceType();
  const router = useRouter();

  const [categoryName, setCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteBlockedMessage, setDeleteBlockedMessage] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const latestEntryActuals = useMemo(() => {
    if (entries.length === 0) return latestActuals;
    const latestEntry = [...entries].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
    return latestEntry?.actuals ?? latestActuals;
  }, [entries, latestActuals]);

  const categoryCards = useMemo(() => {
    return categories.map((category) => {
      const categoryKpis = kpis.filter((kpi) => kpi.category === category.name);
      const totalWeight = categoryKpis.reduce((sum, kpi) => sum + kpi.weight, 0);
      const scoredWeight = categoryKpis.reduce((sum, kpi) => {
        const rawActual = latestEntryActuals[kpi.id];
        const parsedActual = parseFloat(rawActual || '0');
        const safeActual = Number.isNaN(parsedActual) ? 0 : parsedActual;
        const contribution =
          kpi.target > 0 ? Math.min(kpi.weight, (safeActual / kpi.target) * kpi.weight) : 0;
        return sum + contribution;
      }, 0);

      const score = totalWeight > 0 ? Math.round((scoredWeight / totalWeight) * 100) : null;
      const topKpis = categoryKpis.slice(0, 3).map((kpi) => {
        const latestActual = latestEntryActuals[kpi.id];
        const parsedActual = parseFloat(latestActual || '0');
        const progress =
          latestActual !== undefined && latestActual !== '' && !Number.isNaN(parsedActual) && kpi.target > 0
            ? Math.min(100, Math.round((parsedActual / kpi.target) * 100))
            : null;

        return {
          ...kpi,
          latestActual: latestActual ?? null,
          progress,
        };
      });

      return {
        ...category,
        score,
        kpiCount: categoryKpis.length,
        topKpis,
      };
    });
  }, [categories, kpis, latestEntryActuals]);

  const clearForm = () => {
    setCategoryName('');
    setEditingId(null);
    setIsFormOpen(false);
  };

  const openAddModal = () => {
    setDeleteBlockedMessage('');
    setCategoryName('');
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleStartEdit = (category: { id: string; name: string }) => {
    setDeleteBlockedMessage('');
    setCategoryName(category.name);
    setEditingId(category.id);
    setIsFormOpen(true);
  };

  const handleSaveOrAddCategory = () => {
    if (!categoryName.trim()) return;

    if (editingId) {
      updateCategory(editingId, categoryName);
    } else {
      addCategory(categoryName);
    }

    clearForm();
  };

  const handleDeleteCategory = (id: string) => {
    setDeleteBlockedMessage('');
    const deleted = deleteCategory(id);
    if (!deleted) {
      setDeleteBlockedMessage('Cannot delete category because KPIs are linked to it');
      return;
    }

    if (editingId === id) {
      clearForm();
    }
  };

  const pageContent = (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <PageContainer>
        <PageHeader
          title="Categories"
          subtitle="Manage life areas."
          rightAccessory={
            <TouchableOpacity
              style={[
                styles.addButton,
                {
                  backgroundColor: theme.buttonPrimary,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
              onPress={openAddModal}
              activeOpacity={0.8}>
              <Text style={styles.addButtonText}>+ Add Category</Text>
            </TouchableOpacity>
          }
        />

        {deleteBlockedMessage ? (
          <Text style={[styles.blockedMessage, { color: theme.danger }]}>{deleteBlockedMessage}</Text>
        ) : null}

        {categories.length === 0 ? (
          <EmptyState
            title="No Categories Yet"
            message="Create your first category to organize your KPIs."
          />
        ) : (
          <ResponsiveGrid gap={14}>
            {categoryCards.map((category) => (
              <ResponsiveGridItem
                key={category.id}
                mobileSpan={1}
                tabletSpan={3}
                desktopSpan={4}>
                <SectionCard>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push({
                        pathname: '/category/[categoryName]',
                        params: { categoryName: category.name },
                      })
                    }>
                    <View style={styles.categoryHeader}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={[styles.categoryName, { color: theme.textPrimary }]}>
                          {category.name}
                        </Text>
                        <Text style={[styles.categoryMeta, { color: theme.textSecondary }]}>
                          {category.kpiCount} KPI{category.kpiCount === 1 ? '' : 's'}
                        </Text>
                      </View>
                      <Text style={[styles.categoryScore, { color: theme.primary }]}>
                        {category.score !== null ? `${category.score}/100` : '—'}
                      </Text>
                    </View>

                    {category.topKpis.length === 0 ? (
                      <Text style={[styles.emptyCategoryText, { color: theme.textSecondary }]}>
                        No KPIs yet. Add one to start tracking this area.
                      </Text>
                    ) : (
                      <View style={styles.kpiPreviewList}>
                        {category.topKpis.map((kpi) => (
                          <View
                            key={kpi.id}
                            style={[styles.kpiPreviewRow, { borderBottomColor: theme.cardBorder }]}>
                            <View style={{ flex: 1, paddingRight: 8 }}>
                              <Text style={[styles.kpiPreviewName, { color: theme.textPrimary }]}>
                                {kpi.name}
                              </Text>
                              <Text style={[styles.kpiPreviewMeta, { color: theme.textSecondary }]}>
                                Target: {kpi.target} {kpi.unit}
                              </Text>
                              <Text style={[styles.kpiPreviewMeta, { color: theme.textSecondary }]}>
                                Latest actual:{' '}
                                {kpi.latestActual ? `${kpi.latestActual} ${kpi.unit}` : 'No entries yet'}
                              </Text>
                            </View>
                            <Text style={[styles.kpiPreviewScore, { color: theme.primary }]}>
                              {kpi.progress !== null ? `${kpi.progress}%` : '—'}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[
                        styles.secondaryButton,
                        {
                          backgroundColor: theme.buttonSecondary,
                          borderColor: theme.cardBorder,
                          borderRadius: theme.borderRadius.sm,
                        },
                      ]}
                      onPress={() =>
                        router.push({
                          pathname: '/category/[categoryName]',
                          params: { categoryName: category.name },
                        })
                      }
                      activeOpacity={0.8}>
                      <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
                        View all KPIs
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.secondaryButton,
                        {
                          backgroundColor: theme.buttonSecondary,
                          borderColor: theme.cardBorder,
                          borderRadius: theme.borderRadius.sm,
                        },
                      ]}
                      onPress={() => handleStartEdit(category)}
                      activeOpacity={0.8}>
                      <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
                        Edit
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.secondaryButton,
                        {
                          backgroundColor: theme.buttonSecondary,
                          borderColor: theme.danger,
                          borderRadius: theme.borderRadius.sm,
                        },
                      ]}
                      onPress={() => handleDeleteCategory(category.id)}
                      activeOpacity={0.8}>
                      <Text style={[styles.secondaryButtonText, { color: theme.danger }]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </SectionCard>
              </ResponsiveGridItem>
            ))}
          </ResponsiveGrid>
        )}

        <Modal
          visible={isFormOpen}
          transparent
          animationType="fade"
          onRequestClose={clearForm}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={clearForm}
            />
            <View
              style={[
                styles.formModalCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                  borderRadius: theme.borderRadius.lg,
                },
              ]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {editingId ? 'Edit Category' : 'Add Category'}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: theme.cardBorder,
                    borderRadius: theme.borderRadius.md,
                    color: theme.textPrimary,
                    backgroundColor: theme.inputBackground,
                  },
                ]}
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder="Enter category name"
                placeholderTextColor={theme.textMuted}
                autoFocus
              />
              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: theme.buttonPrimary,
                      borderRadius: theme.borderRadius.md,
                    },
                  ]}
                  onPress={handleSaveOrAddCategory}
                  activeOpacity={0.8}>
                  <Text style={styles.primaryButtonText}>
                    {editingId ? 'Save Category' : 'Add Category'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    {
                      backgroundColor: theme.buttonSecondary,
                      borderColor: theme.cardBorder,
                      borderRadius: theme.borderRadius.md,
                    },
                  ]}
                  onPress={clearForm}
                  activeOpacity={0.8}>
                  <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </PageContainer>
    </ScrollView>
  );

  if (deviceType === 'desktop') {
    return <DesktopShell title="Categories">{pageContent}</DesktopShell>;
  }

  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>{pageContent}</SafeAreaView>;
}

const styles = StyleSheet.create({
  addButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  blockedMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  categoryMeta: {
    fontSize: 14,
  },
  categoryScore: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyCategoryText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  kpiPreviewList: {
    marginBottom: 14,
  },
  kpiPreviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  kpiPreviewName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  kpiPreviewMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  kpiPreviewScore: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  formModalCard: {
    width: '100%',
    maxWidth: 520,
    borderWidth: 1,
    padding: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
    marginBottom: 14,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
