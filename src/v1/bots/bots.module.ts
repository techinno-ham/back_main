import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { MyBotsController } from './bots.controller';
import { MyBotsService } from './bots.service';
import { AuthModule } from '../auth/auth.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { hostname } from 'os';
import { S3Service } from 'src/infrastructure/s3/s3.service';
import { JwtModule } from '@nestjs/jwt';
import { S3Module } from 'src/infrastructure/s3/s3.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
    // ClientsModule.register([
    //   {
    //     name: 'KAFKA_SERVICE',
    //     transport: Transport.KAFKA,
    //     options: {
    //       client: {
    //         ssl: true,
    //         sasl: {
    //           mechanism: 'scram-sha-256',
    //           username: process.env.KAFKA_USERNAME,
    //           password: process.env.KAFKA_PASS,
    //         },
    //         clientId: hostname(),
    //         brokers: [process.env.KAFKA_BROKER],
    //       },
    //       producerOnlyMode: true,
    //       // consumer: {
    //       //   groupId: 'aqkjtrhb-foo',
    //       // },
    //     },
    //   },
    // ]),
    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              `amqp://${configService.get('RABBITMQ_USERNAME')}:${configService.get('RABBITMQ_PASSWORD')}@${configService.get('RABBITMQ_HOST')}/${configService.get('RABBITMQ_VHOST')}`,
            ],
            queue: 'ham_job_queue',
            queueOptions: {
              durable: true, // Adjust this based on your queue setup
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    S3Module
  ],
  controllers: [MyBotsController],
  providers: [MyBotsService, S3Service],
})
export class MyBotsModule { }
