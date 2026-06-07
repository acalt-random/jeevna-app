import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  style?: any;
}

export function StatCard({ title, value, subtitle, style }: StatCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
});