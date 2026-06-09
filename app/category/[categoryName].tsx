import { ContactPicker, SelectedContact } from '@/components/ContactPicker';
import { EmptyState } from '@/components/EmptyState';
import { PageContainer } from '@/components/PageContainer';
import { KPI, PEOPLE_GROUPS, Person, useAppData } from '@/context/AppDataContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

function kpiContribution(kpi: KPI, actuals: Record<string, string>): number {
  const actualValue = parseFloat(actuals[kpi.id] || '0');
  const safeActual = isNaN(actualValue) ? 0 : actualValue;
  let kpiScore = 0;
  if (kpi.target > 0) {
    kpiScore = (safeActual / kpi.target) * kpi.weight;
  }
  if (kpiScore > kpi.weight) kpiScore = kpi.weight;
  return kpiScore;
}

function statusForScore(score: number) {
  if (score >= 80) return { label: 'Strong', color: '#34d399', barColor: '#10b981' };
  if (score >= 50) return { label: 'Stable', color: '#fbbf24', barColor: '#f59e0b' };
  return { label: 'Needs Attention', color: '#fb7185', barColor: '#f43f5e' };
}

function todayYMD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function CategoryDetailScreen() {
  const { categories, kpis, subtasks, subtaskLogs, latestActuals, entries, toggleSubtaskLog, addPeopleTodo, deletePeopleTodo, getPeopleTodosForKpi, people, addPerson, updatePerson, deletePerson, getRelationshipsScore, addPersonActivity, getActivitiesForPerson, personTodos, addPersonTodo, updatePersonTodo, deletePersonTodo, togglePersonTodo, getTodosForPerson } = useAppData();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showPeopleTodoForm, setShowPeopleTodoForm] = useState(false);
  const [selectedKpiForContact, setSelectedKpiForContact] = useState<string | null>(null);
  const [selectedContactForTodo, setSelectedContactForTodo] = useState<SelectedContact | null>(null);
  const [peopleTodoActivityType, setPeopleTodoActivityType] = useState<'Meet' | 'Call' | 'Message' | 'Date' | 'Other'>('Meet');
  const [peopleTodoFrequency, setPeopleTodoFrequency] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('weekly');
  const [peopleTodoTargetCount, setPeopleTodoTargetCount] = useState('1');
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [personName, setPersonName] = useState('');
  const [relationshipType, setRelationshipType] = useState('Friend');
  const [personGroup, setPersonGroup] = useState('Other');
  const [personPhone, setPersonPhone] = useState('');
  const [personNotes, setPersonNotes] = useState('');
  const [personLastContact, setPersonLastContact] = useState(todayYMD());
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<'All' | string>('All');
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedPersonForActivity, setSelectedPersonForActivity] = useState<string | null>(null);
  const [activityType, setActivityType] = useState<'Call' | 'Meet' | 'Message' | 'Date' | 'Other'>('Call');
  const [activityDate, setActivityDate] = useState(todayYMD());
  const [activityNotes, setActivityNotes] = useState('');
  const [showPersonTodoModal, setShowPersonTodoModal] = useState(false);
  const [selectedPersonForTodo, setSelectedPersonForTodo] = useState<string | null>(null);
  const [todoTitle, setTodoTitle] = useState('');
  const [todoFrequency, setTodoFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'one-time'>('weekly');
  const [todoDueDate, setTodoDueDate] = useState('');
  const [todoNotes, setTodoNotes] = useState('');

  const categoryName =
    typeof params.categoryName === 'string'
      ? decodeURIComponent(params.categoryName).trim()
      : '';

  const today = new Date().toISOString().split('T')[0];

  const isSocialCategory = useMemo(() => {
    const lowerName = categoryName.toLowerCase();
    return lowerName.includes('social') || lowerName.includes('people') || lowerName.includes('relationship');
  }, [categoryName]);

  const isRelationshipsCategory = useMemo(() => {
    const lowerName = categoryName.toLowerCase();
    return lowerName.includes('relationship');
  }, [categoryName]);

  const handleAddPerson = () => {
    if (!personName.trim()) {
      alert('Please enter a name');
      return;
    }
    addPerson({
      name: personName.trim(),
      relationshipType,
      groupName: personGroup.trim() || 'Other',
      phone: personPhone.trim() || undefined,
      notes: personNotes.trim() || undefined,
      lastContactDate: personLastContact,
    });
    setPersonName('');
    setRelationshipType('Friend');
    setPersonGroup('Other');
    setPersonPhone('');
    setPersonNotes('');
    setPersonLastContact(todayYMD());
    setShowAddPersonModal(false);
  };

  const handleImportContact = (contact: SelectedContact) => {
    setShowContactPicker(false);
    addPerson({
      name: contact.name,
      relationshipType: 'Friend',
      groupName: 'Other',
      phone: contact.phoneNumber || undefined,
      notes: `Email: ${contact.email || 'N/A'}`,
      lastContactDate: todayYMD(),
    });
  };

  const handleAddContact = (kpiId: string) => {
    setSelectedKpiForContact(kpiId);
    setShowContactPicker(true);
  };

  const handleContactSelected = (contact: SelectedContact) => {
    setShowContactPicker(false);
    setSelectedContactForTodo(contact);
    setShowPeopleTodoForm(true);
  };

  const handleDismissContactPicker = () => {
    setShowContactPicker(false);
    setSelectedKpiForContact(null);
  };

  const handleCancelPeopleTodo = () => {
    setShowPeopleTodoForm(false);
    setSelectedContactForTodo(null);
    setSelectedKpiForContact(null);
    setPeopleTodoActivityType('Meet');
    setPeopleTodoFrequency('weekly');
    setPeopleTodoTargetCount('1');
  };

  const handleSavePeopleTodo = () => {
    if (!selectedKpiForContact || !selectedContactForTodo) return;

    const targetCount = parseInt(peopleTodoTargetCount, 10);
    addPeopleTodo({
      kpiId: selectedKpiForContact,
      name: selectedContactForTodo.name,
      frequency: peopleTodoFrequency,
      targetCount: Number.isNaN(targetCount) || targetCount <= 0 ? 1 : targetCount,
      type: 'people',
      contactId: selectedContactForTodo.id,
      contactName: selectedContactForTodo.name,
      contactPhone: selectedContactForTodo.phoneNumber,
      contactEmail: selectedContactForTodo.email,
      activityType: peopleTodoActivityType,
    });

    setShowPeopleTodoForm(false);
    setSelectedContactForTodo(null);
    setSelectedKpiForContact(null);
    setPeopleTodoActivityType('Meet');
    setPeopleTodoFrequency('weekly');
    setPeopleTodoTargetCount('1');
  };

  const handleContactedToday = (person: Person) => {
    const todayStr = todayYMD();
    addPersonActivity({
      personId: person.id,
      activityType: 'Other',
      date: todayStr,
      notes: 'Contacted today',
    });
    updatePerson({
      ...person,
      lastContactDate: todayStr,
    });
  };

  const handleStartAddActivity = (personId: string) => {
    setSelectedPersonForActivity(personId);
    setActivityType('Call');
    setActivityDate(todayYMD());
    setActivityNotes('');
    setShowActivityModal(true);
  };

  const handleCancelActivity = () => {
    setSelectedPersonForActivity(null);
    setActivityType('Call');
    setActivityDate(todayYMD());
    setActivityNotes('');
    setShowActivityModal(false);
  };

  const handleSaveActivity = () => {
    if (!selectedPersonForActivity) return;

    const person = people.find((p) => p.id === selectedPersonForActivity);
    if (!person) return;

    addPersonActivity({
      personId: selectedPersonForActivity,
      activityType,
      date: activityDate,
      notes: activityNotes.trim() || undefined,
    });

    updatePerson({
      ...person,
      lastContactDate: activityDate,
    });

    handleCancelActivity();
  };

  const handleStartAddPersonTodo = (personId: string) => {
    setSelectedPersonForTodo(personId);
    setTodoTitle('');
    setTodoFrequency('weekly');
    setTodoDueDate('');
    setTodoNotes('');
    setShowPersonTodoModal(true);
  };

  const handleCancelPersonTodo = () => {
    setSelectedPersonForTodo(null);
    setTodoTitle('');
    setTodoFrequency('weekly');
    setTodoDueDate('');
    setTodoNotes('');
    setShowPersonTodoModal(false);
  };

  const handleSavePersonTodo = () => {
    if (!selectedPersonForTodo || !todoTitle.trim()) return;

    addPersonTodo({
      personId: selectedPersonForTodo,
      title: todoTitle.trim(),
      frequency: todoFrequency,
      dueDate: todoDueDate.trim() || undefined,
      completed: false,
      notes: todoNotes.trim() || undefined,
    });

    handleCancelPersonTodo();
  };

  const handleTogglePersonTodo = (todoId: string) => {
    togglePersonTodo(todoId);
  };

  const category = useMemo(
    () => categories.find((item) => item.name.toLowerCase() === categoryName.toLowerCase()),
    [categories, categoryName]
  );

  const categoryKpis = useMemo(
    () => kpis.filter((kpi) => category !== undefined && kpi.category === category.name),
    [kpis, category]
  );

  const normalizedPeople = useMemo(() => {
    return people.map((person) => ({
      ...person,
      groupName:
        typeof person.groupName === 'string' && person.groupName.trim()
          ? person.groupName.trim()
          : 'Other',
    }));
  }, [people]);

  const categoryPeople = useMemo(() => {
    if (!isRelationshipsCategory) return [];
    return normalizedPeople;
  }, [normalizedPeople, isRelationshipsCategory]);

  const filteredPeople = useMemo(() => {
    if (selectedGroupFilter === 'All') return categoryPeople;
    return categoryPeople.filter((person) => person.groupName === selectedGroupFilter);
  }, [categoryPeople, selectedGroupFilter]);

  const groupedPeopleSections = useMemo(() => {
    return PEOPLE_GROUPS.map((groupName) => ({
      groupName,
      people: filteredPeople.filter((person) => person.groupName === groupName),
    })).filter((section) => section.people.length > 0);
  }, [filteredPeople]);

  const peopleNeedingAttention = useMemo(() => {
    if (!isRelationshipsCategory) return [];
    return normalizedPeople
      .map((person) => ({
        person,
        score: getRelationshipsScore(person.id),
      }))
      .filter((entry) => entry.score < 70)
      .sort((a, b) => a.score - b.score);
  }, [normalizedPeople, getRelationshipsScore, isRelationshipsCategory]);

  const categoryScore = useMemo(() => {
    if (categoryKpis.length === 0) return 0;
    const totalWeight = categoryKpis.reduce((sum, kpi) => sum + kpi.weight, 0);
    const achieved = categoryKpis.reduce((sum, kpi) => sum + kpiContribution(kpi, latestActuals), 0);
    return totalWeight > 0 ? Math.round((achieved / totalWeight) * 100) : 0;
  }, [categoryKpis, latestActuals]);

  const categoryTodoProgress = useMemo(() => {
    const allSubtasks = categoryKpis.flatMap(kpi => subtasks.filter(s => s.kpiId === kpi.id));
    const completed = allSubtasks.filter(subtask =>
      subtaskLogs.some(log => log.subtaskId === subtask.id && log.date === today && log.completed)
    ).length;
    const total = allSubtasks.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }, [categoryKpis, subtasks, subtaskLogs, today]);

  const status = statusForScore(categoryScore);

  if (!categoryName || !category) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <PageContainer>
            <EmptyState
              title="Category not found"
              message="Choose a category from the dashboard or add a new one."
            />
            <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.backButtonText}>Return to Home</Text>
            </TouchableOpacity>
          </PageContainer>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PageContainer>
          <View style={styles.headerRow}>
            <View style={styles.titleColumn}>
              <Text style={styles.title}>{category.name}</Text>
              <Text style={styles.subtitle}>Only KPIs and subtasks for this category</Text>
            </View>
            <TouchableOpacity style={styles.backButtonCompact} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.backButtonText}>Home</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Category score</Text>
            <Text style={[styles.summaryScore, { color: status.color }]}>{categoryScore} / 100</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, categoryScore))}%`, backgroundColor: status.barColor }]} />
            </View>
            <Text style={styles.statusLabel}>{status.label}</Text>
            <Text style={styles.detailLine}>Tracked days: {entries.length}</Text>
            <Text style={styles.detailLine}>KPIs in category: {categoryKpis.length}</Text>
            <Text style={styles.detailLine}>To-dos completed today: {categoryTodoProgress.completed} / {categoryTodoProgress.total} ({categoryTodoProgress.percent}%)</Text>
          </View>

          {isRelationshipsCategory && (
            <View style={styles.attentionSection}>
              <Text style={styles.attentionTitle}>People Needing Attention</Text>
              {peopleNeedingAttention.length === 0 ? (
                <Text style={styles.attentionMessage}>All relationships are healthy</Text>
              ) : (
                peopleNeedingAttention.map(({ person, score }) => {
                  const lastContactDays = person.lastContactDate
                    ? Math.floor((new Date().getTime() - new Date(person.lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
                    : null;
                  return (
                    <View key={person.id} style={styles.attentionRow}>
                      <View style={styles.attentionMain}>
                        <Text style={styles.attentionName}>{person.name}</Text>
                        <Text style={styles.attentionMeta}>{person.groupName} · {lastContactDays !== null ? `${lastContactDays} days ago` : 'No contact date'}</Text>
                      </View>
                      <Text style={styles.attentionScore}>{score}</Text>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {isRelationshipsCategory && (
            <View style={styles.peopleSection}>
              <View style={styles.peopleSectionHeader}>
                <Text style={styles.peopleSectionTitle}>Relationships</Text>
                <TouchableOpacity
                  style={styles.addPersonButton}
                  onPress={() => setShowAddPersonModal(true)}
                >
                  <Text style={styles.addPersonButtonText}>+ Add Person</Text>
                </TouchableOpacity>
              </View>

              {categoryPeople.length > 0 ? (
                <>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.peopleFilterRow}>
                    {['All', ...PEOPLE_GROUPS].map((group) => (
                      <TouchableOpacity
                        key={group}
                        style={[
                          styles.filterButton,
                          selectedGroupFilter === group && styles.filterButtonActive,
                        ]}
                        onPress={() => setSelectedGroupFilter(group)}
                      >
                        <Text
                          style={[
                            styles.filterButtonText,
                            selectedGroupFilter === group && styles.filterButtonTextActive,
                          ]}
                        >
                          {group}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {filteredPeople.length > 0 ? (
                    groupedPeopleSections.map((section) => (
                      <View key={section.groupName} style={styles.peopleGroupSection}>
                        <Text style={styles.peopleGroupHeader}>{section.groupName}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.peopleCardsScroll}>
                          {section.people.map((person) => {
                            const score = getRelationshipsScore(person.id);
                            const scoreStatus = score >= 80 ? { color: '#34d399' } : score >= 50 ? { color: '#fbbf24' } : { color: '#fb7185' };
                            const recentActivities = getActivitiesForPerson(person.id).slice(0, 3);
                            return (
                              <View key={person.id} style={styles.personCard}>
                                <View style={styles.personCardHeader}>
                                  <Text style={styles.personName}>{person.name}</Text>
                                  <TouchableOpacity onPress={() => deletePerson(person.id)}>
                                    <Text style={styles.personRemoveButton}>×</Text>
                                  </TouchableOpacity>
                                </View>
                                <Text style={styles.personRelationType}>{person.relationshipType}</Text>
                                {person.lastContactDate && (
                                  <Text style={styles.personLastContact}>Last: {person.lastContactDate}</Text>
                                )}
                                <View style={styles.personScore}>
                                  <Text style={[styles.personScoreLabel, scoreStatus]}>
                                    Score: {score}
                                  </Text>
                                </View>
                                {person.phone && (
                                  <Text style={styles.personPhone}>{person.phone}</Text>
                                )}
                                <View style={styles.personActionRow}>
                                  <TouchableOpacity
                                    style={styles.personActionButton}
                                    onPress={() => handleContactedToday(person)}
                                  >
                                    <Text style={styles.personActionText}>Contacted Today</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={styles.personActionButtonSecondary}
                                    onPress={() => handleStartAddActivity(person.id)}
                                  >
                                    <Text style={styles.personActionText}>Add Activity</Text>
                                  </TouchableOpacity>
                                </View>
                                <View style={styles.activityHistorySection}>
                                  <Text style={styles.activityHistoryLabel}>Recent activity</Text>
                                  {recentActivities.length > 0 ? (
                                    recentActivities.map((activity) => (
                                      <View key={activity.id} style={styles.activityHistoryRow}>
                                        <Text style={styles.activityHistoryText}>
                                          {formatDisplayDate(activity.date)} - {activity.activityType} - {activity.notes ?? 'No notes'}
                                        </Text>
                                      </View>
                                    ))
                                  ) : (
                                    <Text style={styles.activityHistoryText}>No activity yet</Text>
                                  )}
                                </View>
                                <View style={styles.personTodoSection}>
                                  <View style={styles.personTodoHeader}>
                                    <Text style={styles.personTodoLabel}>To-Dos</Text>
                                    <TouchableOpacity
                                      style={styles.personTodoAddButton}
                                      onPress={() => handleStartAddPersonTodo(person.id)}
                                    >
                                      <Text style={styles.personTodoAddText}>+ Add</Text>
                                    </TouchableOpacity>
                                  </View>
                                  {getTodosForPerson(person.id).length > 0 ? (
                                    getTodosForPerson(person.id).map((todo) => (
                                      <View key={todo.id} style={[styles.personTodoRow, todo.completed && styles.personTodoRowCompleted]}>
                                        <TouchableOpacity
                                          style={styles.personTodoCheckbox}
                                          onPress={() => handleTogglePersonTodo(todo.id)}
                                        >
                                          <Text style={styles.personTodoCheckboxText}>{todo.completed ? '☑' : '☐'}</Text>
                                        </TouchableOpacity>
                                        <View style={styles.personTodoContent}>
                                          <Text style={[styles.personTodoTitle, todo.completed && styles.personTodoTitleCompleted]}>
                                            {todo.title}
                                          </Text>
                                          <View style={styles.personTodoMeta}>
                                            <Text style={styles.personTodoMetaText}>{todo.frequency}</Text>
                                            {todo.dueDate && <Text style={styles.personTodoMetaText}> · {formatDisplayDate(todo.dueDate)}</Text>}
                                          </View>
                                        </View>
                                        <TouchableOpacity
                                          style={styles.personTodoDelete}
                                          onPress={() => deletePersonTodo(todo.id)}
                                        >
                                          <Text style={styles.personTodoDeleteText}>×</Text>
                                        </TouchableOpacity>
                                      </View>
                                    ))
                                  ) : (
                                    <Text style={styles.personTodoEmpty}>No to-dos yet</Text>
                                  )}
                                </View>
                              </View>
                            );
                          })}
                        </ScrollView>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noPeopleMessage}>No people found for this group.</Text>
                  )}
                </>
              ) : (
                <Text style={styles.noPeopleMessage}>No people added yet. Start by adding someone.</Text>
              )}
            </View>
          )}

          {categoryKpis.length === 0 ? (
            <EmptyState
              title="No KPIs yet"
              message="Add KPIs to this category in the KPIs tab and return to see them here."
            />
          ) : (
            categoryKpis.map((kpi) => {
              const latestActual = latestActuals[kpi.id];
              const kpiScore = Math.round(kpiContribution(kpi, latestActuals));
              const kpiSubtasks = subtasks.filter((subtask) => subtask.kpiId === kpi.id);
              const completedCount = kpiSubtasks.filter(subtask => subtaskLogs.some(log => log.subtaskId === subtask.id && log.date === today && log.completed)).length;
              const totalCount = kpiSubtasks.length;
              const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
              const kpiPeopleTodos = getPeopleTodosForKpi(kpi.id);

              return (
                <View key={kpi.id} style={styles.kpiCard}>
                  <View style={styles.kpiHeader}>
                    <Text style={styles.kpiName}>{kpi.name}</Text>
                    <Text style={[styles.kpiScore, { color: status.color }]}>{kpiScore} / {kpi.weight}</Text>
                  </View>
                  <View style={styles.kpiMetaRow}>
                    <Text style={styles.kpiMeta}>Target: {kpi.target} {kpi.unit}</Text>
                    <Text style={styles.kpiMeta}>Weight: {kpi.weight}</Text>
                  </View>
                  <Text style={styles.kpiMeta}>Latest actual: {latestActual ? `${latestActual} ${kpi.unit}` : 'Not set'}</Text>
                  {kpiSubtasks.length > 0 && (
                    <View style={styles.todoProgress}>
                      <Text style={styles.todoProgressText}>
                        To-dos: {completedCount} / {totalCount} ({percent}%)
                      </Text>
                      <View style={styles.todoProgressTrack}>
                        <View style={[styles.todoProgressFill, { width: `${percent}%` }]} />
                      </View>
                    </View>
                  )}
                  {kpiSubtasks.length > 0 ? (
                    <View style={styles.subtaskSection}>
                      <Text style={styles.subtaskTitle}>To-dos</Text>
                      {kpiSubtasks.map((subtask) => {
                        const isCompleted = subtaskLogs.some(
                          (log) => log.subtaskId === subtask.id && log.date === today && log.completed
                        );
                        return (
                          <View key={subtask.id} style={styles.subtaskRow}>
                            <TouchableOpacity
                              onPress={() => toggleSubtaskLog(subtask.id, today)}
                              style={styles.checkbox}
                            >
                              <Text style={styles.checkboxText}>{isCompleted ? '☑' : '☐'}</Text>
                            </TouchableOpacity>
                            <View style={styles.subtaskTextBlock}>
                              <Text style={[styles.subtaskText, isCompleted && styles.completedText]}>
                                {subtask.name}
                              </Text>
                              <Text style={styles.subtaskHint}>{subtask.frequency}, target {subtask.targetCount}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.noSubtasks}>No To-dos yet</Text>
                  )}
                  {isSocialCategory && (
                    <View style={styles.peopleTodoSection}>
                      <Text style={styles.peopleTodoTitle}>People To-dos</Text>
                      {kpiPeopleTodos.length > 0 ? (
                        kpiPeopleTodos.map((todo) => (
                          <View key={todo.id} style={styles.peopleTodoRow}>
                            <View style={styles.peopleTodoMain}>
                              <Text style={styles.peopleTodoName}>{todo.contactName}</Text>
                              <Text style={styles.peopleTodoMeta}>
                                {todo.activityType} · {todo.frequency} · target {todo.targetCount}
                              </Text>
                              {(todo.contactPhone || todo.contactEmail) && (
                                <Text style={styles.peopleTodoContact}>{todo.contactPhone || ''}{todo.contactPhone && todo.contactEmail ? ' • ' : ''}{todo.contactEmail || ''}</Text>
                              )}
                            </View>
                            <TouchableOpacity
                              onPress={() => deletePeopleTodo(todo.id)}
                              style={styles.removeContactButton}
                            >
                              <Text style={styles.removeContactText}>×</Text>
                            </TouchableOpacity>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noPeopleTodos}>No People To-dos yet</Text>
                      )}
                      <TouchableOpacity
                        style={styles.addContactButton}
                        onPress={() => handleAddContact(kpi.id)}
                      >
                        <Text style={styles.addContactText}>+ Add People To-do</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </PageContainer>
      </ScrollView>
      {showPeopleTodoForm && selectedContactForTodo && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add People To-do</Text>
              <TouchableOpacity onPress={handleCancelPeopleTodo}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Contact</Text>
            <Text style={styles.modalText}>{selectedContactForTodo.name}</Text>
            {selectedContactForTodo.phoneNumber ? (
              <Text style={styles.modalText}>{selectedContactForTodo.phoneNumber}</Text>
            ) : null}
            {selectedContactForTodo.email ? (
              <Text style={styles.modalText}>{selectedContactForTodo.email}</Text>
            ) : null}

            <Text style={styles.modalLabel}>Activity type</Text>
            <View style={styles.optionRow}>
              {['Meet', 'Call', 'Message', 'Date', 'Other'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionButton,
                    peopleTodoActivityType === type && styles.optionButtonActive,
                  ]}
                  onPress={() => setPeopleTodoActivityType(type as any)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      peopleTodoActivityType === type && styles.optionButtonTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Frequency</Text>
            <View style={styles.optionRow}>
              {['weekly', 'monthly', 'quarterly', 'yearly'].map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.optionButton,
                    peopleTodoFrequency === freq && styles.optionButtonActive,
                  ]}
                  onPress={() => setPeopleTodoFrequency(freq as any)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      peopleTodoFrequency === freq && styles.optionButtonTextActive,
                    ]}
                  >
                    {freq}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Target count</Text>
            <TextInput
              style={styles.input}
              value={peopleTodoTargetCount}
              onChangeText={setPeopleTodoTargetCount}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor="#64748b"
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSavePeopleTodo}>
              <Text style={styles.saveButtonText}>Save To-do</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dismissButton} onPress={handleCancelPeopleTodo}>
              <Text style={styles.dismissButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {showActivityModal && selectedPersonForActivity && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Relationship Activity</Text>
              <TouchableOpacity onPress={handleCancelActivity}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Activity type</Text>
            <View style={styles.optionRow}>
              {['Call', 'Meet', 'Message', 'Date', 'Other'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionButton,
                    activityType === type && styles.optionButtonActive,
                  ]}
                  onPress={() => setActivityType(type as any)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      activityType === type && styles.optionButtonTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#64748b"
              value={activityDate}
              onChangeText={setActivityDate}
            />

            <Text style={styles.modalLabel}>Notes</Text>
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              placeholder="Notes (optional)"
              placeholderTextColor="#64748b"
              value={activityNotes}
              onChangeText={setActivityNotes}
              multiline
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveActivity}>
              <Text style={styles.saveButtonText}>Save Activity</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dismissButton} onPress={handleCancelActivity}>
              <Text style={styles.dismissButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {showPersonTodoModal && selectedPersonForTodo && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Relationship To-Do</Text>
              <TouchableOpacity onPress={handleCancelPersonTodo}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter to-do title"
              placeholderTextColor="#64748b"
              value={todoTitle}
              onChangeText={setTodoTitle}
            />

            <Text style={styles.modalLabel}>Frequency</Text>
            <View style={styles.optionRow}>
              {['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'one-time'].map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.optionButton,
                    todoFrequency === freq && styles.optionButtonActive,
                  ]}
                  onPress={() => setTodoFrequency(freq as any)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      todoFrequency === freq && styles.optionButtonTextActive,
                    ]}
                  >
                    {freq}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Due Date (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#64748b"
              value={todoDueDate}
              onChangeText={setTodoDueDate}
            />

            <Text style={styles.modalLabel}>Notes</Text>
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              placeholder="Notes (optional)"
              placeholderTextColor="#64748b"
              value={todoNotes}
              onChangeText={setTodoNotes}
              multiline
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSavePersonTodo}>
              <Text style={styles.saveButtonText}>Save To-Do</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dismissButton} onPress={handleCancelPersonTodo}>
              <Text style={styles.dismissButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {showContactPicker && (
        <ContactPicker
          onContactSelected={handleContactSelected}
          onDismiss={handleDismissContactPicker}
        />
      )}
      {showAddPersonModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.addPersonModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Person</Text>
              <TouchableOpacity onPress={() => setShowAddPersonModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter name"
              placeholderTextColor="#64748b"
              value={personName}
              onChangeText={setPersonName}
            />

            <Text style={styles.modalLabel}>Relationship Type</Text>
            <View style={styles.optionRow}>
              {['Friend', 'Family', 'Colleague', 'Acquaintance', 'Other'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionButton,
                    relationshipType === type && styles.optionButtonActive,
                  ]}
                  onPress={() => setRelationshipType(type)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      relationshipType === type && styles.optionButtonTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Group</Text>
            <View style={styles.optionRow}>
              {PEOPLE_GROUPS.map((group) => (
                <TouchableOpacity
                  key={group}
                  style={[
                    styles.optionButton,
                    personGroup === group && styles.optionButtonActive,
                  ]}
                  onPress={() => setPersonGroup(group)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      personGroup === group && styles.optionButtonTextActive,
                    ]}
                  >
                    {group}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Or type a group"
              placeholderTextColor="#64748b"
              value={personGroup}
              onChangeText={setPersonGroup}
            />

            <Text style={styles.modalLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone number (optional)"
              placeholderTextColor="#64748b"
              value={personPhone}
              onChangeText={setPersonPhone}
            />

            <Text style={styles.modalLabel}>Notes</Text>
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              placeholder="Notes (optional)"
              placeholderTextColor="#64748b"
              value={personNotes}
              onChangeText={setPersonNotes}
              multiline
            />

            <Text style={styles.modalLabel}>Last Contact Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#64748b"
              value={personLastContact}
              onChangeText={setPersonLastContact}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleAddPerson}>
              <Text style={styles.saveButtonText}>Add Person</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dismissButton, { marginTop: 0, marginBottom: 12 }]}
              onPress={() => {
                setShowAddPersonModal(false);
                setShowContactPicker(true);
              }}
            >
              <Text style={styles.dismissButtonText}>+ Import from Contacts</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dismissButton} onPress={() => setShowAddPersonModal(false)}>
              <Text style={styles.dismissButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a0f1e',
  },
  content: {
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleColumn: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  backButton: {
    marginTop: 24,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1d2939',
    borderWidth: 1,
    borderColor: '#334155',
  },
  backButtonCompact: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#334155',
  },
  backButtonText: {
    color: '#e2e8f0',
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 18,
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  summaryScore: {
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 10,
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1f2937',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 8,
  },
  detailLine: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 2,
  },
  kpiCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  kpiName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    flex: 1,
    marginRight: 12,
  },
  kpiScore: {
    fontSize: 16,
    fontWeight: '900',
  },
  kpiMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  kpiMeta: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  subtaskSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  subtaskTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  subtaskRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  subtaskBullet: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  subtaskTextBlock: {
    flex: 1,
  },
  subtaskText: {
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: '600',
  },
  subtaskHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  checkbox: {
    padding: 4,
  },
  checkboxText: {
    fontSize: 16,
    color: '#f8fafc',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  todoProgress: {
    marginTop: 12,
  },
  todoProgressText: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 6,
  },
  todoProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1e293b',
    overflow: 'hidden',
  },
  todoProgressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#3b82f6',
  },
  noSubtasks: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 13,
  },
  peopleTodoSection: {
    marginTop: 16,
  },
  peopleTodoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
  },
  peopleTodoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  peopleTodoMain: {
    flex: 1,
    paddingRight: 8,
  },
  peopleTodoName: {
    fontSize: 16,
    color: '#f8fafc',
    fontWeight: '700',
    marginBottom: 4,
  },
  peopleTodoMeta: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  peopleTodoContact: {
    fontSize: 13,
    color: '#94a3b8',
  },
  noPeopleTodos: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  contactsSection: {
    marginTop: 16,
  },
  contactsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    color: '#f8fafc',
    fontWeight: '500',
  },
  contactDetail: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  removeContactButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeContactText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#f8fafc',
  },
  modalClose: {
    fontSize: 22,
    color: '#94a3b8',
  },
  modalLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modalText: {
    fontSize: 14,
    color: '#e2e8f0',
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
  },
  optionButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
  optionButtonText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  optionButtonTextActive: {
    color: '#ffffff',
  },
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#111827',
    color: '#f8fafc',
    marginBottom: 16,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  dismissButton: {
    margin: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 14,
  },
  addContactButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addContactText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  // People CRM Styles
  peopleSection: {
    marginBottom: 24,
  },
  peopleSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  peopleSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  addPersonButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addPersonButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  peopleFilterRow: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
  filterButtonText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  peopleGroupSection: {
    marginBottom: 16,
  },
  peopleGroupHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 10,
  },
  peopleCardsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  personCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    minWidth: 160,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  personCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  personName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f1f5f9',
    flex: 1,
  },
  personRemoveButton: {
    fontSize: 20,
    color: '#64748b',
    marginLeft: 8,
  },
  personRelationType: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 6,
  },
  personLastContact: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  personScore: {
    marginBottom: 8,
  },
  personScoreLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  personPhone: {
    fontSize: 12,
    color: '#64748b',
  },
  personActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  personActionButton: {
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  personActionButtonSecondary: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  personActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  activityHistorySection: {
    marginTop: 12,
  },
  activityHistoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 6,
  },
  activityHistoryRow: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  activityHistoryText: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  attentionSection: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
  },
  attentionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 12,
  },
  attentionMessage: {
    color: '#94a3b8',
    fontSize: 14,
  },
  attentionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  attentionMain: {
    flex: 1,
    paddingRight: 10,
  },
  attentionName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  attentionMeta: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  attentionScore: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fb7185',
  },
  noPeopleMessage: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  addPersonModalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 20,
    maxHeight: '80%',
  },
  personTodoSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  personTodoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  personTodoLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  personTodoAddButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  personTodoAddText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  personTodoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#111827',
    marginBottom: 8,
  },
  personTodoRowCompleted: {
    backgroundColor: '#0f172a',
    opacity: 0.7,
  },
  personTodoCheckbox: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  personTodoCheckboxText: {
    fontSize: 16,
    color: '#3b82f6',
  },
  personTodoContent: {
    flex: 1,
  },
  personTodoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 2,
  },
  personTodoTitleCompleted: {
    color: '#64748b',
    textDecorationLine: 'line-through',
  },
  personTodoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personTodoMetaText: {
    fontSize: 11,
    color: '#64748b',
  },
  personTodoDelete: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  personTodoDeleteText: {
    fontSize: 18,
    color: '#ef4444',
    fontWeight: '700',
  },
  personTodoEmpty: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
});
