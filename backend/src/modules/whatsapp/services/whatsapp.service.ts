import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  WahaWebhookEvent,
  WahaWebhookHeaders,
  WAHAWebhookEvent,
  MessageEvent,
  MessageAnyEvent,
  SessionStatusEvent,
  MessageReactionEvent,
  GroupJoinEvent,
} from '../interfaces/waha-webhook.interface';
import { WahaApiService } from './waha-api.service';
import { ChatService } from '../../chat/services/chat.service';
import { MessageOrchestratorService } from '../../ai/services/message-orchestrator.service';

import { AiAgentService } from '../../ai/services/ai-agent.service';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly pendingSeenTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly wahaApiService: WahaApiService,
    private readonly chatService: ChatService,
    private readonly messageOrchestratorService: MessageOrchestratorService,
    private readonly aiAgentService: AiAgentService,
  ) {}

  async handleWebhook(
    event: WahaWebhookEvent | WAHAWebhookEvent,
    headers: WahaWebhookHeaders,
    rawBody?: Buffer,
  ) {
    // Verify HMAC signature if secret is configured
    this.verifySignature(headers, rawBody);

    this.logger.log(
      `📨 WAHA Webhook Received - Event: "${event.event}" | Session: "${event.session}"`,
    );
    
    // Log headers
    this.logger.debug('📋 Webhook Headers:', {
      requestId: headers.requestId,
      timestamp: headers.timestamp,
      hasSignature: !!headers.signature,
      algorithm: headers.algorithm,
    });

    // Log full event payload for debugging
    this.logger.debug('📦 Full Event Data:', JSON.stringify(event, null, 2));

    // Route events to appropriate handlers
    try {
      await this.routeEvent(event as unknown as WAHAWebhookEvent);
    } catch (error) {
      this.logger.error(
        `Error handling webhook event ${event.event}:`,
        error.stack,
      );
      throw error;
    }
  }

  private async routeEvent(event: WAHAWebhookEvent) {
    switch (event.event) {
      case 'session.status':
        await this.handleSessionStatus(event);
        break;

      case 'message':
        await this.handleMessage(event);
        break;

      case 'message.any':
        await this.handleMessageAny(event);
        break;

      // case 'message.reaction':
      //   await this.handleMessageReaction(event);
      //   break;

      // case 'message.ack':
      //   this.logger.debug(
      //     `✓ Message ACK: ${event.payload.ackName} (${event.payload.ack})`,
      //   );
      //   break;

      // case 'group.v2.join':
      //   await this.handleGroupJoin(event);
      //   break;

      // case 'group.v2.leave':
      //   this.logger.log(
      //     `👋 Group leave in ${event.payload.chatId}: ${event.payload.participants.length} participant(s)`,
      //   );
      //   break;

      // case 'presence.update':
      //   this.logger.debug(
      //     `👁️ Presence: ${event.payload.id} is ${event.payload.state}`,
      //   );
      //   break;

      default:
        // Ignore all other events
        this.logger.debug(`Ignoring event type: ${event.event}`);
    }
  }

  private async handleSessionStatus(event: SessionStatusEvent) {
    const { status } = event.payload;
    
    this.logger.log(`🔄 Session Status Change`);
    this.logger.log(`   Session: ${event.session}`);
    this.logger.log(`   Status: ${status}`);
    
    if (event.payload.statuses && event.payload.statuses.length > 0) {
      this.logger.log(`   Recent statuses:`);
      event.payload.statuses.forEach((s) => {
        const time = new Date(s.timestamp).toLocaleTimeString();
        this.logger.log(`     - ${s.status} at ${time}`);
      });
    }

    if (status === 'SCAN_QR_CODE') {
      this.logger.warn(
        `⚠️  Session "${event.session}" requires QR code scan`,
      );
      this.logger.warn(
        `   Fetch QR at: GET /api/sessions/${event.session}/qr`,
      );
    } else if (status === 'FAILED') {
      this.logger.error(
        `❌ Session "${event.session}" failed. May need to logout and restart.`,
      );
    } else if (status === 'WORKING') {
      this.logger.log(
        `✅ Session "${event.session}" is now WORKING and ready to use!`,
      );
    }
  }

  private async handleMessage(event: MessageEvent) {
    const { from, body, hasMedia, fromMe, id } = event.payload;

    // Skip messages sent by us
    if (fromMe) {
      this.logger.debug(`⬅️ Outgoing message (skipped): ${body}`);
      return;
    }

    this.logger.log(`💬 Incoming Message`);
    this.logger.log(`   From: ${from}`);
    this.logger.log(`   Body: ${body || '(no text)'}`);
    this.logger.log(`   Message ID: ${id}`);

    if (hasMedia && event.payload.media) {
      this.logger.log(`   📎 Media: ${event.payload.media.mimetype}`);
      this.logger.log(`   📎 URL: ${event.payload.media.url}`);
      if (event.payload.media.filename) {
        this.logger.log(`   📎 Filename: ${event.payload.media.filename}`);
      }
    }

    if (event.payload.replyTo) {
      this.logger.log(`   ↩️ Reply to: ${event.payload.replyTo}`);
    }

    // Convert LID to real phone number if needed
    let finalFrom = from;
    if (from.includes('@lid')) {
      this.logger.debug(`🔄 Converting LID ${from} to phone number for message handling`);
      const realPhone = await this.wahaApiService.getPhoneNumberByLid(from, event.session);
      if (realPhone) {
        finalFrom = realPhone;
        this.logger.debug(`✅ LID converted to ${realPhone}`);
      } else {
        this.logger.warn(`⚠️ Failed to convert LID ${from}, using original`);
      }
    }

    // Skip group messages
    if (finalFrom.includes('@g.us')) {
      this.logger.debug(`👥 Group message (skipped orchestrator): ${finalFrom}`);
      return;
    }

    // Pass to message orchestrator for full handling
    await this.messageOrchestratorService.processIncomingMessage(
      finalFrom,
      event.session,
      //{ skipAiResponse: false },
    );
  }

  private async handleMessageAny(event: MessageAnyEvent) {
    // This fires for ALL messages including ones we send
    const { id, timestamp, from, to, fromMe, body, hasMedia, _data } = event.payload;

    this.logger.debug(
      `💾 Message.any: ${fromMe ? 'Outgoing' : 'Incoming'} - ${body?.substring(0, 30) || '(no text)'}`,
    );

    // Extract notifyName from _data if available (for incoming messages)
    const notifyName = _data?.notifyName;

    // Convert LID to real phone number if needed
    let finalFrom = from;
    let finalTo = to;
    
    // For incoming messages, convert 'from' if it's LID
    if (!fromMe && from.includes('@lid')) {
      this.logger.debug(`🔄 Converting LID ${from} to phone number`);
      const realPhone = await this.wahaApiService.getPhoneNumberByLid(from, event.session);
      if (realPhone) {
        finalFrom = realPhone;
        this.logger.debug(`✅ LID converted to ${realPhone}`);
      } else {
        this.logger.warn(`⚠️ Failed to convert LID ${from}, using original`);
      }
    }
    
    // For outgoing messages, convert 'to' if it's LID
    if (fromMe && to && to.includes('@lid')) {
      this.logger.debug(`🔄 Converting LID ${to} to phone number`);
      const realPhone = await this.wahaApiService.getPhoneNumberByLid(to, event.session);
      if (realPhone) {
        finalTo = realPhone;
        this.logger.debug(`✅ LID converted to ${realPhone}`);
      } else {
        this.logger.warn(`⚠️ Failed to convert LID ${to}, using original`);
      }
    }

    let textBody = body || '';
    // ============================
    // 🎙️ Voice note transcription
    // ============================
    if (!fromMe && hasMedia && event.payload.media) {
      const { mimetype, url } = event.payload.media;

      if (mimetype && mimetype.startsWith('audio/') && url) {
        this.logger.log(
          `🎤 Incoming voice note from ${finalFrom} (${mimetype}) url=${url}`,
        );

        try {
          // Use WAHA API service to download media (handles baseURL + API key)
          const audioBuffer = await this.wahaApiService.downloadMedia(url);

          // Clean up mime type: "audio/ogg; codecs=opus" -> "audio/ogg"
          const cleanMime = mimetype.split(';')[0];

          const transcript = await this.aiAgentService.transcribeAudio(
            audioBuffer,
            cleanMime,
            // Optional translation:
            // { translateTo: 'Indonesian' },
          );

          this.logger.log(
            `📝 Voice note transcribed (${transcript.length} chars) for ${finalFrom}`,
          );

          // Use transcript as message body for storage + AI orchestration
          textBody = transcript;
        } catch (error: any) {
          this.logger.error(
            `❌ Failed to download/transcribe voice note from ${finalFrom}: ${
              error?.message || error
            }`,
          );
          // If it fails, we just fall back to original body (if any)
        }
      }
    }

    // Skip saving group messages
    const isGroupMessage =
      (!fromMe && finalFrom?.includes('@g.us')) ||
      (fromMe && finalTo?.includes('@g.us'));

    if (isGroupMessage) {
      this.logger.debug(
        `👥 Group message (skipped save & orchestrator): from ${finalFrom} to ${finalTo}`,
      );
      return;
    }

    // Save all messages (incoming and outgoing) to database
    await this.chatService.saveMessage({
      id,
      timestamp,
      from: finalFrom,
      to: finalTo,
      fromMe,
      body: textBody,
      hasMedia,
      ...(hasMedia && event.payload.media && {
        mediaType: event.payload.media.mimetype,
        mediaUrl: event.payload.media.url,
      }),
      ...(event.payload.replyTo && { replyTo: event.payload.replyTo }),
      ...(notifyName && { notifyName }),
      session: event.session,
    });
    
    if (!fromMe) {
      await this.messageOrchestratorService.processIncomingMessage(
        finalFrom,
        event.session,
        { skipAiResponse: false },
      );
    }
  }

  private async handleMessageReaction(event: MessageReactionEvent) {
    const { reaction, from } = event.payload;
    this.logger.log(
      `Reaction "${reaction.text}" from ${from} on message ${reaction.messageId}`,
    );
  }

  private async handleGroupJoin(event: GroupJoinEvent) {
    const { chatId, participants } = event.payload;
    this.logger.log(
      `Group join in ${chatId}: ${participants.length} participant(s)`,
    );
  }

  private verifySignature(
    headers: WahaWebhookHeaders,
    rawBody?: Buffer,
  ): void {
    const secret = this.configService.get<string>('WAHA_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.warn(
        'WAHA_WEBHOOK_SECRET not configured. Webhook signatures will not be verified!',
      );
      return;
    }

    if (!headers.signature || !rawBody) {
      throw new UnauthorizedException('Missing webhook signature data');
    }

    const algorithm = headers.algorithm?.toLowerCase() ?? 'sha512';
    if (algorithm !== 'sha512') {
      this.logger.warn(
        `Unexpected HMAC algorithm "${algorithm}" received from WAHA webhooks`,
      );
    }

    const expectedSignature = createHmac(algorithm, secret)
      .update(rawBody)
      .digest('hex');

    const provided = Buffer.from(headers.signature, 'hex');
    const expected = Buffer.from(expectedSignature, 'hex');

    if (
      provided.length !== expected.length ||
      !timingSafeEqual(provided, expected)
    ) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }

  /**
   * Send a text message and save it to conversation history
   * This is a convenience method that combines sending and logging
   */
  async sendTextMessage(
    chatId: string,
    text: string,
    options?: {
      replyTo?: string;
      mentions?: string[];
      session?: string;
    },
  ): Promise<void> {
    try {
      // Send the message
      const response = await this.wahaApiService.sendText({
        chatId,
        text,
        reply_to: options?.replyTo,
        mentions: options?.mentions,
        session: options?.session,
      });

      // Save to conversation history
      await this.chatService.saveMessage({
        id: response.id || `outgoing_${Date.now()}`,
        timestamp: Math.floor(Date.now() / 1000),
        from: chatId,
        fromMe: true,
        body: text,
        hasMedia: false,
        ...(options?.replyTo && { replyTo: options.replyTo }),
      });
    } catch (error) {
      this.logger.error(`Failed to send and save message:`, error.stack);
      throw error;
    }
  }
}
