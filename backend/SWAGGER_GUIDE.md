# Swagger API Documentation

## Overview

Swagger UI has been integrated into the NestJS backend to provide interactive API documentation and testing capabilities.

## Access Swagger UI

Once the server is running, access Swagger at:

```
http://localhost:3001/api
```

## API Endpoints Documentation

### 📡 Webhooks (Tag: webhooks)

#### POST /webhooks/waha
- **Description**: Receive webhook events from WAHA (WhatsApp HTTP API)
- **Authentication**: HMAC signature verification (automatic)
- **Headers**:
  - `x-webhook-request-id`: Unique request ID
  - `x-webhook-timestamp`: Timestamp of webhook
  - `x-webhook-hmac`: HMAC signature
  - `x-webhook-hmac-algorithm`: Algorithm used (sha512)
- **Events Handled**:
  - `message` - Incoming/outgoing messages
  - `session.status` - Session state changes
  - `message.reaction` - Message reactions
  - `message.ack` - Message acknowledgments

### 💬 WhatsApp Operations (Tag: whatsapp)

#### POST /api/whatsapp/send-message
- **Description**: Send a text message to a WhatsApp number
- **Body**:
  ```json
  {
    "chatId": "6285190654210@c.us",
    "text": "Hello! How can I help you?",
    "session": "default"
  }
  ```
- **Response**: Message sent and saved to conversation history

#### GET /api/whatsapp/conversations/recent
- **Description**: Get list of recent conversations
- **Query Parameters**:
  - `limit` (optional, default: 20): Number of conversations to return
- **Response**: Array of conversation objects with customer info

#### GET /api/whatsapp/conversations/:phoneNumber/history
- **Description**: Get message history for a specific phone number
- **Path Parameters**:
  - `phoneNumber`: Phone number (e.g., "6285190654210" or "6285190654210@c.us")
- **Response**: Array of messages with timestamps, sender info, and content

#### GET /api/whatsapp/conversations/:phoneNumber/context
- **Description**: Get full conversation context including customer and messages
- **Path Parameters**:
  - `phoneNumber`: Phone number
- **Response**: Complete conversation object with customer details

#### POST /api/whatsapp/typing/start
- **Description**: Start typing indicator (auto-stops after 10-20 seconds)
- **Body**:
  ```json
  {
    "chatId": "6285190654210@c.us",
    "session": "default"
  }
  ```

#### POST /api/whatsapp/typing/stop
- **Description**: Stop typing indicator
- **Body**:
  ```json
  {
    "chatId": "6285190654210@c.us",
    "session": "default"
  }
  ```

#### POST /api/whatsapp/seen
- **Description**: Mark messages as seen (double blue checkmark)
- **Body**:
  ```json
  {
    "chatId": "6285190654210@c.us",
    "session": "default"
  }
  ```

## Testing with Swagger UI

1. **Start the server**:
   ```bash
   npm run start:dev
   ```

2. **Open Swagger UI**:
   Navigate to `http://localhost:3001/api` in your browser

3. **Test endpoints**:
   - Click on any endpoint to expand it
   - Click "Try it out" button
   - Fill in the required parameters
   - Click "Execute" to make the request
   - View the response below

## Example Usage Flow

### 1. Check Recent Conversations
```bash
GET /api/whatsapp/conversations/recent?limit=10
```

### 2. View Message History
```bash
GET /api/whatsapp/conversations/6285190654210/history
```

### 3. Send a Message
```bash
POST /api/whatsapp/send-message
Body:
{
  "chatId": "6285190654210@c.us",
  "text": "Thank you for contacting us!"
}
```

### 4. Simulate Human-like Behavior
```bash
# Start typing
POST /api/whatsapp/typing/start
Body: { "chatId": "6285190654210@c.us" }

# Wait a few seconds...

# Send message
POST /api/whatsapp/send-message
Body: { "chatId": "6285190654210@c.us", "text": "Hello!" }

# Mark as seen
POST /api/whatsapp/seen
Body: { "chatId": "6285190654210@c.us" }
```

## Phone Number Formats

The API accepts phone numbers in multiple formats:
- Just the number: `6285190654210`
- With WhatsApp suffix: `6285190654210@c.us`
- With LID suffix: `254150512238770@lid`

The service automatically handles format conversion.

## Authentication

Currently, the API endpoints are open for testing. In production, you should:

1. Enable bearer token authentication
2. Add API key validation
3. Implement rate limiting
4. Add CORS restrictions

## Development

To modify the Swagger configuration, edit:
- `src/main.ts` - Main Swagger setup
- Controller decorators:
  - `@ApiTags()` - Group endpoints
  - `@ApiOperation()` - Describe endpoint
  - `@ApiResponse()` - Define responses
  - `@ApiBody()` - Define request body
  - `@ApiParam()` - Define path parameters
  - `@ApiQuery()` - Define query parameters

## Additional Features

### Export OpenAPI Spec
The OpenAPI specification can be accessed at:
```
http://localhost:3001/api-json
```

This JSON can be imported into:
- Postman
- Insomnia
- API testing tools
- Code generators

### Tags Organization
- `webhooks`: WAHA webhook receivers
- `whatsapp`: WhatsApp messaging operations
- `chat`: Chat history and conversation management

## Troubleshooting

### Swagger UI not loading
- Check if server is running on correct port (3001)
- Verify no CORS issues in browser console
- Check for build errors: `npm run build`

### Endpoints not appearing
- Verify controller is imported in module
- Check decorator syntax in controller
- Restart development server

### Request fails in Swagger
- Check request body format matches schema
- Verify required fields are provided
- Check server logs for detailed error messages

## Next Steps

1. Add authentication/authorization decorators
2. Create DTOs with class-validator for validation
3. Add more detailed response schemas
4. Document error responses
5. Add request/response examples
