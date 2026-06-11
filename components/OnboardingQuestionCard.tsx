import { useTheme } from '@/context/ThemeContext';
import { OnboardingQuestion } from '@/types/onboarding';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface OnboardingQuestionCardProps {
  question: OnboardingQuestion;
  answer: string;
  questionNumber: number;
  totalQuestions: number;
  onChangeAnswer: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function OnboardingQuestionCard({
  question,
  answer,
  questionNumber,
  totalQuestions,
  onChangeAnswer,
  onBack,
  onNext,
  onSkip,
  isFirst,
  isLast,
}: OnboardingQuestionCardProps) {
  const { theme } = useTheme();

  return (
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
          Question {questionNumber} of {totalQuestions}
        </Text>
        <TouchableOpacity onPress={onSkip} activeOpacity={0.8}>
          <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip for now</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, { color: theme.textPrimary }]}>{question.title}</Text>
      <Text style={[styles.prompt, { color: theme.textSecondary }]}>{question.prompt}</Text>
      {question.helperText ? (
        <Text style={[styles.helper, { color: theme.textMuted }]}>{question.helperText}</Text>
      ) : null}

      <TextInput
        value={answer}
        onChangeText={onChangeAnswer}
        placeholder={question.placeholder}
        placeholderTextColor={theme.textMuted}
        multiline
        textAlignVertical="top"
        style={[
          styles.input,
          {
            backgroundColor: theme.inputBackground,
            borderColor: theme.cardBorder,
            color: theme.textPrimary,
            borderRadius: theme.borderRadius.md,
          },
        ]}
      />

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

      <Text style={[styles.voiceHint, { color: theme.textMuted }]}>
        Voice setup is planned next. For now, type naturally and Life Buddy will build a first draft.
      </Text>
    </View>
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
    marginBottom: 14,
  },
  input: {
    minHeight: 160,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    lineHeight: 22,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
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
  voiceHint: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
  },
});
