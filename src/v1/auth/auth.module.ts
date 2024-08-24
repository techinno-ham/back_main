import { Logger, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'; 
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from 'src/infrastructure/redis/redis.module';
import { LocalStrategy } from './strategies/local-strategy';
import { GoogleStrategy } from './strategies/google-oauth.strategy';
import { S3Service } from 'src/infrastructure/s3/s3.service';
import { S3Module } from 'src/infrastructure/s3/s3.module';




@Module({
  imports: [PrismaModule,
    S3Module,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' }, 
    }),
    // RedisModule
  ],
  providers: [AuthService,LocalStrategy,GoogleStrategy,S3Service,Logger],
  controllers: [AuthController],
  exports:[AuthService]
})
export class AuthModule {}
