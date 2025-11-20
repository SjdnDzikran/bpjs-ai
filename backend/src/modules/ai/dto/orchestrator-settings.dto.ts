import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class ToggleGlobalOrchestratorDto {
  @ApiProperty({
    description: 'Enable or disable the AI message orchestrator globally',
    example: true,
  })
  @IsBoolean()
  enabled: boolean;
}

export class ToggleChatOrchestratorDto {
  @ApiProperty({
    description: 'Phone number to toggle orchestrator for',
    example: '6285190654210',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: 'Enable or disable the AI message orchestrator for this chat',
    example: false,
  })
  @IsBoolean()
  enabled: boolean;
}

export class OrchestratorToggleResponseDto {
  @ApiProperty({
    description: 'Operation success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Whether orchestrator is enabled after the toggle',
    example: true,
  })
  enabled: boolean;

  @ApiProperty({
    description: 'Phone number affected (only for per-chat toggles)',
    required: false,
    example: '6285190654210',
  })
  phoneNumber?: string;
}
