import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { OnboardingOption, OnboardingStep } from '@/types/onboarding';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface OnboardingQuestionCardProps {
  step: OnboardingStep;
  selectedOptionIds: string[];
  stepNumber: number;
  totalSteps: number;
  onToggleOption: (optionId: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function getOptionLabel(option: OnboardingOption): string {
  return option.label ?? option.labelKey ?? option.id;
}

function getOptionDescription(option: OnboardingOption): string | undefined {
  return option.description ?? option.descriptionKey;
}

function InfoButton({
  onPress,
  color,
}: {
  onPress: () => void;
  color: string;
}) {
  return (
    <Pressable
      hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      onPress={(event) => {
        event.stopPropagation?.();
        onPress();
      }}
      style={styles.infoButton}>
      <MaterialIcons name="info-outline" size={16} color={color} />
    </Pressable>
  );
}

function SelectionChip({
  option,
  selected,
  onPress,
  onShowInfo,
}: {
  option: OnboardingOption;
  selected: boolean;
  onPress: () => void;
  onShowInfo: () => void;
}) {
  const { theme } = useTheme();
  const label = getOptionLabel(option);
  const description = getOptionDescription(option);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={() => {
        if (description) {
          onShowInfo();
        }
      }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.secondaryBackground : theme.cardBackground,
          borderColor: selected ? theme.accent : theme.cardBorder,
          shadowColor: theme.shadowColor,
          shadowOpacity: selected ? 0.18 : 0.08,
          shadowRadius: selected ? 14 : theme.shadowRadius,
          shadowOffset: { width: 0, height: selected ? 8 : 4 },
          elevation: selected ? theme.elevation + 1 : theme.elevation,
        },
      ]}>
      {option.icon ? (
        <MaterialIcons
          name={option.icon as never}
          size={18}
          color={selected ? theme.accent : theme.textSecondary}
        />
      ) : null}
      <Text style={[styles.chipLabel, { color: selected ? theme.textPrimary : theme.textSecondary }]}>
        {label}
      </Text>
      {description ? <InfoButton onPress={onShowInfo} color={theme.textMuted} /> : null}
    </Pressable>
  );
}

function ListRow({
  option,
  selected,
  onPress,
  onShowInfo,
}: {
  option: OnboardingOption;
  selected: boolean;
  onPress: () => void;
  onShowInfo: () => void;
}) {
  const { theme } = useTheme();
  const title = getOptionLabel(option);
  const description = getOptionDescription(option);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={() => {
        if (description) {
          onShowInfo();
        }
      }}
      style={[
        styles.listRow,
        {
          borderBottomColor: theme.cardBorder,
          backgroundColor: selected ? theme.secondaryBackground : theme.inputBackground,
        },
      ]}>
      <View
        style={[
          styles.radio,
          {
            borderColor: selected ? theme.accent : theme.cardBorder,
            backgroundColor: selected ? theme.accent : 'transparent',
          },
        ]}>
        {selected ? <MaterialIcons name="check" size={14} color="#ffffff" /> : null}
      </View>

      <View style={styles.listTextWrap}>
        <Text style={[styles.listTitle, { color: theme.textPrimary }]}>{title}</Text>
        {description ? (
          <Text style={[styles.listSubtitle, { color: theme.textSecondary }]}>{description}</Text>
        ) : null}
      </View>

      {description ? <InfoButton onPress={onShowInfo} color={theme.textMuted} /> : null}
    </Pressable>
  );
}

