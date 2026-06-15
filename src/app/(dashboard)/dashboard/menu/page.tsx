import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getPlatformSettings } from '@/lib/settings';
import MenuManager from './MenuManager';

export default async function MenuPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Load user business, categories, and subscription
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      businesses: {
        include: {
          categories: {
            include: {
              products: {
                orderBy: { sortOrder: 'asc' },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
          subscription: {
            include: {
              plan: true,
            },
          },
        },
      },
    },
  });

  const business = user?.businesses[0];

  if (!business) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-black">İşletme Bulunamadı</h2>
      </div>
    );
  }

  // Plan capability configs (combined with platform-wide flags)
  const settings = await getPlatformSettings();
  const plan = business.subscription?.plan;
  const hasAI = (plan?.hasAI ?? false) && settings.aiEnabled;
  const hasNutrients = plan?.hasNutrients ?? false;
  const hasWhatsApp = plan?.hasWhatsAppOrder ?? false;

  return (
    <div className="flex flex-col gap-6 text-black">
      <div>
        <h1 className="text-2xl font-extrabold text-black tracking-tight">Menü Yönetimi</h1>
        <p className="text-xs text-black font-semibold mt-1">
          Kategorilerinizi ve ürünlerinizi yönetin, yapay zeka ile iştah açıcı açıklamalar ekleyin.
        </p>
      </div>

      <div className="h-px bg-stone-200 w-full" />

      <MenuManager
        businessId={business.id}
        initialCategories={business.categories}
        hasAI={hasAI}
        hasNutrients={hasNutrients}
        hasWhatsApp={hasWhatsApp}
      />
    </div>
  );
}
