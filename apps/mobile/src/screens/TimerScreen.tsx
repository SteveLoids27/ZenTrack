import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { FocusSession } from '../api/sessions';
import { listSessions, startSession, updateSession } from '../api/sessions';
import { useAuth } from '../auth/AuthContext';
import { formatTimer, useFocusTimer } from '../hooks/useFocusTimer';

const PRESET_DURATIONS = [15, 30, 45, 60];

type Props = {
  onBack: () => void;
};

export function TimerScreen({ onBack }: Props) {
  const { token } = useAuth();
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [customDuration, setCustomDuration] = useState('');
  const [session, setSession] = useState<FocusSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { remainingSeconds, isFinished } = useFocusTimer(session);

  async function refreshRecent() {
    if (!token) {
      return;
    }
    const sessions = await listSessions(token);
    setRecentSessions(sessions.slice(0, 5));
    const active = sessions.find((item) => item.status === 'running' || item.status === 'paused');
    if (active) {
      setSession(active);
    }
  }

  useEffect(() => {
    if (token) {
      void refreshRecent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const isLive = session != null && (session.status === 'running' || session.status === 'paused');
  const isFinishedSession =
    session != null && (session.status === 'completed' || session.status === 'cancelled');
  const effectiveDuration =
    customDuration.trim() !== '' ? Number(customDuration) : selectedDuration;

  async function handleStart() {
    if (!token) {
      return;
    }
    if (!Number.isFinite(effectiveDuration) || effectiveDuration < 1) {
      setError('Enter a valid duration in minutes');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const created = await startSession(token, Math.floor(effectiveDuration));
      setSession(created);
      await refreshRecent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: 'pause' | 'resume' | 'stop' | 'complete') {
    if (!token || !session) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const updated = await updateSession(token, session.id, action);
      setSession(updated);
      if (updated.status === 'completed' || updated.status === 'cancelled') {
        await refreshRecent();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>← Back to dashboard</Text>
      </Pressable>

      <Text style={styles.title}>Focus Timer</Text>
      <Text style={styles.subtitle}>Choose a duration and start your session.</Text>

      {!isLive && !isFinishedSession ? (
        <>
          <View style={styles.presetRow}>
            {PRESET_DURATIONS.map((minutes) => (
              <Pressable
                key={minutes}
                style={[
                  styles.presetChip,
                  selectedDuration === minutes && customDuration === '' && styles.presetChipActive,
                ]}
                onPress={() => {
                  setSelectedDuration(minutes);
                  setCustomDuration('');
                }}
              >
                <Text style={styles.presetChipText}>{minutes}m</Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="Custom minutes"
            placeholderTextColor="#95D5B2"
            value={customDuration}
            onChangeText={setCustomDuration}
          />

          <Pressable style={styles.primaryButton} onPress={handleStart} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#1B4332" />
            ) : (
              <Text style={styles.primaryButtonText}>Start</Text>
            )}
          </Pressable>
        </>
      ) : isLive && session ? (
        <>
          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>
              {session.status === 'paused' ? 'Paused' : 'Focusing'}
            </Text>
            <Text style={styles.timerValue}>{formatTimer(remainingSeconds)}</Text>
            <Text style={styles.timerMeta}>Target: {session.duration} minutes</Text>
            {isFinished && session.status === 'running' ? (
              <Text style={styles.timerHint}>Time is up — complete or stop your session.</Text>
            ) : null}
          </View>

          <View style={styles.actionRow}>
            {session.status === 'running' ? (
              <Pressable style={styles.secondaryButton} onPress={() => handleAction('pause')} disabled={loading}>
                <Text style={styles.secondaryButtonText}>Pause</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.secondaryButton} onPress={() => handleAction('resume')} disabled={loading}>
                <Text style={styles.secondaryButtonText}>Resume</Text>
              </Pressable>
            )}
            <Pressable style={styles.secondaryButton} onPress={() => handleAction('stop')} disabled={loading}>
              <Text style={styles.secondaryButtonText}>Stop</Text>
            </Pressable>
            <Pressable style={styles.primaryButtonSmall} onPress={() => handleAction('complete')} disabled={loading}>
              <Text style={styles.primaryButtonText}>Complete</Text>
            </Pressable>
          </View>
        </>
      ) : isFinishedSession && session ? (
        <>
          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>Session saved</Text>
            <Text style={styles.timerValue}>{session.status === 'completed' ? 'Complete' : 'Cancelled'}</Text>
            <Text style={styles.timerMeta}>
              {session.duration} minutes · {session.ended_at ? new Date(session.ended_at).toLocaleString() : ''}
            </Text>
          </View>
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              setSession(null);
              void refreshRecent();
            }}
          >
            <Text style={styles.primaryButtonText}>Start another session</Text>
          </Pressable>
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {recentSessions.length > 0 ? (
        <View style={styles.recentCard}>
          <Text style={styles.recentTitle}>Recent sessions</Text>
          {recentSessions.map((item) => (
            <Text key={item.id} style={styles.recentItem}>
              {item.duration}m · {item.status} · {new Date(item.started_at).toLocaleString()}
            </Text>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#1B4332',
    padding: 24,
    gap: 12,
  },
  backLink: {
    color: '#95D5B2',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#D8F3DC',
  },
  subtitle: {
    color: '#B7E4C7',
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    borderColor: '#95D5B2',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  presetChipActive: {
    backgroundColor: '#95D5B2',
  },
  presetChipText: {
    color: '#D8F3DC',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#2D6A4F',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#D8F3DC',
  },
  timerCard: {
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  timerLabel: {
    color: '#95D5B2',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  timerValue: {
    color: '#D8F3DC',
    fontSize: 56,
    fontWeight: '700',
  },
  timerMeta: {
    color: '#B7E4C7',
  },
  timerHint: {
    color: '#FFB4A2',
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#95D5B2',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonSmall: {
    backgroundColor: '#95D5B2',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#1B4332',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    borderColor: '#95D5B2',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#D8F3DC',
    fontWeight: '600',
  },
  error: {
    color: '#FFB4A2',
  },
  recentCard: {
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    padding: 16,
    gap: 6,
    marginTop: 8,
  },
  recentTitle: {
    color: '#D8F3DC',
    fontWeight: '600',
    marginBottom: 4,
  },
  recentItem: {
    color: '#B7E4C7',
    fontSize: 13,
  },
});
