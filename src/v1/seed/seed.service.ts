import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';


@Injectable()
export class SeedService {

  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

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

    try {
        for (const tier of pricingTiers) {
          await this.prisma.pricing_tier.upsert({
            where: { id: tier.id },
            update: {},
            create: tier,
          });
        }
        this.logger.log('Seeding completed successfully.');
      } catch (error) {
        this.logger.error('Failed to seed pricing tiers.', error.stack);
      }
  }
}
