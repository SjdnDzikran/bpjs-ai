import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiAgentService } from './services/ai-agent.service';
import { AiSettingsService } from './services/ai-settings.service';
import { MessageOrchestratorService } from './services/message-orchestrator.service';
import { AiController } from './controllers/ai.controller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => WhatsappModule),
    ChatModule,
  ],
  controllers: [AiController],
  providers: [AiAgentService, AiSettingsService, MessageOrchestratorService],
  exports: [AiAgentService, AiSettingsService, MessageOrchestratorService],
})
export class AiModule {}
