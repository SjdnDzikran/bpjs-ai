import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCustomerDto {
  @ApiProperty({
    description: 'Customer name',
    example: 'Jane Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;
}
