import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ChatActionDto {
  @ApiProperty({
    description: 'WhatsApp chat ID',
    example: '6285190654210@c.us',
  })
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @ApiPropertyOptional({
    description: 'WAHA session name',
    example: 'default',
    default: 'default',
  })
  @IsString()
  @IsOptional()
  session?: string;
}
