import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import { SeedService } from './v1/seed/seed.service';
import { WinstonModule } from 'nest-winston';
import { instance } from './infrastructure/logger/winston.logger';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: WinstonModule.createLogger({
      instance: instance,
    }),
  });
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  const seedService = app.get(SeedService);

  await seedService.seed();

  await app.listen(12000);
}
bootstrap();
