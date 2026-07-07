import { apiClient } from './client';
import { Document } from '../types';

export async function listDocuments(): Promise<Document[]> {
  const { data } = await apiClient.get('/documents/');
  return data;
}

export async function uploadDocument(title: string, file: File, meetingId?: number): Promise<Document> {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('file', file);
  if (meetingId) formData.append('meeting', String(meetingId));

  const { data } = await apiClient.post('/documents/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteDocument(id: number): Promise<void> {
  await apiClient.delete(`/documents/${id}/`);
}

export async function signDocument(id: number, signatureBlob: Blob): Promise<Document> {
  const formData = new FormData();
  formData.append('signature_image', signatureBlob, 'signature.png');

  const { data } = await apiClient.post(`/documents/${id}/sign/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
