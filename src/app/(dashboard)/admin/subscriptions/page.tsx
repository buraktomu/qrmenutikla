import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import SubscriptionTable from './SubscriptionTable';

export default async function AdminSubscriptionsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Double check admin role
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (currentUser?.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  // Fetch all businesses with subscription details
  const businesses = await prisma.business.findMany({
    include: {
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
      subscription: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex flex-col gap-8 text-black">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-black tracking-tight">Abonelik Yönetimi</h1>
        <p className="text-sm text-stone-600 font-medium mt-1">Sistemdeki tüm kayıtlı işletmelerin abonelik durumları, paket sürümleri ve aylık tekrarlayan gelir (MRR) takibi.</p>
      </div>

      {/* Subscription Table Component */}
      <SubscriptionTable initialBusinesses={businesses as any} />

    </div>
  );
}
