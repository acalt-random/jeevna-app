import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { IllustrationKey, illustrationConfig } from '@/src/design/illustrations';
import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface EmptyStateProps {
  illustrationKey?: IllustrationKey;
  title: string;
  subtitle?: string;
  message?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  illustrationKey = 'emptyState',
  title,
  subtitle,
  message,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
}: EmptyStateProps) {
  const { theme } = useTheme();
  const illustration = illustrationConfig[illustrationKey];
  const bodyText = subtitle ?? message;
  const accentColor =
    illustration.accent === 'success'
      ? theme.success
      : illustration.accent === 'secondary'
        ? theme.accent
        : theme.primary;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder,
          borderRadius: theme.borderRadius.lg,
          shadowColor: theme.shadowColor,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: theme.shadowOpacity,
          shadowRadius: theme.shadowRadius,
          elevation: theme.elevation,
        },
        style,
      ]}>
      <View
        style={[
          styles.illustrationWrap,
          {
            backgroundColor: theme.secondaryBackground,
            borderColor: `${accentColor}44`,
          },
        ]}>
        <MaterialIcons name={illustration.icon as never} size={28} color={accentColor} />
      </View>

      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      {bodyText ? (
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{bodyText}</Text>
      ) : null}

      {primaryActionLabel || secondaryActionLabel ? (
        <View style={styles.actionsRow}>
          {primaryActionLabel && onPrimaryAction ? (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: theme.buttonPrimary,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
              onPress={onPrimaryAction}
              activeOpacity={0.85}>
              <Text style={styles.primaryButtonText}>{primaryActionLabel}</Text>
            </TouchableOpacity>
          ) : null}

          {secondaryActionLabel && onSecondaryAction ? (
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: theme.buttonSecondary,
                  borderColor: theme.cardBorder,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
              onPress={onSecondaryAction}
              activeOpacity={0.85}>
              <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>
                {secondaryActionLabel}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  illustrationWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 440,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 18,
  },
  primaryButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 44,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
