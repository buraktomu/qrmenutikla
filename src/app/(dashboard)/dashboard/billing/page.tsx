import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import BillingManager from './BillingManager';

export default async function BillingPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

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
        <h2 className="text-xl font-bold text-black">İşletme Bulunamadı</h2>
      </div>
    );
  }

  const subscription = business.subscription;
  const activePlanId = subscription?.planId || 'starter';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-black tracking-tight">Abonelik &amp; Paket Bilgileri</h1>
        <p className="text-xs text-stone-500 font-light mt-1">
          Mevcut paketinizi görüntüleyin. Paket değişikliği için bizimle iletişime geçin.
        </p>
      </div>

      <div className="h-px bg-stone-200 w-full" />

      <BillingManager
        activePlanId={activePlanId}
        businessName={business.name}
        userEmail={session.user.email}
      />
    </div>
  );
}
