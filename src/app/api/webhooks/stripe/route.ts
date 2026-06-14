import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/billing';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') || '';

  const event = verifyWebhookSignature(body, signature);

  if (!event) {
    return NextResponse.json({ error: 'Geçersiz imza / Webhook Hatası' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const businessId = session.metadata?.businessId;
        const planId = session.metadata?.planId;

        if (businessId && planId) {
          const stripeSubId = session.subscription as string;
          // Set current period end to 30 days from now (or read from Stripe if live)
          const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          await prisma.subscription.upsert({
            where: { businessId },
            update: {
              planId,
              status: 'ACTIVE',
              stripeSubscriptionId: stripeSubId,
              currentPeriodEnd,
            },
            create: {
              businessId,
              planId,
              status: 'ACTIVE',
              stripeSubscriptionId: stripeSubId,
              currentPeriodEnd,
            },
          });
          
          console.log(`Stripe Sync: Business ${businessId} subscribed to ${planId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;
        
        // Refresh period end date on successful recurring payment
        if (subscriptionId) {
          const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: {
              status: 'ACTIVE',
              currentPeriodEnd,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'CANCELED',
          },
        });
        console.log(`Stripe Sync: Subscription deleted: ${subscription.id}`);
        break;
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook database sync error:', error);
    return NextResponse.json({ error: 'Veritabanı senkronizasyon hatası' }, { status: 500 });
  }
}
