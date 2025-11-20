import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsArray } from 'class-validator';

export class UpdateChatDto {
  @ApiProperty({
    description: 'Updated message history',
    example: [],
    required: false,
  })
  @IsOptional()
  @IsArray()
  message_history?: any[];
}
