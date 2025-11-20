import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiAgentService } from '../services/ai-agent.service';
import { ChatService } from '../../chat/services/chat.service';
import { AiSettingsService } from '../services/ai-settings.service';
import {
  GenerateAiResponseDto,
  AiConnectionTestResponseDto,
  AiGenerateSuccessResponseDto,
  AiGenerateErrorResponseDto,
  ToggleGlobalOrchestratorDto,
  ToggleChatOrchestratorDto,
  OrchestratorToggleResponseDto,
} from '../dto';

@ApiTags('ai')
@Controller('api/ai')
export class AiController {
  constructor(
    private readonly aiAgentService: AiAgentService,
    private readonly chatService: ChatService,
    private readonly aiSettingsService: AiSettingsService,
  ) {}

  @Get('test')
  @ApiOperation({ 
    summary: 'Test AI connection',
    description: 'Test connection to Google AI Gemini service'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'AI connection test result',
    type: AiConnectionTestResponseDto,
  })
  async testConnection(): Promise<AiConnectionTestResponseDto> {
    const isConnected = await this.aiAgentService.testConnection();
    
    return { 
      success: isConnected,
      message: isConnected 
        ? 'AI connection successful' 
        : 'AI connection failed. Check logs for details.'
    };
  }

  @Post('generate')
  @ApiOperation({ 
    summary: 'Generate AI response',
    description: 'Generate AI response for a phone number based on conversation history'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'AI response generated successfully',
    type: AiGenerateSuccessResponseDto,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'No conversation history found',
    type: AiGenerateErrorResponseDto,
  })
  async generateResponse(
    @Body() dto: GenerateAiResponseDto,
  ): Promise<AiGenerateSuccessResponseDto | AiGenerateErrorResponseDto> {
    // Get conversation history
    const history = await this.chatService.getMessageHistory(
      dto.phoneNumber,
    );
    
    if (history.length === 0) {
      return {
        success: false,
        error: 'No conversation history found for this number',
        messageCount: 0,
      };
    }

    // Generate AI response
    const response = await this.aiAgentService.generateResponse(history);
    
    return {
      success: true,
      response,
      messageCount: history.length,
    };
  }

  @Post('orchestrator/global')
  @ApiOperation({
    summary: 'Toggle AI orchestrator globally',
    description: 'Enable or disable AI message orchestration for all chats',
  })
  @ApiResponse({
    status: 200,
    description: 'Orchestrator global toggle updated',
    type: OrchestratorToggleResponseDto,
  })
  toggleOrchestratorGlobal(
    @Body() dto: ToggleGlobalOrchestratorDto,
  ): OrchestratorToggleResponseDto {
    this.aiSettingsService.setGlobalOrchestrator(dto.enabled);

    return {
      success: true,
      enabled: this.aiSettingsService.isOrchestratorEnabled(),
    };
  }

  @Post('orchestrator/chat')
  @ApiOperation({
    summary: 'Toggle AI orchestrator for a chat',
    description: 'Enable or disable AI message orchestration for a single chat/number',
  })
  @ApiResponse({
    status: 200,
    description: 'Orchestrator chat toggle updated',
    type: OrchestratorToggleResponseDto,
  })
  toggleOrchestratorChat(
    @Body() dto: ToggleChatOrchestratorDto,
  ): OrchestratorToggleResponseDto {
    this.aiSettingsService.setChatOrchestrator(dto.phoneNumber, dto.enabled);

    return {
      success: true,
      enabled: this.aiSettingsService.isOrchestratorEnabled(dto.phoneNumber),
      phoneNumber: dto.phoneNumber,
    };
  }
}
