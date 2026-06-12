import { MaterialIcons } from '@expo/vector-icons';
import { EmptyState } from '@/components/EmptyState';
import { useAppData } from '@/context/AppDataContext';
import { useTheme } from '@/context/ThemeContext';
import {
  groupSearchResults,
  SearchEntityType,
  SearchResult,
  searchEntities,
  buildSearchIndex,
} from '@/services/searchEngine';
import { templatePacks } from '@/src/data/templatePacks';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

function todayYMD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function getResultIcon(type: SearchEntityType) {
  if (type === 'category') return 'category';
  if (type === 'kpi') return 'query-stats';
  if (type === 'activity') return 'check-circle-outline';
  if (type === 'relationship') return 'people-outline';
  return 'dashboard-customize';
}

function getGroupLabel(type: SearchEntityType) {
  if (type === 'category') return 'Categories';
  if (type === 'kpi') return 'KPIs';
  if (type === 'activity') return 'Activities';
  if (type === 'relationship') return 'Relationships';
  return 'Templates';
}

function SearchResultCard({
  result,
  onPrimaryAction,
  onSecondaryAction,
}: {
  result: SearchResult;
  onPrimaryAction: (result: SearchResult) => void;
  onSecondaryAction?: (result: SearchResult) => void;
}) {
  const { theme } = useTheme();

  const primaryLabel =
    result.type === 'category'
      ? 'Open Category'
      : result.type === 'kpi'
        ? 'Open KPI'
        : result.type === 'activity'
          ? 'Open Activity'
          : result.type === 'relationship'
            ? 'Open Relationship'
            : 'Activate Template';

  const secondaryLabel = result.type === 'activity' ? 'Complete Activity' : undefined;

  return (
    <View
      style={[
        styles.resultCard,
        {
          backgroundColor: theme.background,
          borderColor: theme.cardBorder,
          borderRadius: theme.borderRadius.md,
        },
      ]}>
      <View style={styles.resultHeader}>
        <View style={styles.resultTitleRow}>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: theme.secondaryBackground,
                borderColor: theme.cardBorder,
                borderRadius: theme.borderRadius.sm,
              },
            ]}>
            <MaterialIcons
              name={getResultIcon(result.type) as never}
              size={16}
              color={theme.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.resultTitle, { color: theme.textPrimary }]}>{result.title}</Text>
            {result.subtitle ? (
              <Text style={[styles.resultSubtitle, { color: theme.textSecondary }]}>
                {result.subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.resultActions}>
        <TouchableOpacity
          style={[
            styles.primaryAction,
            {
              backgroundColor: theme.buttonPrimary,
              borderRadius: theme.borderRadius.sm,
            },
          ]}
          onPress={() => onPrimaryAction(result)}
          activeOpacity={0.85}>
          <Text style={styles.primaryActionText}>{primaryLabel}</Text>
        </TouchableOpacity>
        {secondaryLabel && onSecondaryAction ? (
          <TouchableOpacity
            style={[
              styles.secondaryAction,
              {
                backgroundColor: theme.buttonSecondary,
                borderColor: theme.cardBorder,
                borderRadius: theme.borderRadius.sm,
              },
            ]}
            onPress={() => onSecondaryAction(result)}
            activeOpacity={0.85}>
            <Text style={[styles.secondaryActionText, { color: theme.textPrimary }]}>
              {secondaryLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export function GlobalSearchButton({ compact = false }: { compact?: boolean }) {
  const { theme } = useTheme();
  const router = useRouter();
  const {
    categories,
    kpis,
    subtasks,
    people,
    toggleSubtaskLog,
    applyTemplatePack,
  } = useAppData();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');

  const searchIndex = useMemo(
    () =>
      buildSearchIndex({
        categories,
        kpis,
        subtasks,
        people,
        templates: templatePacks,
      }),
    [categories, kpis, subtasks, people]
  );

  const results = useMemo(() => searchEntities(query, searchIndex), [query, searchIndex]);
  const groupedResults = useMemo(() => groupSearchResults(results), [results]);

  const relationshipCategoryName = useMemo(() => {
    const match = categories.find((category) => {
      const lower = category.name.toLowerCase();
      return lower.includes('relationship') || lower.includes('social') || lower.includes('people');
    });
    return match?.name;
  }, [categories]);

  const close = () => {
    setVisible(false);
    setQuery('');
  };

  const handlePrimaryAction = (result: SearchResult) => {
    if (result.type === 'category' && result.categoryName) {
      router.push({
        pathname: '/category/[categoryName]',
        params: { categoryName: result.categoryName },
      });
      close();
      return;
    }

    if (result.type === 'kpi') {
      router.push('/(tabs)/kpis');
      close();
      return;
    }

    if (result.type === 'activity' && result.categoryName) {
      router.push({
        pathname: '/category/[categoryName]',
        params: { categoryName: result.categoryName },
      });
      close();
      return;
    }

    if (result.type === 'relationship') {
      if (relationshipCategoryName) {
        router.push({
          pathname: '/category/[categoryName]',
          params: { categoryName: relationshipCategoryName },
        });
      } else {
        router.push('/(tabs)');
      }
      close();
      return;
    }

    if (result.type === 'template' && result.templateId) {
      const template = templatePacks.find((item) => item.id === result.templateId);
      if (template) {
        const { id, title, blurb, ...payload } = template;
        applyTemplatePack(payload);
      }
      close();
    }
  };

  const handleSecondaryAction = (result: SearchResult) => {
    if (result.type === 'activity' && result.subtaskId) {
      toggleSubtaskLog(result.subtaskId, todayYMD());
      close();
    }
  };

  const orderedTypes: SearchEntityType[] = ['category', 'kpi', 'activity', 'relationship', 'template'];

  return (
    <>
      <TouchableOpacity
        style={[
          compact ? styles.compactTrigger : styles.triggerButton,
          {
            backgroundColor: theme.buttonSecondary,
            borderColor: theme.cardBorder,
            borderRadius: theme.borderRadius.md,
          },
        ]}
        onPress={() => setVisible(true)}
        activeOpacity={0.85}>
        <MaterialIcons name="search" size={18} color={theme.textPrimary} />
        {!compact ? (
          <Text style={[styles.triggerText, { color: theme.textPrimary }]}>Search</Text>
        ) : null}
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.modalOverlay} onPress={close}>
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.cardBorder,
                borderRadius: theme.borderRadius.xl,
              },
            ]}
            onPress={(event) => event.stopPropagation?.()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Global Search</Text>
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: theme.buttonSecondary,
                    borderColor: theme.cardBorder,
                    borderRadius: theme.borderRadius.sm,
                  },
                ]}
                onPress={close}
                activeOpacity={0.85}>
                <MaterialIcons name="close" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.searchInputWrap,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.cardBorder,
                  borderRadius: theme.borderRadius.md,
                },
              ]}>
              <MaterialIcons name="search" size={18} color={theme.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search categories, KPIs, activities, relationships, templates..."
                placeholderTextColor={theme.textMuted}
                autoFocus
                style={[styles.searchInput, { color: theme.textPrimary }]}
              />
            </View>

            <ScrollView style={styles.resultsScroll} contentContainerStyle={styles.resultsContent}>
              {!query.trim() ? (
                <EmptyState
                  title="Search everything"
                  message="Find categories, KPIs, activities, relationships, and templates from one place."
                />
              ) : results.length === 0 ? (
                <EmptyState
                  title="No matches"
                  message="Try a shorter keyword or another phrase. Search works locally and updates in real time."
                />
              ) : (
                orderedTypes.map((type) => {
                  const items = groupedResults[type];
                  if (items.length === 0) return null;

                  return (
                    <View key={type} style={styles.groupSection}>
                      <Text style={[styles.groupTitle, { color: theme.textPrimary }]}>
                        {getGroupLabel(type)}
                      </Text>
                      {items.map((result) => (
                        <SearchResultCard
                          key={result.id}
                          result={result}
                          onPrimaryAction={handlePrimaryAction}
                          onSecondaryAction={handleSecondaryAction}
                        />
                      ))}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerButton: {
    minHeight: 40,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactTrigger: {
    width: 40,
    height: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.56)',
    padding: 18,
    justifyContent: 'center',
  },
  modalCard: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    maxHeight: '88%',
    borderWidth: 1,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInputWrap: {
    minHeight: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    paddingBottom: 4,
  },
  groupSection: {
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  resultCard: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  resultHeader: {
    marginBottom: 10,
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  resultActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  primaryAction: {
    minHeight: 34,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  secondaryAction: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
