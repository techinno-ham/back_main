import { IsString, IsUUID, IsOptional } from 'class-validator';
//import { Transform } from 'class-transformer';

export class CreateLiveConversationRequestDto {
  @IsUUID()
  conversationId: string;

  @IsString()
  botId: string;

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
  conversationId: string;
}

export class LiveConversationsHistoryResponseDto {
  @IsString()
  botId: string;

  @IsUUID()
  conversationId: string;

  messages: {
    id: string;
    sender: string;
    body: string;
    time: string;
  }[];

  constructor(partial: Partial<LiveConversationsHistoryResponseDto>) {
    Object.assign(this, partial);
  }
}

export class BotConversationsRequestDto {
  @IsString()
  botId: string;

  @IsUUID()
  @IsOptional()
  sessionId?: string;
}

export class BotConversationsResponseDto {
  @IsString()
  botId: string;

  liveConversations: { conversationId: string }[];

  constructor(partial: Partial<BotConversationsResponseDto>) {
    Object.assign(this, partial);
  }
}