function LifeStageCard({
  option,
  selected,
  onPress,
  onShowInfo,
}: {
  option: OnboardingOption;
  selected: boolean;
  onPress: () => void;
  onShowInfo: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onShowInfo}
      style={[
        styles.lifeStageCard,
        {
          backgroundColor: selected ? theme.secondaryBackground : theme.cardBackground,
          borderColor: selected ? theme.accent : theme.cardBorder,
          shadowColor: theme.shadowColor,
          shadowOpacity: selected ? 0.18 : theme.shadowOpacity,
          shadowRadius: selected ? 16 : theme.shadowRadius,
          shadowOffset: { width: 0, height: selected ? 10 : 6 },
          elevation: selected ? theme.elevation + 2 : theme.elevation,
        },
      ]}>
      <View
        style={[
          styles.lifeStageIconWrap,
          {
            backgroundColor: theme.inputBackground,
            borderColor: selected ? `${theme.accent}55` : theme.cardBorder,
          },
        ]}>
        <MaterialIcons
          name={(option.icon || 'auto-awesome') as never}
          size={22}
          color={selected ? theme.accent : theme.primary}
        />
      </View>
      <View style={styles.lifeStageTextWrap}>
        <Text style={[styles.lifeStageTitle, { color: theme.textPrimary }]}>
          {getOptionLabel(option)}
        </Text>
        <Text style={[styles.lifeStageDescription, { color: theme.textSecondary }]}>
          {getOptionDescription(option)}
        </Text>
      </View>
      <MaterialIcons
        name={selected ? 'check-circle' : 'radio-button-unchecked'}
        size={22}
        color={selected ? theme.accent : theme.textMuted}
      />
    </Pressable>
  );
}

