import { Logger, Module, OnModuleInit } from '@nestjs/common';
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
              mechanism: 'scram-sha-256',
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
export class MyBotsModule implements OnModuleInit {
  private readonly logger = new Logger(MyBotsModule.name);

  onModuleInit() {
    this.logger.log(`JWT_SECRET: ${process.env.JWT_SECRET}`);
    this.logger.log(`KAFKA_USERNAME: ${process.env.KAFKA_USERNAME}`);
    this.logger.log(`KAFKA_PASS: ${process.env.KAFKA_PASS}`);
    this.logger.log(`KAFKA_BROKER: ${process.env.KAFKA_BROKER}`);
  }
}
