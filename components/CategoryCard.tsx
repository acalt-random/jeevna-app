import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

interface CategoryCardProps {
  title: string;
  subtitle?: string;
  score?: number | null;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  badgeText?: string;
  onPress?: () => void;
  children?: React.ReactNode;
  compact?: boolean;
}

export function CategoryCard({
  title,
  subtitle,
  score,
  iconName = 'dashboard',
  badgeText,
  onPress,
  children,
  compact = false,
}: CategoryCardProps) {
  const { theme } = useTheme();
  const pressable = typeof onPress === 'function';

  return (
    <TouchableOpacity
      activeOpacity={pressable ? 0.84 : 1}
      disabled={!pressable}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder,
          borderRadius: theme.borderRadius.lg,
          padding: compact ? theme.spacing.md : theme.spacing.lg,
        },
      ]}>
      <View style={styles.header}>
        <View style={styles.identity}>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: theme.secondaryBackground,
                borderColor: theme.cardBorder,
                borderRadius: theme.borderRadius.md,
              },
            ]}>
            <MaterialIcons name={iconName} size={compact ? 18 : 20} color={theme.primary} />
          </View>
          <View style={styles.titleWrap}>
            <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.metrics}>
          {typeof score === 'number' ? (
            <Text style={[styles.score, { color: theme.primary }]}>{score}/100</Text>
          ) : null}
          {badgeText ? (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: theme.secondaryBackground,
                  borderColor: theme.cardBorder,
                  borderRadius: theme.borderRadius.sm,
                },
              ]}>
              <Text style={[styles.badgeText, { color: theme.textMuted }]}>{badgeText}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {children ? <View style={styles.content}>{children}</View> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    minHeight: 124,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  metrics: {
    alignItems: 'flex-end',
    gap: 8,
  },
  score: {
    fontSize: 14,
    fontWeight: '900',
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  content: {
    marginTop: 14,
  },
});
