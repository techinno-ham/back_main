import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-01-27.acacia',
    });
  }

  priceTierMap: Record<string, { tier_name: string; db_id: string }> = {
    price_1Qmhhb02L9pKqcxp75Syyp7d: { tier_name: 'pro', db_id: '1' },
    price_124: { tier_name: 'enterprise', db_id: '2' },
  };

  getTierDetails = (priceId: string) => {
    return this.priceTierMap?.[priceId] || null;
  };

  async createCheckoutSession(priceId: string, userId: string) {
    // Create the checkout session
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `http://localhost:3000/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/pricing`,
      metadata: { userId, priceId },
    });

    return session;
  }

  async handleWebhookEvent(rawBody: any, signature: string) {
    const endpointSecret = this.configService.get('STRIPE_SECRET_WEBHOOK_KEY');

    let event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        endpointSecret,
      );
    } catch (err) {
      throw new Error(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const data = event.data.object;
      const userId = data.metadata?.userId;
      const priceId = data.metadata?.priceId;

      //console.log({ data, userId, priceId });

      // Get tier details from the priceTierMap
      const tierDetails = this.getTierDetails(priceId);
      if (!tierDetails) {
        throw new Error(`Tier details not found for priceId: ${priceId}`);
      }

      // Create a new subscription and update the user's activeSubscriptionId
      await this.updateUserSubscription(userId, tierDetails.db_id);
    }

    return { received: true };
  }

  async getSessionDetails(sessionId: string) {
    try {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["payment_intent"],
      });
      
      return {
        amount: (session.amount_total / 100).toFixed(2),
        transactionId: session.invoice,
      };
    } catch (error) {
      throw new Error(`Error fetching session details: ${error.message}`);
    }
  }
  

  private async updateUserSubscription(userId: string, tierId: string) {
    const newSubscription = await this.prisma.subscription.create({
      data: {
        user_id: userId,
        tier_id: parseInt(tierId),
        start_date: new Date(),
        end_date: new Date(
            new Date().setMonth(new Date().getMonth() + 1)
          ),
        token_usage: 0,
      },
    });

    // Update the user's activeSubscriptionId
    await this.prisma.users.update({
      where: { user_id: userId },
      data: { activeSubscriptionId: newSubscription.id },
    });

    console.log(
      'Subscription created and user updated successfully:',
      newSubscription,
    );
  }
}
