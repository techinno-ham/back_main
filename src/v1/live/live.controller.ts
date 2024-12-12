import {
  Controller,
  Post,
  Body,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  CreateLiveConversationRequestDto,
  CreateLiveConversationResponseDto,
  CreateMessageRequestDto,
  CreateMessageResponseDto,
  LiveConversationsHistoryRequestDto,
  LiveConversationsHistoryResponseDto,
  BotConversationsRequestDto,
  BotConversationsResponseDto,
} from './dtos/live.dto';
import { LiveService } from './live.service';

@Controller('live')
export class LiveController {
  private readonly logger = new Logger(LiveController.name);

  constructor(private readonly liveService: LiveService) {}

  @Post('/request-chat')
  async requestLiveConversation(
    @Body() createLiveConversationRequestDto: CreateLiveConversationRequestDto,
  ): Promise<CreateLiveConversationResponseDto> {
    const { conversationId, botId, sessionId } =
      createLiveConversationRequestDto;
    try {
      await this.liveService.requestLiveConversationService(
        conversationId,
        botId,
        sessionId,
      );

      const response = new CreateLiveConversationResponseDto({
        conversationId,
        sessionId,
      });
      return response;
    } catch (error) {
      this.logger.error('Error in requestLiveConversation:', error);
      throw new HttpException(
        'Failed to request live conversation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/history')
  async fetchLiveConversationHistory(
    @Body() historyRequestDto: LiveConversationsHistoryRequestDto,
  ): Promise<LiveConversationsHistoryResponseDto> {
    const { botId, sessionId } = historyRequestDto;
    try {
      const result =
        await this.liveService.fetchLiveConversationHistoryService(sessionId);

      const response = new LiveConversationsHistoryResponseDto({
        botId,
        sessionId,
        messages: result[0]?.live_chat_messages || [],
      });
      return response;
    } catch (error) {
      this.logger.error('Error in fetchLiveConversationHistory:', error);
      throw new HttpException(
        'Failed to fetch conversation history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/message/user')
  async receiveUserMessage(
    @Body() createMessageRequestDto: CreateMessageRequestDto,
  ): Promise<CreateMessageResponseDto> {
    const { conversationId, message } = createMessageRequestDto;
    try {
      const response = await this.liveService.receiveUserMessageService(
        conversationId,
        message,
      );

      return response;
    } catch (error) {
      this.logger.error('Error in receiveUserMessage:', error);
      throw new HttpException(
        'Failed to receive user message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/message/operator')
  async receiveOperatorMessage(
    @Body() createMessageRequestDto: CreateMessageRequestDto,
  ): Promise<CreateMessageResponseDto> {
    const { conversationId, message } = createMessageRequestDto;
    try {
      const response = await this.liveService.receiveOperatorMessageService(
        conversationId,
        message,
      );

      return response;
    } catch (error) {
      this.logger.error('Error in receiveOperatorMessage:', error);
      throw new HttpException(
        'Failed to receive operator message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/conversation-ids')
  async fetchBotLiveConversations(
    @Body() botConversationsRequestDto: BotConversationsRequestDto,
  ): Promise<BotConversationsResponseDto> {
    const { botId, sessionId } = botConversationsRequestDto;
    try {
      const result =
        await this.liveService.fetchBotLiveConversationsService(botId);

      return result;
    } catch (error) {
      this.logger.error('Error in fetchBotLiveConversations:', error);
      throw new HttpException(
        'Failed to fetch live conversations for bot',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
