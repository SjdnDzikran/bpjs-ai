import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateAiResponseDto {
  @ApiProperty({
    description: 'Phone number to get conversation history for AI generation',
    example: '6285190654210',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}
