import { IsString, IsNotEmpty } from 'class-validator';

export class CreatedInitFormDto {
  @IsString()
  @IsNotEmpty()
  botId: string;
}

export class GetCollectionNameDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class GetBotConfigDto {
  @IsString()
  @IsNotEmpty()
  botId: string;
}
