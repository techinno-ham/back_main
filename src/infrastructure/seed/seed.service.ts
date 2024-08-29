import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { join } from 'path';
import { readFileSync } from 'fs';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async seed() {
    const pricingTiers = [
      {
        id: 0,
        tier_name: 'free',
        price: 100000,
        bot_count: 2,
        context_limit: 8192,
        token_limit: 1600000,
        storage_limit: 1000,
      },
      {
        id: 1,
        tier_name: 'pro',
        price: 200000,
        bot_count: 5,
        context_limit: 16385,
        token_limit: 16000000,
        storage_limit: 1000,
      },
      {
        id: 2,
        tier_name: 'enterprise',
        price: 300000,
        bot_count: 10,
        context_limit: 16385,
        token_limit: 32000000,
        storage_limit: 1000,
      },
      {
        id: 3,
        tier_name: 'custom_a',
        price: 111,
        bot_count: 22,
        context_limit: 333,
        token_limit: 444,
        storage_limit: 555,
      },
    ];

    const bucketNames = [
      'bot-resources',
      'data-sources',
      'user-resources',
      'widget',
      'hamyar-resources'
    ];
    const defaultProfileImagePath = join(process.cwd(), 'assets', 'profile.svg');
    const botImagePath = join(process.cwd(), 'assets', 'bot.svg');

    const profileImageBuffer = readFileSync(defaultProfileImagePath);
    const botImageBuffer = readFileSync(botImagePath);

    try {
      // Create a promise for ensuring all buckets are created
      const bucketCreationPromise = Promise.all(
        bucketNames.map(bucketName => this.s3Service.ensureBucketExists(bucketName))
      );

            // Ensure default profile image exists
            const profileImageBucketName = 'user-resources'; // Adjust bucket name if different
            const profileImageExists = await this.s3Service.fileExists(profileImageBucketName, 'defaultProfile/profile.svg');
            console.log(profileImageExists)
            if (!profileImageExists) {
              await this.s3Service.uploadFile(profileImageBucketName, '', 'defaultProfile/profile.svg', profileImageBuffer);
              this.logger.log('Uploaded default profile image.');
            } else {
              this.logger.log('Default profile image already exists.');
            }

                  // Ensure default bot image exists
      const botImageBucketName = 'bot-resources'; // Adjust bucket name if different
      const botImageExists = await this.s3Service.fileExists(botImageBucketName, 'defaultImage/bot.svg');
      if (!botImageExists) {
        await this.s3Service.uploadFile(botImageBucketName, '', 'defaultImage/bot.svg', botImageBuffer);
        this.logger.log('Uploaded default bot image.');
      } else {
        this.logger.log('Default bot image already exists.');
      }
      

      // Create a promise for seeding all pricing tiers
      const pricingTierSeedingPromise = Promise.all(
        pricingTiers.map(tier => 
          this.prisma.pricing_tier.upsert({
            where: { id: tier.id },
            update: {},
            create: tier,
          })
        )
      );

      // Wait for both promises to resolve
      await Promise.all([bucketCreationPromise, pricingTierSeedingPromise]);

      this.logger.log('Seeding completed successfully.');
    } catch (error) {
      this.logger.error('Failed to seed pricing tiers and buckets.', error.stack);
    }
  }
}
