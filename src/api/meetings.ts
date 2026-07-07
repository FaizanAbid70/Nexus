import { apiClient } from './client';
import { Meeting } from '../types';

export async function listMeetings(): Promise<Meeting[]> {
  const { data } = await apiClient.get('/meetings/');
  return data;
}

export async function createMeeting(payload: {
  participant: number;
  title: string;
  description?: string;
  start_time: string; // ISO string
  end_time: string;   // ISO string
}): Promise<Meeting> {
  const { data } = await apiClient.post('/meetings/', payload);
  return data;
}

export async function meetingAction(
  id: number,
  action: 'accept' | 'reject' | 'cancel'
): Promise<Meeting> {
  const { data } = await apiClient.post(`/meetings/${id}/${action}/`);
  return data;
}

export async function deleteMeeting(id: number): Promise<void> {
  await apiClient.delete(`/meetings/${id}/`);
}
