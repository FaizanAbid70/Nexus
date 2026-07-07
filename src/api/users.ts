import { apiClient } from './client';

export interface SimpleUser {
  id: number;
  name: string;
  username: string;
  role: 'investor' | 'entrepreneur';
  bio: string;
  profile_picture: string;
}

export async function listUsers(role?: 'investor' | 'entrepreneur'): Promise<SimpleUser[]> {
  const { data } = await apiClient.get('/auth/users/', { params: role ? { role } : {} });
  return data;
}
