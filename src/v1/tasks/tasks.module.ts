import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';

@Module({
  imports:[PrismaModule],
  providers: [TasksService],
})
export class TasksModule {}