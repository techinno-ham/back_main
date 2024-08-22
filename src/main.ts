import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import { SeedService } from './v1/seed/seed.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
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
