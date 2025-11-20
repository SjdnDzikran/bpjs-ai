import { ApiProperty } from '@nestjs/swagger';

export class CustomerResponseDto {
  @ApiProperty({
    description: 'Customer unique identifier',
    example: 'clxxxx123456',
  })
  id: string;

  @ApiProperty({
    description: 'Customer phone number',
    example: '6281234567890',
  })
  phone_number: string;

  @ApiProperty({
    description: 'Customer name',
    example: 'John Doe',
    nullable: true,
  })
  name: string | null;

  @ApiProperty({
    description: 'Customer creation timestamp',
    example: '2025-11-19T08:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Customer last update timestamp',
    example: '2025-11-19T09:30:00.000Z',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Whether customer has an associated chat',
    example: true,
  })
  has_chat: boolean;
}

export class CustomerListResponseDto {
  @ApiProperty({
    description: 'List of customers',
    type: [CustomerResponseDto],
  })
  data: CustomerResponseDto[];

  @ApiProperty({
    description: 'Total number of customers',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Number of items returned',
    example: 50,
  })
  limit: number;

  @ApiProperty({
    description: 'Offset for pagination',
    example: 0,
  })
  offset: number;
}
