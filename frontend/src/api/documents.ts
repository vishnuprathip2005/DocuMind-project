import { request, API_BASE_URL } from './client';
import { DocumentMetadata, DocumentDetail } from '../types';

export async function fetchDocuments(): Promise<DocumentMetadata[]> {
  return request<DocumentMetadata[]>('/api/documents');
}

export async function uploadDocument(file: File): Promise<DocumentMetadata> {
  const formData = new FormData();
  formData.append('file', file);

  return request<DocumentMetadata>('/api/documents', {
    method: 'POST',
    body: formData,
  });
}

export async function getDocumentDetails(id: string): Promise<DocumentDetail> {
  return request<DocumentDetail>(`/api/documents/${encodeURIComponent(id)}`);
}

export function getDownloadUrl(id: string): string {
  return `${API_BASE_URL}/api/documents/${encodeURIComponent(id)}/download`;
}

export function getViewUrl(id: string): string {
  return `${API_BASE_URL}/api/documents/${encodeURIComponent(id)}/view`;
}

export async function deleteDocument(id: string): Promise<void> {
  return request<void>(`/api/documents/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
