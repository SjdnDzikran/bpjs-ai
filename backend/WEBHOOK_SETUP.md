# WAHA Webhook Configuration Guide

This guide explains how to configure WAHA (WhatsApp HTTP API) to send webhooks to your NestJS backend.

## Overview

WAHA can send webhook events to your application when various WhatsApp activities occur, such as:
- Incoming messages
- Message reactions
- Session status changes
- Group events
- And more...

## Configuration Steps

### 1. Backend Configuration

#### Set Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Generate a secure secret for HMAC verification
openssl rand -hex 32

# Add to .env
WAHA_WEBHOOK_SECRET=your-generated-secret-here
WAHA_API_URL=http://localhost:3000
WAHA_API_KEY=127434fd3a9643f0bdc7440cb8a6ba4e  # Must match WAHA's API key
```

#### Start the Backend

```bash
npm install
npm run start:dev
```

Your webhook endpoint will be available at: `http://localhost:3001/webhooks/waha`

### 2. WAHA Configuration

You have two options to configure webhooks in WAHA:

#### Option A: Global Webhooks (All Sessions)

Configure via environment variables in `waha/.env`:

```bash
# Webhook URL - point to your backend
WHATSAPP_HOOK_URL=http://host.docker.internal:3001/webhooks/waha

# Events to subscribe to (see available events below)
WHATSAPP_HOOK_EVENTS=session.status,message,message.any,message.reaction,message.ack

# HMAC secret for signature verification (must match backend)
WHATSAPP_HOOK_HMAC_KEY=your-generated-secret-here

# Optional: Retry configuration
WHATSAPP_HOOK_RETRIES_POLICY=exponential
WHATSAPP_HOOK_RETRIES_DELAY_SECONDS=2
WHATSAPP_HOOK_RETRIES_ATTEMPTS=3
```

**Note:** Use `host.docker.internal` instead of `localhost` when WAHA runs in Docker and needs to connect to services on the host machine.

#### Option B: Per-Session Webhooks

When creating/starting a session via API:

```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: 127434fd3a9643f0bdc7440cb8a6ba4e" \
  -d '{
    "name": "default",
    "config": {
      "webhooks": [
        {
          "url": "http://host.docker.internal:3001/webhooks/waha",
          "events": [
            "session.status",
            "message",
            "message.any",
            "message.reaction",
            "message.ack"
          ],
          "hmac": {
            "key": "your-generated-secret-here"
          },
          "retries": {
            "policy": "exponential",
            "delaySeconds": 2,
            "attempts": 3
          }
        }
      ]
    }
  }'
```

### 3. Available Events

Subscribe to the events you need:

#### Essential Events for Chat Service
- `session.status` - Session state changes (WORKING, SCAN_QR_CODE, FAILED, etc.)
- `message` - Incoming messages (excludes messages sent by you)
- `message.any` - All messages (including ones you send)
- `message.reaction` - Message reactions (emoji)
- `message.ack` - Message delivery/read status

#### Additional Events
- `message.waiting` - "Waiting for this message" indicator
- `message.edited` - Message edits
- `message.revoked` - Deleted messages
- `chat.archive` - Chat archive status
- `group.v2.join` - User joins group
- `group.v2.leave` - User leaves group
- `group.v2.participants` - Participant changes
- `group.v2.update` - Group settings updates
- `presence.update` - Typing/online status
- `poll.vote` - Poll votes
- `label.upsert` - Label created/updated
- `label.deleted` - Label deleted
- `label.chat.added` - Label added to chat
- `label.chat.deleted` - Label removed from chat
- `call.received` - Incoming call
- `call.accepted` - Call accepted
- `call.rejected` - Call rejected

**Recommendation:** Start with essential events only to avoid unnecessary traffic. Add more as needed.

### 4. Testing the Webhook

#### Using webhook.site for Testing

Before connecting to your backend, test with webhook.site:

1. Go to https://webhook.site
2. Copy the unique URL
3. Configure WAHA to use that URL temporarily
4. Send a test message via WhatsApp
5. Observe the webhook payload on webhook.site

#### Testing with Your Backend

1. Start your backend: `npm run start:dev`
2. Start WAHA with webhook configured
3. Create a session (scan QR code)
4. Send a test message to your WhatsApp number
5. Check backend logs for webhook events:

```bash
[WhatsappService] WAHA event "message" for session "default" (requestId=...)
[WhatsappService] Incoming message from 1234567890@c.us: Hello!
```

### 5. Security Best Practices

#### HMAC Signature Verification

Always configure `WAHA_WEBHOOK_SECRET` to verify that webhooks are genuinely from WAHA:

```typescript
// The backend automatically verifies signatures using:
// 1. X-Webhook-Hmac header (signature)
// 2. X-Webhook-Hmac-Algorithm header (usually sha512)
// 3. Raw request body
// 4. Your WAHA_WEBHOOK_SECRET
```

