import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import UserTable from './UserTable';

export default async function AdminUsersPage() {
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

  // Fetch all users with their business name and subscription plan details
  const users = await prisma.user.findMany({
    include: {
      businesses: {
        select: {
          name: true,
          slug: true,
          subscription: {
            select: {
              planId: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex flex-col gap-8 text-black">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-black tracking-tight">Kullanıcı Yönetimi</h1>
        <p className="text-sm text-stone-600 font-medium mt-1">Sistemdeki tüm kayıtlı kullanıcıların rolleri, kayıt durumları ve işletme ilişkileri.</p>
      </div>

      {/* User Table Component */}
      <UserTable initialUsers={users as any} />

    </div>
  );
}
