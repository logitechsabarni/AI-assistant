
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  type: 'text' | 'grounded-text' | 'error';
  groundingUrls?: string[];
}

export interface GeminiResponseChunk {
  text: string | undefined;
  groundingUrls: string[];
}
