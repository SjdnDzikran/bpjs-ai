import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteConversationDto {
  @ApiProperty({
    description: 'Phone number (with or without WhatsApp suffix)',
    example: '6285190654210',
  })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;
}

export class DeleteConversationResponseDto {
  @ApiProperty({
    description: 'Whether the deletion was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Conversation deleted successfully',
  })
  message: string;
}