export function OnboardingQuestionCard({
  step,
  selectedOptionIds,
  stepNumber,
  totalSteps,
  onToggleOption,
  onBack,
  onNext,
  onSkip,
  isFirst,
  isLast,
}: OnboardingQuestionCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMoreLanguages, setShowMoreLanguages] = useState(false);
  const [showMoreRegions, setShowMoreRegions] = useState(false);
  const [sheetOption, setSheetOption] = useState<OnboardingOption | null>(null);

  useEffect(() => {
    setSearchQuery('');
    setShowMoreLanguages(false);
    setShowMoreRegions(false);
  }, [step.id]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isLanguageStep = step.id === 'language';
  const isRegionStep = step.id === 'region';
  const isLifeStageStep = step.id === 'lifeStages';
  const showSelectedCount = !step.singleSelect && !isLanguageStep && !isRegionStep;

  const filteredOptions = useMemo(() => {
    const baseOptions = step.options.filter((option) => {
      if (!normalizedQuery) return true;

      return [
        getOptionLabel(option),
        getOptionDescription(option) ?? '',
        option.groupLabel ?? '',
        option.searchText ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });

    if (isLanguageStep && !showMoreLanguages) {
      return baseOptions.filter((option) => option.groupLabel === 'Top Languages');
    }

    if (isRegionStep && !showMoreRegions) {
      return baseOptions.filter((option) => option.groupLabel === 'Recommended Regions');
    }

    return baseOptions;
  }, [isLanguageStep, isRegionStep, normalizedQuery, showMoreLanguages, showMoreRegions, step.options]);

  const groupedOptions = useMemo(() => {
    const groups = new Map<string, OnboardingOption[]>();

    for (const option of filteredOptions) {
      const groupName = option.groupLabel ?? 'Options';
      const current = groups.get(groupName) ?? [];
      current.push(option);
      groups.set(groupName, current);
    }

    return [...groups.entries()];
  }, [filteredOptions]);

  return (
    <>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.cardBorder,
            borderRadius: theme.borderRadius.xl,
          },
        ]}>
        <View style={styles.progressRow}>
          <Text style={[styles.progressText, { color: theme.primary }]}>
            {`Step ${stepNumber} of ${totalSteps}`}
          </Text>
          <TouchableOpacity onPress={onSkip} activeOpacity={0.8}>
            <Text style={[styles.skipText, { color: theme.textSecondary }]}>
              {t('common.skipForNow')}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { color: theme.textPrimary }]}>{step.title}</Text>
        {step.subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{step.subtitle}</Text>
        ) : null}
        {step.helperText ? (
          <Text style={[styles.helper, { color: theme.textMuted }]}>{step.helperText}</Text>
        ) : null}

        {showSelectedCount ? (
          <View
            style={[
              styles.selectedCountPill,
              {
                backgroundColor: theme.secondaryBackground,
                borderColor: theme.cardBorder,
              },
            ]}>
            <Text style={[styles.selectedCountText, { color: theme.textPrimary }]}>
              {step.maxSelections
                ? `${selectedOptionIds.length} of ${step.maxSelections} selected`
                : `${selectedOptionIds.length} selected`}
            </Text>
          </View>
        ) : null}

        {(isLanguageStep ? showMoreLanguages : isRegionStep ? showMoreRegions : false) ? (
          <View
            style={[
              styles.searchWrap,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.cardBorder,
                borderRadius: theme.borderRadius.md,
              },
            ]}>
            <MaterialIcons name="search" size={18} color={theme.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={isLanguageStep ? 'Search languages' : 'Search regions'}
              placeholderTextColor={theme.textMuted}
              style={[styles.searchInput, { color: theme.textPrimary }]}
            />
          </View>
        ) : null}

        {isLifeStageStep ? (
          <View style={styles.lifeStageList}>
            {filteredOptions.map((option) => (
              <LifeStageCard
                key={option.id}
                option={option}
                selected={selectedOptionIds.includes(option.id)}
                onPress={() => onToggleOption(option.id)}
                onShowInfo={() => setSheetOption(option)}
              />
            ))}
          </View>
        ) : isLanguageStep || isRegionStep ? (
          <View style={styles.pickerSections}>
            {groupedOptions.map(([groupName, options]) => (
              <View key={groupName} style={styles.groupSection}>
                <Text style={[styles.groupHeading, { color: theme.textPrimary }]}>{groupName}</Text>
                <View
                  style={[
                    styles.listWrap,
                    {
                      borderColor: theme.cardBorder,
                      backgroundColor: theme.inputBackground,
                    },
                  ]}>
                  {options.map((option, index) => (
                    <View key={option.id}>
                      <ListRow
                        option={option}
                        selected={selectedOptionIds.includes(option.id)}
                        onPress={() => onToggleOption(option.id)}
                        onShowInfo={() => setSheetOption(option)}
                      />
                      {index === options.length - 1 ? null : null}
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {isLanguageStep && !showMoreLanguages ? (
              <TouchableOpacity
                style={[
                  styles.moreButton,
                  {
                    backgroundColor: theme.buttonSecondary,
                    borderColor: theme.cardBorder,
                    borderRadius: theme.borderRadius.md,
                  },
                ]}
                onPress={() => setShowMoreLanguages(true)}
                activeOpacity={0.85}>
                <Text style={[styles.moreButtonText, { color: theme.textPrimary }]}>More Languages</Text>
              </TouchableOpacity>
            ) : null}

            {isRegionStep && !showMoreRegions ? (
              <TouchableOpacity
                style={[
                  styles.moreButton,
                  {
                    backgroundColor: theme.buttonSecondary,
                    borderColor: theme.cardBorder,
                    borderRadius: theme.borderRadius.md,
                  },
                ]}
                onPress={() => setShowMoreRegions(true)}
                activeOpacity={0.85}>
                <Text style={[styles.moreButtonText, { color: theme.textPrimary }]}>More Regions</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={styles.groupedSections}>
            {groupedOptions.map(([groupName, options]) => (
              <View key={groupName} style={styles.groupSection}>
                {groupedOptions.length > 1 ? (
                  <Text style={[styles.groupHeading, { color: theme.textPrimary }]}>{groupName}</Text>
                ) : null}
                <View style={styles.optionGrid}>
                  {options.map((option) => (
                    <SelectionChip
                      key={option.id}
                      option={option}
                      selected={selectedOptionIds.includes(option.id)}
                      onPress={() => onToggleOption(option.id)}
                      onShowInfo={() => setSheetOption(option)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {filteredOptions.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            No matches yet. Try a different keyword.
          </Text>
        ) : null}

        <View style={styles.footerRow}>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {
                backgroundColor: theme.buttonSecondary,
                borderColor: theme.cardBorder,
                borderRadius: theme.borderRadius.md,
                opacity: isFirst ? 0.5 : 1,
              },
            ]}
            onPress={onBack}
            disabled={isFirst}
            activeOpacity={0.85}>
            <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
              {t('common.back')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: theme.buttonPrimary,
                borderRadius: theme.borderRadius.md,
              },
            ]}
            onPress={onNext}
            activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>
              {isLast ? 'Preview My Setup' : t('common.continue')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={!!sheetOption}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOption(null)}>
        <Pressable
          style={[styles.sheetBackdrop, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
          onPress={() => setSheetOption(null)}>
          <Pressable
            style={[
              styles.bottomSheet,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.cardBorder,
                borderTopLeftRadius: theme.borderRadius.xl,
                borderTopRightRadius: theme.borderRadius.xl,
              },
            ]}
            onPress={(event) => event.stopPropagation?.()}>
            {sheetOption ? (
              <>
                <View style={styles.sheetHandleWrap}>
                  <View
                    style={[
                      styles.sheetHandle,
                      { backgroundColor: theme.cardBorder, borderRadius: 999 },
                    ]}
                  />
                </View>

                <View style={styles.sheetHeader}>
                  <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>
                    {getOptionLabel(sheetOption)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSheetOption(null)}
                    activeOpacity={0.8}
                    style={[
                      styles.sheetCloseButton,
                      {
                        backgroundColor: theme.buttonSecondary,
                        borderColor: theme.cardBorder,
                      },
                    ]}>
                    <MaterialIcons name="close" size={18} color={theme.textPrimary} />
                  </TouchableOpacity>
                </View>

                {getOptionDescription(sheetOption) ? (
                  <Text style={[styles.sheetDescription, { color: theme.textSecondary }]}>
                    {getOptionDescription(sheetOption)}
                  </Text>
                ) : null}

                <View style={styles.sheetActionRow}>
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      {
                        backgroundColor: selectedOptionIds.includes(sheetOption.id)
                          ? theme.buttonSecondary
                          : theme.buttonPrimary,
                        borderRadius: theme.borderRadius.md,
                        borderWidth: selectedOptionIds.includes(sheetOption.id) ? 1 : 0,
                        borderColor: theme.cardBorder,
                      },
                    ]}
                    onPress={() => {
                      if (!selectedOptionIds.includes(sheetOption.id)) {
                        onToggleOption(sheetOption.id);
                      }
                      setSheetOption(null);
                    }}
                    activeOpacity={0.85}>
                    <Text
                      style={[
                        styles.primaryButtonText,
                        {
                          color: selectedOptionIds.includes(sheetOption.id)
                            ? theme.textMuted
                            : '#ffffff',
                        },
                      ]}>
                      {selectedOptionIds.includes(sheetOption.id) ? t('common.selected') : t('common.selectThis')}
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
                    onPress={() => setSheetOption(null)}
                    activeOpacity={0.85}>
                    <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
                      {t('common.gotIt')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 20,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  skipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
  helper: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  selectedCountPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },
  selectedCountText: {
    fontSize: 12,
    fontWeight: '800',
  },
  searchWrap: {
    minHeight: 46,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  pickerSections: {
    gap: 14,
  },
  groupedSections: {
    gap: 18,
  },
  groupSection: {
    gap: 10,
  },
  groupHeading: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  listWrap: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  listRow: {
    minHeight: 72,
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listTextWrap: {
    flex: 1,
    gap: 3,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  listSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  moreButton: {
    minHeight: 46,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  moreButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  lifeStageList: {
    gap: 12,
  },
  lifeStageCard: {
    minHeight: 108,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  lifeStageIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifeStageTextWrap: {
    flex: 1,
    gap: 4,
  },
  lifeStageTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  lifeStageDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    minHeight: 48,
    minWidth: 164,
    maxWidth: 320,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '800',
    flexShrink: 1,
  },
  infoButton: {
    marginLeft: 'auto',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  primaryButton: {
    minHeight: 46,
    minWidth: 150,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    minHeight: 46,
    minWidth: 110,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    maxHeight: '80%',
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 24,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  sheetHandle: {
    width: 44,
    height: 5,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '900',
    flex: 1,
  },
  sheetCloseButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  sheetActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
