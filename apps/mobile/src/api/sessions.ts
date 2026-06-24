import { API_URL } from '../config';
import { ApiRequestError } from './client';

async function authedFetch(
  token: string,
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
}

async function parseError(response: Response): Promise<ApiRequestError> {
  try {
    const body = (await response.json()) as { detail?: string };
    if (typeof body.detail === 'string') {
      return new ApiRequestError(body.detail, response.status);
    }
  } catch {
    // ignore
  }
  return new ApiRequestError('Request failed', response.status);
}

export type SessionStatus = 'running' | 'paused' | 'completed' | 'cancelled';
export type SessionAction = 'pause' | 'resume' | 'stop' | 'complete';

export type FocusSession = {
  id: string;
  user_id: string;
  duration: number;
  status: SessionStatus;
  started_at: string;
  ended_at: string | null;
  paused_at: string | null;
  accumulated_pause_seconds: number;
};

export async function startSession(token: string, duration: number): Promise<FocusSession> {
  const response = await authedFetch(token, '/api/v1/sessions', {
    method: 'POST',
    body: JSON.stringify({ duration }),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json();
}

export async function updateSession(
  token: string,
  sessionId: string,
  action: SessionAction,
): Promise<FocusSession> {
  const response = await authedFetch(token, `/api/v1/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json();
}

export async function listSessions(token: string): Promise<FocusSession[]> {
  const response = await authedFetch(token, '/api/v1/sessions');
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json();
}
