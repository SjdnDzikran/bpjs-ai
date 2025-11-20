export interface ChatMessage {
  id: string;
  body: string | null;
  fromMe: boolean;
  timestamp: number | Date;
}

export interface AIGenerateOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}
