import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class LiveService {
  constructor(private readonly prismaService: PrismaService) {}

  async requestLiveConversationService(
    conversationId: string,
    botId: string,
    sessionId: string
  ): Promise<void> {
    try {
      const transactionResult = await this.prismaService.$transaction([
        this.prismaService.conversations.update({
          where: {
            conversation_id: conversationId,
          },
          data: {
            isLiveRequested: true, // Updated to indicate live request
          },
        }),
        this.prismaService.live_chat_conversations.create({
          data: {
            conversation_id: conversationId,
            bot_id: botId,
            session_id: sessionId,
          },
        }),
      ]);

      console.log('Transaction successful:', transactionResult);
    } catch (error) {
      console.error('Error in requestLiveConversationService:', error);
      throw error; // Re-throwing error for further handling
    }
  }

  async receiveUserMessageService(
    conversationId: string,
    message: string
  ): Promise<void> {
    try {
      const result = await this.prismaService.live_chat_messages.create({
        data: {
          conversation_id: conversationId,
          sender: 'user',
          message,
        },
      });
      console.log('User message saved:', result);
    } catch (error) {
      console.error('Error in receiveUserMessageService:', error);
      throw error;
    }
  }

  async receiveOperatorMessageService(
    conversationId: string,
    message: string
  ): Promise<void> {
    try {
      const result = await this.prismaService.live_chat_messages.create({
        data: {
          conversation_id: conversationId,
          sender: 'operator',
          message,
        },
      });
      console.log('Operator message saved:', result);
    } catch (error) {
      console.error('Error in receiveOperatorMessageService:', error);
      throw error;
    }
  }

  async fetchLiveConversationHistoryService(
    conversationId: string
  ): Promise<any> {
    try {
      const result = await this.prismaService.live_chat_conversations.findMany({
        where: {
          conversation_id: conversationId,
        },
        include: {
          live_chat_messages: {
            orderBy: {
              sent_at: 'asc',
            },
          },
        },
      });
      console.log('Conversation history fetched:', result);
      return result;
    } catch (error) {
      console.error('Error in fetchLiveConversationHistoryService:', error);
      throw error;
    }
  }

  async fetchBotLiveConversationsService(botId: string): Promise<any> {
    try {
      const result = await this.prismaService.bots.findMany({
        where: {
          bot_id: botId,
        },
        include: {
          live_chat_conversations: {
            select: {
              conversation_id: true,
            },
          },
        },
      });
      console.log('Bot live conversations fetched:', result);
      return result;
    } catch (error) {
      console.error('Error in fetchBotLiveConversationsService:', error);
      throw error;
    }
  }
}
