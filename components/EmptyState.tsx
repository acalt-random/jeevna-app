import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface EmptyStateProps {
  title: string;
  message: string;
  style?: any;
}

export function EmptyState({ title, message, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f1f5f9',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
  },
});