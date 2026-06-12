import { SectionCard } from '@/components/SectionCard';
import { useTheme } from '@/context/ThemeContext';
import { LifeBuddySuggestion } from '@/services/suggestionEngine';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface LifeBuddySuggestionsProps {
  suggestions: LifeBuddySuggestion[];
  onActivate: (suggestion: LifeBuddySuggestion) => void;
  onDismiss: (suggestion: LifeBuddySuggestion) => void;
}

function formatFrequency(value: string) {
  return value.replace(/^\w/, (match) => match.toUpperCase());
}

export function LifeBuddySuggestions({
  suggestions,
  onActivate,
  onDismiss,
}: LifeBuddySuggestionsProps) {
  const { theme } = useTheme();

  return (
    <SectionCard>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Life Buddy Suggestions</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        New things to track based on your profile and what is already active.
      </Text>

      {suggestions.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          Life Buddy does not have any fresh suggestions right now.
        </Text>
      ) : (
        suggestions.map((suggestion) => (
          <View
            key={suggestion.id}
            style={[
              styles.suggestionCard,
              {
                backgroundColor: theme.background,
                borderColor: theme.cardBorder,
                borderRadius: theme.borderRadius.md,
              },
            ]}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{suggestion.title}</Text>
            <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>
              {suggestion.category} | {formatFrequency(suggestion.frequency)}
            </Text>
            <Text style={[styles.cardReason, { color: theme.textMuted }]}>
              Reason: {suggestion.reason}
            </Text>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: theme.buttonPrimary,
                    borderRadius: theme.borderRadius.sm,
                  },
                ]}
                onPress={() => onActivate(suggestion)}
                activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>Activate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: theme.buttonSecondary,
                    borderColor: theme.cardBorder,
                    borderRadius: theme.borderRadius.sm,
                  },
                ]}
                onPress={() => onDismiss(suggestion)}
                activeOpacity={0.85}>
                <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
                  Dismiss
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
  },
  suggestionCard: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  cardReason: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
