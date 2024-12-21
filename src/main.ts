import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import { WinstonModule } from 'nest-winston';
import { instance } from './infrastructure/logger/winston.logger';
import { SeedService } from './infrastructure/seed/seed.service';
// import './amp';
import { ChatbotAssetService } from './infrastructure/chatbotAsset/ChatbotAsset.service';
import * as cookieParser from 'cookie-parser';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      instance: instance,
    }),
  })


  app.enableCors({
    origin: true, 
    credentials: true,  
  });


  app.use(cookieParser());

  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  const seedService = app.get(SeedService);
  const ChatbotAssetServic = app.get(ChatbotAssetService);

  // await seedService.seed();
  // //befor use version upload check this version is exist in chatbotasset
  await ChatbotAssetServic.uploadChatbotAsset('v1.0.0')


  //https://stackoverflow.com/questions/66086427/docker-container-with-nodejs-appnestjs-is-not-accessible-from-both-other-conta
  await app.listen(12000, '0.0.0.0');
}
bootstrap();
