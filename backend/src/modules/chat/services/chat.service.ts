import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateChatDto, UpdateChatDto } from '../dto';
import { ChatMessage } from '../interfaces/chat.interface';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all chats with pagination
   */
  async findAll(limit: number = 20, offset: number = 0) {
    try {
      const [chats, total] = await Promise.all([
        this.prisma.chat.findMany({
          take: limit,
          skip: offset,
          orderBy: { last_message_at: 'desc' },
          select: {
            id: true,
            customer_id: true,
            phone_number: true,
            last_message_at: true,
            created_at: true,
            updated_at: true,
            customer: true,
          },
        }),
        this.prisma.chat.count(),
      ]);

      return { chats, total };
    } catch (error) {
      this.logger.error('Failed to get chats:', error.stack);
      throw error;
    }
  }

  /**
   * Get a single chat by ID
   */
  async findOne(id: string) {
    try {
      const chat = await this.prisma.chat.findUnique({
        where: { id },
        include: {
          customer: true,
        },
      });

      if (!chat) {
        throw new NotFoundException(`Chat with ID ${id} not found`);
      }

      return chat;
    } catch (error) {
      this.logger.error(`Failed to get chat ${id}:`, error.stack);
      throw error;
    }
  }

  /**
   * Get chat by phone number
   */
  async findByPhoneNumber(phoneNumber: string) {
    try {
      const cleanPhone = this.extractPhoneNumber(phoneNumber);

      const chat = await this.prisma.chat.findUnique({
        where: { phone_number: cleanPhone },
        include: {
          customer: true,
        },
      });

      return chat;
    } catch (error) {
      this.logger.error(
        `Failed to get chat for ${phoneNumber}:`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Create a new chat
   */
  async create(createChatDto: CreateChatDto) {
    try {
      const chat = await this.prisma.chat.create({
        data: {
          customer_id: createChatDto.customer_id,
          phone_number: createChatDto.phone_number,
          message_history: createChatDto.message_history || [],
          last_message_at: new Date(),
        },
        include: {
          customer: true,
        },
      });

      this.logger.log(`Created chat for ${createChatDto.phone_number}`);
      return chat;
    } catch (error) {
      this.logger.error('Failed to create chat:', error.stack);
      throw error;
    }
  }

  /**
   * Update a chat
   */
  async update(id: string, updateChatDto: UpdateChatDto) {
    try {
      const chat = await this.prisma.chat.update({
        where: { id },
        data: {
          ...updateChatDto,
          updated_at: new Date(),
        },
        include: {
          customer: true,
        },
      });

      this.logger.log(`Updated chat ${id}`);
      return chat;
    } catch (error) {
      this.logger.error(`Failed to update chat ${id}:`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a chat
   */
  async remove(id: string) {
    try {
      await this.prisma.chat.delete({
        where: { id },
      });

      this.logger.log(`Deleted chat ${id}`);
      return { success: true, message: 'Chat deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete chat ${id}:`, error.stack);
      throw error;
    }
  }

  /**
   * Delete chat by phone number
   */
  async removeByPhoneNumber(phoneNumber: string) {
    try {
      const cleanPhone = this.extractPhoneNumber(phoneNumber);

      const chat = await this.prisma.chat.findUnique({
        where: { phone_number: cleanPhone },
      });

      if (!chat) {
        throw new NotFoundException(
          `Chat for phone number ${cleanPhone} not found`,
        );
      }

      await this.prisma.chat.delete({
        where: { phone_number: cleanPhone },
      });

      this.logger.log(`Deleted chat for ${cleanPhone}`);
      return { success: true, message: 'Chat deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to delete chat for ${phoneNumber}:`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Save message to chat
   */
  async saveMessage(message: ChatMessage): Promise<void> {
    try {
      // For outgoing messages, use 'to' field; for incoming, use 'from'
      const phoneNumber = message.fromMe && message.to
        ? this.extractPhoneNumber(message.to)
        : this.extractPhoneNumber(message.from);

      // Find or create customer (only for incoming messages)
      let customer = await this.prisma.customer.findUnique({
        where: { phone_number: phoneNumber },
      });

      if (!customer) {
        // Don't create customer for outgoing messages (fromMe: true)
        if (message.fromMe) {
          this.logger.warn(
            `Skipping save: No customer found for outgoing message to ${phoneNumber}`,
          );
          return;
        }

        this.logger.log(`Creating new customer: ${phoneNumber}`);
        customer = await this.prisma.customer.create({
          data: {
            phone_number: phoneNumber,
            name: message.notifyName || null,
          },
        });
      } else if (
        !message.fromMe &&
        message.notifyName &&
        customer.name !== message.notifyName
      ) {
        this.logger.log(
          `Updating customer name: ${phoneNumber} -> ${message.notifyName}`,
        );
        customer = await this.prisma.customer.update({
          where: { phone_number: phoneNumber },
          data: { name: message.notifyName },
        });
      }

      // Find or create chat
      let chat = await this.prisma.chat.findUnique({
        where: { phone_number: phoneNumber },
      });

      if (!chat) {
        this.logger.log(`Creating new chat for: ${phoneNumber}`);
        chat = await this.prisma.chat.create({
          data: {
            customer_id: customer.id,
            phone_number: phoneNumber,
            message_history: [],
            last_message_at: new Date(message.timestamp * 1000),
          },
        });
      }

      // Append message to history
      const messageHistory = Array.isArray(chat.message_history)
        ? chat.message_history
        : [];

      const newMessage = {
        id: message.id,
        timestamp: message.timestamp,
        fromMe: message.fromMe,
        body: message.body,
        hasMedia: message.hasMedia,
        ...(message.mediaType && { mediaType: message.mediaType }),
        ...(message.mediaUrl && { mediaUrl: message.mediaUrl }),
        ...(message.replyTo && { replyTo: message.replyTo }),
      };

      messageHistory.push(newMessage);

      // Update chat
      await this.prisma.chat.update({
        where: { phone_number: phoneNumber },
        data: {
          message_history: messageHistory,
          last_message_at: new Date(message.timestamp * 1000),
        },
      });

      this.logger.log(
        `Saved message from ${phoneNumber} (total: ${messageHistory.length} messages)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to save message from ${message.from}:`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get message history for a phone number
   */
  async getMessageHistory(phoneNumber: string): Promise<ChatMessage[]> {
    try {
      const cleanPhone = this.extractPhoneNumber(phoneNumber);

      const chat = await this.prisma.chat.findUnique({
        where: { phone_number: cleanPhone },
      });

      if (!chat) {
        return [];
      }

      return Array.isArray(chat.message_history)
        ? (chat.message_history as unknown as ChatMessage[])
        : [];
    } catch (error) {
      this.logger.error(
        `Failed to get message history for ${phoneNumber}:`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Extract clean phone number from WhatsApp ID format
   */
  private extractPhoneNumber(waId: string): string {
    return waId.split('@')[0];
  }
}