If signature verification fails, the webhook is rejected with `401 Unauthorized`.

#### Network Security

- Use HTTPS in production (configure nginx reverse proxy)
- Use strong, random secrets (minimum 32 characters)
- Restrict WAHA API access with `WAHA_API_KEY`
- Consider IP whitelisting if possible

### 6. Webhook Headers

Every webhook request includes these headers:

- `X-Webhook-Request-Id` - Unique request ID (ULID format)
- `X-Webhook-Timestamp` - Unix timestamp in milliseconds
- `X-Webhook-Hmac` - HMAC signature (if configured)
- `X-Webhook-Hmac-Algorithm` - Hash algorithm (sha512)

### 7. Event Payload Structure

All webhook events follow this structure:

```typescript
{
  "id": "evt_01ARZ3NDEKTSV4RRFFQ69G5FAV",  // ULID
  "timestamp": 1700000000000,               // Unix timestamp (ms)
  "event": "message",                       // Event type
  "session": "default",                     // Session name
  "me": {                                   // Your WhatsApp account
    "id": "1234567890@c.us",
    "pushName": "Your Name"
  },
  "metadata": {                             // Custom metadata from session
    "user.id": "123",
    "user.email": "user@example.com"
  },
  "payload": {                              // Event-specific data
    // ... event data
  },
  "environment": {
    "tier": "PLUS",
    "version": "2024.11.15",
    "engine": "WEBJS"
  },
  "engine": "WEBJS"
}
```

### 8. Handling Different Event Types

The service includes typed interfaces for all events. Example handler:

```typescript
// In whatsapp.service.ts
private async handleMessage(event: MessageEvent) {
  const { from, body, hasMedia } = event.payload;
  
  // Skip our own messages
  if (event.payload.fromMe) {
    return;
  }

  // Process the message
  console.log(`Message from ${from}: ${body}`);
  
  // Download media if present
  if (hasMedia && event.payload.media) {
    const mediaUrl = event.payload.media.url;
    // Download and process media...
  }
  
  // TODO: Send to AI agent for processing
}
```

### 9. Production Deployment

#### Using ngrok for Development/Testing

If your backend is on localhost but WAHA is remote:

```bash
ngrok http 3001
# Use the ngrok URL in WHATSAPP_HOOK_URL
WHATSAPP_HOOK_URL=https://abc123.ngrok.io/webhooks/waha
```

#### Production Setup

1. Deploy backend to a server with HTTPS
2. Configure WAHA with production URL:
   ```bash
   WHATSAPP_HOOK_URL=https://api.yourdomain.com/webhooks/waha
   ```
3. Use environment-specific secrets
4. Enable retry policy for reliability
5. Monitor webhook failures

### 10. Troubleshooting

#### Webhooks Not Received

1. **Check WAHA logs**: `docker-compose logs -f waha`
2. **Verify URL is accessible**: Test from WAHA container
   ```bash
   docker exec -it waha curl http://host.docker.internal:3001/webhooks/waha
   ```
3. **Check events subscription**: Ensure event type is in `WHATSAPP_HOOK_EVENTS`
4. **Verify session is WORKING**: Check session status

#### Signature Verification Failures

1. Ensure `WAHA_WEBHOOK_SECRET` matches `WHATSAPP_HOOK_HMAC_KEY`
2. Check that rawBody middleware is configured (already done in `main.ts`)
3. Verify no middleware is modifying the request body before verification

#### Session Status Issues

- `SCAN_QR_CODE`: Session needs authentication - fetch QR code
- `FAILED`: Session crashed - may need to logout and restart
- `STOPPED`: Session manually stopped

### 11. Monitoring and Debugging

#### Enable Debug Logging

```bash
# In backend/.env
NODE_ENV=development
```

This will show detailed logs including:
- All webhook events received
- Payload details
- Signature verification results

#### WAHA Dashboard

Access WAHA dashboard to monitor events in real-time:
- URL: http://localhost:3000/dashboard
- Credentials: See `waha/.env` for username/password
- Navigate to "Event Monitor" to see live events

### 12. Next Steps

After webhooks are configured:

1. **Implement AI Agent Integration**: Connect webhook handler to your AI service
2. **Add Conversation Context**: Store conversation history in database
3. **Implement Message Sending**: Use WAHA API to send responses
4. **Add Error Handling**: Handle media download failures, rate limits, etc.
5. **Set Up Monitoring**: Track webhook success rates, response times

## References

- [WAHA Events Documentation](https://waha.devlike.pro/docs/how-to/events/)
- [WAHA Configuration](https://waha.devlike.pro/docs/how-to/config/)
- [WAHA Sessions](https://waha.devlike.pro/docs/how-to/sessions/)
- [NestJS Middleware](https://docs.nestjs.com/middleware)
