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
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // logger: WinstonModule.createLogger({
    //   instance: instance,
    // }),
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

  //NOTE: These seeding logics must be optimised
  // await seedService.seed();
  // //befor use version upload check this version is exist in chatbotasset
  //await ChatbotAssetServic.uploadChatbotAsset('v1.0.0')


  //https://stackoverflow.com/questions/66086427/docker-container-with-nodejs-appnestjs-is-not-accessible-from-both-other-conta
  
  const configService = app.get(ConfigService);
  const rabbitmqHost = configService.get('RABBITMQ_HOST');
  const rabbitmqQueue = configService.get('RABBITMQ_QUEUE');
  const rabbitmqUsername = configService.get('RABBITMQ_USERNAME');
  const rabbitmqPassword = configService.get('RABBITMQ_PASSWORD');
  const rabbitmqVhost = configService.get('RABBITMQ_VHOST');

  // app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.RMQ,
  //   options: {
  //     urls: [
  //       `amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}/${rabbitmqVhost}`,
  //     ], // Constructing the full connection URL dynamically
  //     queue: "ham_job_queue",
  //     queueOptions: {
  //       durable: true, // Adjust to your needs
  //     },
  //   },
  // });

  // await app.startAllMicroservices();
  
  await app.listen(12000, '0.0.0.0');
}
bootstrap();
