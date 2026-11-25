export interface DocumentMetadata {
  id: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface DocumentDetail extends DocumentMetadata {
  extractedSnippet?: string;
  extractedText?: string;
}

export interface SourceItem {
  id: string;
  originalName: string;
}

export interface ChatResponse {
  answer: string;
  sources: SourceItem[];
  mode: 'llm' | 'mock';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sources?: SourceItem[];
  mode?: 'llm' | 'mock';
  timestamp: string;
  isError?: boolean;
}

export interface HealthStatus {
  status: string;
  service: string;
  provider: string;
  maxUploadSizeMb: number;
}
