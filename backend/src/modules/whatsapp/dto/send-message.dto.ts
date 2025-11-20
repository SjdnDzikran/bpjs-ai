import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description: 'WhatsApp chat ID (phone number with suffix)',
    example: '6285190654210@c.us',
  })
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @ApiProperty({
    description: 'Message text content',
    example: 'Hello! How can I help you today?',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({
    description: 'WAHA session name',
    example: 'default',
    default: 'default',
  })
  @IsString()
  @IsOptional()
  session?: string;
}
