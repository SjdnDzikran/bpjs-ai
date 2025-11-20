import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  SendSeenRequest,
  SendTextRequest,
  SendImageRequest,
  SendFileRequest,
  WAHAApiResponse,
  WAHAApiError,
} from '../interfaces/waha-api.interface';

/**
 * WAHA API Service
 * Handles all REST API calls to WAHA for sending messages and interacting with WhatsApp
 */
@Injectable()
export class WahaApiService {
  private readonly logger = new Logger(WahaApiService.name);
  private readonly client: AxiosInstance;
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly defaultSession: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('WAHA_API_URL', 'http://localhost:3000');
    this.apiKey = this.configService.get<string>('WAHA_API_KEY', '');
    this.defaultSession = this.configService.get<string>('WAHA_DEFAULT_SESSION', 'default');

    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.apiKey,
      },
      timeout: 30000, // 30 second timeout
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('❌ Request Error:', error.message);
        return Promise.reject(error);
      },
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError<WAHAApiError>) => {
        const errorMsg = error.response?.data?.message || error.message;
        this.logger.error(`❌ API Error: ${error.response?.status} - ${errorMsg}`);
        return Promise.reject(error);
      },
    );
  }

  /**
   * Send "seen" status for messages in a chat
   * This marks messages as read (double blue checkmark)
   */
  async sendSeen(request: Partial<SendSeenRequest>): Promise<WAHAApiResponse> {
    try {
      const payload: SendSeenRequest = {
        session: request.session || this.defaultSession,
        chatId: request.chatId!,
        messageIds: request.messageIds,
        participant: request.participant,
      };

      this.logger.log(`👀 Sending seen for chat: ${payload.chatId}`);

      const response = await this.client.post<WAHAApiResponse>('/api/sendSeen', payload);

      this.logger.log(`✅ Seen sent successfully for chat: ${payload.chatId}`);
      return response.data;
    } catch (error) {
      this.handleError('sendSeen', error);
      throw error;
    }
  }

  /**
   * Send text message to a chat
   */
  async sendText(request: Partial<SendTextRequest>): Promise<WAHAApiResponse> {
    try {
      const payload: SendTextRequest = {
        session: request.session || this.defaultSession,
        chatId: request.chatId!,
        text: request.text!,
        reply_to: request.reply_to,
        mentions: request.mentions,
        linkPreview: request.linkPreview ?? false,
        linkPreviewHighQuality: request.linkPreviewHighQuality ?? false,
      };

      this.logger.log(`💬 Sending text to ${payload.chatId}: ${payload.text.substring(0, 50)}...`);

      const response = await this.client.post<WAHAApiResponse>('/api/sendText', payload);

      this.logger.log(`✅ Text sent successfully to: ${payload.chatId}`);
      return response.data;
    } catch (error) {
      this.handleError('sendText', error);
      throw error;
    }
  }

  /**
   * Send image message to a chat
   */
  async sendImage(request: Partial<SendImageRequest>): Promise<WAHAApiResponse> {
    try {
      const payload: SendImageRequest = {
        session: request.session || this.defaultSession,
        chatId: request.chatId!,
        file: request.file!,
        caption: request.caption,
        reply_to: request.reply_to,
        mentions: request.mentions,
      };

      this.logger.log(`🖼️ Sending image to ${payload.chatId}`);

      const response = await this.client.post<WAHAApiResponse>('/api/sendImage', payload);

      this.logger.log(`✅ Image sent successfully to: ${payload.chatId}`);
      return response.data;
    } catch (error) {
      this.handleError('sendImage', error);
      throw error;
    }
  }

  /**
   * Send file/document to a chat
   */
  async sendFile(request: Partial<SendFileRequest>): Promise<WAHAApiResponse> {
    try {
      const payload: SendFileRequest = {
        session: request.session || this.defaultSession,
        chatId: request.chatId!,
        file: request.file!,
        caption: request.caption,
        reply_to: request.reply_to,
      };

      this.logger.log(`📎 Sending file to ${payload.chatId}: ${payload.file.filename || 'file'}`);

      const response = await this.client.post<WAHAApiResponse>('/api/sendFile', payload);

      this.logger.log(`✅ File sent successfully to: ${payload.chatId}`);
      return response.data;
    } catch (error) {
      this.handleError('sendFile', error);
      throw error;
    }
  }

  /**
   * Start typing indicator in a chat
   * Automatically stops typing after a random delay (10-20 seconds)
   */
  async startTyping(chatId: string, session?: string): Promise<void> {
    try {
      const sessionName = session || this.defaultSession;
      this.logger.debug(`⌨️ Starting typing indicator in ${chatId}`);

      await this.client.post(`/api/${sessionName}/presence`, {
        chatId,
        presence: 'typing',
      });

      this.logger.debug(`✅ Typing started for: ${chatId}`);
    } catch (error) {
      this.handleError('startTyping', error);
      throw error;
    }
  }

  /**
   * Stop typing indicator in a chat
   */
  async stopTyping(chatId: string, session?: string): Promise<void> {
    try {
      const sessionName = session || this.defaultSession;
      this.logger.debug(`⌨️ Stopping typing indicator in ${chatId}`);

      await this.client.post(`/api/${sessionName}/presence`, {
        chatId,
        presence: 'paused',
      });

      this.logger.debug(`✅ Typing stopped for: ${chatId}`);
    } catch (error) {
      this.handleError('stopTyping', error);
      throw error;
    }
  }

  /**
   * Generic error handler
   */
  private handleError(method: string, error: any): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<WAHAApiError>;
      const status = axiosError.response?.status || 'unknown';
      const message = axiosError.response?.data?.message || axiosError.message;
      this.logger.error(`❌ ${method} failed [${status}]: ${message}`);
    } else {
      this.logger.error(`❌ ${method} failed:`, error);
    }
  }

  /**
   * Health check - verify WAHA API is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/sessions');
      this.logger.log('✅ WAHA API is accessible');
      return response.status === 200;
    } catch (error) {
      this.logger.error('❌ WAHA API health check failed:', error);
      return false;
    }
  }

  /**
   * Get phone number by LID
   * Converts LID (@lid) to real phone number (@c.us)
   */
  async getPhoneNumberByLid(lid: string, session?: string): Promise<string | null> {
    try {
      const sessionName = session || this.defaultSession;
      // Remove @lid suffix if present and encode @ as %40
      const cleanLid = lid.replace('@lid', '');
      
      this.logger.debug(`🔍 Getting phone number for LID: ${lid}`);
      
      const response = await this.client.get(
        `/api/${sessionName}/lids/${encodeURIComponent(cleanLid)}`
      );
      
      const phoneNumber = response.data?.pn;
      
      if (phoneNumber) {
        this.logger.debug(`✅ Found phone number for LID ${lid}: ${phoneNumber}`);
        return phoneNumber;
      } else {
        this.logger.warn(`⚠️  No phone number found for LID: ${lid}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`❌ Failed to get phone number for LID ${lid}:`, error);
      return null;
    }
  }
}
