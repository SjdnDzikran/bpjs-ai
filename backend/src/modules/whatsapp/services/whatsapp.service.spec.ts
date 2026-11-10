import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import { WhatsappService } from './whatsapp.service';

describe('WhatsappService webhook signature verification', () => {
  const buildService = (secret?: string): WhatsappService => {
    const configService = {
      get: jest.fn().mockReturnValue(secret),
    } as unknown as ConfigService;

    return new WhatsappService(
      configService,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  };

  const verify = (
    service: WhatsappService,
    headers: { signature?: string; algorithm?: string },
    rawBody?: Buffer,
  ): void =>
    (
      service as unknown as {
        verifySignature: (h: unknown, b?: Buffer) => void;
      }
    ).verifySignature(headers, rawBody);

  it('rejects the webhook when WAHA_WEBHOOK_SECRET is not configured', () => {
    const service = buildService(undefined);

    expect(() => verify(service, {}, Buffer.from('{}'))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects the webhook when WAHA_WEBHOOK_SECRET is blank', () => {
    const service = buildService('   ');

    expect(() => verify(service, {}, Buffer.from('{}'))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects the placeholder secret shipped in .env.example', () => {
    const service = buildService('your-secret-key-here');

    expect(() =>
      verify(service, { signature: 'abcd' }, Buffer.from('{}')),
    ).toThrow(UnauthorizedException);
  });

  it('accepts a request whose HMAC matches the configured secret', () => {
    const secret = 'a-strong-configured-secret';
    const rawBody = Buffer.from('{"event":"message"}');
    const signature = createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');
    const service = buildService(secret);

    expect(() =>
      verify(service, { signature, algorithm: 'sha512' }, rawBody),
    ).not.toThrow();
  });

  it('rejects a request whose HMAC does not match the configured secret', () => {
    const rawBody = Buffer.from('{"event":"message"}');
    const service = buildService('a-strong-configured-secret');

    expect(() =>
      verify(service, { signature: 'deadbeef', algorithm: 'sha512' }, rawBody),
    ).toThrow(UnauthorizedException);
  });
});
