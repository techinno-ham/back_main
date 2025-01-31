import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
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
import { SeedService } from './infrastructure/seed/seed.service';
import { SeedModule } from './infrastructure/seed/seed.module';
import { S3Module } from './infrastructure/s3/s3.module';
import { HealthModule } from './health/health.module';
import { ChatbotAssetModule } from './infrastructure/chatbotAsset/chatbotAsset.module';
import { AppLoggerMiddleware } from './logger.middleware';
import { LiveModule } from './v1/live/live.module';
import { FormsModule } from './v1/froms/froms.module';
import { SocialModule } from './v1/social/social.module';
import { StripeModule } from './v1/stripe/stripe.module';

@Module({
  imports: [
    CrawlerModule,
    PrismaModule,
    AuthModule,
    MyBotsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ChatModule,
    WidgetModule,
    FormsModule,
    {
      ...HttpModule.register({
        timeout: 15000,
        maxRedirects: 5,
      }),
      global: true,
    },
    ScheduleModule.forRoot(),
    TasksModule,
    SeedModule,
    S3Module,
    ChatbotAssetModule,
    LiveModule,
    HealthModule,
    SocialModule,
    StripeModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ConsumerService,
    ChatService,
    SeedService,
    ChatbotAssetModule,
    Logger
    //InitConsumer
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AppLoggerMiddleware)
      .forRoutes('*');
  }
}
