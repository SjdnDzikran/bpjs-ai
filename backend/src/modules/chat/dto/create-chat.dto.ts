import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class CreateChatDto {
  @ApiProperty({
    description: 'Customer ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsString()
  customer_id: string;

  @ApiProperty({
    description: 'Phone number',
    example: '6285190654210',
  })
  @IsNotEmpty()
  @IsString()
  phone_number: string;

  @ApiProperty({
    description: 'Initial message history',
    example: [],
    required: false,
  })
  @IsOptional()
  @IsArray()
  message_history?: any[];
}
