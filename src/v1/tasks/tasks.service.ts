import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class TasksService {

  constructor(
    private readonly prismaService: PrismaService,
  ) { }

  private readonly logger = new Logger(TasksService.name);

  private async findExpiredSubscriptions() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return this.prismaService.subscription.findMany({
      where: {
        end_date: {
          lte: today,
        },
      },
      select: {
        id: true,
        user_id: true,
      },
    });
  }

  private async removeExpiredSubscriptions(expiredSubscriptions) {
    for (const subscription of expiredSubscriptions) {
      try {
        // Check if the user's activeSubscriptionId is already null
        const user = await this.prismaService.users.findUnique({
          where: {
            user_id: subscription.user_id,
          },
          select: {
            activeSubscriptionId: true,
          },
        });
  
        // Only update if activeSubscriptionId is not already null
        if (user && user.activeSubscriptionId !== null) {
          await this.prismaService.users.update({
            where: {
              user_id: subscription.user_id,
            },
            data: {
              activeSubscriptionId: null,
            },
          });
          this.logger.log(`Removed subscription ${subscription.id} from user ${subscription.user_id}`);
        } else {
          this.logger.log(`Skipped user ${subscription.user_id} because activeSubscriptionId is already null`);
        }
      } catch (error) {
        this.logger.error(`Error removing subscription ${subscription.id}:`, error);
      }
    }
  }

  @Cron('0 0 * * *')
  async subscriptionCheckCron() {
    try {
      const expiredSubscriptions = await this.findExpiredSubscriptions();
      await this.removeExpiredSubscriptions(expiredSubscriptions);
    } catch (error) {
      this.logger.error('Error handling expired subscriptions:', error);
    }
  }

  onModuleInit() {
    this.subscriptionCheckCron();
    //this.logger.debug('Called at server startup');
  }
}
