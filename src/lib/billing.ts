import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia' as any,
    })
  : null;

/**
 * Creates a checkout session for subscriptions.
 * Abstracts Stripe away, enabling easy swapping for PayTR/iyzico later.
 */
export async function createCheckoutSession(
  planId: string,
  businessId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ url: string; isSimulated: boolean }> {
  
  // Resolve plan price ID from mock or live settings
  const priceMap: Record<string, string> = {
    starter: process.env.STRIPE_PRICE_STARTER || 'price_starter_mock',
    pro: process.env.STRIPE_PRICE_PRO || 'price_pro_mock',
    premium: process.env.STRIPE_PRICE_PREMIUM || 'price_premium_mock',
  };

  const priceId = priceMap[planId] || planId;

  if (stripe && process.env.STRIPE_SECRET_KEY && !priceId.endsWith('_mock')) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          businessId,
          planId,
        },
      });
      
      return { url: session.url || successUrl, isSimulated: false };
    } catch (error) {
      console.error('Stripe Checkout Session Error, falling back to simulator:', error);
    }
  }

  // Fallback to local simulation mode
  const mockSessionId = `mock_sess_${Math.random().toString(36).substring(2, 9)}`;
  const query = new URLSearchParams({
    session_id: mockSessionId,
    business_id: businessId,
    plan_id: planId,
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  const simulatorUrl = `/dashboard/billing/checkout-simulator?${query.toString()}`;
  return { url: simulatorUrl, isSimulated: true };
}

/**
 * Verifies the Stripe webhook signature if live, otherwise returns a mock payload.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): Stripe.Event | null {
  if (stripe && process.env.STRIPE_WEBHOOK_SECRET) {
    try {
      return stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error('Stripe Webhook Signature Verification Failed:', error);
      return null;
    }
  }
  
  // Simulation signature validation (always succeeds in development)
  try {
    const parsed = JSON.parse(body);
    return parsed as Stripe.Event;
  } catch {
    return null;
  }
}
