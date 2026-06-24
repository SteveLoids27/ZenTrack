import { useCallback, useEffect, useRef, useState } from 'react';

import type { FocusSession } from '../api/sessions';

function getElapsedSeconds(session: FocusSession, nowMs: number): number {
  const startedMs = new Date(session.started_at).getTime();
  let elapsed = Math.floor((nowMs - startedMs) / 1000) - session.accumulated_pause_seconds;
  if (session.status === 'paused' && session.paused_at) {
    const pausedMs = new Date(session.paused_at).getTime();
    elapsed -= Math.floor((nowMs - pausedMs) / 1000);
  }
  return Math.max(0, elapsed);
}

export function useFocusTimer(session: FocusSession | null) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const sessionRef = useRef(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const recompute = useCallback(() => {
    const current = sessionRef.current;
    if (!current) {
      setRemainingSeconds(0);
      return;
    }
    const targetSeconds = current.duration * 60;
    const elapsed = getElapsedSeconds(current, Date.now());
    setRemainingSeconds(Math.max(0, targetSeconds - elapsed));
  }, []);

  useEffect(() => {
    recompute();
    if (!session || session.status === 'completed' || session.status === 'cancelled') {
      return undefined;
    }

    const interval = setInterval(recompute, 1000);
    return () => clearInterval(interval);
  }, [session, recompute]);

  const isFinished =
    session?.status === 'completed' ||
    session?.status === 'cancelled' ||
    (session != null && remainingSeconds <= 0);

  return { remainingSeconds, isFinished, recompute };
}

export function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
