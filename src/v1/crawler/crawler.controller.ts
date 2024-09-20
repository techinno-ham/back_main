import { Controller, Get, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { Body, Post, Query } from '@nestjs/common/decorators';
import { UserUrlsReqDTO } from './dtos/crawler.dto';

@Controller({
  path: 'crawler',
  version: '1',
})
export class CrawlerController {
  private readonly logger = new Logger(CrawlerController.name);
  constructor(private readonly crawlerService: CrawlerService) {}

  @Get('links')
  async getListLink(@Query('url') url?: string) {
    this.logger.log(`Fetching available links for URL: ${url || 'no URL provided'}`);

    try {
      const links = await this.crawlerService.getavailableLink(url);
      this.logger.log(`Successfully retrieved links for URL: ${url}`);
      return links;
    } catch (error) {
      this.logger.error(`Error fetching links for URL: ${url}`, error.stack);
      throw new HttpException('Failed to retrieve links. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  };



  @Get('linksDemo')
  async getListLinkDemo(@Query('url') url?: string) {
    this.logger.log(`Fetching demo available links for URL: ${url || 'no URL provided'}`);

    try {
      const demoLinks = await this.crawlerService.getAvailableLinksDemo(url);
      this.logger.log(`Successfully retrieved demo links for URL: ${url}`);
      return demoLinks;
    } catch (error) {
      this.logger.error(`Error fetching demo links for URL: ${url}`, error.stack);
      throw new HttpException('Failed to retrieve demo links. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  async sendArrayLinkForCrawler(@Body() UserUrlsReq: UserUrlsReqDTO) {
    this.logger.log(`Sending URLs for crawling: ${JSON.stringify(UserUrlsReq.urls)} for bot ID: ${UserUrlsReq.botId}`);

    try {
      const result = await this.crawlerService.sendUrlToCrawler(
        UserUrlsReq.botId,
        UserUrlsReq.urls,
      );
      this.logger.log(`Successfully sent URLs for bot ID: ${UserUrlsReq.botId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error sending URLs for bot ID: ${UserUrlsReq.botId}`, error.stack);
      throw new HttpException('Failed to send URLs for crawling. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
