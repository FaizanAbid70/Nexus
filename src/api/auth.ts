import { apiClient, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from './client';
import { User, UserRole } from '../types';

// Shape returned by the Django backend for a user
interface BackendUser {
  id: number;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  bio: string;
  profile_picture: string;
  preferences?: Record<string, unknown>;
  startup_history?: unknown[];
  investment_history?: unknown[];
  date_joined?: string;
}

// Converts the Django user shape into the shape the rest of the frontend expects
export function mapBackendUser(backendUser: BackendUser): User {
  return {
    id: String(backendUser.id),
    name: backendUser.name || backendUser.username,
    email: backendUser.email,
    role: backendUser.role,
    avatarUrl:
      backendUser.profile_picture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(backendUser.name || backendUser.username)}&background=random`,
    bio: backendUser.bio || '',
    isOnline: true,
    createdAt: backendUser.date_joined || new Date().toISOString(),
  };
}

export async function registerRequest(name: string, email: string, password: string, role: UserRole) {
  const { data } = await apiClient.post('/auth/register/', { name, email, password, role });
  localStorage.setItem(ACCESS_TOKEN_KEY, data.tokens.access);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.tokens.refresh);
  return mapBackendUser(data.user);
}

export async function loginRequest(email: string, password: string) {
  const { data } = await apiClient.post('/auth/login/', { email, password });
  localStorage.setItem(ACCESS_TOKEN_KEY, data.tokens.access);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.tokens.refresh);
  return mapBackendUser(data.user);
}

export async function getMyProfileRequest() {
  const { data } = await apiClient.get('/auth/profile/me/');
  return mapBackendUser(data);
}

export async function updateMyProfileRequest(updates: Partial<{ name: string; bio: string; profile_picture: string }>) {
  const { data } = await apiClient.put('/auth/profile/me/', updates);
  return mapBackendUser(data);
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
