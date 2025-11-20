import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import {
  CreateChatDto,
  UpdateChatDto,
  ChatResponseDto,
  ChatListResponseDto,
} from '../dto';

@ApiTags('chats')
@Controller('api/chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all chats',
    description: 'Retrieve all chats with pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'List of chats',
    type: ChatListResponseDto,
  })
  async findAll(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const { chats, total } = await this.chatService.findAll(
      limit ? Number(limit) : 20,
      offset ? Number(offset) : 0,
    );

    return { chats, total };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get chat by ID',
    description: 'Retrieve a single chat by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Chat ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat details',
    type: ChatResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Chat not found',
  })
  async findOne(@Param('id') id: string) {
    return await this.chatService.findOne(id);
  }

  @Get('phone/:phoneNumber')
  @ApiOperation({
    summary: 'Get chat by phone number',
    description: 'Retrieve a chat by phone number',
  })
  @ApiParam({
    name: 'phoneNumber',
    description: 'Phone number',
    example: '6285190654210',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat details',
    type: ChatResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Chat not found',
  })
  async findByPhoneNumber(
    @Param('phoneNumber') phoneNumber: string,
  ) {
    return await this.chatService.findByPhoneNumber(phoneNumber);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new chat',
    description: 'Create a new chat record',
  })
  @ApiResponse({
    status: 201,
    description: 'Chat created successfully',
    type: ChatResponseDto,
  })
  async create(@Body() createChatDto: CreateChatDto) {
    return await this.chatService.create(createChatDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a chat',
    description: 'Update chat details',
  })
  @ApiParam({
    name: 'id',
    description: 'Chat ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat updated successfully',
    type: ChatResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Chat not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateChatDto: UpdateChatDto,
  ) {
    return await this.chatService.update(id, updateChatDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a chat',
    description: 'Delete a chat by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Chat ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Chat not found',
  })
  async remove(@Param('id') id: string) {
    return await this.chatService.remove(id);
  }

  @Delete('phone/:phoneNumber')
  @ApiOperation({
    summary: 'Delete chat by phone number',
    description: 'Delete a chat by phone number',
  })
  @ApiParam({
    name: 'phoneNumber',
    description: 'Phone number',
    example: '6285190654210',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Chat not found',
  })
  async removeByPhoneNumber(@Param('phoneNumber') phoneNumber: string) {
    return await this.chatService.removeByPhoneNumber(phoneNumber);
  }
}
