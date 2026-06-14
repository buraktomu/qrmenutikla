'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { createCheckoutSession } from '@/lib/billing';

export async function startSubscriptionCheckout(planId: string, businessId: string) {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'Oturum açmanız gerekiyor.' };
  }

  // Verify business ownership
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { businesses: true },
  });

  const business = user?.businesses.find((b) => b.id === businessId);
  if (!business && user?.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Yetkisiz işlem.' };
  }

  // Construct absolute return URLs
  const host = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const successUrl = `${host}/dashboard/billing?payment=success&plan_id=${planId}`;
  const cancelUrl = `${host}/dashboard/billing?payment=cancel`;

  try {
    const sessionRes = await createCheckoutSession(
      planId,
      businessId,
      successUrl,
      cancelUrl
    );
    
    return { success: true, url: sessionRes.url, error: null };
  } catch (error) {
    console.error('Checkout error:', error);
    return { success: false, error: 'Ödeme oturumu başlatılamadı.' };
  }
}

export async function completeMockSubscription(businessId: string, planId: string) {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'Oturum açmanız gerekiyor.' };
  }

  try {
    // Upsert subscription
    await prisma.subscription.upsert({
      where: { businessId },
      update: {
        planId,
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      create: {
        businessId,
        planId,
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return { success: true, error: null };
  } catch (error) {
    console.error('Mock subscription completion error:', error);
    return { success: false, error: 'Abonelik kaydedilirken hata oluştu.' };
  }
}
