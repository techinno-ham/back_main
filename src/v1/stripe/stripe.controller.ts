import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  RawBodyRequest,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { StripeService } from './stripe.service';

@Controller({
  path: 'stripe',
  version: '1',
})
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('checkout')
  async createCheckout(
    @Body('priceId') priceId: string,
    @Body('userId') userId: string,
  ) {
    const session = await this.stripeService.createCheckoutSession(
      priceId,
      userId,
    );
    return { result: session, ok: true };
  }

  @Get('session-details')
  async getSessionDetails(@Query('session_id') sessionId: string) {
    if (!sessionId) {
      throw new BadRequestException('Session ID is required');
    }

    return this.stripeService.getSessionDetails(sessionId);
  }

  @Post('webhook')
  async handleWebhook(
    @Req() @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.stripeService.handleWebhookEvent(req.rawBody, signature);
  }
}
