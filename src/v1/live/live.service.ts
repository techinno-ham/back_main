import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateLiveConversationResponseDto,
  CreateMessageResponseDto,
  LiveConversationsHistoryResponseDto,
  BotConversationsResponseDto,
} from './dtos/live.dto'; // Import your DTOs

@Injectable()
export class LiveService {
  constructor(private readonly prismaService: PrismaService) {}

  // Method for requesting a live conversation
  async requestLiveConversationService(
    conversationId: string,
    botId: string,
    sessionId: string,
  ): Promise<CreateLiveConversationResponseDto> {
    console.log({ conversationId, botId, sessionId });

    try {
      const transactionResult = await this.prismaService.$transaction([
        this.prismaService.conversations.update({
          where: {
            conversation_id: conversationId,
          },
          data: {
            isLiveRequested: true,
          },
        }),
        this.prismaService.live_chat_conversations.create({
          data: {
            conversation_id: conversationId,
            session_id: sessionId,
            bot: {
              connect: {
                bot_id: botId,
              },
            },
          },
        }),
      ]);

      // Parsing the result to the response DTO
      const responseDto = new CreateLiveConversationResponseDto({
        conversationId,
        sessionId,
      });

      return responseDto; // Returning the DTO
    } catch (error) {
      console.error('Error in requestLiveConversationService:', error);
      throw new Error('Error requesting live conversation');
    }
  }

  // Method for receiving a user message
  async receiveUserMessageService(
    conversationId: string,
    message: string,
  ): Promise<CreateMessageResponseDto> {
    try {
      const result = await this.prismaService.live_chat_messages.create({
        data: {
          // conversation_id: conversationId,
          sender: 'user',
          message,
          live_chat_conversations: {
            connect: {
              conversation_id: conversationId,
            },
          },
        },
      });

      // Parsing the result to the response DTO
      const responseDto = new CreateMessageResponseDto({
        messageId: result.message_id, // Assuming message_id is returned
        sentAt: new Date().toISOString(),
      });

      return responseDto; // Returning the DTO
    } catch (error) {
      console.error('Error in receiveUserMessageService:', error);
      throw new Error('Error receiving user message');
    }
  }

  // Method for receiving an operator message
  async receiveOperatorMessageService(
    conversationId: string,
    message: string,
  ): Promise<CreateMessageResponseDto> {
    try {
      const result = await this.prismaService.live_chat_messages.create({
        data: {
          sender: 'operator',
          message,
          live_chat_conversations: {
            connect: {
              conversation_id: conversationId,
            },
          },
        },
      });

      // Parsing the result to the response DTO
      const responseDto = new CreateMessageResponseDto({
        messageId: result.message_id, // Assuming message_id is returned
        sentAt: new Date().toISOString(),
      });

      return responseDto; // Returning the DTO
    } catch (error) {
      console.error('Error in receiveOperatorMessageService:', error);
      throw new Error('Error receiving operator message');
    }
  }

  // Method for fetching the conversation history
  async fetchLiveConversationHistoryService(
    conversationId: string,
  ): Promise<LiveConversationsHistoryResponseDto> {
    try {
      const conversation =
        await this.prismaService.live_chat_conversations.findUnique({
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

      if (!conversation) {
        throw new Error(`Conversation with ID ${conversationId} not found.`);
      }

      const messages =
        //NOTE: this code convert message to widget message schema
        conversation.live_chat_messages?.map((message) => ({
          id: message.message_id,
          sender: message.sender,
          body: message.message,
          time: message.sent_at.toISOString(),
        })) || [];

      const responseDto = new LiveConversationsHistoryResponseDto({
        botId: conversation.bot_id,
        conversationId: conversation.conversation_id,
        messages,
      });

      return responseDto;
    } catch (error) {
      console.error('Error fetching live conversation history:', error);
      throw new Error('Failed to fetch live conversation history');
    }
  }

  // Method for fetching bot live conversations
  async fetchBotLiveConversationsService(
    botId: string,
    sessionId?: string,
  ): Promise<BotConversationsResponseDto> {
    try {
      const result = await this.prismaService.conversations.findMany({
        where: {
          bot_id: botId,
          ...(sessionId && {session_id : sessionId}),
          isLiveRequested: true,
        },
        select: {
          conversation_id: true,
        },
      });

      const responseDto = new BotConversationsResponseDto({
        botId,
        liveConversations: result.map((bot) => ({
          conversationId: bot.conversation_id,
        })),
      });

      return responseDto; // Returning the DTO
    } catch (error) {
      console.error('Error in fetchBotLiveConversationsService:', error);
      throw new Error('Error fetching bot live conversations');
    }
  }
}
