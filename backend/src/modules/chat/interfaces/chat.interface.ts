export interface ChatMessage {
  id: string;
  timestamp: number;
  from: string;
  to?: string;
  fromMe: boolean;
  body: string;
  hasMedia: boolean;
  mediaType?: string;
  mediaUrl?: string;
  replyTo?: string;
  notifyName?: string;
  session?: string;
}
