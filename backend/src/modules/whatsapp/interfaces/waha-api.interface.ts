/**
 * WAHA API Request and Response Types
 * For sending messages and interacting with WhatsApp through WAHA REST API
 */

// Send Seen API
export interface SendSeenRequest {
  session: string;
  chatId: string;
  messageIds?: string[];
  participant?: string; // Required for group messages
}

// Send Text API
export interface SendTextRequest {
  session: string;
  chatId: string;
  text: string;
  reply_to?: string;
  mentions?: string[];
  linkPreview?: boolean;
  linkPreviewHighQuality?: boolean;
}

// Send Image API
export interface SendImageRequest {
  session: string;
  chatId: string;
  file: FileData;
  caption?: string;
  reply_to?: string;
  mentions?: string[];
}

// Send File API
export interface SendFileRequest {
  session: string;
  chatId: string;
  file: FileData;
  caption?: string;
  reply_to?: string;
}

// File Data (can be URL or BASE64)
export interface FileData {
  mimetype: string;
  filename?: string;
  url?: string;
  data?: string; // BASE64 encoded
}

// Generic API Response
export interface WAHAApiResponse {
  id?: string;
  timestamp?: number;
  [key: string]: any;
}

// Error Response
export interface WAHAApiError {
  error: string;
  message: string;
  statusCode: number;
}
