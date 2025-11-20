import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { ChatService } from '../../chat/services/chat.service';
import { AiAgentService } from './ai-agent.service';
import { AiSettingsService } from './ai-settings.service';
import { WahaApiService } from '../../whatsapp/services/waha-api.service';

export interface MessageOrchestratorConfig {
  sendSeenStatus?: boolean;
  showTypingIndicator?: boolean;
  skipAiResponse?: boolean;
}

@Injectable()
export class MessageOrchestratorService {
  private readonly logger = new Logger(MessageOrchestratorService.name);
  private readonly pendingMessageTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly activeProcessIds: Map<string, string> = new Map();

  constructor(
    private readonly chatService: ChatService,
    private readonly aiAgentService: AiAgentService,
    private readonly aiSettingsService: AiSettingsService,
    @Inject(forwardRef(() => WahaApiService))
    private readonly wahaApiService: WahaApiService,
  ) {}

  /**
   * Orchestrate the full message handling workflow:
   * 1. Wait 10-20s before processing (restart if new message arrives)
   * 2. Send seen status
   * 3. Show typing indicator
   * 4. Get conversation history
   * 5. Generate AI response
   * 6. Send response via WhatsApp
   * 
   * Note: Message saving is handled by message.any webhook
   */
  async processIncomingMessage(
    phoneNumber: string,
    session: string,
    config: MessageOrchestratorConfig = {},
  ): Promise<void> {
    try {
      if (!this.aiSettingsService.isOrchestratorEnabled(phoneNumber)) {
        this.logger.debug(
          `⚙️  AI orchestration disabled for ${phoneNumber} (global or per-chat)`,
        );
        return;
      }

      this.logger.log(`📨 Message received from ${phoneNumber}`);

      // Skip AI response if requested (e.g., for media messages)
      if (config.skipAiResponse) {
        this.logger.debug(`⏭️  Skipping AI response (media message)`);
        return;
      }

      // Generate unique ID for this message processing attempt
      const processId = Date.now().toString() + Math.random().toString();
      this.activeProcessIds.set(phoneNumber, processId);

      // Clear any existing timeout for this chat
      const existingTimeout = this.pendingMessageTimeouts.get(phoneNumber);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        this.logger.debug(`⏱️  Restarting countdown for ${phoneNumber}`);
      }

      // Wait 10-20 seconds (random) before processing
      const waitTime = Math.floor(Math.random() * (20000 - 10000 + 1)) + 10000;
      this.logger.log(`⏰ Waiting ${waitTime}ms before sending seen to ${phoneNumber}`);
      
      const timeout = setTimeout(async () => {
        try {
          // Check if this process is still valid (hasn't been superseded by a new message)
          if (this.activeProcessIds.get(phoneNumber) !== processId) {
             this.logger.debug(`🛑 Process aborted - new message received`);
             return;
          }

          // Remove from pending map
          this.pendingMessageTimeouts.delete(phoneNumber);
          
          this.logger.log(`🤖 Processing message from ${phoneNumber} after ${waitTime}ms wait`);

          // Send "seen" and typing indicators
          if (config.sendSeenStatus !== false) {
            await this.sendSeenStatus(phoneNumber, session);
          }

          if (config.showTypingIndicator !== false) {
            await this.startTyping(phoneNumber, session);
            
            // Wait for random typing duration (5-15 seconds) before generating response
            const typingDuration = Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000;
            this.logger.log(`⌨️  Typing for ${typingDuration}ms before generating response`);
            await new Promise(resolve => setTimeout(resolve, typingDuration));

            // Check AGAIN if this process is still valid (interrupted during typing)
            if (this.activeProcessIds.get(phoneNumber) !== processId) {
               this.logger.debug(`🛑 Process aborted during typing - new message received`);
               await this.stopTyping(phoneNumber, session);
               return;
            }
          }

          // Get conversation history
          const history = await this.chatService.getMessageHistory(phoneNumber);
          
          if (history.length === 0) {
            this.logger.warn(`⚠️  No history found, sending default greeting`);
            if (config.showTypingIndicator !== false) {
              await this.stopTyping(phoneNumber, session);
            }
            await this.sendResponse(phoneNumber, 'Halo! Ada yang bisa saya bantu?', session);
            return;
          }

          // Generate AI response
          const aiResponse = await this.aiAgentService.generateResponse(history);
          this.logger.log(`✅ Generated response (${aiResponse.length} chars, ${history.length} msgs in context)`);
          
          // Stop typing before sending response
          if (config.showTypingIndicator !== false) {
            await this.stopTyping(phoneNumber, session);
          }
          
          await this.sendResponse(phoneNumber, aiResponse, session);
        } catch (error) {
          this.logger.error(`❌ Failed to process message:`, error.stack);
          // Stop typing on error
          if (config.showTypingIndicator !== false) {
            await this.stopTyping(phoneNumber, session).catch(() => {});
          }
          await this.sendErrorResponse(phoneNumber, session);
        }
      }, waitTime);

      // Store timeout
      this.pendingMessageTimeouts.set(phoneNumber, timeout);
      
    } catch (error) {
      this.logger.error(`❌ Failed to schedule message processing:`, error.stack);
    }
  }

  /**
   * Send "seen" status (double blue checkmark)
   */
  private async sendSeenStatus(chatId: string, session: string): Promise<void> {
    try {
      await this.wahaApiService.sendSeen({ chatId, session });
    } catch (error) {
      this.logger.warn(`⚠️  Failed to send seen status`, error.message);
    }
  }

  /**
   * Start typing indicator
   */
  private async startTyping(chatId: string, session: string): Promise<void> {
    try {
      await this.wahaApiService.startTyping(chatId, session);
    } catch (error) {
      this.logger.warn(`⚠️  Failed to start typing`, error.message);
    }
  }

  /**
   * Stop typing indicator
   */
  private async stopTyping(chatId: string, session: string): Promise<void> {
    try {
      await this.wahaApiService.stopTyping(chatId, session);
    } catch (error) {
      this.logger.warn(`⚠️  Failed to stop typing`, error.message);
    }
  }

  /**
   * Send response message to user
   */
  private async sendResponse(
    chatId: string,
    text: string,
    session: string,
  ): Promise<void> {
    try {
      await this.wahaApiService.sendText({
        chatId,
        text,
        session,
      });
    } catch (error) {
      this.logger.error(`❌ Failed to send response`, error.stack);
      throw error;
    }
  }

  /**
   * Send error response to user
   */
  private async sendErrorResponse(chatId: string, session: string): Promise<void> {
    try {
      await this.wahaApiService.sendText({
        chatId,
        text: 'Maaf, terjadi kesalahan. Mohon coba lagi atau hubungi admin kami.',
        session,
      });
    } catch (error) {
      this.logger.error(`❌ Failed to send error message`, error.message);
    }
  }

  /**
   * Get conversation history for a phone number
   */
  async getConversationHistory(phoneNumber: string) {
    return this.chatService.getMessageHistory(phoneNumber);
  }

  /**
   * Generate response with custom system prompt
   */
  async processWithCustomPrompt(
    phoneNumber: string,
    systemPrompt: string,
  ): Promise<string> {
    try {
      const history = await this.chatService.getMessageHistory(phoneNumber);
      
      if (history.length === 0) {
        this.logger.warn(`⚠️  No conversation history found for ${phoneNumber}`);
        return 'Halo! Ada yang bisa saya bantu?';
      }

      return this.aiAgentService.generateWithCustomPrompt(history, systemPrompt);
    } catch (error) {
      this.logger.error(
        `❌ Failed to process with custom prompt for ${phoneNumber}:`,
        error.stack,
      );
      throw error;
    }
  }
}
