import { IsString, IsUUID, IsOptional } from 'class-validator';
//import { Transform } from 'class-transformer';

export class CreateLiveConversationRequestDto {
  @IsUUID()
  conversationId: string;

  @IsString()
  botId: string;

  @IsUUID()
  sessionId: string;
}

export class CreateLiveConversationResponseDto {
  @IsUUID()
  conversationId: string;

  @IsUUID()
  sessionId: string;

  constructor(partial: Partial<CreateLiveConversationResponseDto>) {
    Object.assign(this, partial);
  }
}

export class CreateMessageRequestDto {
  @IsUUID()
  conversationId: string;

  @IsString()
  sender: 'user' | 'operator';

  @IsString()
  message: string;
}

export class CreateMessageResponseDto {
  @IsUUID()
  messageId: string;

  sentAt: string;

  constructor(partial: Partial<CreateMessageResponseDto>) {
    Object.assign(this, partial);
  }
}

export class LiveConversationsHistoryRequestDto {
  @IsString()
  botId: string;

  @IsUUID()
  sessionId: string;
}

export class LiveConversationsHistoryResponseDto {
  @IsString()
  botId: string;

  @IsUUID()
  sessionId: string;

  messages: {
    sender: string;
    message: string;
    sentAt: string;
  }[];

  constructor(partial: Partial<LiveConversationsHistoryResponseDto>) {
    Object.assign(this, partial);
  }
}

export class BotConversationsRequestDto {
  @IsString()
  botId: string;

  @IsUUID()
  sessionId: string;
}

export class BotConversationsResponseDto {
  @IsString()
  botId: string;

  liveConversations: { conversationId: string }[];

  constructor(partial: Partial<BotConversationsResponseDto>) {
    Object.assign(this, partial);
  }
}
