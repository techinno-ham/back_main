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
import { ChatSessionId } from '../decorators/chatSession.decorator';

@Controller({
  path: 'live',
  version: '1',
})
export class LiveController {
  private readonly logger = new Logger(LiveController.name);

  constructor(private readonly liveService: LiveService) {}

  @Post('/request-chat')
  async requestLiveConversation(
    @Body() createLiveConversationRequestDto: CreateLiveConversationRequestDto,
    @ChatSessionId() sessionId: string,
  ): Promise<CreateLiveConversationResponseDto> {
    const { conversationId, botId } = createLiveConversationRequestDto;
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
    const { botId, conversationId } = historyRequestDto;
    try {
      const response =
        await this.liveService.fetchLiveConversationHistoryService(
          conversationId,
        );

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

  @Post('/conversation-ids/widget')
  async fetchBotLiveConversationsForWidget(
    @Body() botConversationsRequestDto: BotConversationsRequestDto,
    @ChatSessionId() sessionId: string,
  ): Promise<BotConversationsResponseDto> {
    if (!sessionId)
      throw new HttpException(
        'No conversation data for this session',
        HttpStatus.NOT_FOUND,
      );
    const { botId } = botConversationsRequestDto;
    try {
      const result = await this.liveService.fetchBotLiveConversationsService(
        botId,
        sessionId,
      );

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
