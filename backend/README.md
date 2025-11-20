# AI Car Inspection Customer Service - Backend

NestJS backend for the AI-powered WhatsApp customer service system for used car inspections.

## Overview

This backend handles:
- WhatsApp message webhooks from WAHA
- AI agent integration for customer conversations
- Booking information collection and management
- Payment processing coordination
- Inspector notification system

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
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/car_inspection_ai"
WAHA_WEBHOOK_SECRET=<generate-with-openssl-rand-hex-32>
WAHA_API_URL=http://localhost:3000
WAHA_API_KEY=127434fd3a9643f0bdc7440cb8a6ba4e
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

The backend will be available at `http://localhost:3001`

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
│   │   ├── whatsapp/          # WhatsApp webhook handling
│   │   │   ├── interfaces/    # Type definitions for WAHA events
│   │   │   ├── examples/      # Testing examples
│   │   │   ├── whatsapp.controller.ts
│   │   │   └── whatsapp.service.ts
│   │   ├── ai-agent/          # AI conversation handling (TODO)
│   │   ├── booking/           # Booking management (TODO)
│   │   ├── payment/           # Payment processing (TODO)
│   │   └── inspector/         # Inspector coordination (TODO)
│   ├── prisma/                # Database client
│   └── main.ts
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/
├── scripts/
│   └── setup-waha-session.sh # WAHA session setup script
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

Based on the implementation plan in `waha/plan.md`:

- **Phase 1 (Current)**: Foundation - NestJS setup, database, WhatsApp webhooks ✅
- **Phase 2 (Next)**: MCP tool implementation and code execution sandbox
- **Phase 3**: Payment & inspector integration
- **Phase 4**: Testing & refinement
- **Phase 5**: Deployment & monitoring

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3001` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://...` |
| `WAHA_WEBHOOK_SECRET` | HMAC secret for webhooks | `<generated-secret>` |
| `WAHA_API_URL` | WAHA API endpoint | `http://localhost:3000` |
| `WAHA_API_KEY` | WAHA API key | `<your-api-key>` |

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [WAHA Documentation](https://waha.devlike.pro)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Project Plan](../waha/plan.md)

## License

UNLICENSED
