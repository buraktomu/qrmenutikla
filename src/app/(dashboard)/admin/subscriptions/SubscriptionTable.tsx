'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { updateBusinessSubscription } from '@/app/actions/admin';
import { 
  Search, 
  CreditCard,
  CheckCircle2,
  AlertOctagon,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type BusinessWithSubscription = {
  id: string;
  name: string;
  owner: {
    name: string;
    email: string;
  };
  subscription: {
    id: string;
    planId: string;
    status: string;
    currentPeriodEnd: Date | null;
    updatedAt: Date;
  } | null;
};

type SubscriptionTableProps = {
  initialBusinesses: BusinessWithSubscription[];
};

export default function SubscriptionTable({ initialBusinesses }: SubscriptionTableProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<'ALL' | 'starter' | 'pro' | 'premium'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'>('ALL');
  const [loading, setLoading] = useState<string | null>(null);

  const handlePlanChange = async (bizId: string, planId: string) => {
    setLoading(bizId);
    const res = await updateBusinessSubscription(bizId, planId);
    if (res.success) {
      showToast('Abonelik paketi başarıyla güncellendi.', 'success');
      router.refresh();
    } else {
      showToast(res.error || 'İşlem başarısız.', 'error');
    }
    setLoading(null);
  };

  // Filter
  const filteredBusinesses = initialBusinesses.filter(biz => {
    const matchesSearch = 
      biz.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      biz.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      biz.owner.email.toLowerCase().includes(searchTerm.toLowerCase());

    const activePlan = biz.subscription?.planId || 'starter';
    const matchesPlan = 
      planFilter === 'ALL' || 
      activePlan === planFilter;

    const activeStatus = biz.subscription?.status || 'INACTIVE';
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && activeStatus === 'ACTIVE') ||
      (statusFilter === 'PAST_DUE' && activeStatus === 'PAST_DUE') ||
      (statusFilter === 'CANCELED' && (activeStatus === 'CANCELED' || activeStatus === 'INACTIVE'));

    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Calculate MRR on filtered or total? Let's show total MRR on stats card
  const totalMrr = initialBusinesses.reduce((acc, curr) => {
    if (curr.subscription?.status !== 'ACTIVE') return acc;
    const plan = curr.subscription?.planId;
    if (plan === 'starter') return acc + 199;
    if (plan === 'pro') return acc + 399;
    if (plan === 'premium') return acc + 699;
    return acc;
  }, 0);

  const activeCount = initialBusinesses.filter(b => b.subscription?.status === 'ACTIVE').length;

  return (
    <div className="flex flex-col gap-8">
      
      {/* Mini Stats Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        
        {/* Active Subs */}
        <div className="p-6 rounded-2xl border border-stone-200 bg-white flex justify-between items-start shadow-sm">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Aktif Faturalı Paket</span>
            <div className="text-3xl font-extrabold text-black mt-2">{activeCount}</div>
            <span className="text-[10px] text-stone-400 font-semibold mt-1">Sistem genelindeki aktif işletme lisansları</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-650 border border-indigo-500/10">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Expected MRR */}
        <div className="p-6 rounded-2xl border border-stone-200 bg-white flex justify-between items-start shadow-sm">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Aylık Tekrarlayan Gelir (MRR)</span>
            <div className="text-3xl font-extrabold text-indigo-650 mt-2">{totalMrr.toLocaleString('tr-TR')} TL</div>
            <span className="text-[10px] text-stone-400 font-semibold mt-1">Aktif lisanslardan öngörülen aylık kazanç</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/10">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="İşletme veya sahip ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-250 text-xs text-black font-semibold outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-stone-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto self-stretch sm:self-auto justify-end">
          
          {/* Plan Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-stone-500 font-bold hidden md:inline">Paket:</span>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-250 text-xs text-black font-extrabold outline-none cursor-pointer focus:border-indigo-500 transition-all"
            >
              <option value="ALL">Tüm Paketler</option>
              <option value="starter">Başlangıç</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-stone-500 font-bold hidden md:inline">Durum:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-250 text-xs text-black font-extrabold outline-none cursor-pointer focus:border-indigo-500 transition-all"
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="ACTIVE">Aktif</option>
              <option value="PAST_DUE">Ödeme Gecikti</option>
              <option value="CANCELED">İptal Edildi</option>
            </select>
          </div>

        </div>

      </div>

      {/* Subscription Table */}
      <div className="overflow-x-auto border border-stone-200 rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-stone-200 text-stone-500 font-black uppercase tracking-wider bg-stone-50/50">
              <th className="p-4">İşletme Adı</th>
              <th className="p-4">İşletme Sahibi</th>
              <th className="p-4">Paket Sürümü</th>
              <th className="p-4">Aylık Fiyat</th>
              <th className="p-4">Lisans Durumu</th>
              <th className="p-4">Bitiş Tarihi</th>
              <th className="p-4 text-right">Lisans Güncelle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-150">
            {filteredBusinesses.length > 0 ? (
              filteredBusinesses.map((biz) => {
                const sub = biz.subscription;
                const isActive = sub?.status === 'ACTIVE';
                const planId = sub?.planId || 'starter';
                const isOpLoading = loading === biz.id;

                let priceLabel = '199 TL';
                if (planId === 'pro') priceLabel = '399 TL';
                if (planId === 'premium') priceLabel = '699 TL';

                return (
                  <tr key={biz.id} className="hover:bg-stone-50/50 text-black font-bold">
                    
                    {/* Business Info */}
                    <td className="p-4">
                      <span className="font-extrabold text-black text-sm">{biz.name}</span>
                    </td>

                    {/* Owner Info */}
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span>{biz.owner.name}</span>
                        <span className="text-[10px] text-stone-500 font-mono font-medium">{biz.owner.email}</span>
                      </div>
                    </td>

                    {/* Active Plan */}
                    <td className="p-4 uppercase font-mono text-stone-700">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black border tracking-wider ${
                        planId === 'premium' ? 'bg-indigo-50 border-indigo-150 text-indigo-600' :
                        planId === 'pro' ? 'bg-purple-50 border-purple-150 text-purple-600' :
                        'bg-stone-50 border-stone-250 text-stone-600'
                      }`}>
                        {planId}
                      </span>
                    </td>

                    {/* Monthly Price */}
                    <td className="p-4 font-extrabold text-black">
                      {priceLabel} / ay
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-black ${
                        isActive 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                          : 'bg-red-500/10 border-red-500/20 text-red-650'
                      }`}>
                        {isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Aktif
                          </>
                        ) : (
                          <>
                            <AlertOctagon className="w-3 h-3" />
                            {sub?.status || 'İPTAL EDİLDİ'}
                          </>
                        )}
                      </span>
                    </td>

                    {/* End Date */}
                    <td className="p-4 text-stone-500 font-medium">
                      {sub?.currentPeriodEnd ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 opacity-60" />
                          {new Date(sub.currentPeriodEnd).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      ) : (
                        <span className="text-stone-400 italic">Sınırsız / Yok</span>
                      )}
                    </td>

                    {/* Change Plan Dropdown */}
                    <td className="p-4 text-right">
                      <select
                        disabled={isOpLoading}
                        value={planId}
                        onChange={(e) => handlePlanChange(biz.id, e.target.value)}
                        className="bg-white border border-stone-250 rounded-lg px-2.5 py-1 text-xs outline-none text-black font-extrabold cursor-pointer focus:border-indigo-500 transition-colors"
                      >
                        <option value="starter">Başlangıç</option>
                        <option value="pro">Pro</option>
                        <option value="premium">Premium</option>
                      </select>
                    </td>

                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-stone-400 italic">
                  Abonelik bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
