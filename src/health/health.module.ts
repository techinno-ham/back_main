import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';

@Module({
  controllers: [HealthController],
  imports: [TerminusModule , HttpModule,PrismaModule]
})
export class HealthModule {}
