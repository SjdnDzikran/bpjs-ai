import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Swagger Configuration (for OpenAPI spec generation)
  const config = new DocumentBuilder()
    .setTitle('Palapa AI - WhatsApp Chat API')
    .setDescription('API for AI-powered WhatsApp chat system with WAHA integration')
    .setVersion('1.0')
    .addTag('webhooks', 'WAHA webhook endpoints')
    .addTag('whatsapp', 'WhatsApp messaging operations')
    .addTag('chat', 'Chat history and conversation management')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  
  // Use Scalar instead of Swagger UI for better docs experience
  app.use(
    '/docs',
    apiReference({
      theme: 'saturn',
      hideClientButton: true,
      defaultOpenAllTags: true,
      content: document,
    }),
  );
  
  // Raw body parser for webhook signature verification
  const rawBodyPaths = ['/webhooks/waha'];
  rawBodyPaths.forEach((path) => {
    app.use(
      path,
      express.json({
        verify: (req: any, _res, buf) => {
          req.rawBody = Buffer.from(buf);
        },
      }),
    );
  });
  
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);
  
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation (Scalar): http://localhost:${port}/docs`);
}
bootstrap();
