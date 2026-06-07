import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  style?: any;
}

export function PageHeader({ title, subtitle, style }: PageHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    lineHeight: 22,
  },
});
