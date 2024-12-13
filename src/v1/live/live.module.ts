import { Module } from '@nestjs/common';
import { LiveService } from './live.service';
import { LiveController } from './live.controller';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
  ],
  providers: [LiveService],
  controllers: [LiveController]
})
export class LiveModule {}
