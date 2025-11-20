import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AiSettingsService {
  private readonly logger = new Logger(AiSettingsService.name);
  private orchestratorEnabled = true;
  private chatOverrides: Map<string, boolean> = new Map();

  setGlobalOrchestrator(enabled: boolean): void {
    this.orchestratorEnabled = enabled;
    this.logger.log(
      `AI orchestrator globally ${enabled ? 'ENABLED' : 'DISABLED'}`,
    );
  }

  setChatOrchestrator(phoneNumber: string, enabled: boolean): void {
    this.chatOverrides.set(phoneNumber, enabled);
    this.logger.log(
      `AI orchestrator for ${phoneNumber} ${enabled ? 'ENABLED' : 'DISABLED'}`,
    );
  }

  clearChatOverride(phoneNumber: string): void {
    this.chatOverrides.delete(phoneNumber);
    this.logger.log(`AI orchestrator override cleared for ${phoneNumber}`);
  }

  isOrchestratorEnabled(phoneNumber?: string): boolean {
    if (!this.orchestratorEnabled) {
      return false;
    }

    if (!phoneNumber) {
      return true;
    }

    const override = this.chatOverrides.get(phoneNumber);
    return override !== undefined ? override : true;
  }
}
