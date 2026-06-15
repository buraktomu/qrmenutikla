'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { toggleBusinessStatus, updateBusinessSubscription } from '@/app/actions/admin';
import { 
  Search, 
  ExternalLink, 
  Building2,
  AlertOctagon,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type BusinessWithOwner = {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: Date;
  owner: {
    name: string;
    email: string;
  };
  subscription: {
    planId: string;
    status: string;
  } | null;
  _count: {
    categories: number;
  };
};

type BusinessTableProps = {
  initialBusinesses: BusinessWithOwner[];
};

export default function BusinessTable({ initialBusinesses }: BusinessTableProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<BusinessWithOwner[]>(initialBusinesses);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<'ALL' | 'starter' | 'pro' | 'premium'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggleStatus = async (bizId: string, currentStatus: string) => {
    const confirmMessage = currentStatus === 'ACTIVE'
      ? 'Bu işletmeyi askıya almak istediğinize emin misiniz? Müşteriler menüye erişemez!'
      : 'Bu işletmeyi aktifleştirmek istediğinize emin misiniz?';

    if (!confirm(confirmMessage)) return;

    setLoading(bizId);
    const res = await toggleBusinessStatus(bizId, currentStatus);
    if (res.success) {
      showToast('İşletme durumu güncellendi.', 'success');
      const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      setBusinesses(prev => prev.map(b => b.id === bizId ? { ...b, status: nextStatus } : b));
      router.refresh();
    } else {
      showToast(res.error || 'İşlem başarısız.', 'error');
    }
    setLoading(null);
  };

  const handlePlanChange = async (bizId: string, planId: string) => {
    setLoading(bizId);
    const res = await updateBusinessSubscription(bizId, planId);
    if (res.success) {
      showToast('İşletme paketi başarıyla güncellendi.', 'success');
      setBusinesses(prev => prev.map(b => {
        if (b.id === bizId) {
          return {
            ...b,
            subscription: {
              planId,
              status: b.subscription?.status || 'ACTIVE'
            }
          };
        }
        return b;
      }));
      router.refresh();
    } else {
      showToast(res.error || 'İşlem başarısız.', 'error');
    }
    setLoading(null);
  };

  // Filter businesses
  const filteredBusinesses = businesses.filter(biz => {
    const matchesSearch = 
      biz.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      biz.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      biz.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      biz.owner.email.toLowerCase().includes(searchTerm.toLowerCase());

    const activePlan = biz.subscription?.planId || 'starter';
    const matchesPlan = 
      planFilter === 'ALL' || 
      activePlan === planFilter;

    const matchesStatus = 
      statusFilter === 'ALL' || 
      biz.status === statusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="İşletme adı, slug veya sahip ara..."
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
              <option value="SUSPENDED">Askıda</option>
            </select>
          </div>

        </div>

      </div>

      {/* Businesses Table — desktop */}
      <div className="hidden md:block overflow-x-auto border border-stone-200 rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-stone-200 text-stone-500 font-black uppercase tracking-wider bg-stone-50/50">
              <th className="p-4">İşletme / URL</th>
              <th className="p-4">İşletme Sahibi</th>
              <th className="p-4">Paket Sürümü</th>
              <th className="p-4">Kategoriler</th>
              <th className="p-4">Durum</th>
              <th className="p-4">Kuruluş Tarihi</th>
              <th className="p-4 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-150">
            {filteredBusinesses.length > 0 ? (
              filteredBusinesses.map((biz) => {
                const isActive = biz.status === 'ACTIVE';
                const currentPlan = biz.subscription?.planId || 'starter';
                const isOpLoading = loading === biz.id;

                return (
                  <tr key={biz.id} className="hover:bg-stone-50/50 text-black font-bold">
                    
                    {/* Business Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                          isActive 
                            ? 'bg-purple-500/10 border-purple-500/20 text-purple-600' 
                            : 'bg-red-500/10 border-red-500/20 text-red-650'
                        }`}>
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-black text-sm">{biz.name}</span>
                          <span className="text-[10px] text-stone-500 font-mono font-medium">/menu/{biz.slug}</span>
                        </div>
                      </div>
                    </td>

                    {/* Owner Info */}
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-black text-sm">{biz.owner.name}</span>
                        <span className="text-[10px] text-stone-500 font-mono font-medium">{biz.owner.email}</span>
                      </div>
                    </td>

                    {/* Subscription Plan */}
                    <td className="p-4">
                      <select
                        disabled={isOpLoading}
                        value={currentPlan}
                        onChange={(e) => handlePlanChange(biz.id, e.target.value)}
                        className="bg-white border border-stone-250 rounded-lg px-2 py-1 text-xs outline-none text-black font-black cursor-pointer focus:border-indigo-500 transition-colors"
                      >
                        <option value="starter">Başlangıç</option>
                        <option value="pro">Pro</option>
                        <option value="premium">Premium</option>
                      </select>
                    </td>

                    {/* Categories count */}
                    <td className="p-4 font-mono text-stone-600 font-bold text-sm">
                      {biz._count.categories} Grup
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
                            Askıda
                          </>
                        )}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="p-4 text-stone-500 font-medium flex items-center gap-1 mt-2">
                      <Calendar className="w-3.5 h-3.5 opacity-60" />
                      {new Date(biz.createdAt).toLocaleDateString('tr-TR')}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/menu/${biz.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-colors"
                          title="QR Menüyü Canlı Gör"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          disabled={isOpLoading}
                          onClick={() => handleToggleStatus(biz.id, biz.status)}
                          className={`px-3 py-1.5 rounded-lg font-black border transition-all text-[11px] active:scale-95 disabled:opacity-50 ${
                            isActive 
                              ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-150' 
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-150'
                          }`}
                        >
                          {isActive ? 'Askıya Al' : 'Aktifleştir'}
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-stone-400 italic">
                  İşletme bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Businesses — mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        {filteredBusinesses.length > 0 ? (
          filteredBusinesses.map((biz) => {
            const isActive = biz.status === 'ACTIVE';
            const currentPlan = biz.subscription?.planId || 'starter';
            const isOpLoading = loading === biz.id;

            return (
              <div key={biz.id} className="border border-stone-200 rounded-2xl bg-white shadow-sm p-4 flex flex-col gap-3 text-black">
                {/* Top: identity + status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border shrink-0 ${
                      isActive
                        ? 'bg-purple-500/10 border-purple-500/20 text-purple-600'
                        : 'bg-red-500/10 border-red-500/20 text-red-650'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-extrabold text-black text-sm truncate">{biz.name}</span>
                      <span className="text-[10px] text-stone-500 font-mono font-medium truncate">/menu/{biz.slug}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-black shrink-0 ${
                    isActive
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                      : 'bg-red-500/10 border-red-500/20 text-red-650'
                  }`}>
                    {isActive ? <CheckCircle2 className="w-3 h-3" /> : <AlertOctagon className="w-3 h-3" />}
                    {isActive ? 'Aktif' : 'Askıda'}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-xs border-t border-stone-100 pt-3">
                  <div className="flex flex-col gap-1 col-span-2">
                    <span className="text-[9px] text-stone-400 font-black uppercase tracking-wider">İşletme Sahibi</span>
                    <span className="text-black font-bold truncate">{biz.owner.name}</span>
                    <span className="text-[10px] text-stone-500 font-mono font-medium truncate">{biz.owner.email}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-stone-400 font-black uppercase tracking-wider">Kategoriler</span>
                    <span className="font-mono text-stone-600 font-bold">{biz._count.categories} Grup</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-stone-400 font-black uppercase tracking-wider">Kuruluş</span>
                    <span className="text-stone-500 font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 opacity-60" />
                      {new Date(biz.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 col-span-2">
                    <span className="text-[9px] text-stone-400 font-black uppercase tracking-wider">Paket</span>
                    <select
                      disabled={isOpLoading}
                      value={currentPlan}
                      onChange={(e) => handlePlanChange(biz.id, e.target.value)}
                      className="bg-white border border-stone-250 rounded-lg px-2 py-1.5 text-xs outline-none text-black font-black cursor-pointer focus:border-indigo-500 transition-colors w-full"
                    >
                      <option value="starter">Başlangıç</option>
                      <option value="pro">Pro</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 border-t border-stone-100 pt-3">
                  <a
                    href={`/menu/${biz.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-stone-50 border border-stone-200 text-stone-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-colors"
                    title="QR Menüyü Canlı Gör"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    disabled={isOpLoading}
                    onClick={() => handleToggleStatus(biz.id, biz.status)}
                    className={`flex-1 px-3 py-2 rounded-lg font-black border transition-all text-[11px] active:scale-95 disabled:opacity-50 ${
                      isActive
                        ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-150'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-150'
                    }`}
                  >
                    {isActive ? 'Askıya Al' : 'Aktifleştir'}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-stone-400 italic border border-stone-200 rounded-2xl bg-white">
            İşletme bulunamadı.
          </div>
        )}
      </div>

    </div>
  );
}
