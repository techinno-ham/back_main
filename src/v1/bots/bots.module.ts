import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { MyBotsController } from './bots.controller';
import { MyBotsService } from './bots.service';
import { AuthModule } from '../auth/auth.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { hostname } from 'os';
import { S3Service } from 'src/infrastructure/s3/s3.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' }, 
    }),
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            ssl: true,
            sasl: {
              mechanism: process.env.KAFKA_SASL_MECH as any,
              username: process.env.KAFKA_USERNAME,
              password: process.env.KAFKA_PASS,
            },
            clientId: hostname(),
            brokers: [process.env.KAFKA_BROKER],
          },
          producerOnlyMode: true,
          // consumer: {
          //   groupId: 'aqkjtrhb-foo',
          // },
        },
      },
    ]),
  ],
  controllers: [MyBotsController],
  providers: [MyBotsService,S3Service],
})
export class MyBotsModule {}
