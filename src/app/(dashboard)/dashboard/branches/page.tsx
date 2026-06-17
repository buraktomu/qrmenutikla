import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import BranchesManager from './BranchesManager';

export default async function BranchesPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      businesses: {
        include: {
          branches: {
            include: { menu: true },
            orderBy: { createdAt: 'desc' },
          },
          menus: {
            orderBy: { createdAt: 'asc' },
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

  // Ensure there is at least one default menu
  let menus = business.menus;
  if (menus.length === 0) {
    const defaultMenu = await prisma.menu.create({
      data: {
        businessId: business.id,
        name: `${business.name} Menü`,
      },
    });
    menus = [defaultMenu];
  }

  return (
    <div className="flex flex-col gap-6 text-black">
      <div>
        <h1 className="text-2xl font-extrabold text-black tracking-tight">Şube Yönetimi</h1>
        <p className="text-xs text-black font-semibold mt-1">
          İşletmenizin şubelerini oluşturun, düzenleyin ve her şube için bağımsız QR kodlar üretin.
        </p>
      </div>

      <div className="h-px bg-stone-200 w-full" />

      <BranchesManager
        businessId={business.id}
        businessName={business.name}
        initialBranches={business.branches}
        initialMenus={menus}
      />
    </div>
  );
}
