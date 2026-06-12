import { OnboardingQuestionCard } from '@/components/OnboardingQuestionCard';
import { useTheme } from '@/context/ThemeContext';
import { OnboardingSelections, OnboardingStep } from '@/types/onboarding';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface LifeBuddySetupProps {
  steps: OnboardingStep[];
  currentStepIndex: number;
  selections: OnboardingSelections;
  onToggleOption: (stepId: OnboardingStep['id'], optionId: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export function LifeBuddySetup({
  steps,
  currentStepIndex,
  selections,
  onToggleOption,
  onBack,
  onNext,
  onSkip,
}: LifeBuddySetupProps) {
  const { theme } = useTheme();
  const currentStep = steps[currentStepIndex];
  const currentSelections = selections[currentStep.id];

  const completedCount = steps.filter((step) => selections[step.id].length > 0).length;

  return (
    <View>
      <View style={styles.introBlock}>
        <Text style={[styles.eyebrow, { color: theme.primary }]}>Onboarding V2</Text>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Build your Life KPI system by identifying yourself, not by creating KPIs manually.
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Choose your roles, relationships, assets, interests, and priorities. Life Buddy will turn
          those selections into categories, KPIs, activities, and relationship trackers.
        </Text>
      </View>

      <View style={styles.progressDotsRow}>
        {steps.map((step, index) => {
          const isComplete = selections[step.id].length > 0;
          const isActive = index === currentStepIndex;
          return (
            <View
              key={step.id}
              style={[
                styles.progressDot,
                {
                  backgroundColor: isActive
                    ? theme.primary
                    : isComplete
                      ? theme.accent
                      : theme.cardBorder,
                  borderRadius: theme.borderRadius.sm,
                },
              ]}
            />
          );
        })}
      </View>

      <Text style={[styles.statusText, { color: theme.textMuted }]}>
        {completedCount} of {steps.length} steps selected so far.
      </Text>

      <OnboardingQuestionCard
        step={currentStep}
        selectedOptionIds={currentSelections}
        stepNumber={currentStepIndex + 1}
        totalSteps={steps.length}
        onToggleOption={(optionId) => onToggleOption(currentStep.id, optionId)}
        onBack={onBack}
        onNext={onNext}
        onSkip={onSkip}
        isFirst={currentStepIndex === 0}
        isLast={currentStepIndex === steps.length - 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  introBlock: {
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  progressDotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  progressDot: {
    flex: 1,
    height: 6,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
});
