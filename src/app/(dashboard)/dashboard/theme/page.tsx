import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import ThemeManager from './ThemeManager';

export default async function ThemePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Load user business
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      businesses: {
        include: {
          subscription: true,
        },
      },
    },
  });

  const business = user?.businesses[0];

  if (!business) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white">İşletme Bulunamadı</h2>
      </div>
    );
  }

  const activePlanId = business.subscription?.planId || 'starter';
  const hasThemeSelectionLimit = activePlanId === 'starter';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Görsel Tema Seçimi</h1>
        <p className="text-xs text-zinc-500 font-light mt-1">
          QR menünüzün müşterileriniz tarafından görüntülenecek olan arayüz tasarımını seçin. Seçtiğiniz temayı sağdaki canlı telefonda anında görebilirsiniz.
        </p>
      </div>

      <div className="h-px bg-zinc-900 w-full" />

      <ThemeManager 
        business={{
          id: business.id,
          name: business.name,
          description: business.description,
          logoUrl: business.logoUrl,
          allowOrders: business.allowOrders,
          showCalories: business.showCalories,
          themeId: business.themeId,
          instagramUrl: business.instagramUrl,
          locationUrl: business.locationUrl,
          reviewsUrl: business.reviewsUrl,
        }}
        hasThemeSelectionLimit={hasThemeSelectionLimit}
      />
    </div>
  );
}
