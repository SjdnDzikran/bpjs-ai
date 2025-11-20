import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from '../dto';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all customers with pagination
   */
  async findAll(limit: number = 50, offset: number = 0) {
    try {
      const [customers, total] = await Promise.all([
        this.prisma.customer.findMany({
          take: limit,
          skip: offset,
          orderBy: { created_at: 'desc' },
          include: {
            chat: {
              select: {
                id: true,
                last_message_at: true,
              },
            },
          },
        }),
        this.prisma.customer.count(),
      ]);

      const data = customers.map((customer) => ({
        id: customer.id,
        phone_number: customer.phone_number,
        name: customer.name,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        has_chat: !!customer.chat,
      }));

      return {
        data,
        total,
        limit,
        offset,
      };
    } catch (error) {
      this.logger.error('Failed to get customers:', error.stack);
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async findOne(id: string) {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id },
        include: {
          chat: {
            select: {
              id: true,
              last_message_at: true,
            },
          },
        },
      });

      if (!customer) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }

      return {
        id: customer.id,
        phone_number: customer.phone_number,
        name: customer.name,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        has_chat: !!customer.chat,
      };
    } catch (error) {
      this.logger.error(`Failed to get customer ${id}:`, error.stack);
      throw error;
    }
  }

  /**
   * Get customer by phone number
   */
  async findByPhoneNumber(phoneNumber: string) {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { phone_number: phoneNumber },
        include: {
          chat: {
            select: {
              id: true,
              last_message_at: true,
            },
          },
        },
      });

      if (!customer) {
        throw new NotFoundException(
          `Customer with phone number ${phoneNumber} not found`,
        );
      }

      return {
        id: customer.id,
        phone_number: customer.phone_number,
        name: customer.name,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        has_chat: !!customer.chat,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get customer by phone ${phoneNumber}:`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Create new customer
   */
  async create(dto: CreateCustomerDto) {
    try {
      // Check if customer already exists
      const existing = await this.prisma.customer.findUnique({
        where: { phone_number: dto.phone_number },
      });

      if (existing) {
        throw new ConflictException(
          `Customer with phone number ${dto.phone_number} already exists`,
        );
      }

      const customer = await this.prisma.customer.create({
        data: {
          phone_number: dto.phone_number,
          name: dto.name || null,
        },
      });

      this.logger.log(`Created customer: ${customer.phone_number}`);

      return {
        id: customer.id,
        phone_number: customer.phone_number,
        name: customer.name,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        has_chat: false,
      };
    } catch (error) {
      this.logger.error('Failed to create customer:', error.stack);
      throw error;
    }
  }

  /**
   * Update customer
   */
  async update(id: string, dto: UpdateCustomerDto) {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id },
      });

      if (!customer) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }

      const updated = await this.prisma.customer.update({
        where: { id },
        data: {
          name: dto.name,
        },
        include: {
          chat: {
            select: {
              id: true,
              last_message_at: true,
            },
          },
        },
      });

      this.logger.log(`Updated customer: ${updated.phone_number}`);

      return {
        id: updated.id,
        phone_number: updated.phone_number,
        name: updated.name,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
        has_chat: !!updated.chat,
      };
    } catch (error) {
      this.logger.error(`Failed to update customer ${id}:`, error.stack);
      throw error;
    }
  }

  /**
   * Delete customer
   */
  async remove(id: string) {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id },
        include: {
          chat: true,
        },
      });

      if (!customer) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }

      // Delete associated chat first if exists
      if (customer.chat) {
        await this.prisma.chat.delete({
          where: { id: customer.chat.id },
        });
        this.logger.log(`Deleted associated chat for customer ${customer.phone_number}`);
      }

      // Delete customer
      await this.prisma.customer.delete({
        where: { id },
      });

      this.logger.log(`Deleted customer: ${customer.phone_number}`);

      return {
        success: true,
        message: 'Customer deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to delete customer ${id}:`, error.stack);
      throw error;
    }
  }

  /**
   * Delete customer by phone number
   */
  async removeByPhoneNumber(phoneNumber: string) {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { phone_number: phoneNumber },
        include: {
          chat: true,
        },
      });

      if (!customer) {
        throw new NotFoundException(
          `Customer with phone number ${phoneNumber} not found`,
        );
      }

      // Delete associated chat first if exists
      if (customer.chat) {
        await this.prisma.chat.delete({
          where: { id: customer.chat.id },
        });
        this.logger.log(`Deleted associated chat for customer ${phoneNumber}`);
      }

      // Delete customer
      await this.prisma.customer.delete({
        where: { phone_number: phoneNumber },
      });

      this.logger.log(`Deleted customer: ${phoneNumber}`);

      return {
        success: true,
        message: 'Customer deleted successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to delete customer by phone ${phoneNumber}:`,
        error.stack,
      );
      throw error;
    }
  }
}
