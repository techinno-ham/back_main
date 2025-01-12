import { Module } from '@nestjs/common';
//import { SocialService } from './social.service';
import { SocialController } from './social.controller';

@Module({
  providers: [],
  controllers: [SocialController]
})
export class SocialModule {}
