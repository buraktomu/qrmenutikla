import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import ApprovalManager from './ApprovalManager';

export default async function AdminApprovalsPage() {
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

  // Businesses awaiting approval: no subscription OR subscription not ACTIVE
  const pending = await prisma.business.findMany({
    where: {
      OR: [
        { subscription: { is: null } },
        { subscription: { status: { not: 'ACTIVE' } } },
      ],
    },
    include: {
      owner: { select: { name: true, email: true } },
      subscription: { select: { planId: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex flex-col gap-8 text-black">
      <div className="border-b border-stone-200 pb-6">
        <h1 className="text-3xl font-extrabold text-black tracking-tight">Onay Bekleyenler</h1>
        <p className="text-sm text-stone-600 font-medium mt-1">
          Yeni kayıt olmuş veya aboneliği aktif olmayan işletmeleri buradan onaylayıp aktifleştirin.
          {pending.length > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-black">
              {pending.length} bekliyor
            </span>
          )}
        </p>
      </div>

      <ApprovalManager initialPending={pending} />
    </div>
  );
}
