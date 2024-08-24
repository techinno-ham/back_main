import { Module } from '@nestjs/common';
import { S3Service } from './s3.service'; // Adjust the path as necessary

@Module({
  providers: [S3Service],
  exports: [S3Service], // Export S3Service to make it available in other modules
})
export class S3Module {}
