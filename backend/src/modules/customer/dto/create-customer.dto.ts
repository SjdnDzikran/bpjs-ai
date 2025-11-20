import { IsString, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Customer phone number (digits only, without country code prefix)',
    example: '6281234567890',
    pattern: '^\\d+$',
  })
  @IsString()
  @Matches(/^\d+$/, {
    message: 'phone_number must contain only digits',
  })
  phone_number: string;

  @ApiProperty({
    description: 'Customer name',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;
}
