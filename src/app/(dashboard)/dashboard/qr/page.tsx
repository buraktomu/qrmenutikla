import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import QrGenerator from './QrGenerator';

export default async function QrCodePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Load user business
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      businesses: true,
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-black tracking-tight">QR Kod Oluşturucu</h1>
        <p className="text-xs text-stone-900 font-bold mt-1">
          Müşterilerinizin masadan okutabileceği karekod görsellerini özelleştirin ve indirin.
        </p>
      </div>

      <div className="h-px bg-zinc-900 w-full" />

      <QrGenerator businessSlug={business.slug} businessName={business.name} />
    </div>
  );
}
