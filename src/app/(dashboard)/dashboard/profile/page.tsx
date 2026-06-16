import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { maskApiKey } from '@/app/actions/ai-settings';
import ProfileForm from './ProfileForm';

export default async function ProfilePage() {
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
        <h2 className="text-xl font-bold text-black">İşletme Bulunamadı</h2>
      </div>
    );
  }

  // If the user plan is 'starter', they can only select the first 3 themes
  const activePlanId = business.subscription?.planId || 'starter';
  const hasThemeSelectionLimit = activePlanId === 'starter';

  // Decrypt and mask the merchant's key
  const decryptedKey = business.customOpenAiKey ? decrypt(business.customOpenAiKey) : '';
  const maskedKey = decryptedKey ? maskApiKey(decryptedKey) : '';

  return (
    <div className="flex flex-col gap-6 text-black">
      <div>
        <h1 className="text-2xl font-extrabold text-black tracking-tight">Profil & İşletme Ayarları</h1>
        <p className="text-xs text-black font-semibold mt-1">
          İşletme iletişim bilgilerinizi güncelleyin, QR menü tasarım temanızı belirleyin.
        </p>
      </div>

      <div className="h-px bg-stone-200 w-full" />

      <ProfileForm 
        business={{
          id: business.id,
          name: business.name,
          phone: business.phone,
          address: business.address,
          whatsappNumber: business.whatsappNumber,
          showCalories: business.showCalories,
          allowOrders: business.allowOrders,
          logoUrl: business.logoUrl,
          coverVideoUrl: business.coverVideoUrl,
          coverImageUrl: business.coverImageUrl,
          themeId: business.themeId,
          description: business.description,
          openingHours: business.openingHours,
          serviceType: business.serviceType,
          instagramUrl: business.instagramUrl,
          locationUrl: business.locationUrl,
          reviewsUrl: business.reviewsUrl,
          useOwnApiKey: business.useOwnApiKey,
          customOpenAiKey: maskedKey,
        }}
        hasThemeSelectionLimit={hasThemeSelectionLimit}
      />
    </div>
  );
}
