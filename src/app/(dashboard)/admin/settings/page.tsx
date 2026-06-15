import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getPlatformSettings } from '@/lib/settings';
import SettingsManager from './SettingsManager';

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (currentUser?.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  const settings = await getPlatformSettings();

  return (
    <div className="flex flex-col gap-8 text-black">
      <div className="border-b border-stone-200 pb-6">
        <h1 className="text-3xl font-extrabold text-black tracking-tight">Sistem Ayarları</h1>
        <p className="text-sm text-stone-600 font-medium mt-1">
          Platform genelinde geçerli özellik anahtarları. Buradan yapılan değişiklikler tüm işletmeleri etkiler.
        </p>
      </div>

      <SettingsManager initialSettings={settings} />
    </div>
  );
}
