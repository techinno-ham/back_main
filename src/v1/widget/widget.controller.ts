import { Body, Controller, Get, HttpException, HttpStatus, Logger, Param, Post } from '@nestjs/common';
import { WidgetService } from './widget.service';
import {
  GenerateWidgetTokenDto,
  GetBotConfigDto,
  GetCollectionNameDto,
} from './dtos/widget.dto';

@Controller({
  path: 'widget',
  version: '1',
})
export class WidgetController {
  private readonly logger = new Logger(WidgetController.name);
  constructor(private readonly widgetService: WidgetService) {}

  @Post('generate-token')
  async generateWidgetToken(@Body() body: GenerateWidgetTokenDto) {
    this.logger.log(`Generating widget token for user ID: ${body.userId}, bot ID: ${body.botId}`);

    try {
      const token = await this.widgetService.generateWidgetTokenService({
        userId: body.userId,
        botId: body.botId,
      });
      this.logger.log(`Successfully generated token for user ID: ${body.userId}, bot ID: ${body.botId}`);
      return token;
    } catch (error) {
      this.logger.error(`Error generating token for user ID: ${body.userId}, bot ID: ${body.botId}`, error.stack);
      throw new HttpException('Failed to generate widget token. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  @Post('get-collection')
  async getCollectionName(@Body() body: GetCollectionNameDto) {
    this.logger.log(`Retrieving collection name with token: ${body.token}`);

    try {
      const collectionName = await this.widgetService.getCollectionNameService(body.token);
      this.logger.log(`Successfully retrieved collection name for token: ${body.token}`);
      return collectionName;
    } catch (error) {
      this.logger.error(`Error retrieving collection name for token: ${body.token}`, error.stack);
      throw new HttpException('Failed to retrieve collection name. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('config/:botId')
  async getBotConfig(@Param('botId') botId: string) {
    this.logger.log(`Fetching bot config for bot ID: ${botId}`);

    try {
      const config = await this.widgetService.getBotConfigService({ botId });
      this.logger.log(`Successfully retrieved config for bot ID: ${botId}`);
      return config;
    } catch (error) {
      this.logger.error(`Error fetching config for bot ID: ${botId}`, error.stack);
      throw new HttpException('Failed to retrieve bot config. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
