import { Controller, Get, Post, Req, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';


// @Controller('webhook')
@Controller('webhooks')
export class SocialController {
    constructor(private readonly configService: ConfigService) {}

    
  private readonly verifyToken = this.configService.get('INSTA_VERIFY_TOKEN');
  private readonly appSecret = this.configService.get('INSTA_APP_SECRET');

  @Get()
  verifyWebhook(@Req() req: Request, @Res() res: Response) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === this.verifyToken) {
      console.log('Webhook verified');
      return res.status(200).send(challenge);
    } else {
      console.error('Webhook verification failed');
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
  }

  @Post()
  handleEvent(@Req() req: Request, @Res() res: Response) {
    const signature = req.headers['x-hub-signature-256'] as string;
    const payload = JSON.stringify(req.body);

    if (!this.validateSignature(payload, signature)) {
      console.error('Invalid signature');
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    console.log('Received event:', payload);
    res.status(200).send('EVENT_RECEIVED');
  }

  private validateSignature(payload: string, signature: string): boolean {
    if (!signature) {
      console.error('No signature provided');
      return false;
    }

    const computedSignature =
      'sha256=' +
      crypto.createHmac('sha256', this.appSecret).update(payload).digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature),
    );
  }
}

