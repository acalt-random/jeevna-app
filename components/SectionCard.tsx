import React from 'react';
import { StyleSheet, View } from 'react-native';

interface SectionCardProps {
  children: React.ReactNode;
  style?: any;
}

export function SectionCard({ children, style }: SectionCardProps) {
  return (
    <View style={[styles.card, style]}>
      {children}
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
    marginBottom: 16,
  },
});