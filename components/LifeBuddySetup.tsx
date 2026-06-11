import { OnboardingQuestionCard } from '@/components/OnboardingQuestionCard';
import { useTheme } from '@/context/ThemeContext';
import { OnboardingAnswers, OnboardingQuestion } from '@/types/onboarding';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface LifeBuddySetupProps {
  questions: OnboardingQuestion[];
  currentQuestionIndex: number;
  answers: OnboardingAnswers;
  onChangeAnswer: (questionId: OnboardingQuestion['id'], value: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export function LifeBuddySetup({
  questions,
  currentQuestionIndex,
  answers,
  onChangeAnswer,
  onBack,
  onNext,
  onSkip,
}: LifeBuddySetupProps) {
  const { theme } = useTheme();
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <View>
      <View style={styles.introBlock}>
        <Text style={[styles.eyebrow, { color: theme.primary }]}>Life Buddy Setup</Text>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Tell Life Buddy about your life and it will draft your starting system.
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          We&apos;ll ask a handful of focused questions, generate categories, KPIs, activities,
          relationship trackers, and reminder defaults, then let you edit everything before saving.
        </Text>
      </View>

      <View style={styles.progressDotsRow}>
        {questions.map((question, index) => {
          const isComplete = answers[question.id].trim().length > 0;
          const isActive = index === currentQuestionIndex;
          return (
            <View
              key={question.id}
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

      <OnboardingQuestionCard
        question={currentQuestion}
        answer={answers[currentQuestion.id]}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        onChangeAnswer={(value) => onChangeAnswer(currentQuestion.id, value)}
        onBack={onBack}
        onNext={onNext}
        onSkip={onSkip}
        isFirst={currentQuestionIndex === 0}
        isLast={currentQuestionIndex === questions.length - 1}
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
    marginBottom: 14,
  },
  progressDot: {
    flex: 1,
    height: 6,
  },
});
