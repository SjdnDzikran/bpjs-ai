import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponseDto {
  @ApiProperty({
    description: 'Whether the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'Message sent and saved to history',
  })
  message: string;
}

export class ConversationHistoryResponseDto {
  @ApiProperty({
    description: 'Phone number',
    example: '6285190654210',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'Number of messages in history',
    example: 15,
  })
  messageCount: number;

  @ApiProperty({
    description: 'List of messages',
    isArray: true,
    example: [
      {
        id: 'msg_123',
        timestamp: 1700000000,
        from: '6285190654210@c.us',
        fromMe: false,
        body: 'Hello',
        hasMedia: false,
      },
    ],
  })
  messages: any[];
}

export class ConversationContextSuccessResponseDto {
  @ApiProperty({
    description: 'Whether conversation was found',
    example: true,
  })
  found: boolean;

  @ApiProperty({
    description: 'Conversation context data',
  })
  conversation: any;
}

export class ConversationContextNotFoundResponseDto {
  @ApiProperty({
    description: 'Whether conversation was found',
    example: false,
  })
  found: boolean;

  @ApiProperty({
    description: 'Not found message',
    example: 'No conversation found for this number',
  })
  message: string;
}
