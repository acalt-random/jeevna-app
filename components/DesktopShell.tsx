import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DesktopShellProps {
  children: React.ReactNode;
  title: string;
}

export function DesktopShell({ children, title }: DesktopShellProps) {
  const router = useRouter();

  const navigateTo = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <Text style={styles.sidebarTitle}>Life KPI</Text>
        <TouchableOpacity style={styles.navItem} onPress={() => navigateTo('/(tabs)')}>
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigateTo('/(tabs)/entry')}>
          <Text style={styles.navText}>Entry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigateTo('/(tabs)/kpis')}>
          <Text style={styles.navText}>KPIs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigateTo('/(tabs)/categories')}>
          <Text style={styles.navText}>Categories</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigateTo('/(tabs)/history')}>
          <Text style={styles.navText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigateTo('/(tabs)/weekly')}>
          <Text style={styles.navText}>Weekly</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigateTo('/life-buddy')}>
          <Text style={styles.navText}>Life Buddy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigateTo('/(tabs)/templates')}>
          <Text style={styles.navText}>Templates</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.main}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <View style={styles.content}>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0f172a',
  },
  sidebar: {
    width: 240,
    backgroundColor: '#1e293b',
    padding: 20,
    paddingTop: 40,
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 40,
  },
  navItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  navText: {
    fontSize: 16,
    color: '#cbd5e1',
  },
  main: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    height: 60,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  content: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 20,
  },
});
