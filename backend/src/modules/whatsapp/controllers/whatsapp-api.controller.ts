import { Controller, Get, Post, Body, Param, Query, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { WhatsappService } from '../services/whatsapp.service';
import { ChatService } from '../../chat/services/chat.service';
import { WahaApiService } from '../services/waha-api.service';
import {
  SendMessageDto,
  ChatActionDto,
  SuccessResponseDto,
  ConversationHistoryResponseDto,
  ConversationContextSuccessResponseDto,
  ConversationContextNotFoundResponseDto,
  DeleteConversationDto,
  DeleteConversationResponseDto,
} from '../dto';

@ApiTags('whatsapp')
@Controller('api/whatsapp')
export class WhatsappApiController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly chatService: ChatService,
    private readonly wahaApiService: WahaApiService,
  ) {}

  @Post('send-message')
  @ApiOperation({ 
    summary: 'Send a WhatsApp message',
    description: 'Send a text message to a WhatsApp number and save it to conversation history'
  })
  @ApiBody({
    type: SendMessageDto,
    examples: {
      example1: {
        summary: 'Send message example',
        value: {
          chatId: '6285190654210@c.us',
          text: 'Hello! How can I help you today?',
          session: 'default'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Message sent successfully',
    type: SuccessResponseDto,
  })
  @ApiResponse({ status: 500, description: 'Failed to send message' })
  async sendMessage(@Body() dto: SendMessageDto): Promise<SuccessResponseDto> {
    await this.whatsappService.sendTextMessage(
      dto.chatId,
      dto.text,
      { session: dto.session }
    );
    
    return { 
      success: true,
      message: 'Message sent and saved to history'
    };
  }

  @Get('conversations/recent')
  @ApiOperation({ 
    summary: 'Get recent conversations',
    description: 'Retrieve a list of recent WhatsApp conversations'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ 
    status: 200, 
    description: 'List of recent conversations',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          phone_number: { type: 'string' },
          last_message_at: { type: 'string', format: 'date-time' },
          customer: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              phone_number: { type: 'string' },
              name: { type: 'string', nullable: true }
            }
          }
        }
      }
    }
  })
  async getRecentConversations(@Query('limit') limit?: number) {
    const result = await this.chatService.findAll(
      limit ? parseInt(limit.toString()) : 20,
      0
    );
    
    return result.chats;
  }

  @Get('conversations/:phoneNumber/history')
  @ApiOperation({ 
    summary: 'Get conversation history',
    description: 'Retrieve message history for a specific phone number'
  })
  @ApiParam({ 
    name: 'phoneNumber', 
    description: 'Phone number (can include @c.us suffix or just the number)',
    example: '6285190654210'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Conversation message history',
    type: ConversationHistoryResponseDto,
  })
  async getConversationHistory(
    @Param('phoneNumber') phoneNumber: string,
  ): Promise<ConversationHistoryResponseDto> {
    const history = await this.chatService.getMessageHistory(phoneNumber);
    
    return {
      phoneNumber,
      messageCount: history.length,
      messages: history
    };
  }

  @Get('conversations/:phoneNumber/context')
  @ApiOperation({ 
    summary: 'Get conversation context',
    description: 'Retrieve full conversation context including customer info and messages'
  })
  @ApiParam({ 
    name: 'phoneNumber', 
    description: 'Phone number (can include @c.us suffix or just the number)',
    example: '6285190654210'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Full conversation context',
    type: ConversationContextSuccessResponseDto,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Conversation not found',
    type: ConversationContextNotFoundResponseDto,
  })
  async getConversationContext(
    @Param('phoneNumber') phoneNumber: string,
  ): Promise<ConversationContextSuccessResponseDto | ConversationContextNotFoundResponseDto> {
    const context = await this.chatService.findByPhoneNumber(phoneNumber);
    
    if (!context) {
      return {
        found: false,
        message: 'No conversation found for this number'
      };
    }
    
    return {
      found: true,
      conversation: context
    };
  }

  @Post('typing/start')
  @ApiOperation({ 
    summary: 'Start typing indicator',
    description: 'Show typing indicator in a WhatsApp chat (auto-stops after 10-20 seconds)'
  })
  @ApiBody({ type: ChatActionDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Typing indicator started',
    type: SuccessResponseDto,
  })
  async startTyping(@Body() body: ChatActionDto): Promise<SuccessResponseDto> {
    await this.wahaApiService.startTyping(
      body.chatId,
      body.session
    );
    
    return { 
      success: true,
      message: 'Typing indicator started (will auto-stop after 10-20 seconds)'
    };
  }

  @Post('typing/stop')
  @ApiOperation({ 
    summary: 'Stop typing indicator',
    description: 'Stop showing typing indicator in a WhatsApp chat'
  })
  @ApiBody({ type: ChatActionDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Typing indicator stopped',
    type: SuccessResponseDto,
  })
  async stopTyping(@Body() body: ChatActionDto): Promise<SuccessResponseDto> {
    await this.wahaApiService.stopTyping(
      body.chatId,
      body.session
    );
    
    return { 
      success: true,
      message: 'Typing indicator stopped'
    };
  }

  @Post('seen')
  @ApiOperation({ 
    summary: 'Mark messages as seen',
    description: 'Send "seen" status (double blue checkmark) for messages in a chat'
  })
  @ApiBody({ type: ChatActionDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Seen status sent',
    type: SuccessResponseDto,
  })
  async sendSeen(@Body() body: ChatActionDto): Promise<SuccessResponseDto> {
    await this.wahaApiService.sendSeen({
      chatId: body.chatId,
      session: body.session
    });
    
    return { 
      success: true,
      message: 'Seen status sent'
    };
  }

  @Delete('conversations/:phoneNumber')
  @ApiOperation({ 
    summary: 'Delete conversation history',
    description: 'Delete all conversation history for a specific phone number'
  })
  @ApiParam({ 
    name: 'phoneNumber', 
    description: 'Phone number (can include @c.us suffix or just the number)',
    example: '6285190654210'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Conversation deleted successfully',
    type: DeleteConversationResponseDto,
  })
  async deleteConversation(
    @Param('phoneNumber') phoneNumber: string,
  ): Promise<DeleteConversationResponseDto> {
    const result = await this.chatService.removeByPhoneNumber(phoneNumber);

    return {
      success: result.success,
      message: result.message,
    };
  }
}
