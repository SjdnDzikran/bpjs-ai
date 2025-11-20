import { ApiProperty } from '@nestjs/swagger';

class ChatCustomerDto {
  @ApiProperty({
    description: 'Customer ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Phone number',
    example: '6285190654210',
  })
  phone_number: string;

  @ApiProperty({
    description: 'Customer name',
    example: 'Budi',
  })
  name: string | null;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2025-11-19T05:43:24.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Updated timestamp',
    example: '2025-11-19T05:43:24.000Z',
  })
  updated_at: Date;
}

export class ChatSummaryDto {
  @ApiProperty({
    description: 'Chat ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Customer ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  customer_id: string;

  @ApiProperty({
    description: 'Phone number',
    example: '6285190654210',
  })
  phone_number: string;

  @ApiProperty({
    description: 'Last message timestamp',
    example: '2025-11-19T05:43:24.000Z',
  })
  last_message_at: Date;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2025-11-19T05:43:24.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Updated timestamp',
    example: '2025-11-19T05:43:24.000Z',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Customer details',
    required: false,
    type: ChatCustomerDto,
  })
  customer?: ChatCustomerDto;
}

export class ChatResponseDto extends ChatSummaryDto {
  @ApiProperty({
    description: 'Message history',
    example: [],
  })
  message_history: any[];
}

export class ChatListResponseDto {
  @ApiProperty({
    description: 'List of chats (without message history for payload efficiency)',
    type: [ChatSummaryDto],
  })
  chats: ChatSummaryDto[];

  @ApiProperty({
    description: 'Total count',
    example: 10,
  })
  total: number;
}
