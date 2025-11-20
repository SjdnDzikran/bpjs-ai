import { Module } from '@nestjs/common';
import { CustomerController } from './controllers';
import { CustomerService } from './services';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
