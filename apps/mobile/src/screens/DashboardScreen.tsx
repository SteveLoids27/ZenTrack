import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../auth/AuthContext';
import { TimerScreen } from './TimerScreen';

export function DashboardScreen() {
  const { user, logout } = useAuth();
  const [showTimer, setShowTimer] = useState(false);

  if (showTimer) {
    return <TimerScreen onBack={() => setShowTimer(false)} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Dashboard</Text>
      <Text style={styles.title}>Hello, {user?.name ?? 'Focus seeker'}</Text>
      <Text style={styles.subtitle}>{user?.email}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Focus Timer</Text>
        <Text style={styles.cardBody}>
          Start a timed focus session. Choose 15, 30, 45, 60 minutes, or enter a custom duration.
        </Text>
        <Pressable style={styles.startButton} onPress={() => setShowTimer(true)}>
          <Text style={styles.startButtonText}>Start focus session</Text>
        </Pressable>
      </View>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B4332',
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  eyebrow: {
    color: '#95D5B2',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#D8F3DC',
  },
  subtitle: {
    color: '#B7E4C7',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    padding: 20,
    gap: 8,
  },
  cardTitle: {
    color: '#D8F3DC',
    fontSize: 18,
    fontWeight: '600',
  },
  cardBody: {
    color: '#B7E4C7',
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: '#95D5B2',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  startButtonText: {
    color: '#1B4332',
    fontWeight: '700',
  },
  logoutButton: {
    borderColor: '#95D5B2',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutButtonText: {
    color: '#D8F3DC',
    fontWeight: '600',
    fontSize: 16,
  },
});
