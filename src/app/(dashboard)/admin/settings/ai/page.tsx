import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getPlatformAiSettings } from '@/app/actions/ai-settings';
import AiSettingsManager from './AiSettingsManager';

export default async function AdminAiSettingsPage() {
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

  const aiSettings = await getPlatformAiSettings();

  return (
    <div className="flex flex-col gap-8 text-black">
      <div className="border-b border-stone-200 pb-6">
        <h1 className="text-3xl font-extrabold text-black tracking-tight">Yapay Zeka (AI) Sistem Ayarları</h1>
        <p className="text-sm text-stone-600 font-medium mt-1">
          Platform genelinde kullanılacak yapay zeka yapılandırmalarını yönetin. API bağlantılarınızı test edin ve model sınırlarını belirleyin.
        </p>
      </div>

      <AiSettingsManager initialSettings={aiSettings} />
    </div>
  );
}
