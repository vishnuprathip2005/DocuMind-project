import { request } from './client';
import { ChatResponse, HealthStatus } from '../types';

export async function sendChatMessage(question: string): Promise<ChatResponse> {
  return request<ChatResponse>('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });
}

export async function fetchHealth(): Promise<HealthStatus> {
  return request<HealthStatus>('/api/health');
}
