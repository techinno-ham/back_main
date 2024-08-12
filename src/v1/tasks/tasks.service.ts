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
        const user = await this.prismaService.users.update({
          where: {
            user_id: subscription.user_id,
          },
          data: {
            // subscriptions: {
            //   disconnect: {
            //     id: subscription.id,
            //   },
            // },
            activeSubscriptionId: null,
          },
        });
        this.logger.log(`Removed subscription ${subscription.id} from user ${user.user_id}`);
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
