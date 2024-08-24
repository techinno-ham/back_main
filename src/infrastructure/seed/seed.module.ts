import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Module } from '../s3/s3.module';
import { SeedService } from './seed.service';



@Module({
  imports: [PrismaModule, S3Module], // Import the modules that provide the required services
  providers: [SeedService], // Only provide SeedService here
  exports: [SeedService], // Export SeedService if needed in other modules
})
export class SeedModule {}
