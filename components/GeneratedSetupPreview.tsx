import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { ReminderPreferences } from '@/context/PreferencesContext';
import { useTheme } from '@/context/ThemeContext';
import {
  GeneratedOnboardingCategory,
  GeneratedOnboardingKpi,
  GeneratedOnboardingSetup,
  GeneratedRelationshipTracker,
} from '@/types/onboarding';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type ActivityField = 'name' | 'frequency' | 'targetCount';
type KpiField = 'name' | 'target' | 'unit' | 'weight';
type RelationshipField = 'name' | 'relationshipType' | 'groupName' | 'frequency' | 'todoTitle' | 'notes';

interface GeneratedSetupPreviewProps {
  setup: GeneratedOnboardingSetup;
  editable: boolean;
  onChangeSummary: (value: string) => void;
  onUpdateCategoryName: (categoryId: string, value: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddCategory: () => void;
  onAddKpi: (categoryId: string) => void;
  onUpdateKpi: (categoryId: string, kpiId: string, field: KpiField, value: string) => void;
  onDeleteKpi: (categoryId: string, kpiId: string) => void;
  onAddActivity: (categoryId: string, kpiId: string) => void;
  onUpdateActivity: (
    categoryId: string,
    kpiId: string,
    activityId: string,
    field: ActivityField,
    value: string
  ) => void;
  onDeleteActivity: (categoryId: string, kpiId: string, activityId: string) => void;
  onUpdateReminderPreference: (key: keyof ReminderPreferences, value: boolean) => void;
  onAddRelationship: () => void;
  onUpdateRelationship: (relationshipId: string, field: RelationshipField, value: string) => void;
  onDeleteRelationship: (relationshipId: string) => void;
}

function InputLabel({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return <Text style={[styles.inputLabel, { color: theme.textMuted }]}>{children}</Text>;
}

function PreviewTextInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  editable = true,
}: {
  value: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  editable?: boolean;
}) {
  const { theme } = useTheme();

  if (!editable) {
    return <Text style={[styles.readOnlyText, { color: theme.textPrimary }]}>{value || '-'}</Text>;
  }

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.textMuted}
      keyboardType={keyboardType}
      style={[
        styles.input,
        {
          backgroundColor: theme.inputBackground,
          borderColor: theme.cardBorder,
          color: theme.textPrimary,
          borderRadius: theme.borderRadius.sm,
        },
      ]}
    />
  );
}

function ToggleChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.toggleChip,
        {
          backgroundColor: selected ? theme.buttonPrimary : theme.buttonSecondary,
          borderColor: selected ? theme.buttonPrimary : theme.cardBorder,
          borderRadius: theme.borderRadius.sm,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}>
      <Text style={[styles.toggleChipText, { color: selected ? '#ffffff' : theme.textPrimary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function InlineActionButton({
  label,
  onPress,
  tone = 'default',
}: {
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
}) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.inlineActionButton,
        {
          backgroundColor: tone === 'danger' ? theme.secondaryBackground : theme.buttonSecondary,
          borderColor: tone === 'danger' ? theme.danger : theme.cardBorder,
          borderRadius: theme.borderRadius.sm,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}>
      <Text
        style={[
          styles.inlineActionText,
          { color: tone === 'danger' ? theme.danger : theme.textPrimary },
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function KpiEditor({
  category,
  kpi,
  editable,
  onUpdateKpi,
  onDeleteKpi,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
}: {
  category: GeneratedOnboardingCategory;
  kpi: GeneratedOnboardingKpi;
  editable: boolean;
  onUpdateKpi: GeneratedSetupPreviewProps['onUpdateKpi'];
  onDeleteKpi: GeneratedSetupPreviewProps['onDeleteKpi'];
  onAddActivity: GeneratedSetupPreviewProps['onAddActivity'];
  onUpdateActivity: GeneratedSetupPreviewProps['onUpdateActivity'];
  onDeleteActivity: GeneratedSetupPreviewProps['onDeleteActivity'];
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.kpiCard,
        {
          backgroundColor: theme.background,
          borderColor: theme.cardBorder,
          borderRadius: theme.borderRadius.md,
        },
      ]}>
      <View style={styles.blockHeaderRow}>
        <Text style={[styles.blockTitle, { color: theme.textPrimary }]}>{kpi.name || 'Untitled KPI'}</Text>
        {editable ? (
          <InlineActionButton
            label="Delete KPI"
            tone="danger"
            onPress={() => onDeleteKpi(category.id, kpi.id)}
          />
        ) : null}
      </View>

      <View style={styles.threeColumnRow}>
        <View style={styles.flexField}>
          <InputLabel>KPI Name</InputLabel>
          <PreviewTextInput
            editable={editable}
            value={kpi.name}
            onChangeText={(value) => onUpdateKpi(category.id, kpi.id, 'name', value)}
          />
        </View>
        <View style={styles.smallField}>
          <InputLabel>Target</InputLabel>
          <PreviewTextInput
            editable={editable}
            value={String(kpi.target)}
            keyboardType="numeric"
            onChangeText={(value) => onUpdateKpi(category.id, kpi.id, 'target', value)}
          />
        </View>
        <View style={styles.smallField}>
          <InputLabel>Weight</InputLabel>
          <PreviewTextInput
            editable={editable}
            value={String(kpi.weight)}
            keyboardType="numeric"
            onChangeText={(value) => onUpdateKpi(category.id, kpi.id, 'weight', value)}
          />
        </View>
      </View>

      <View style={styles.singleField}>
        <InputLabel>Unit</InputLabel>
        <PreviewTextInput
          editable={editable}
          value={kpi.unit}
          onChangeText={(value) => onUpdateKpi(category.id, kpi.id, 'unit', value)}
        />
      </View>

      <View style={styles.activitiesHeaderRow}>
        <Text style={[styles.subsectionTitle, { color: theme.textPrimary }]}>Activities / To-Dos</Text>
        {editable ? <InlineActionButton label="Add Activity" onPress={() => onAddActivity(category.id, kpi.id)} /> : null}
      </View>

      {kpi.activities.length === 0 ? (
        <Text style={[styles.emptyHint, { color: theme.textSecondary }]}>
          No activities yet. Add one to turn this KPI into a trackable routine.
        </Text>
      ) : (
        kpi.activities.map((activity) => (
          <View
            key={activity.id}
            style={[
              styles.activityCard,
              {
                backgroundColor: theme.secondaryBackground,
                borderColor: theme.cardBorder,
                borderRadius: theme.borderRadius.sm,
              },
            ]}>
            <View style={styles.blockHeaderRow}>
              <Text style={[styles.activityTitle, { color: theme.textPrimary }]}>
                {activity.name || 'Untitled activity'}
              </Text>
              {editable ? (
                <InlineActionButton
                  label="Delete"
                  tone="danger"
                  onPress={() => onDeleteActivity(category.id, kpi.id, activity.id)}
                />
              ) : null}
            </View>

            <View style={styles.threeColumnRow}>
              <View style={styles.flexField}>
                <InputLabel>Activity</InputLabel>
                <PreviewTextInput
                  editable={editable}
                  value={activity.name}
                  onChangeText={(value) =>
                    onUpdateActivity(category.id, kpi.id, activity.id, 'name', value)
                  }
                />
              </View>
              <View style={styles.smallField}>
                <InputLabel>Frequency</InputLabel>
                <PreviewTextInput
                  editable={editable}
                  value={activity.frequency}
                  onChangeText={(value) =>
                    onUpdateActivity(category.id, kpi.id, activity.id, 'frequency', value)
                  }
                />
              </View>
              <View style={styles.smallField}>
                <InputLabel>Count</InputLabel>
                <PreviewTextInput
                  editable={editable}
                  value={String(activity.targetCount)}
                  keyboardType="numeric"
                  onChangeText={(value) =>
                    onUpdateActivity(category.id, kpi.id, activity.id, 'targetCount', value)
                  }
                />
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function RelationshipEditor({
  relationship,
  editable,
  onUpdateRelationship,
  onDeleteRelationship,
}: {
  relationship: GeneratedRelationshipTracker;
  editable: boolean;
  onUpdateRelationship: GeneratedSetupPreviewProps['onUpdateRelationship'];
  onDeleteRelationship: GeneratedSetupPreviewProps['onDeleteRelationship'];
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.relationshipCard,
        {
          backgroundColor: theme.background,
          borderColor: theme.cardBorder,
          borderRadius: theme.borderRadius.md,
        },
      ]}>
      <View style={styles.blockHeaderRow}>
        <Text style={[styles.blockTitle, { color: theme.textPrimary }]}>
          {relationship.name || 'Relationship tracker'}
        </Text>
        {editable ? (
          <InlineActionButton
            label="Delete"
            tone="danger"
            onPress={() => onDeleteRelationship(relationship.id)}
          />
        ) : null}
      </View>

      <View style={styles.threeColumnRow}>
        <View style={styles.flexField}>
          <InputLabel>Name</InputLabel>
          <PreviewTextInput
            editable={editable}
            value={relationship.name}
            onChangeText={(value) => onUpdateRelationship(relationship.id, 'name', value)}
          />
        </View>
        <View style={styles.smallField}>
          <InputLabel>Type</InputLabel>
          <PreviewTextInput
            editable={editable}
            value={relationship.relationshipType}
            onChangeText={(value) => onUpdateRelationship(relationship.id, 'relationshipType', value)}
          />
        </View>
        <View style={styles.smallField}>
          <InputLabel>Frequency</InputLabel>
          <PreviewTextInput
            editable={editable}
            value={relationship.frequency}
            onChangeText={(value) => onUpdateRelationship(relationship.id, 'frequency', value)}
          />
        </View>
      </View>

      <View style={styles.threeColumnRow}>
        <View style={styles.flexField}>
          <InputLabel>Group</InputLabel>
          <PreviewTextInput
            editable={editable}
            value={relationship.groupName}
            onChangeText={(value) => onUpdateRelationship(relationship.id, 'groupName', value)}
          />
        </View>
        <View style={styles.flexField}>
          <InputLabel>To-Do</InputLabel>
          <PreviewTextInput
            editable={editable}
            value={relationship.todoTitle}
            onChangeText={(value) => onUpdateRelationship(relationship.id, 'todoTitle', value)}
          />
        </View>
      </View>

      <View style={styles.singleField}>
        <InputLabel>Notes</InputLabel>
        <PreviewTextInput
          editable={editable}
          value={relationship.notes ?? ''}
          onChangeText={(value) => onUpdateRelationship(relationship.id, 'notes', value)}
        />
      </View>
    </View>
  );
}

export function GeneratedSetupPreview({
  setup,
  editable,
  onChangeSummary,
  onUpdateCategoryName,
  onDeleteCategory,
  onAddCategory,
  onAddKpi,
  onUpdateKpi,
  onDeleteKpi,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
  onUpdateReminderPreference,
  onAddRelationship,
  onUpdateRelationship,
  onDeleteRelationship,
}: GeneratedSetupPreviewProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <SectionCard>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Generated Setup</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          Review everything before saving. You can edit categories, KPIs, activities, relationships,
          and reminder defaults.
        </Text>

        <View style={styles.singleField}>
          <InputLabel>Life Buddy Summary</InputLabel>
          <PreviewTextInput
            editable={editable}
            value={setup.summary}
            onChangeText={onChangeSummary}
          />
        </View>
      </SectionCard>

      <SectionCard>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Generated Categories, KPIs, and Activities
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              This becomes your main tracking structure.
            </Text>
          </View>
          {editable ? <InlineActionButton label="Add Category" onPress={onAddCategory} /> : null}
        </View>

        {setup.categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            message="Add a category to start building your setup."
          />
        ) : (
          setup.categories.map((category) => (
            <View
              key={category.id}
              style={[
                styles.categoryCard,
                {
                  backgroundColor: theme.secondaryBackground,
                  borderColor: theme.cardBorder,
                  borderRadius: theme.borderRadius.md,
                },
              ]}>
              <View style={styles.blockHeaderRow}>
                <View style={{ flex: 1 }}>
                  <InputLabel>Category</InputLabel>
                  <PreviewTextInput
                    editable={editable}
                    value={category.name}
                    onChangeText={(value) => onUpdateCategoryName(category.id, value)}
                  />
                </View>
                {editable ? (
                  <InlineActionButton
                    label="Delete Category"
                    tone="danger"
                    onPress={() => onDeleteCategory(category.id)}
                  />
                ) : null}
              </View>

              <View style={styles.categoryActionsRow}>
                {editable ? <InlineActionButton label="Add KPI" onPress={() => onAddKpi(category.id)} /> : null}
              </View>

              {category.kpis.length === 0 ? (
                <Text style={[styles.emptyHint, { color: theme.textSecondary }]}>
                  No KPIs yet. Add one to make this category actionable.
                </Text>
              ) : (
                category.kpis.map((kpi) => (
                  <KpiEditor
                    key={kpi.id}
                    category={category}
                    kpi={kpi}
                    editable={editable}
                    onUpdateKpi={onUpdateKpi}
                    onDeleteKpi={onDeleteKpi}
                    onAddActivity={onAddActivity}
                    onUpdateActivity={onUpdateActivity}
                    onDeleteActivity={onDeleteActivity}
                  />
                ))
              )}
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Relationship Trackers</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              These become people records and follow-up to-dos.
            </Text>
          </View>
          {editable ? <InlineActionButton label="Add Relationship" onPress={onAddRelationship} /> : null}
        </View>

        {setup.relationships.length === 0 ? (
          <Text style={[styles.emptyHint, { color: theme.textSecondary }]}>
            No relationship trackers yet. Add one if staying connected matters to your setup.
          </Text>
        ) : (
          setup.relationships.map((relationship) => (
            <RelationshipEditor
              key={relationship.id}
              relationship={relationship}
              editable={editable}
              onUpdateRelationship={onUpdateRelationship}
              onDeleteRelationship={onDeleteRelationship}
            />
          ))
        )}
      </SectionCard>

      <SectionCard>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Reminder Preferences</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          Pick the defaults you want saved with this setup.
        </Text>

        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>KPI reminders</Text>
          <ToggleChip
            label={setup.reminderPreferences.kpiReminders ? 'On' : 'Off'}
            selected={setup.reminderPreferences.kpiReminders}
            onPress={() =>
              onUpdateReminderPreference('kpiReminders', !setup.reminderPreferences.kpiReminders)
            }
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>Relationship reminders</Text>
          <ToggleChip
            label={setup.reminderPreferences.relationshipReminders ? 'On' : 'Off'}
            selected={setup.reminderPreferences.relationshipReminders}
            onPress={() =>
              onUpdateReminderPreference(
                'relationshipReminders',
                !setup.reminderPreferences.relationshipReminders
              )
            }
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>Weekly review</Text>
          <ToggleChip
            label={setup.reminderPreferences.weeklyReview ? 'On' : 'Off'}
            selected={setup.reminderPreferences.weeklyReview}
            onPress={() =>
              onUpdateReminderPreference('weeklyReview', !setup.reminderPreferences.weeklyReview)
            }
          />
        </View>
      </SectionCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    minHeight: 42,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  readOnlyText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    minHeight: 22,
  },
  singleField: {
    marginBottom: 12,
  },
  categoryCard: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  categoryActionsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  kpiCard: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  relationshipCard: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  activityCard: {
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
  },
  blockHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  threeColumnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  flexField: {
    flex: 1,
    minWidth: 180,
  },
  smallField: {
    width: 120,
  },
  activitiesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
    marginBottom: 6,
  },
  inlineActionButton: {
    minHeight: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  inlineActionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  toggleChip: {
    minWidth: 76,
    minHeight: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  toggleChipText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
