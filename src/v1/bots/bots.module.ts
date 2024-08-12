import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { MyBotsController } from './bots.controller';
import { MyBotsService } from './bots.service';
import { AuthModule } from '../auth/auth.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { hostname } from 'os';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            ssl: true,
            sasl: {
              mechanism: 'scram-sha-512',
              username: 'aqkjtrhb',
              password: 'JSY-cpUfbH6qH5pt2DxbFriMo-tTgygV',
            },
            clientId: hostname(),
            brokers: ['dory.srvs.cloudkafka.com:9094'],
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
  providers: [MyBotsService],
})
export class MyBotsModule {}
