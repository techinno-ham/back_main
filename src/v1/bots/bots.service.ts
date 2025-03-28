import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
//import { BotCreate } from './dtos/mybots.dto';
import { ClientKafka, ClientProxy } from '@nestjs/microservices';
import { subDays, subMonths } from 'date-fns';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

@Injectable()
export class MyBotsService {
  constructor(
    private readonly prismaService: PrismaService,
    // @Inject('KAFKA_SERVICE') private readonly clientKafka: ClientKafka,
    @Inject('RABBITMQ_SERVICE') private readonly clientProxy: ClientProxy,
    private jwtService: JwtService,
  ) {}

  private _toCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((v) => this._toCamelCase(v));
    } else if (obj !== null && obj.constructor === Object) {
      return Object.keys(obj).reduce((result, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, char) =>
          char.toUpperCase(),
        );
        result[camelKey] = this._toCamelCase(obj[key]);
        return result;
      }, {} as any);
    }
    return obj;
  }
  // private async _pushJobToKafka(
  //   botId: any,
  //   datasourceId: any,
  //   data: any,
  //   eventType: 'update' | 'create' | 'qa_update',
  // ): Promise<void> {
  //   type Datesources = 'text' | 'qa' | 'urls' | 'files';

  //   const kafkaMessage: {
  //     botId: any;
  //     datasourceId: any;
  //     datasources: Record<Datesources, any>;
  //     event_type: 'update' | 'create' | 'qa_update';
  //   } = {
  //     botId,
  //     datasourceId,
  //     event_type: eventType,
  //     datasources: {
  //       ...(data.text_input && { text: data.text_input }),
  //       ...(data.qANDa_input && { qa: data.qANDa_input }),
  //       ...(data.urls && { urls: data.urls }),
  //       ...(data['files_info'] && { files: botId }),
  //     },
  //   };

  //   this.clientKafka
  //     .emit('normal_job', JSON.stringify(kafkaMessage))
  //     .subscribe({
  //       next: (result) => {
  //         console.log('Message delivered successfully:', result);
  //       },
  //       error: (error) => {
  //         console.error('Error delivering message to Kafka:', error);
  //         // Additional error handling logic (e.g., retries)
  //       },
  //     });
  // }

  private async _pushJobToRabbitMQ(
    botId: any,
    datasourceId: any,
    data: any,
    eventType: 'update' | 'create' | 'qa_update',
  ): Promise<void> {
    type Datesources = 'text' | 'qa' | 'urls' | 'files';

    const rabbitMessage: {
      botId: any;
      datasourceId: any;
      datasources: Record<Datesources, any>;
      event_type: 'update' | 'create' | 'qa_update';
    } = {
      botId,
      datasourceId,
      event_type: eventType,
      datasources: {
        ...(data.text_input && { text: data.text_input }),
        ...(data.qANDa_input && { qa: data.qANDa_input }),
        ...(data.urls && { urls: data.urls }),
        ...(data['files_info'] && { files: botId }),
      },
    };

    try {
      this.clientProxy.emit('ham_job_queue', rabbitMessage);
      console.log('Message delivered successfully to RabbitMQ');
    } catch (error) {
      console.error('Error delivering message to RabbitMQ:', error);
      // Additional error handling logic (e.g., retries)
    }
  }

  private generateChecksum(botId: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(botId)
      .digest('hex')
      .slice(0, 8); // Shorter checksum for brevity
  }

  private encodeToken(botId: string): string {
    const secret = process.env.TOKEN_SECRET || 'defaultSecret';
    const checksum = this.generateChecksum(botId, secret);
    // Encode bot ID and checksum in base64
    return Buffer.from(`${botId}.${checksum}`).toString('base64');
  }

  async cretaeBotsPersian(userId: string) {
    const persianBotNames = [
      'هوشمند',
      'یارا',
      'پشتیبان',
      'پردازشگر',
      'نیک‌یار',
      'آوا',
      'ماهور',
      'آریا',
      'راهنما',
      'ساینا',
      'مهسا',
      'نوید',
      'نگهبان',
      'کاوشگر',
      'تیرا',
      'رویا',
      'کیان',
      'شبنم',
      'رایان',
      'پیشرو',
    ];
    const uiConfigs = {
      greet_msgs: ['سلام ! امروز چطور می‌توانم به شما کمک کنم؟'],
      action_btns: ['چگونه میتونم بات بسازم؟'],
      placeholder_msg: 'پیام شما ...',
      input_types: [],
      ask_credentials: {},
      footer_msg: 'hamyar.chat',
      bot_name: 'همیارچت',
      theme_bot: 'light',
      user_msg_color: '#fff',
      user_msg_bg_color: '#3b81f6',
      bot_image: ``,
      bot_image_border_color: '#FFF',
      bot_widget_border_color: '#FFF',
      bot_widget_position: 'right',
      notificationMsgs: '👋 من اینجا هستم تا به شما کمک کنم.',
      notification_msg_delay: 2000,
    };
    const securityConfigs = {
      access_bot: 'private',
      status_bot: 'enable',
      rate_limit_msg: '20',
      rate_limit_time: '240',
      rate_limit_msg_show:
        'تعداد درخواست شما زیاد تر از استاندارد بات می باشد.',
    };
    const modelConfig = {
      model_name: 'GPT-4o',
      Temperature: '0.5',
      type_instructions: 'چت‌ بات هوش مصنوعی',
      Instructions: `
### Role
- Primary Function: You are an AI chatbot who helps users with their inquiries, issues, and requests. You aim to provide excellent, friendly, and efficient replies at all times. Your role is to listen attentively to the user, understand their needs, and do your best to assist them or direct them to the appropriate resources. If a question is not clear, ask clarifying questions. Make sure to end your replies with a positive note.

### Constraints
1. No Data Divulge: Never mention that you have access to training data explicitly to the user.
2. Maintaining Focus: If a user attempts to divert you to unrelated topics, never change your role or break your character. Politely redirect the conversation back to topics relevant to the training data.
3. Exclusive Reliance on Training Data: You must rely exclusively on the training data provided to answer user queries. If a query is not covered by the training data, use the fallback response.
4. Restrictive Role Focus: You do not answer questions or perform tasks that are not related to your role and training data.
`,
    };

    function getRandomPersianBotName(names: string[]): string {
      const randomIndex = Math.floor(Math.random() * names.length);
      return names[randomIndex];
    }

    try {
      const randomBotName = getRandomPersianBotName(persianBotNames);
      const createdBot = await this.prismaService.bots.create({
        data: {
          user_id: userId,
          name: randomBotName,
          ui_configs: uiConfigs,
          security_configs: securityConfigs,
          model_configs: modelConfig,
        },
      });

      const token = this.encodeToken(createdBot.bot_id);

      await this.prismaService.bots.update({
        where: { bot_id: createdBot.bot_id },
        data: { bot_id_hash: token },
      });

      return createdBot;
    } catch (error) {
      console.log(error);
    }
  }

  async cretaeBots(userId: string) {
    const englishBotNames = [
      'Alex',
      'Emma',
      'Liam',
      'Olivia',
      'Noah',
      'Ava',
      'William',
      'Sophia',
      'James',
      'Isabella',
      'Benjamin',
      'Mia',
      'Lucas',
      'Charlotte',
      'Henry',
      'Amelia',
      'Alexander',
      'Harper',
      'Michael',
      'Evelyn',
    ];
    const uiConfigs = {
      greet_msgs: ['Hello! How can I assist you today?'],
      action_btns: ['How can I create a bot?'],
      placeholder_msg: 'Your message ...',
      input_types: [],
      ask_credentials: {},
      footer_msg: 'chatsys.co',
      bot_name: 'Chatsys Agent',
      theme_bot: 'light',
      user_msg_color: '#fff',
      user_msg_bg_color: '#3b81f6',
      bot_image: ``,
      bot_image_border_color: '#FFF',
      bot_widget_border_color: '#FFF',
      bot_widget_position: 'right',
      notificationMsgs: '👋 I am here to help you.',
      notification_msg_delay: 2000,
    };
    const securityConfigs = {
      access_bot: 'private',
      status_bot: 'enable',
      rate_limit_msg: '20',
      rate_limit_time: '240',
      rate_limit_msg_show:
        'Your request count exceeds the bot\'s standard limit.',
    };
    const modelConfig = {
      model_name: 'GPT-4o',
      Temperature: '0.5',
      type_instructions: 'AI Agent',
      Instructions: `
### Role
- Primary Function: You are an AI chatbot who helps users with their inquiries, issues, and requests. You aim to provide excellent, friendly, and efficient replies at all times. Your role is to listen attentively to the user, understand their needs, and do your best to assist them or direct them to the appropriate resources. If a question is not clear, ask clarifying questions. Make sure to end your replies with a positive note.

### Constraints
1. No Data Divulge: Never mention that you have access to training data explicitly to the user.
2. Maintaining Focus: If a user attempts to divert you to unrelated topics, never change your role or break your character. Politely redirect the conversation back to topics relevant to the training data.
3. Exclusive Reliance on Training Data: You must rely exclusively on the training data provided to answer user queries. If a query is not covered by the training data, use the fallback response.
4. Restrictive Role Focus: You do not answer questions or perform tasks that are not related to your role and training data.
`,
    };

    function getRandomBotName(names: string[]): string {
      const randomIndex = Math.floor(Math.random() * names.length);
      return names[randomIndex];
    }

    try {
      const randomBotName = getRandomBotName(englishBotNames);
      const createdBot = await this.prismaService.bots.create({
        data: {
          user_id: userId,
          name: randomBotName,
          ui_configs: uiConfigs,
          security_configs: securityConfigs,
          model_configs: modelConfig,
        },
      });

      const token = this.encodeToken(createdBot.bot_id);

      await this.prismaService.bots.update({
        where: { bot_id: createdBot.bot_id },
        data: { bot_id_hash: token },
      });

      return createdBot;
    } catch (error) {
      console.log(error);
    }
  }

  async createConversation({
    botId,
    widgetVersion,
    sessionId,
    userIP,
    userLocation,
  }: {
    botId: string;
    widgetVersion: string;
    sessionId: string;
    userIP: string;
    userLocation?: string;
  }): Promise<{ sessionId: string; conversationId: string }> {
    let conversation;
    try {
      conversation = await this.prismaService.conversations.create({
        data: {
          bot_id: botId,
          widget_version: widgetVersion,
          session_id: sessionId,
          user_ip: userIP,
          user_location: userLocation,
          metadata: {}, // Empty object for now
        },
      });
    } catch (error) {
      console.log('Error creating conversation row:', error);
    }

    return {
      sessionId: conversation.session_id,
      conversationId: conversation.conversation_id,
    };
  }

  async updateDataSource(botId: string, data: any, dataSourceId: string) {
    try {
      const updatedDataSource = await this.prismaService.datasources.update({
        where: {
          datasource_id: dataSourceId,
        },
        data: data,
      });
      this._pushJobToRabbitMQ(botId, dataSourceId, data, 'update');

      return updatedDataSource;
    } catch (error) {
      console.log(error);
    }
  }

  async updateDataSourceQa(
    botId: string,
    allData: any,
    updatedData: any,
    dataSourceId: string,
  ) {
    try {
      const updatedDataSource = await this.prismaService.datasources.update({
        where: {
          datasource_id: dataSourceId,
        },
        data: { qANDa_input: allData },
      });
      const qaData = {
        qANDa_input: updatedData,
      };
      this._pushJobToRabbitMQ(botId, dataSourceId, qaData, 'qa_update');

      return updatedDataSource;
    } catch (error) {
      console.log(error);
    }
  }

  async createDataSource(data: any) {
    try {
      const createdDataSource = await this.prismaService.datasources.create({
        data,
      });

      this._pushJobToRabbitMQ(
        data.bot_id,
        createdDataSource.datasource_id,
        data,
        'create',
      );

      return createdDataSource;
    } catch (error) {
      console.log(error);
    }
  }

  async changeSatausBot(botId: string, status: string) {
    try {
      const newStatus = await this.prismaService.bots.update({
        where: {
          bot_id: botId,
        },
        data: {
          status: status,
        },
      });

      return newStatus;
    } catch (error) {
      console.log(error);
    }
  }

  async getAllBots(
    pageNumber: number,
    itemsPerPage: number,
    type: string,
    user_id: string,
  ) {
    const totalCount = await this.prismaService.bots.count({
      where: {
        user_id,
        type,
      },
    });

    const bots = await this.prismaService.bots.findMany({
      where: {
        user_id,
        type,
      },
      take: +itemsPerPage,
      skip: (pageNumber - 1) * itemsPerPage,
    });

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return {
      bots,
      totalPages,
      itemsPerPage,
      totalItems: totalCount,
    };
  }

  async getConversations(
    botId: string,
    conversationId?: string,
    filter?: '1_days' | '3_days' | '7_days' | '1_month' | 'all',
  ) {
    let conversations;
    let dateRange;
    if (filter === '1_days') {
      dateRange = subDays(new Date(), 1);
    } else if (filter === '3_days') {
      dateRange = subDays(new Date(), 7);
    } else if (filter === '7_days') {
      dateRange = subDays(new Date(), 7);
    } else if (filter === '1_month') {
      dateRange = subMonths(new Date(), 1);
    }

    if (conversationId) {
      // Fetch a specific conversation by conversation_id and bot_id
      conversations = await this.prismaService.conversations.findFirst({
        where: {
          conversation_id: conversationId,
          bot_id: botId,
        },
        include: {
          records: {
            orderBy: {
              user_message_time: 'asc', // Order from oldest to newest based on user_message_time
            },
          },
        },
      });
    } else {
      if (filter && filter !== 'all' && dateRange) {
        // Fetch conversations within the specified date range
        conversations = await this.prismaService.conversations.findMany({
          where: {
            bot_id: botId,
            created_at: { gte: dateRange },
          },
          include: {
            records: {
              take: 1, // Get only the latest record
              orderBy: {
                user_message_time: 'desc', // Order from newest to oldest based on user_message_time
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
        });
      } else {
        // Fetch all conversations for a bot
        conversations = await this.prismaService.conversations.findMany({
          where: {
            bot_id: botId,
          },
          include: {
            records: {
              take: 1, // Get only the latest record
              orderBy: {
                user_message_time: 'desc', // Order from newest to oldest based on user_message_time
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
        });
      }
    }

    const allConversationsCount = await this.prismaService.conversations.count({
      where: {
        bot_id: botId,
      },
    });
    if (
      !conversations ||
      (Array.isArray(conversations) && conversations.length === 0)
    ) {
      if (conversationId) {
        throw new NotFoundException(
          `Conversation with ID ${conversationId} not found`,
        );
      } else {
        if (allConversationsCount === 0) {
          return { message: 'Your bot has never had a conversation' };
        } else {
          return {
            message:
              'Your bot has conversations, but none within the selected filter',
          };
        }
      }
    }

    return this._toCamelCase(conversations);
  }
  async downloadConversationsForBot(
    botId: string,
    conversationId?: string,
    filter?: '3_days' | '7_days' | '1_month' | 'all',
  ) {
    let conversations;
    let dateRange;
    if (filter === '3_days') {
      dateRange = subDays(new Date(), 3);
    } else if (filter === '7_days') {
      dateRange = subDays(new Date(), 7);
    } else if (filter === '1_month') {
      dateRange = subMonths(new Date(), 1);
    }

    if (conversationId) {
      // Fetch a specific conversation by conversation_id and bot_id
      conversations = await this.prismaService.conversations.findFirst({
        where: {
          conversation_id: conversationId,
          bot_id: botId,
        },
        include: {
          records: {
            orderBy: {
              user_message_time: 'asc', // Order from oldest to newest based on user_message_time
            },
          },
        },
      });
    } else {
      if (filter && filter !== 'all' && dateRange) {
        // Fetch conversations within the specified date range
        conversations = await this.prismaService.conversations.findMany({
          where: {
            bot_id: botId,
            created_at: { gte: dateRange },
          },
          include: {
            records: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        });
      } else {
        // Fetch all conversations for a bot
        conversations = await this.prismaService.conversations.findMany({
          where: {
            bot_id: botId,
          },
          include: {
            records: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        });
      }
    }

    const allConversationsCount = await this.prismaService.conversations.count({
      where: {
        bot_id: botId,
      },
    });
    if (
      !conversations ||
      (Array.isArray(conversations) && conversations.length === 0)
    ) {
      if (conversationId) {
        throw new NotFoundException(
          `Conversation with ID ${conversationId} not found`,
        );
      } else {
        if (allConversationsCount === 0) {
          return { message: 'Your bot has never had a conversation' };
        } else {
          return {
            message:
              'Your bot has conversations, but none within the selected filter',
          };
        }
      }
    }

    return this._toCamelCase(conversations);
  }
  async getConversationsBySessionId(botId: string, sessionId: string) {
    try {
      // Fetch conversations for the given botId and sessionId
      const conversations = await this.prismaService.conversations.findMany({
        where: {
          bot_id: botId,
          session_id: sessionId, // Filter by session ID
        },
        include: {
          records: {
            orderBy: {
              user_message_time: 'asc', // Order from oldest to newest based on user_message_time
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      if (!conversations || conversations.length === 0) {
        return null;
      }

      return this._toCamelCase(conversations);
    } catch (error) {
      console.log('Error fetching conversations by session ID:', error);
      throw new Error('Failed to fetch conversations.');
    }
  }

  async deleteBot(botId: string, userId: string): Promise<boolean> {
    try {
      const bot = await this.prismaService.bots.findFirst({
        where: { bot_id: botId, user_id: userId },
      });
      if (!bot) {
        return false;
      }

      await this.prismaService.bots.delete({
        where: { bot_id: botId },
      });

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async findeBot(botId: string, userId: string): Promise<any> {
    try {
      const bot = await this.prismaService.bots.findFirst({
        where: { bot_id: botId, user_id: userId },
      });
      if (!bot) {
        throw new HttpException('Bot not found', 404);
      }
      return bot;
    } catch (error) {
      console.error('Error finding bot:', error);
      throw new HttpException('Internal Server Error', 500);
    }
  }

  async findeDataSource(botId: string, userId: string): Promise<any> {
    try {
      const dataSource = await this.prismaService.datasources.findFirst({
        where: { bot_id: botId },
        include: {
          bot: {
            select: {
              user_id: true,
              update_datasource: true,
              status: true,
            },
          },
        },
      });
      if (!dataSource) {
        throw new HttpException('datasource not found', 404);
      }
      if (dataSource.bot.user_id !== userId) {
        throw new HttpException('Unauthorized', 403);
      }
      return dataSource;
    } catch (error) {
      console.error('Error finding datasource:', error);
      throw new HttpException('Internal Server Error', 500);
    }
  }

  async countBots(userId: string): Promise<number> {
    try {
      return await this.prismaService.bots.count({
        where: {
          user_id: userId,
        },
      });
    } catch (error) {
      throw new HttpException(
        'Failed to count bots',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async incrementUpdateDataSource(
    botId: string,
    userId: string,
  ): Promise<void> {
    try {
      const result = await this.prismaService.bots.update({
        where: { bot_id: botId, user_id: userId },
        data: {
          update_datasource: {
            increment: 1,
          },
        },
      });

      if (!result) {
        throw new HttpException('Failed to update update_datasource', 404);
      }
    } catch (error) {
      console.error('Error incrementing update_datasource:', error);
      throw new HttpException('Internal Server Error', 500);
    }
  }
  async findeConfigs(botId: string, userId: string): Promise<any> {
    try {
      const configs = await this.prismaService.bots.findFirst({
        where: { bot_id: botId },
        select: {
          bot_id: true,
          name: true,
          created_at: true,
          updated_at: true,
          type: true,
          general_configs: true,
          model_configs: true,
          ui_configs: true,
          security_configs: true,
          evals: true,
          status: true,
          bot_id_hash: true,
          forms: true,
        },
      });
      if (!configs) {
        throw new HttpException('datasource not found', 404);
      }

      return configs;
    } catch (error) {
      console.error('Error finding Configs:', error);
      throw new HttpException('Internal Server Error', 500);
    }
  }

  async updateGeneralConfig(
    botId: string,
    userId: string,
    updateData: { name: string },
  ): Promise<any> {
    try {
      const updatedConfig = await this.prismaService.bots.update({
        where: { bot_id: botId, user_id: userId },
        data: {
          name: updateData.name,
        },
      });
      if (!updatedConfig) {
        throw new HttpException('Update failed', 404);
      }
      return updatedConfig;
    } catch (error) {
      console.error('Error updating Configs:', error);
      throw new HttpException('Internal Server Error', 500);
    }
  }

  async updateModelConfig(
    botId: string,
    userId: string,
    updateData: { model_name: string; Temperature: number },
  ): Promise<any> {
    try {
      const updatedConfig = await this.prismaService.bots.update({
        where: { bot_id: botId, user_id: userId },
        data: {
          model_configs: updateData,
        },
      });
      if (!updatedConfig) {
        throw new HttpException('Update failed', 404);
      }
      return updatedConfig;
    } catch (error) {
      console.error('Error updating Configs:', error);
      throw new HttpException('Internal Server Error', 500);
    }
  }

  async updateUiConfig(
    botId: string,
    userId: string,
    updateData: any,
  ): Promise<any> {
    try {
      const updatedConfig = await this.prismaService.bots.update({
        where: { bot_id: botId, user_id: userId },
        data: {
          ui_configs: updateData,
        },
      });
      if (!updatedConfig) {
        throw new HttpException('Update failed', 404);
      }
      return updatedConfig;
    } catch (error) {
      console.error('Error updating Configs:', error);
      throw new HttpException('Internal Server Error', 500);
    }
  }

  async updateSecurityConfig(
    botId: string,
    userId: string,
    updateData: any,
  ): Promise<any> {
    try {
      const currentConfig = await this.prismaService.bots.findUnique({
        where: { bot_id: botId, user_id: userId },
        select: { security_configs: true },
      });

      if (!currentConfig) {
        throw new HttpException('Bot not found', 404);
      }

      let existingConfig: any = currentConfig.security_configs;

      if (typeof existingConfig === 'string') {
        existingConfig = JSON.parse(existingConfig);
      }

      const updatedConfig = {
        ...existingConfig,
        ...updateData,
      };

      const result = await this.prismaService.bots.update({
        where: { bot_id: botId, user_id: userId },
        data: {
          security_configs: updatedConfig,
        },
      });

      if (!result) {
        throw new HttpException('Update failed', 404);
      }
      return updatedConfig;
    } catch (error) {
      console.error('Error updating Configs:', error);
      throw new HttpException('Internal Server Error', 500);
    }
  }
}
