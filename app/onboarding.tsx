import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Life KPI</Text>

      <Text style={styles.subtitle}>
        Manage your life using Categories, KPIs and To-Dos.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/templates')}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  title: {
    color: 'white',
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 12,
  },

  subtitle: {
    color: '#94a3b8',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
  },

  button: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },

  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});