import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import type {
  WahaWebhookEvent,
  WahaWebhookHeaders,
} from '../interfaces/waha-webhook.interface';
import { WhatsappService } from '../services/whatsapp.service';

type RawBodyRequest = Request & { rawBody?: Buffer };

@ApiTags('webhooks')
@Controller('webhooks/waha')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Receive WAHA webhooks',
    description: 'Endpoint to receive webhook events from WAHA (WhatsApp HTTP API). Handles incoming messages, session status changes, and other WhatsApp events.'
  })
  @ApiBody({
    description: 'WAHA webhook event payload',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'evt_01kabfp70g456devhq0h3dzc2t' },
        timestamp: { type: 'number', example: 1763469630488 },
        event: { type: 'string', example: 'message', enum: ['message', 'session.status', 'message.any', 'message.reaction', 'message.ack'] },
        session: { type: 'string', example: 'default' },
        me: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '6285190654210@c.us' },
            pushName: { type: 'string', example: 'My Business' }
          }
        },
        payload: {
          type: 'object',
          description: 'Event-specific payload data'
        }
      }
    }
  })
  @ApiHeader({ name: 'x-webhook-request-id', required: false, description: 'Unique request ID from WAHA' })
  @ApiHeader({ name: 'x-webhook-timestamp', required: false, description: 'Timestamp of the webhook request' })
  @ApiHeader({ name: 'x-webhook-hmac', required: false, description: 'HMAC signature for webhook verification' })
  @ApiHeader({ name: 'x-webhook-hmac-algorithm', required: false, description: 'HMAC algorithm used (e.g., sha512)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook received and processed successfully',
    schema: {
      type: 'object',
      properties: {
        received: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid webhook signature' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async handleWebhook(
    @Req() req: RawBodyRequest,
    @Body() body: WahaWebhookEvent,
    @Headers('x-webhook-request-id') requestId?: string,
    @Headers('x-webhook-timestamp') timestamp?: string,
    @Headers('x-webhook-hmac') signature?: string,
    @Headers('x-webhook-hmac-algorithm') algorithm?: string,
  ) {
    const headers: WahaWebhookHeaders = {
      requestId,
      timestamp,
      signature,
      algorithm,
    };

    await this.whatsappService.handleWebhook(
      body,
      headers,
      req.rawBody ?? Buffer.from(JSON.stringify(body)),
    );

    return { received: true };
  }
}
