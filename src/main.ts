import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import { WinstonModule } from 'nest-winston';
import { instance } from './infrastructure/logger/winston.logger';
import { SeedService } from './infrastructure/seed/seed.service';
import './amp';
import { ChatbotAssetService } from './infrastructure/chatbotAsset/ChatbotAsset.service';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: WinstonModule.createLogger({
      instance: instance,
    }),
  })

  app.use

  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  const seedService = app.get(SeedService);
  const ChatbotAssetServic = app.get(ChatbotAssetService);

  await seedService.seed();
  //befor use version upload check this version is exist in chatbotasset
  await ChatbotAssetServic.uploadChatbotAsset('v1.0.0')

  await app.listen(12000);
}
bootstrap();
