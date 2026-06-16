import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getPlatformSettings } from '@/lib/settings';
import QrMenu from './QrMenu';
import { ShieldAlert, AlertCircle } from 'lucide-react';

export default async function PublicMenuPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const { slug } = await props.params;

  // Fetch business, subscription status and plan parameters
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      subscription: {
        include: {
          plan: true,
        },
      },
      categories: {
        include: {
          products: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!business) {
    notFound();
  }

  // 1. Security check: Business status must be ACTIVE
  if (business.status !== 'ACTIVE') {
    return (
      <div className="bg-zinc-950 text-zinc-100 min-h-screen flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full p-8 rounded-3xl border border-zinc-900 bg-zinc-900/40 backdrop-blur-md flex flex-col items-center gap-4">
          <ShieldAlert className="w-16 h-16 text-red-500 animate-pulse" />
          <h2 className="text-xl font-bold text-white">Menü Geçici Olarak Kapatılmıştır</h2>
          <p className="text-xs text-zinc-500 font-light leading-relaxed">
            Bu işletmenin menüsü yöneticiler tarafından geçici olarak askıya alınmıştır veya erişime kapalıdır.
          </p>
        </div>
      </div>
    );
  }

  // 2. Security check: Business must have an active subscription package
  const subscription = business.subscription;
  if (!subscription || subscription.status !== 'ACTIVE') {
    return (
      <div className="bg-zinc-950 text-zinc-100 min-h-screen flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full p-8 rounded-3xl border border-zinc-900 bg-zinc-900/40 backdrop-blur-md flex flex-col items-center gap-4">
          <AlertCircle className="w-16 h-16 text-amber-500 animate-bounce" />
          <h2 className="text-xl font-bold text-white">Abonelik Süresi Dolmuştur</h2>
          <p className="text-xs text-zinc-500 font-light leading-relaxed">
            Bu işletmenin menü kiralama abonelik süresi sona ermiştir. Menüye erişebilmek için aboneliğin yenilenmesi gerekmektedir.
          </p>
        </div>
      </div>
    );
  }

  // 3. Increment Visitor Statistics Log for the Dashboard Graph
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.visitorLog.upsert({
      where: {
        businessId_date: {
          businessId: business.id,
          date: today,
        },
      },
      update: {
        count: {
          increment: 1,
        },
      },
      create: {
        businessId: business.id,
        date: today,
        count: 1,
      },
    });
  } catch (error) {
    console.error('Failed to log visitor view:', error);
  }

  const plan = subscription.plan;

  // Platform-wide master switch: if ordering is globally disabled, no business can take orders.
  const settings = await getPlatformSettings();
  const effectiveAllowOrders = business.allowOrders && settings.orderingEnabled;

  return (
    <QrMenu
      business={{
        name: business.name,
        description: business.description,
        whatsappNumber: business.whatsappNumber,
        showCalories: business.showCalories,
        allowOrders: effectiveAllowOrders,
        logoUrl: business.logoUrl,
        coverVideoUrl: business.coverVideoUrl,
        coverImageUrl: business.coverImageUrl,
        coverOpacity: business.coverOpacity,
        themeId: business.themeId,
        openingHours: business.openingHours,
        serviceType: business.serviceType,
        address: business.address,
        instagramUrl: business.instagramUrl,
        locationUrl: business.locationUrl,
        reviewsUrl: business.reviewsUrl,
        slug: business.slug,
      }}
      categories={business.categories}
      hasWhatsAppOrder={plan.hasWhatsAppOrder}
      hasNutrients={plan.hasNutrients}
      viewOnly={!settings.orderingEnabled}
    />
  );
}
