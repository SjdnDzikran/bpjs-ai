import { ApiProperty } from '@nestjs/swagger';

export class AiConnectionTestResponseDto {
  @ApiProperty({
    description: 'Whether the AI connection test was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Message describing the test result',
    example: 'AI connection successful',
  })
  message: string;
}

export class AiGenerateSuccessResponseDto {
  @ApiProperty({
    description: 'Whether the AI response generation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'The generated AI response text',
    example: 'Halo! Saya bisa membantu Anda menjadwalkan inspeksi mobil. Kapan Anda ingin melakukan inspeksi?',
  })
  response: string;

  @ApiProperty({
    description: 'Number of messages in the conversation context',
    example: 5,
  })
  messageCount: number;
}

export class AiGenerateErrorResponseDto {
  @ApiProperty({
    description: 'Whether the AI response generation was successful',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'Error message',
    example: 'No conversation history found for this number',
  })
  error: string;

  @ApiProperty({
    description: 'Number of messages found',
    example: 0,
  })
  messageCount: number;
}
