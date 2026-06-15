import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { 
  Building2, 
  Users, 
  DollarSign, 
  CreditCard,
  ArrowRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';

export default async function AdminOverviewPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Verify role
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (currentUser?.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  // Load stats
  const totalUsers = await prisma.user.count();
  const totalBusinesses = await prisma.business.count();
  
  const businesses = await prisma.business.findMany({
    include: {
      subscription: true,
      owner: {
        select: {
          name: true,
          email: true,
        }
      }
    }
  });

  const activeSubscriptions = businesses.filter(
    (b) => b.subscription?.status === 'ACTIVE'
  ).length;

  const mrr = businesses.reduce((acc, curr) => {
    const plan = curr.subscription?.planId;
    if (curr.subscription?.status !== 'ACTIVE') return acc;
    if (plan === 'starter') return acc + 199;
    if (plan === 'pro') return acc + 399;
    if (plan === 'premium') return acc + 699;
    return acc;
  }, 0);

  // Load recent users
  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      businesses: {
        select: {
          name: true,
        }
      }
    }
  });

  // Load recent businesses
  const recentBusinesses = await prisma.business.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      owner: {
        select: {
          name: true,
          email: true,
        }
      },
      subscription: true,
    }
  });

  return (
    <div className="flex flex-col gap-8 text-black">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-black tracking-tight">Süper Admin Yönetim Paneli</h1>
          <p className="text-sm text-stone-600 font-medium mt-1">Sistem geneli işletmeler, abonelik gelirleri ve kullanıcı durumları.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Users */}
        <Link href="/admin/users" className="p-6 rounded-2xl border border-stone-200 bg-white hover:border-indigo-500/35 hover:shadow-md transition-all duration-300 flex justify-between items-start group">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Kayıtlı Kullanıcı</span>
            <div className="text-3xl font-extrabold text-black mt-2 group-hover:text-indigo-600 transition-colors">{totalUsers}</div>
            <span className="text-[10px] text-indigo-600 font-semibold mt-1.5 flex items-center gap-1">
              Kullanıcıları Yönet <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 border border-indigo-500/10">
            <Users className="w-5 h-5" />
          </div>
        </Link>

        {/* Total Businesses */}
        <Link href="/admin/businesses" className="p-6 rounded-2xl border border-stone-200 bg-white hover:border-purple-500/35 hover:shadow-md transition-all duration-300 flex justify-between items-start group">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Kayıtlı İşletme</span>
            <div className="text-3xl font-extrabold text-black mt-2 group-hover:text-purple-650 transition-colors">{totalBusinesses}</div>
            <span className="text-[10px] text-purple-600 font-semibold mt-1.5 flex items-center gap-1">
              İşletmeleri Yönet <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-650 border border-purple-500/10">
            <Building2 className="w-5 h-5" />
          </div>
        </Link>

        {/* Active Subscriptions */}
        <Link href="/admin/subscriptions" className="p-6 rounded-2xl border border-stone-200 bg-white hover:border-emerald-500/35 hover:shadow-md transition-all duration-300 flex justify-between items-start group">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Aktif Abonelik</span>
            <div className="text-3xl font-extrabold text-black mt-2 group-hover:text-emerald-650 transition-colors">{activeSubscriptions}</div>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
              Abonelikleri Yönet <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/10">
            <CreditCard className="w-5 h-5" />
          </div>
        </Link>

        {/* Monthly Recurring Revenue */}
        <div className="p-6 rounded-2xl border border-stone-200 bg-white flex justify-between items-start shadow-sm">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Öngörülen MRR Geliri</span>
            <div className="text-3xl font-extrabold text-indigo-600 mt-2">{mrr.toLocaleString('tr-TR')} TL</div>
            <span className="text-[10px] text-stone-400 font-semibold mt-1.5 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" /> Tahmini Aylık Gelir
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-600 border border-indigo-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Users */}
        <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-stone-100 pb-3">
            <h3 className="font-extrabold text-base text-black flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              Son Katılan Kullanıcılar
            </h3>
            <Link href="/admin/users" className="text-xs text-indigo-600 hover:underline font-bold">Tümünü Gör</Link>
          </div>
          
          <div className="flex flex-col divide-y divide-stone-100">
            {recentUsers.map((user) => (
              <div key={user.id} className="py-3 flex justify-between items-center text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-black text-sm">{user.name}</span>
                  <span className="text-stone-500 font-mono">{user.email}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-600 font-semibold uppercase text-[9px] tracking-wider">
                    {user.role === 'SUPER_ADMIN' ? 'Süper Admin' : 'İşletme Sahibi'}
                  </span>
                  <span className="text-[10px] text-stone-400 font-medium">
                    {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Businesses */}
        <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-stone-100 pb-3">
            <h3 className="font-extrabold text-base text-black flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-650" />
              Son Eklenen İşletmeler
            </h3>
            <Link href="/admin/businesses" className="text-xs text-purple-650 hover:underline font-bold">Tümünü Gör</Link>
          </div>

          <div className="flex flex-col divide-y divide-stone-100">
            {recentBusinesses.map((biz) => {
              const plan = biz.subscription?.planId || 'starter';
              const isActive = biz.status === 'ACTIVE';

              return (
                <div key={biz.id} className="py-3 flex justify-between items-center text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-black text-sm">{biz.name}</span>
                    <span className="text-stone-500">Sahibi: {biz.owner.name} ({biz.owner.email})</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border tracking-wider ${
                      plan === 'premium' ? 'bg-indigo-50 border-indigo-150 text-indigo-600' :
                      plan === 'pro' ? 'bg-purple-50 border-purple-150 text-purple-600' :
                      'bg-stone-50 border-stone-200 text-stone-600'
                    }`}>
                      {plan}
                    </span>
                    <span className={`text-[10px] font-bold ${isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isActive ? 'Aktif' : 'Askıda'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
