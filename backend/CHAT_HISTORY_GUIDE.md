# Chat History Service Guide

## Overview

The `ChatHistoryService` automatically saves all incoming and outgoing WhatsApp messages to the PostgreSQL database, maintaining conversation context for each customer.

## Features

- ✅ **Automatic Message Saving**: All incoming messages are automatically saved to database
- ✅ **Customer Management**: Automatically creates customer records on first contact
- ✅ **Conversation Context**: Maintains full message history per customer
- ✅ **Booking Tracking**: Links conversations to active bookings
- ✅ **History Trimming**: Automatically manage context window size for AI

## Database Schema

### Conversation Model
```prisma
model Conversation {
  id              String   @id @default(uuid())
  customer_id     String
  phone_number    String   @unique
  message_history Json     @default("[]")
  last_message_at DateTime @default(now())
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  customer Customer @relation(fields: [customer_id], references: [id], onDelete: Cascade)
}
```

### Customer Model
```prisma
model Customer {
  id           String   @id @default(uuid())
  phone_number String   @unique
  name         String?
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt
  
  conversations Conversation[]
}
```

### ChatMessage Interface
```typescript
interface ChatMessage {
  id: string;
  timestamp: number;
  from: string;
  fromMe: boolean;
  body: string;
  hasMedia: boolean;
  mediaType?: string;
  mediaUrl?: string;
  replyTo?: string;
}
```

## Automatic Functionality

### Incoming Messages
Messages are automatically saved when they arrive via webhook:

```typescript
// In WhatsappService.handleMessage()
await this.chatHistoryService.saveMessage({
  id: event.payload.id,
  timestamp: event.payload.timestamp,
  from: event.payload.from,
  fromMe: false,
  body: event.payload.body,
  hasMedia: event.payload.hasMedia,
  // ... media and reply info
});
```

### Outgoing Messages
Use the convenience method to send AND save messages:

```typescript
// Send a message and automatically save it to history
await this.whatsappService.sendTextMessage(
  '6285190654210@c.us',
  'Your inspection is scheduled for tomorrow at 10 AM',
  {
    session: 'default'
  }
);
```

## Manual Usage

### Get Conversation History
```typescript
const messages = await this.chatHistoryService.getConversationHistory(
  '6285190654210@c.us'
);

// Returns: ChatMessage[]
console.log(`Found ${messages.length} messages`);
```

### Get Full Context (Customer Info)
```typescript
const context = await this.chatHistoryService.getConversationContext(
  '6285190654210@c.us'
);

if (context) {
  console.log(`Customer: ${context.customer.name || 'Unknown'}`);
  console.log(`Last message: ${context.last_message_at}`);
  console.log(`Message count: ${context.message_history.length}`);
}
```

### Trim Old Messages (Context Management)
```typescript
// Keep only last 50 messages to manage AI context window
await this.chatHistoryService.trimConversationHistory(
  '6285190654210@c.us',
  50
);
```

### Get Recent Conversations (Dashboard)
```typescript
const recent = await this.chatHistoryService.getRecentConversations(20);

recent.forEach(conv => {
  console.log(`${conv.customer.phone_number}: ${conv.last_message_at}`);
});
```

## Integration with AI Agent

When processing messages, you'll have full conversation context:

```typescript
async processMessage(event: MessageEvent) {
  const phoneNumber = event.payload.from;
  
  // Get conversation history for AI context
  const history = await this.chatHistoryService.getConversationHistory(phoneNumber);
  
  // Get customer and booking info
  const context = await this.chatHistoryService.getConversationContext(phoneNumber);
  
  // Build AI prompt with context
  const aiPrompt = `
    Customer: ${context?.customer.name || 'Unknown'}
    Message History (last 10):
    ${history.slice(-10).map(m => `${m.fromMe ? 'Bot' : 'Customer'}: ${m.body}`).join('\n')}
    
    New Message: ${event.payload.body}
  `;
  
  // Send to AI agent
  const response = await this.aiAgent.generateResponse(aiPrompt);
  
  // Send response and save to history
  await this.whatsappService.sendTextMessage(phoneNumber, response);
}
```

## Context Window Management

For AI agents with token limits, automatically trim conversation history:

```typescript
// In your message handler, after saving the message
await this.chatHistoryService.trimConversationHistory(
  phoneNumber,
  50 // Keep last 50 messages
);
```

## Phone Number Format

The service automatically extracts phone numbers from WhatsApp IDs:
- Input: `6285190654210@c.us` or `254150512238770@lid`
- Stored: `6285190654210` or `254150512238770`

This ensures consistent storage and retrieval regardless of WhatsApp ID format.

## Best Practices

1. **Always use `sendTextMessage()`** instead of direct `wahaApiService.sendText()` to ensure outgoing messages are logged
2. **Trim conversation history** periodically to manage database size and AI context window
3. **Use `getConversationContext()`** when you need both customer info and message history

## Error Handling

All methods include comprehensive error handling and logging:

```typescript
try {
  await chatHistoryService.saveMessage(message);
} catch (error) {
  // Error is logged automatically
  // Service will not throw, allowing message processing to continue
}
```

## Next Steps

- Integrate with AI agent service
- Add conversation analytics
- Implement auto-cleanup for old conversations
- Add message search functionality
