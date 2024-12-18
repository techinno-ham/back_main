import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

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
};

export class CreatedContactDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  form_id: string;
}