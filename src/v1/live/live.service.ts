import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class LiveService {
  constructor(private readonly prismaService: PrismaService) {}

  async requestLiveConversationService() {
    try {
      let transactionResult = await this.prismaService.$transaction([
        this.prismaService.conversations.update({
          where: {
            conversation_id: 'abc',
          },
          //SHOULD UPDATE isLiveRequested
          data: undefined,
        }),
        this.prismaService.live_chat_conversations.create({
          data: {
            conversation_id: 'a',
            bot_id: 'b',
            session_id: 'c',
          },
        }),
      ]);
      const [] = await Promise.all([]);
    } catch (error) {
      console.log(error);
    }
  }

  async receiveUserMessageService() {
    try {
        let result = await this.prismaService.live_chat_messages.create({
            data: {
                conversation_id : "",
                sender: "user",
                message: "",

            }
        })
      } catch (error) {
        console.log(error);
      }
  }

  async receiveOperatorMessageService() {
    try {
        let result = await this.prismaService.live_chat_messages.create({
            data: {
                conversation_id : "",
                sender: "operator",
                message: "",

            }
        })
      } catch (error) {
        console.log(error);
      }
  }

  async fetchLiveConversationHistoryService() {
    try {
      let result = await this.prismaService.live_chat_conversations.findMany({
        where: {
          conversation_id: 'a',
          bot_id: 'b',
          session_id: 'c',
        },
        include: {
          live_chat_messages: {
            orderBy: {
              sent_at: 'asc',
            },
          },
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async fetchUserMessageService() {}

  async fetchOperatorMessageService() {}

  async fetchBotLiveConversationsService() {
    try {
      let result = await this.prismaService.bots.findMany({
        where: {
          bot_id: 'a',
        },
        include: {
          live_chat_conversations: {
            where: {
              conversation_id: 'b',
            },
            select: {
              conversation_id: true,
            },
          },
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
}
