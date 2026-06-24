import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { checkHealth } from './src/api/client';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { API_URL } from './src/config';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';

type AuthScreen = 'login' | 'register';

function AppContent() {
  const { user, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [apiStatus, setApiStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      const healthy = await checkHealth();
      if (!cancelled) {
        setApiStatus(healthy ? 'ok' : 'error');
      }
    }

    loadHealth();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#95D5B2" size="large" />
      </View>
    );
  }

  if (user) {
    return <DashboardScreen />;
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.brand}>ZenTrack</Text>
        <Text style={styles.tagline}>Make focus rewarding, not restriction painful.</Text>
        <Text style={[styles.apiStatus, apiStatus === 'ok' && styles.apiOk, apiStatus === 'error' && styles.apiError]}>
          API: {apiStatus === 'loading' ? 'Checking…' : apiStatus === 'ok' ? 'Connected' : 'Unavailable'} ({API_URL})
        </Text>
      </View>

      {authScreen === 'login' ? (
        <LoginScreen onGoToRegister={() => setAuthScreen('register')} />
      ) : (
        <RegisterScreen onGoToLogin={() => setAuthScreen('login')} />
      )}
      <StatusBar style="light" />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1B4332',
  },
  centered: {
    flex: 1,
    backgroundColor: '#1B4332',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 24,
    gap: 4,
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    color: '#D8F3DC',
  },
  tagline: {
    color: '#B7E4C7',
    fontSize: 13,
  },
  apiStatus: {
    color: '#95D5B2',
    fontSize: 11,
    marginTop: 4,
  },
  apiOk: {
    color: '#B7E4C7',
  },
  apiError: {
    color: '#FFB4A2',
  },
});
