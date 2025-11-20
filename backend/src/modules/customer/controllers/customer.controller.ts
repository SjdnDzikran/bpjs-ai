import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CustomerService } from '../services/customer.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerResponseDto, CustomerListResponseDto } from '../dto';

@ApiTags('customers')
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all customers',
    description: 'Retrieve a paginated list of all customers with their chat status',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of customers to return',
    example: 50,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Offset for pagination',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'List of customers retrieved successfully',
    type: CustomerListResponseDto,
  })
  async findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    return this.customerService.findAll(parsedLimit, parsedOffset);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get customer by ID',
    description: 'Retrieve a single customer by their unique identifier',
  })
  @ApiParam({
    name: 'id',
    description: 'Customer unique identifier',
    example: 'clxxxx123456',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer found',
    type: CustomerResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  async findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }

  @Get('phone/:phoneNumber')
  @ApiOperation({
    summary: 'Get customer by phone number',
    description: 'Retrieve a single customer by their phone number',
  })
  @ApiParam({
    name: 'phoneNumber',
    description: 'Customer phone number (digits only)',
    example: '6281234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer found',
    type: CustomerResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  async findByPhoneNumber(@Param('phoneNumber') phoneNumber: string) {
    return this.customerService.findByPhoneNumber(phoneNumber);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new customer',
    description: 'Create a new customer with phone number and optional name',
  })
  @ApiResponse({
    status: 201,
    description: 'Customer created successfully',
    type: CustomerResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Customer with this phone number already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async create(@Body() dto: CreateCustomerDto) {
    return this.customerService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update customer',
    description: 'Update customer information (currently only name can be updated)',
  })
  @ApiParam({
    name: 'id',
    description: 'Customer unique identifier',
    example: 'clxxxx123456',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer updated successfully',
    type: CustomerResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customerService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete customer by ID',
    description: 'Delete a customer and their associated chat (if exists)',
  })
  @ApiParam({
    name: 'id',
    description: 'Customer unique identifier',
    example: 'clxxxx123456',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  async remove(@Param('id') id: string) {
    return this.customerService.remove(id);
  }

  @Delete('phone/:phoneNumber')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete customer by phone number',
    description: 'Delete a customer by their phone number and their associated chat (if exists)',
  })
  @ApiParam({
    name: 'phoneNumber',
    description: 'Customer phone number (digits only)',
    example: '6281234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  async removeByPhoneNumber(@Param('phoneNumber') phoneNumber: string) {
    return this.customerService.removeByPhoneNumber(phoneNumber);
  }
}
