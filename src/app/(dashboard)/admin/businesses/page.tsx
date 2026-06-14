import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import BusinessTable from './BusinessTable';

export default async function AdminBusinessesPage() {
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

  // Load all businesses with detailed counts and owner details
  const businesses = await prisma.business.findMany({
    include: {
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
      subscription: {
        select: {
          planId: true,
          status: true,
        },
      },
      _count: {
        select: {
          categories: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex flex-col gap-8 text-black">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-black tracking-tight">İşletme Yönetimi</h1>
        <p className="text-sm text-stone-600 font-medium mt-1">Sistemdeki tüm kayıtlı restoran/kafe işletmeleri, durum kontrolleri ve plan atamaları.</p>
      </div>

      {/* Business Table Component */}
      <BusinessTable initialBusinesses={businesses as any} />

    </div>
  );
}
