import { DesktopShell } from '@/components/DesktopShell';
import { EmptyState } from '@/components/EmptyState';
import { PageContainer } from '@/components/PageContainer';
import { PageHeader } from '@/components/PageHeader';
import { SectionCard } from '@/components/SectionCard';
import { KPI, Subtask, SubtaskFrequency, useAppData } from '@/context/AppDataContext';
import { useDeviceType } from '@/hooks/useDeviceType';

import React, { useState } from 'react';
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

// ─── Subtask frequency options ────────────────────────────────────────────────

const FREQUENCY_OPTIONS: { label: string; value: SubtaskFrequency }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Custom', value: 'custom' },
];

// ─── SubtaskRow: renders one subtask with edit / delete ───────────────────────

interface SubtaskRowProps {
  subtask: Subtask;
  onEdit: (subtask: Subtask) => void;
  onDelete: (id: string) => void;
}

function SubtaskRow({ subtask, onEdit, onDelete }: SubtaskRowProps) {
  return (
    <View style={stStyles.row}>
      <View style={stStyles.info}>
        <Text style={stStyles.name}>{subtask.name}</Text>
        <Text style={stStyles.meta}>
          {subtask.frequency} · {subtask.targetCount}×
        </Text>
      </View>
      <View style={stStyles.actions}>
        <TouchableOpacity
          style={stStyles.editBtn}
          onPress={() => onEdit(subtask)}
          activeOpacity={0.7}
        >
          <Text style={stStyles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={stStyles.deleteBtn}
          onPress={() => onDelete(subtask.id)}
          activeOpacity={0.7}
        >
          <Text style={stStyles.deleteBtnText}>Del</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── SubtaskForm: inline add / edit form for a subtask ────────────────────────

interface SubtaskFormProps {
  kpiId: string;
  /** When set, we're editing an existing subtask */
  editingSubtask: Subtask | null;
  onDone: () => void;
}

function SubtaskForm({ kpiId, editingSubtask, onDone }: SubtaskFormProps) {
  const { addSubtask, updateSubtask } = useAppData();

  const [name, setName] = useState(editingSubtask?.name ?? '');
  const [frequency, setFrequency] = useState<SubtaskFrequency>(
    editingSubtask?.frequency ?? 'daily'
  );
  const [targetCount, setTargetCount] = useState(
    editingSubtask ? String(editingSubtask.targetCount) : '1'
  );
  const [freqPickerOpen, setFreqPickerOpen] = useState(false);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const count = parseInt(targetCount, 10);
    const safeCount = isNaN(count) || count < 1 ? 1 : count;

    if (editingSubtask) {
      updateSubtask({
        ...editingSubtask,
        name: trimmedName,
        frequency,
        targetCount: safeCount,
      });
    } else {
      addSubtask({ kpiId, name: trimmedName, frequency, targetCount: safeCount });
    }
    onDone();
  };

  const selectedFreqLabel =
    FREQUENCY_OPTIONS.find((o) => o.value === frequency)?.label ?? 'Daily';

  return (
    <View style={stStyles.form}>
      <TextInput
        style={stStyles.input}
        value={name}
        onChangeText={setName}
        placeholder="Subtask name"
        placeholderTextColor="#64748b"
        autoFocus
      />

      {/* Frequency inline picker */}
      <TouchableOpacity
        style={stStyles.freqButton}
        onPress={() => setFreqPickerOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={stStyles.freqButtonText}>Frequency: {selectedFreqLabel}</Text>
      </TouchableOpacity>

      <Modal
        visible={freqPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFreqPickerOpen(false)}
      >
        <View style={stStyles.modalOverlay}>
          <TouchableOpacity
            style={stStyles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setFreqPickerOpen(false)}
          />
          <View style={stStyles.modalCard}>
            <Text style={stStyles.modalTitle}>Select frequency</Text>
            {FREQUENCY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  stStyles.modalRow,
                  frequency === opt.value && stStyles.modalRowSelected,
                ]}
                onPress={() => {
                  setFrequency(opt.value);
                  setFreqPickerOpen(false);
                }}
              >
                <Text style={stStyles.modalRowText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <View style={stStyles.countRow}>
        <Text style={stStyles.countLabel}>Target count</Text>
        <TextInput
          style={stStyles.countInput}
          value={targetCount}
          onChangeText={setTargetCount}
          keyboardType="numeric"
          placeholderTextColor="#64748b"
        />
      </View>

      <View style={stStyles.formActions}>
        <TouchableOpacity style={stStyles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={stStyles.saveBtnText}>
            {editingSubtask ? 'Save' : 'Add'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={stStyles.cancelBtn} onPress={onDone} activeOpacity={0.7}>
          <Text style={stStyles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── SubtasksSection: the collapsible block rendered under each KPI card ──────

interface SubtasksSectionProps {
  kpiId: string;
}

function SubtasksSection({ kpiId }: SubtasksSectionProps) {
  const { subtasks, deleteSubtask } = useAppData();
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);

  const kpiSubtasks = subtasks.filter((s) => s.kpiId === kpiId);

  const handleEdit = (subtask: Subtask) => {
    setEditingSubtask(subtask);
    setShowForm(true);
    setExpanded(true);
  };

  const handleFormDone = () => {
    setShowForm(false);
    setEditingSubtask(null);
  };

  const handleAddNew = () => {
    setEditingSubtask(null);
    setShowForm(true);
    setExpanded(true);
  };

  return (
    <View style={stStyles.section}>
      {/* Section header — always visible */}
      <TouchableOpacity
        style={stStyles.sectionHeader}
        onPress={() => {
          setExpanded((v) => !v);
          if (showForm) setShowForm(false);
        }}
        activeOpacity={0.7}
      >
        <Text style={stStyles.sectionTitle}>
          Subtasks{kpiSubtasks.length > 0 ? ` (${kpiSubtasks.length})` : ''}
        </Text>
        <Text style={stStyles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View>
          {kpiSubtasks.length === 0 && !showForm ? (
            <Text style={stStyles.emptyText}>No subtasks yet. Add one below.</Text>
          ) : (
            kpiSubtasks.map((st) => (
              <SubtaskRow
                key={st.id}
                subtask={st}
                onEdit={handleEdit}
                onDelete={deleteSubtask}
              />
            ))
          )}

          {showForm ? (
            <SubtaskForm
              kpiId={kpiId}
              editingSubtask={editingSubtask}
              onDone={handleFormDone}
            />
          ) : (
            <TouchableOpacity
              style={stStyles.addSubtaskButton}
              onPress={handleAddNew}
              activeOpacity={0.8}
            >
              <Text style={stStyles.addSubtaskButtonText}>+ Add Subtask</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Main KPI Manager Screen ──────────────────────────────────────────────────

export default function KPIManagerScreen() {
  const [kpiName, setKpiName] = useState('');
  const [category, setCategory] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [weight, setWeight] = useState('');
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { categories, kpis, addKPI, updateKPI, deleteKPI } = useAppData();

  const clearForm = () => {
    setKpiName('');
    setCategory('');
    setTarget('');
    setUnit('');
    setWeight('');
    setEditingId(null);
  };

  const handleStartEdit = (item: KPI) => {
    setKpiName(item.name);
    setCategory(item.category);
    setTarget(String(item.target));
    setUnit(item.unit);
    setWeight(String(item.weight));
    setEditingId(item.id);
  };

  const handleCancelEdit = () => {
    clearForm();
  };

  const handleSaveOrAddKPI = () => {
    if (!kpiName.trim() || !category.trim() || !target.trim() || !unit.trim() || !weight.trim()) {
      return;
    }
    const targetNum = parseFloat(target);
    const weightNum = parseFloat(weight);
    if (isNaN(targetNum) || isNaN(weightNum)) {
      return;
    }

    if (editingId) {
      updateKPI({
        id: editingId,
        name: kpiName.trim(),
        category: category.trim(),
        target: targetNum,
        unit: unit.trim(),
        weight: weightNum,
      });
    } else {
      addKPI({
        name: kpiName.trim(),
        category: category.trim(),
        target: targetNum,
        unit: unit.trim(),
        weight: weightNum,
      });
    }
    clearForm();
  };

  const handleDeleteKPI = (id: string) => {
    if (editingId === id) {
      clearForm();
    }
    deleteKPI(id);
  };

  const deviceType = useDeviceType();

  // ─── Desktop layout ───────────────────────────────────────────────────────

  if (deviceType === 'desktop') {
    return (
      <DesktopShell title="KPIs">
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
          <PageHeader title="KPIs" subtitle="Manage your performance metrics." />
          <View style={styles.desktopLayout}>
            <View style={styles.formPanel}>
              <SectionCard>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>KPI Name</Text>
                  <TextInput
                    style={styles.input}
                    value={kpiName}
                    onChangeText={setKpiName}
                    placeholder="Enter KPI name"
                    placeholderTextColor="#888"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Category</Text>
                  <TouchableOpacity
                    style={styles.picker}
                    onPress={() => setCategoryPickerOpen(!categoryPickerOpen)}
                  >
                    <Text style={styles.pickerText}>
                      {category || 'Select category'}
                    </Text>
                  </TouchableOpacity>
                  {categoryPickerOpen && (
                    <View style={styles.pickerDropdown}>
                      <ScrollView style={{ maxHeight: 150 }}>
                        {categories.map((cat) => (
                          <TouchableOpacity
                            key={cat.id}
                            style={styles.pickerOption}
                            onPress={() => {
                              setCategory(cat.name);
                              setCategoryPickerOpen(false);
                            }}
                          >
                            <Text style={styles.modalRowText}>{cat.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <View style={styles.row}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Target</Text>
                    <TextInput
                      style={styles.input}
                      value={target}
                      onChangeText={setTarget}
                      keyboardType="numeric"
                      placeholder="Enter target"
                      placeholderTextColor="#888"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Unit</Text>
                    <TextInput
                      style={styles.input}
                      value={unit}
                      onChangeText={setUnit}
                      placeholder="Enter unit"
                      placeholderTextColor="#888"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Weight</Text>
                  <TextInput
                    style={styles.input}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    placeholder="Enter weight"
                    placeholderTextColor="#888"
                  />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleSaveOrAddKPI}>
                  <Text style={styles.buttonText}>{editingId ? 'Save KPI' : 'Add KPI'}</Text>
                </TouchableOpacity>
                {editingId ? (
                  <TouchableOpacity style={styles.cancelButton} onPress={clearForm}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                ) : null}
              </SectionCard>
            </View>

            <View style={styles.listPanel}>
              <Text style={styles.title}>Your KPIs</Text>
              {kpis.length === 0 ? (
                <EmptyState
                  title="No KPIs Yet"
                  message="Add your first KPI to start tracking."
                />
              ) : (
                kpis.map((kpi) => (
                  <SectionCard key={kpi.id}>
                    <View style={styles.kpiHeader}>
                      <Text style={styles.kpiName}>{kpi.name}</Text>
                      <View style={styles.kpiActions}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => handleStartEdit(kpi)}
                        >
                          <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteKPI(kpi.id)}
                        >
                          <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.kpiDetails}>
                      Category: {kpi.category} | Target: {kpi.target} {kpi.unit} | Weight: {kpi.weight}
                    </Text>
                    {/* ─── Subtasks section ─── */}
                    <SubtasksSection kpiId={kpi.id} />
                  </SectionCard>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </DesktopShell>
    );
  }

  // ─── Mobile layout ────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <PageContainer>
          <PageHeader title="KPIs" subtitle="Manage your performance metrics." />
          <SectionCard>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>KPI Name</Text>
              <TextInput
                style={styles.input}
                value={kpiName}
                onChangeText={setKpiName}
                placeholder="Enter KPI name"
                placeholderTextColor="#888"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Category</Text>
              {categories.length === 0 ? (
                <Text style={styles.emptyCategoriesText}>Please add categories first</Text>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => setCategoryPickerOpen(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={category ? styles.pickerValueText : styles.pickerPlaceholderText}>
                      {category || 'Select a category'}
                    </Text>
                  </TouchableOpacity>
                  <Modal
                    visible={categoryPickerOpen}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setCategoryPickerOpen(false)}
                  >
                    <View style={styles.modalOverlay}>
                      <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => setCategoryPickerOpen(false)}
                      />
                      <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Select a category</Text>
                        <ScrollView style={styles.modalList}>
                          {categories.map((cat) => (
                            <TouchableOpacity
                              key={cat.id}
                              style={styles.modalRow}
                              onPress={() => {
                                setCategory(cat.name);
                                setCategoryPickerOpen(false);
                              }}
                            >
                              <Text style={styles.modalRowText}>{cat.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  </Modal>
                </>
              )}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.label}>Target</Text>
                <TextInput
                  style={styles.input}
                  value={target}
                  onChangeText={setTarget}
                  keyboardType="numeric"
                  placeholder="Enter target"
                  placeholderTextColor="#888"
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.label}>Unit</Text>
                <TextInput
                  style={styles.input}
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="Enter unit"
                  placeholderTextColor="#888"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Weight</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="Enter weight"
                placeholderTextColor="#888"
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSaveOrAddKPI}>
              <Text style={styles.buttonText}>{editingId ? 'Save KPI' : 'Add KPI'}</Text>
            </TouchableOpacity>
            {editingId ? (
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit} activeOpacity={0.7}>
                <Text style={styles.cancelButtonText}>Cancel Edit</Text>
              </TouchableOpacity>
            ) : null}
          </SectionCard>

          {kpis.length === 0 ? (
            <EmptyState
              title="No KPIs Added Yet"
              message="Create your first KPI to start tracking your progress."
            />
          ) : (
            kpis.map((item) => (
              <SectionCard key={item.id}>
                <Text style={styles.kpiText}>Name: {item.name}</Text>
                <Text style={styles.kpiText}>Category: {item.category}</Text>
                <Text style={styles.kpiText}>
                  Target: {item.target} {item.unit}
                </Text>
                <Text style={styles.kpiText}>Weight: {item.weight}</Text>
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
                    onPress={() => handleDeleteKPI(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
                {/* ─── Subtasks section ─── */}
                <SubtasksSection kpiId={item.id} />
              </SectionCard>
            ))
          )}
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Subtask component styles ─────────────────────────────────────────────────

const stStyles = StyleSheet.create({
  section: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#93c5fd',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chevron: {
    fontSize: 11,
    color: '#64748b',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  meta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  editBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3b82f6',
    backgroundColor: '#172554',
  },
  editBtnText: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dc2626',
    backgroundColor: '#450a0a',
  },
  deleteBtnText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
  },
  addSubtaskButton: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  addSubtaskButtonText: {
    color: '#93c5fd',
    fontSize: 13,
    fontWeight: '600',
  },
  // Form
  form: {
    marginTop: 10,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#f1f5f9',
    marginBottom: 10,
  },
  freqButton: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  freqButtonText: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  countLabel: {
    fontSize: 14,
    color: '#94a3b8',
    flex: 1,
  },
  countInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: '#f1f5f9',
    width: 70,
    textAlign: 'center',
  },
  formActions: {
    flexDirection: 'row',
    gap: 8,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  // Frequency picker modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalCard: {
    width: '75%',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 10,
  },
  modalRow: {
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalRowSelected: {
    backgroundColor: '#172554',
    borderRadius: 6,
  },
  modalRowText: {
    fontSize: 15,
    color: '#e2e8f0',
  },
});

// ─── KPI screen styles (unchanged from original) ──────────────────────────────

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: 'white',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: 'white',
    backgroundColor: '#1e293b',
  },
  emptyCategoriesText: {
    fontSize: 16,
    color: '#94a3b8',
    paddingVertical: 10,
  },
  pickerValueText: {
    fontSize: 16,
    color: 'white',
  },
  pickerPlaceholderText: {
    fontSize: 16,
    color: '#888',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#0f172a',
  },
  pickerText: {
    fontSize: 16,
    color: 'white',
  },
  pickerDropdown: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  pickerOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  kpiName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
    flex: 1,
  },
  kpiActions: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiDetails: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalCard: {
    width: '85%',
    maxHeight: '50%',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  modalList: {
    maxHeight: 280,
  },
  modalRow: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalRowText: {
    fontSize: 16,
    color: 'white',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
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
  kpiText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
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
  desktopLayout: {
    flexDirection: 'row',
    gap: 20,
    flex: 1,
  },
  formPanel: {
    flex: 1,
  },
  listPanel: {
    flex: 1,
  },
});
