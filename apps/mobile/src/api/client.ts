import { API_URL } from '../config';

type ApiError = {
  detail?: string;
  status?: number;
};

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseError(response: Response): Promise<ApiRequestError> {
  try {
    const body = (await response.json()) as ApiError;
    if (typeof body.detail === 'string') {
      return new ApiRequestError(body.detail, response.status);
    }
  } catch {
    // ignore parse errors
  }
  return new ApiRequestError('Request failed', response.status);
}

export type User = {
  id: string;
  name: string;
  email: string;
  target_minutes: number;
  timezone: string;
  created_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json();
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json();
}

export async function logout(token: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/v1/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw await parseError(response);
  }
}

export async function getCurrentUser(token: string): Promise<User> {
  const response = await fetch(`${API_URL}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.status === 'ok' || data.status === 'degraded';
  } catch {
    return false;
  }
}
