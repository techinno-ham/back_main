import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Module } from '../s3/s3.module';
import { ChatbotAssetService } from './ChatbotAsset.service';



@Module({
  imports: [ S3Module], 
  providers: [ChatbotAssetService],
  exports: [ChatbotAssetService], 
})
export class ChatbotAssetModule {}
