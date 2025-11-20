import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsappController, WhatsappApiController } from './controllers';
import { 
  WhatsappService, 
  WahaApiService,
} from './services';
import { AiModule } from '../ai';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ConfigModule, AiModule, ChatModule],
  controllers: [WhatsappController, WhatsappApiController],
  providers: [WhatsappService, WahaApiService],
  exports: [WhatsappService, WahaApiService],
})
export class WhatsappModule {}
