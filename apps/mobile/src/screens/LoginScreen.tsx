import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '../auth/AuthContext';

type Props = {
  onGoToRegister: () => void;
};

export function LoginScreen({ onGoToRegister }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to continue your focus journey.</Text>

      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor="#95D5B2"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Password"
        placeholderTextColor="#95D5B2"
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.primaryButton} onPress={handleLogin} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#1B4332" /> : <Text style={styles.primaryButtonText}>Log in</Text>}
      </Pressable>

      <Pressable onPress={onGoToRegister}>
        <Text style={styles.link}>Need an account? Register</Text>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#D8F3DC',
  },
  subtitle: {
    color: '#B7E4C7',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#2D6A4F',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#D8F3DC',
  },
  error: {
    color: '#FFB4A2',
  },
  primaryButton: {
    backgroundColor: '#95D5B2',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#1B4332',
    fontWeight: '700',
    fontSize: 16,
  },
  link: {
    color: '#D8F3DC',
    textAlign: 'center',
    marginTop: 16,
  },
});
