import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { OnboardingOption, OnboardingStep } from '@/types/onboarding';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
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

type TooltipOverlayState = {
  option: OnboardingOption;
  anchor: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function OptionChip({
  option,
  selected,
  showMobileInfoIcon,
  onPress,
  onRequestTooltip,
  onRequestBottomSheet,
  onScheduleTooltipHide,
}: {
  option: OnboardingOption;
  selected: boolean;
  showMobileInfoIcon: boolean;
  onPress: () => void;
  onRequestTooltip: (option: OnboardingOption, target: View | null) => void;
  onRequestBottomSheet: (option: OnboardingOption) => void;
  onScheduleTooltipHide: () => void;
}) {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(selected ? 1 : 0.98)).current;
  const opacityAnim = useRef(new Animated.Value(selected ? 1 : 0.92)).current;
  const chipRef = useRef<View>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: selected ? 1 : 0.98,
        duration: 160,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: selected ? 1 : 0.92,
        duration: 160,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim, scaleAnim, selected]);

  const openTooltip = () => onRequestTooltip(option, chipRef.current);

  return (
    <View ref={chipRef} collapsable={false} style={styles.chipOuter}>
      <Animated.View
        style={[
          styles.animatedChipWrap,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}>
        <Pressable
          onPress={onPress}
          onLongPress={() => {
            if (Platform.OS !== 'web' && option.description) {
              onRequestBottomSheet(option);
            }
          }}
          onHoverIn={Platform.OS === 'web' && option.description ? openTooltip : undefined}
          onHoverOut={Platform.OS === 'web' && option.description ? onScheduleTooltipHide : undefined}
          style={[
            styles.optionChip,
            {
              backgroundColor: selected ? theme.secondaryBackground : theme.cardBackground,
              borderColor: selected ? theme.accent : theme.cardBorder,
              borderRadius: 999,
              shadowColor: selected ? theme.accent : theme.shadowColor,
              shadowOpacity: selected ? 0.24 : 0.08,
              shadowRadius: selected ? 14 : theme.shadowRadius,
              shadowOffset: { width: 0, height: selected ? 8 : 4 },
              elevation: selected ? theme.elevation + 2 : theme.elevation,
            },
          ]}>
          {option.icon ? (
            <MaterialIcons
              name={option.icon as never}
              size={18}
              color={selected ? theme.accent : theme.textSecondary}
            />
          ) : null}
          <Text
            style={[
              styles.optionChipLabel,
              { color: selected ? theme.textPrimary : theme.textSecondary },
            ]}>
            {option.label}
          </Text>
          {showMobileInfoIcon && option.description ? (
            <TouchableOpacity
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              onPress={() => onRequestBottomSheet(option)}
              activeOpacity={0.75}
              style={[
                styles.infoButton,
                {
                  backgroundColor: theme.buttonSecondary,
                  borderColor: theme.cardBorder,
                },
              ]}>
              <MaterialIcons name="info-outline" size={14} color={theme.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </Pressable>
      </Animated.View>
    </View>
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
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [tooltipState, setTooltipState] = useState<TooltipOverlayState | null>(null);
  const [tooltipHeight, setTooltipHeight] = useState(88);
  const [sheetOption, setSheetOption] = useState<OnboardingOption | null>(null);
  const hideTooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isRolesStep = step.id === 'roles';
  const showMobileInfoIcon = Platform.OS !== 'web';

  const roleGroups = useMemo(() => {
    const groups = new Map<string, OnboardingOption[]>();

    for (const option of step.options) {
      const groupName = option.group ?? 'Other';
      const current = groups.get(groupName) ?? [];
      current.push(option);
      groups.set(groupName, current);
    }

    return [...groups.entries()];
  }, [step.options]);

  const clearHideTooltipTimer = () => {
    if (hideTooltipTimerRef.current) {
      clearTimeout(hideTooltipTimerRef.current);
      hideTooltipTimerRef.current = null;
    }
  };

  const closeTooltip = () => {
    clearHideTooltipTimer();
    setTooltipState(null);
  };

  const scheduleTooltipHide = () => {
    clearHideTooltipTimer();
    hideTooltipTimerRef.current = setTimeout(() => {
      setTooltipState(null);
    }, 120);
  };

  const openTooltip = (option: OnboardingOption, target: View | null) => {
    if (Platform.OS !== 'web' || !option.description || !target) return;

    clearHideTooltipTimer();
    target.measureInWindow((x, y, width, height) => {
      setTooltipState({
        option,
        anchor: { x, y, width, height },
      });
    });
  };

  const tooltipWidth = clamp(Math.round(screenWidth * 0.24), 220, 320);
  const tooltipLeft = tooltipState
    ? clamp(
        tooltipState.anchor.x + tooltipState.anchor.width / 2 - tooltipWidth / 2,
        12,
        Math.max(12, screenWidth - tooltipWidth - 12)
      )
    : 12;
  const shouldPlaceBelow = tooltipState
    ? tooltipState.anchor.y < tooltipHeight + 24 ||
      tooltipState.anchor.y + tooltipState.anchor.height + 16 + tooltipHeight > screenHeight
    : false;
  const tooltipTop = tooltipState
    ? shouldPlaceBelow
      ? Math.min(
          screenHeight - tooltipHeight - 16,
          tooltipState.anchor.y + tooltipState.anchor.height + 10
        )
      : Math.max(16, tooltipState.anchor.y - tooltipHeight - 10)
    : 16;

  return (
    <>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.cardBorder,
            borderRadius: theme.borderRadius.lg,
          },
        ]}>
        <View style={styles.progressRow}>
          <Text style={[styles.progressText, { color: theme.primary }]}>
            Step {stepNumber} of {totalSteps}
          </Text>
          <TouchableOpacity onPress={onSkip} activeOpacity={0.8}>
            <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip for now</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.title, { color: theme.textPrimary }]}>{step.title}</Text>
        <Text style={[styles.prompt, { color: theme.textSecondary }]}>{step.subtitle}</Text>
        {step.helperText ? (
          <Text style={[styles.helper, { color: theme.textMuted }]}>{step.helperText}</Text>
        ) : null}

        <View
          style={[
            styles.selectedCountPill,
            {
              backgroundColor: theme.secondaryBackground,
              borderColor: theme.cardBorder,
            },
          ]}>
          <Text style={[styles.selectedCountText, { color: theme.textPrimary }]}>
            {selectedOptionIds.length} selected
          </Text>
        </View>

        {isRolesStep ? (
          <View style={styles.groupedSections}>
            {roleGroups.map(([groupName, options]) => (
              <View key={groupName} style={styles.groupSection}>
                <Text style={[styles.groupHeading, { color: theme.textPrimary }]}>{groupName}</Text>
                <View style={styles.optionGrid}>
                  {options.map((option) => (
                    <OptionChip
                      key={option.id}
                      option={option}
                      selected={selectedOptionIds.includes(option.id)}
                      showMobileInfoIcon={showMobileInfoIcon}
                      onPress={() => onToggleOption(option.id)}
                      onRequestTooltip={openTooltip}
                      onRequestBottomSheet={setSheetOption}
                      onScheduleTooltipHide={scheduleTooltipHide}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.optionGrid}>
            {step.options.map((option) => (
              <OptionChip
                key={option.id}
                option={option}
                selected={selectedOptionIds.includes(option.id)}
                showMobileInfoIcon={showMobileInfoIcon}
                onPress={() => onToggleOption(option.id)}
                onRequestTooltip={openTooltip}
                onRequestBottomSheet={setSheetOption}
                onScheduleTooltipHide={scheduleTooltipHide}
              />
            ))}
          </View>
        )}

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
            <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>Back</Text>
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
            <Text style={styles.primaryButtonText}>{isLast ? 'Generate Setup' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={Platform.OS === 'web' && !!tooltipState}
        transparent
        animationType="fade"
        onRequestClose={closeTooltip}>
        <Pressable style={styles.overlayRoot} onPress={closeTooltip}>
          {tooltipState ? (
            <Pressable
              onHoverIn={clearHideTooltipTimer}
              onHoverOut={scheduleTooltipHide}
              onPress={(event) => event.stopPropagation?.()}
              style={[
                styles.tooltipOverlay,
                {
                  top: tooltipTop,
                  left: tooltipLeft,
                  width: tooltipWidth,
                  minWidth: 220,
                  maxWidth: 320,
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
              onLayout={(event) => {
                const nextHeight = event.nativeEvent.layout.height;
                if (Math.abs(nextHeight - tooltipHeight) > 2) {
                  setTooltipHeight(nextHeight);
                }
              }}>
              <Text style={[styles.tooltipTitle, { color: theme.textPrimary }]}>
                {tooltipState.option.label}
              </Text>
              <Text style={[styles.tooltipText, { color: theme.textSecondary }]}>
                {tooltipState.option.description}
              </Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Modal>

      <Modal
        visible={Platform.OS !== 'web' && !!sheetOption}
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
                    {sheetOption.label}
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
                    <Text style={[styles.sheetCloseText, { color: theme.textPrimary }]}>
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.sheetDescription, { color: theme.textSecondary }]}>
                  {sheetOption.description}
                </Text>
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
    padding: 18,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
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
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  prompt: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
  helper: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
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
  groupedSections: {
    gap: 18,
  },
  groupSection: {
    gap: 10,
  },
  groupHeading: {
    fontSize: 14,
    fontWeight: '800',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipOuter: {
    maxWidth: '100%',
  },
  animatedChipWrap: {
    maxWidth: '100%',
  },
  optionChip: {
    minHeight: 48,
    maxWidth: 320,
    minWidth: 168,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  optionChipLabel: {
    fontSize: 13,
    fontWeight: '800',
    flexShrink: 1,
  },
  infoButton: {
    marginLeft: 'auto',
    width: 22,
    height: 22,
    borderWidth: 1,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 18,
  },
  secondaryButton: {
    minHeight: 44,
    minWidth: 110,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButton: {
    minHeight: 44,
    minWidth: 146,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  overlayRoot: {
    flex: 1,
  },
  tooltipOverlay: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 50,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  tooltipTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  tooltipText: {
    fontSize: 13,
    lineHeight: 19,
    flexWrap: 'wrap',
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingBottom: 28,
    paddingTop: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
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
    minHeight: 36,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  sheetCloseText: {
    fontSize: 13,
    fontWeight: '800',
  },
  sheetDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
});
