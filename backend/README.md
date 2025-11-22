# BPJS AI Care - Backend

NestJS backend for the BPJS Kesehatan WhatsApp assistant. It receives WAHA webhooks, stores chats/customers, and uses Gemini to answer BPJS inquiries with escalation cues when a human agent is needed.

## Overview

This backend handles:
- WhatsApp message webhooks from WAHA
- AI agent responses for BPJS questions via Google Gemini
- Chat + customer records with Prisma/PostgreSQL
- Outbound WhatsApp messaging through WAHA API
- Escalation markers when cases should be handed to a human

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bpjs_ai_care"
WAHA_WEBHOOK_SECRET=<generate-with-openssl-rand-hex-32>
WAHA_API_URL=http://localhost:3000
WAHA_API_KEY=127434fd3a9643f0bdc7440cb8a6ba4e
GOOGLE_AI_API_KEY=<your-google-ai-api-key>
```

### 3. Set Up Database

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Start Development Server

```bash
npm run start:dev
```

The backend will be available at `http://localhost:3001` and API docs at `http://localhost:3001/docs`.

## WhatsApp Integration

This project integrates with WAHA (WhatsApp HTTP API) to receive and send WhatsApp messages.

### Setup Guides

- **[Quick Start Guide](./WEBHOOK_QUICKSTART.md)** - Get up and running in 5 minutes
- **[Comprehensive Setup](./WEBHOOK_SETUP.md)** - Detailed configuration, security, and deployment guide

### Quick Setup

1. Configure WAHA webhook (see `waha/.env`):
   ```bash
   WHATSAPP_HOOK_URL=http://host.docker.internal:3001/webhooks/waha
   WHATSAPP_HOOK_EVENTS=session.status,message,message.any
   WHATSAPP_HOOK_HMAC_KEY=<your-secret>
   ```

2. Create a WhatsApp session:
   ```bash
   ./scripts/setup-waha-session.sh
   ```

3. Test by sending a message to your WhatsApp number

See [WEBHOOK_QUICKSTART.md](./WEBHOOK_QUICKSTART.md) for detailed instructions.

## Project Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── ai/               # Gemini-powered BPJS assistant + escalation logic
│   │   ├── chat/             # Chat sessions and history
│   │   ├── customer/         # Customer records linked to chats
│   │   └── whatsapp/         # WAHA webhook handling + outbound messaging
│   ├── prisma/               # Database client
│   └── main.ts               # App bootstrap + docs setup
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Prisma migrations (if any)
├── scripts/
│   └── setup-waha-session.sh  # WAHA session setup script
└── test/
```

## Available Scripts

```bash
# Development
npm run start:dev        # Start with hot-reload
npm run start:debug      # Start with debugger

# Production
npm run build            # Build for production
npm run start:prod       # Run production build

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio

# Testing
npm run test             # Run unit tests
npm run test:e2e         # Run e2e tests
npm run test:cov         # Generate coverage

# Linting
npm run lint             # Run ESLint
npm run format           # Format with Prettier
```

## Development

### Webhook Events

The system handles various WhatsApp events:

- `session.status` - Session state changes (WORKING, SCAN_QR_CODE, FAILED)
- `message` - Incoming messages (text, media, voice)
- `message.reaction` - Message reactions
- `message.ack` - Message delivery/read status
- `group.*` - Group events
- And more...

See [webhook interfaces](./src/modules/whatsapp/interfaces/) for full type definitions.

### Testing Webhooks Locally

```bash
# Send a test webhook
curl -X POST http://localhost:3001/webhooks/waha \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message",
    "session": "default",
    "payload": {
      "from": "123456@c.us",
      "body": "Test message"
    }
  }'
```

See [examples](./src/modules/whatsapp/examples/webhook-testing.example.ts) for more test cases.

## Architecture

- WAHA delivers WhatsApp webhooks to `/webhooks/waha` (raw body preserved for HMAC verification).
- Chat + customer entities are stored via Prisma (PostgreSQL).
- Gemini (`AiAgentService`) generates BPJS-specific replies and flags answers that should be escalated.
- Outbound messages are sent back to WAHA using the configured API URL and key.

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3001` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://.../bpjs_ai_care` |
| `WAHA_WEBHOOK_SECRET` | HMAC secret for webhooks | `<generated-secret>` |
| `WAHA_API_URL` | WAHA API endpoint | `http://localhost:3000` |
| `WAHA_API_KEY` | WAHA API key | `<your-api-key>` |
| `GOOGLE_AI_API_KEY` | Google Gemini API key | `<your-ai-key>` |

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [WAHA Documentation](https://waha.devlike.pro)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Webhook Quickstart](./WEBHOOK_QUICKSTART.md)
- [Webhook Setup](./WEBHOOK_SETUP.md)
- [Webhook Integration Summary](../WEBHOOK_INTEGRATION_SUMMARY.md)
- [Chat History Guide](./CHAT_HISTORY_GUIDE.md)
- [Swagger/Scalar Guide](./SWAGGER_GUIDE.md)

## License

UNLICENSED
