# WAHA Webhook Quick Reference

## Quick Start

### 1. Configure Backend

```bash
cd backend
cp .env.example .env

# Generate secret
openssl rand -hex 32

# Edit .env and add:
WAHA_WEBHOOK_SECRET=<your-generated-secret>
```

### 2. Configure WAHA

Edit `waha/.env`:
```bash
WHATSAPP_HOOK_URL=http://host.docker.internal:3001/webhooks/waha
WHATSAPP_HOOK_EVENTS=session.status,message,message.any,message.reaction,message.ack
WHATSAPP_HOOK_HMAC_KEY=<same-secret-as-backend>
```

### 3. Start Services

```bash
# Terminal 1: Start WAHA
cd waha
docker-compose up

# Terminal 2: Start Backend
cd backend
npm run start:dev
```

### 4. Create Session

```bash
cd backend
./scripts/setup-waha-session.sh
```

Or manually:
```bash
curl -X POST http://localhost:3000/api/sessions/ \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: 127434fd3a9643f0bdc7440cb8a6ba4e" \
  -d '{
    "name": "default"
  }'
```

### 5. Test

1. Scan QR code in WAHA dashboard: http://localhost:3000/dashboard
2. Wait for session status to become "WORKING"
3. Send a message to your WhatsApp number
4. Check backend logs for webhook events

## Common Event Payloads

### Incoming Message

```json
{
  "event": "message",
  "session": "default",
  "payload": {
    "id": "false_123456@c.us_MSGID",
    "from": "123456@c.us",
    "fromMe": false,
    "body": "Hello!",
    "hasMedia": false,
    "timestamp": 1700000000
  }
}
```

### Message with Media

```json
{
  "event": "message",
  "session": "default",
  "payload": {
    "id": "false_123456@c.us_MSGID",
    "from": "123456@c.us",
    "body": "Check this out",
    "hasMedia": true,
    "media": {
      "url": "http://localhost:3000/api/files/image.jpg",
      "mimetype": "image/jpeg",
      "filename": "photo.jpg"
    }
  }
}
```

### Session Status

```json
{
  "event": "session.status",
  "session": "default",
  "payload": {
    "status": "WORKING",
    "statuses": [
      {"status": "STOPPED", "timestamp": 1700000000000},
      {"status": "STARTING", "timestamp": 1700000001000},
      {"status": "WORKING", "timestamp": 1700000002000}
    ]
  }
}
```

### Message Reaction

```json
{
  "event": "message.reaction",
  "session": "default",
  "payload": {
    "from": "123456@c.us",
    "reaction": {
      "text": "👍",
      "messageId": "true_123456@c.us_ORIGINAL_MSG_ID"
    }
  }
}
```

## Troubleshooting

### Webhook Not Received

```bash
# Check if WAHA can reach backend
docker exec -it waha-waha-1 curl http://host.docker.internal:3001/webhooks/waha

# Check WAHA logs
docker-compose -f waha/docker-compose.yaml logs -f waha

# Check backend logs
# Should see: "WAHA event "message" for session "default"..."
```

### Signature Verification Failed

```bash
# Verify secrets match
grep WAHA_WEBHOOK_SECRET backend/.env
grep WHATSAPP_HOOK_HMAC_KEY waha/.env

# They should be identical
```

### Session Not Working

```bash
# Check session status
curl -H "X-Api-Key: 127434fd3a9643f0bdc7440cb8a6ba4e" \
  http://localhost:3000/api/sessions/default

# Get QR code if needed
curl -H "X-Api-Key: 127434fd3a9643f0bdc7440cb8a6ba4e" \
  http://localhost:3000/api/sessions/default/qr

# Restart session
curl -X POST -H "X-Api-Key: 127434fd3a9643f0bdc7440cb8a6ba4e" \
  http://localhost:3000/api/sessions/default/restart
```

## Testing Without WhatsApp

Send test webhook with curl:

```bash
curl -X POST http://localhost:3001/webhooks/waha \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message",
    "session": "default",
    "payload": {
      "id": "test_123",
      "from": "123456@c.us",
      "fromMe": false,
      "body": "Test message",
      "hasMedia": false,
      "timestamp": 1700000000
    }
  }'
```

## Environment Variables Reference

### Backend `.env`
```bash
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://..."
WAHA_WEBHOOK_SECRET=<secret>
WAHA_API_URL=http://localhost:3000
WAHA_API_KEY=127434fd3a9643f0bdc7440cb8a6ba4e
```

### WAHA `.env`
```bash
WAHA_API_KEY=127434fd3a9643f0bdc7440cb8a6ba4e
WHATSAPP_HOOK_URL=http://host.docker.internal:3001/webhooks/waha
WHATSAPP_HOOK_EVENTS=session.status,message,message.any
WHATSAPP_HOOK_HMAC_KEY=<secret>
```

## Next Steps

1. Implement message response logic in `whatsapp.service.ts`
2. Add conversation context storage
3. Integrate with AI agent
4. Implement booking flow
5. Add payment processing

## Useful Links

- WAHA Dashboard: http://localhost:3000/dashboard
- WAHA Swagger: http://localhost:3000/swagger
- Backend: http://localhost:3001
- Full Documentation: See `WEBHOOK_SETUP.md`
