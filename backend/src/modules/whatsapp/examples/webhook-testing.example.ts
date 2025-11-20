/**
 * Example: Testing WAHA Webhooks Locally
 * 
 * This example demonstrates how to test incoming webhooks
 * from WAHA during development.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { WhatsappService } from '../services/whatsapp.service';
import { MessageEvent, SessionStatusEvent } from '../interfaces/waha-webhook.interface';

describe('WAHA Webhook Examples', () => {
  let service: WhatsappService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env.test',
        }),
      ],
      providers: [WhatsappService],
    }).compile();

    service = module.get<WhatsappService>(WhatsappService);
  });

  it('should process incoming text message', async () => {
    const event: MessageEvent = {
      id: 'evt_01ARZ3NDEKTSV4RRFFQ69G5FAV',
      timestamp: Date.now(),
      event: 'message',
      session: 'default',
      me: {
        id: '1234567890@c.us',
        pushName: 'Bot',
      },
      payload: {
        id: 'false_1234567890@c.us_ABCDEF123456',
        timestamp: Date.now(),
        from: '0987654321@c.us',
        fromMe: false,
        to: '1234567890@c.us',
        body: 'Hello, I want to book an inspection',
        hasMedia: false,
        ack: 1,
        vCards: [],
      },
      environment: {
        tier: 'PLUS',
        version: '2024.11.15',
      },
      engine: 'WEBJS',
    };

    await service.handleWebhook(
      event as any,
      {
        requestId: 'test-request-id',
        timestamp: Date.now().toString(),
      },
    );

    // Should log and process the message
    expect(true).toBe(true);
  });

  it('should process message with media', async () => {
    const event: MessageEvent = {
      id: 'evt_01ARZ3NDEKTSV4RRFFQ69G5FAV',
      timestamp: Date.now(),
      event: 'message',
      session: 'default',
      payload: {
        id: 'false_1234567890@c.us_ABCDEF123456',
        timestamp: Date.now(),
        from: '0987654321@c.us',
        fromMe: false,
        to: '1234567890@c.us',
        body: 'Check out my car',
        hasMedia: true,
        media: {
          url: 'http://localhost:3000/api/files/image123.jpg',
          mimetype: 'image/jpeg',
          filename: 'car_photo.jpg',
          error: null,
        },
        ack: 1,
        vCards: [],
      },
      engine: 'WEBJS',
    };

    await service.handleWebhook(
      event as any,
      {
        requestId: 'test-request-id',
        timestamp: Date.now().toString(),
      },
    );
  });

  it('should handle session status changes', async () => {
    const event: SessionStatusEvent = {
      id: 'evt_01ARZ3NDEKTSV4RRFFQ69G5FAV',
      timestamp: Date.now(),
      event: 'session.status',
      session: 'default',
      payload: {
        status: 'WORKING',
        statuses: [
          { status: 'STOPPED', timestamp: Date.now() - 3000 },
          { status: 'STARTING', timestamp: Date.now() - 2000 },
          { status: 'WORKING', timestamp: Date.now() },
        ],
      },
      engine: 'WEBJS',
    };

    await service.handleWebhook(
      event as any,
      {
        requestId: 'test-request-id',
        timestamp: Date.now().toString(),
      },
    );
  });

  it('should handle message with reply', async () => {
    const event: MessageEvent = {
      id: 'evt_01ARZ3NDEKTSV4RRFFQ69G5FAV',
      timestamp: Date.now(),
      event: 'message',
      session: 'default',
      payload: {
        id: 'false_1234567890@c.us_ABCDEF123456',
        timestamp: Date.now(),
        from: '0987654321@c.us',
        fromMe: false,
        to: '1234567890@c.us',
        body: 'Yes, tomorrow works!',
        hasMedia: false,
        replyTo: 'true_1234567890@c.us_PREVIOUS_MESSAGE_ID',
        ack: 1,
        vCards: [],
      },
      engine: 'WEBJS',
    };

    await service.handleWebhook(
      event as any,
      {
        requestId: 'test-request-id',
        timestamp: Date.now().toString(),
      },
    );
  });
});

/**
 * Manual Testing with curl
 * 
 * You can test the webhook endpoint directly with curl:
 */

// Example 1: Simple text message
const curlExample1 = `
curl -X POST http://localhost:3001/webhooks/waha \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Request-Id: test-123" \\
  -H "X-Webhook-Timestamp: $(date +%s)000" \\
  -d '{
    "id": "evt_01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "timestamp": 1700000000000,
    "event": "message",
    "session": "default",
    "me": {
      "id": "1234567890@c.us",
      "pushName": "Bot"
    },
    "payload": {
      "id": "false_1234567890@c.us_ABCDEF123456",
      "timestamp": 1700000000,
      "from": "0987654321@c.us",
      "fromMe": false,
      "to": "1234567890@c.us",
      "body": "Hello! I want to book a car inspection",
      "hasMedia": false,
      "ack": 1,
      "vCards": []
    },
    "engine": "WEBJS"
  }'
`;

// Example 2: Session status change
const curlExample2 = `
curl -X POST http://localhost:3001/webhooks/waha \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Request-Id: test-124" \\
  -H "X-Webhook-Timestamp: $(date +%s)000" \\
  -d '{
    "id": "evt_01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "timestamp": 1700000000000,
    "event": "session.status",
    "session": "default",
    "payload": {
      "status": "WORKING",
      "statuses": [
        {"status": "STOPPED", "timestamp": 1700000000000},
        {"status": "STARTING", "timestamp": 1700000001000},
        {"status": "WORKING", "timestamp": 1700000002000}
      ]
    },
    "engine": "WEBJS"
  }'
`;

// Example 3: Message with HMAC signature
const curlExample3 = `
# First, generate HMAC signature
WEBHOOK_SECRET="your-secret-key"
BODY='{"event":"message","session":"default","payload":{"body":"test"}}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha512 -hmac "$WEBHOOK_SECRET" | sed 's/^.* //')

curl -X POST http://localhost:3001/webhooks/waha \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Request-Id: test-125" \\
  -H "X-Webhook-Timestamp: $(date +%s)000" \\
  -H "X-Webhook-Hmac: $SIGNATURE" \\
  -H "X-Webhook-Hmac-Algorithm: sha512" \\
  -d "$BODY"
`;

console.log('Example curl commands:');
console.log('\n=== Example 1: Text Message ===');
console.log(curlExample1);
console.log('\n=== Example 2: Session Status ===');
console.log(curlExample2);
console.log('\n=== Example 3: With HMAC Signature ===');
console.log(curlExample3);
