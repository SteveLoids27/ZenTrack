import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export default function App() {
  const [apiStatus, setApiStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      try {
        const response = await fetch(`${API_URL}/health`);
        if (!response.ok) {
          throw new Error('Health check failed');
        }
        const data = await response.json();
        if (!cancelled) {
          setApiStatus(data.status === 'ok' ? 'ok' : 'error');
        }
      } catch {
        if (!cancelled) {
          setApiStatus('error');
        }
      }
    }

    checkHealth();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ZenTrack</Text>
      <Text style={styles.subtitle}>Digital Detox Timer</Text>
      <Text style={styles.tagline}>Make focus rewarding, not restriction painful.</Text>

      <View style={styles.statusCard}>
        {apiStatus === 'loading' && <ActivityIndicator color="#2D6A4F" />}
        <Text style={styles.statusLabel}>API Status</Text>
        <Text style={[styles.statusValue, apiStatus === 'ok' && styles.statusOk, apiStatus === 'error' && styles.statusError]}>
          {apiStatus === 'loading' ? 'Checking…' : apiStatus === 'ok' ? 'Connected' : 'Unavailable'}
        </Text>
        <Text style={styles.apiUrl}>{API_URL}</Text>
      </View>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B4332',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#D8F3DC',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#95D5B2',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#B7E4C7',
    textAlign: 'center',
    marginBottom: 32,
  },
  statusCard: {
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: 6,
  },
  statusLabel: {
    color: '#D8F3DC',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusValue: {
    color: '#D8F3DC',
    fontSize: 18,
    fontWeight: '600',
  },
  statusOk: {
    color: '#95D5B2',
  },
  statusError: {
    color: '#FFB4A2',
  },
  apiUrl: {
    color: '#B7E4C7',
    fontSize: 11,
    marginTop: 4,
  },
});
