import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CrawlerModule } from './v1/crawler/crawler.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuthModule } from './v1/auth/auth.module';
import { MyBotsModule } from './v1/bots/bots.module';
import { ConfigModule } from '@nestjs/config';
//import { InitConsumer } from './init.consumer';
import { ConsumerService } from './infrastructure/kafka/consumer.service';
import { ChatModule } from './v1/chat/chat.module';
import { ChatService } from './v1/chat/chat.service';
//import { ChatController } from './v1/chat/chat.controller';
import { HttpModule } from '@nestjs/axios';
import { WidgetModule } from './v1/widget/widget.module';
import { TasksModule } from './v1/tasks/tasks.module';
import { ScheduleModule } from '@nestjs/schedule';
@Module({
  imports: [
    CrawlerModule,
    PrismaModule,
    AuthModule,
    MyBotsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ChatModule,
    WidgetModule,
    {
      ...HttpModule.register({
        timeout: 15000,
        maxRedirects: 5,
      }),
      global: true,
    },
    ScheduleModule.forRoot(),
    TasksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ConsumerService,
    ChatService,
    //InitConsumer
  ],
})
export class AppModule {}
