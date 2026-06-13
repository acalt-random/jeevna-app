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
    <View style={styles.container}>
      <View style={styles.progressRail}>
        {steps.map((step, index) => {
          const isComplete = selections[step.id].length > 0;
          const isActive = index === currentStepIndex;

          return (
            <View
              key={step.id}
              style={[
                styles.progressSegment,
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
        {`${completedCount} of ${steps.length} setup choices made`}
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
  container: {
    gap: 12,
  },
  progressRail: {
    flexDirection: 'row',
    gap: 8,
  },
  progressSegment: {
    flex: 1,
    height: 6,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
