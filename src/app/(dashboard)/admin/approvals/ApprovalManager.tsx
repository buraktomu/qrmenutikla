'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { approveBusiness } from '@/app/actions/admin';
import { useRouter } from 'next/navigation';
import { Building2, CheckCircle2, Clock, ExternalLink } from 'lucide-react';

type PendingBusiness = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  owner: { name: string; email: string };
  subscription: { planId: string; status: string } | null;
};

type ApprovalManagerProps = {
  initialPending: PendingBusiness[];
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Onay Bekliyor',
  PAST_DUE: 'Ödeme Gecikti',
  CANCELED: 'İptal Edildi',
  INACTIVE: 'Pasif',
};

export default function ApprovalManager({ initialPending }: ApprovalManagerProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [pending, setPending] = useState<PendingBusiness[]>(initialPending);
  const [planChoice, setPlanChoice] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const handleApprove = async (bizId: string) => {
    const planId = planChoice[bizId] || 'starter';
    setLoading(bizId);
    const res = await approveBusiness(bizId, planId);
    if (res.success) {
      showToast('İşletme onaylandı ve aktifleştirildi.', 'success');
      setPending((prev) => prev.filter((b) => b.id !== bizId));
      router.refresh();
    } else {
      showToast(res.error || 'Onaylama başarısız.', 'error');
    }
    setLoading(null);
  };

  if (pending.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-center border border-dashed border-stone-300 rounded-2xl bg-white">
        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        <h3 className="text-base font-black text-black">Onay bekleyen işletme yok</h3>
        <p className="text-xs text-stone-500 font-medium max-w-sm">
          Tüm kayıtlı işletmeler aktif. Yeni bir kayıt geldiğinde burada onaylamak için görünecektir.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pending.map((biz) => {
        const status = biz.subscription?.status || 'INACTIVE';
        const isOpLoading = loading === biz.id;
        return (
          <div key={biz.id} className="border border-stone-200 rounded-2xl bg-white shadow-sm p-4 sm:p-5 flex flex-col gap-4 text-black">
            {/* Identity */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-black text-sm truncate">{biz.name}</span>
                  <span className="text-[10px] text-stone-500 font-mono font-medium truncate">/menu/{biz.slug}</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-black bg-amber-500/10 border-amber-500/20 text-amber-700 shrink-0">
                <Clock className="w-3 h-3" />
                {STATUS_LABEL[status] || status}
              </span>
            </div>

            {/* Owner + date */}
            <div className="grid grid-cols-2 gap-3 text-xs border-t border-stone-100 pt-3">
              <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                <span className="text-[9px] text-stone-400 font-black uppercase tracking-wider">Sahibi</span>
                <span className="text-black font-bold truncate">{biz.owner.name}</span>
                <span className="text-[10px] text-stone-500 font-mono font-medium truncate">{biz.owner.email}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-stone-400 font-black uppercase tracking-wider">Kayıt Tarihi</span>
                <span className="text-stone-500 font-medium">{new Date(biz.createdAt).toLocaleDateString('tr-TR')}</span>
              </div>
            </div>

            {/* Approve controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-t border-stone-100 pt-3">
              <div className="flex items-center gap-2 flex-1">
                <a
                  href={`/menu/${biz.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-stone-50 border border-stone-200 text-stone-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-colors shrink-0"
                  title="Menüyü Önizle"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <select
                  value={planChoice[biz.id] || 'starter'}
                  onChange={(e) => setPlanChoice((prev) => ({ ...prev, [biz.id]: e.target.value }))}
                  className="flex-1 sm:flex-none bg-white border border-stone-250 rounded-lg px-3 py-2 text-xs outline-none text-black font-extrabold cursor-pointer focus:border-indigo-500 transition-colors"
                >
                  <option value="starter">Başlangıç paketi ile aktifleştir</option>
                  <option value="pro">Pro paketi ile aktifleştir</option>
                  <option value="premium">Premium paketi ile aktifleştir</option>
                </select>
              </div>
              <button
                disabled={isOpLoading}
                onClick={() => handleApprove(biz.id)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 shadow-sm shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isOpLoading ? 'Onaylanıyor...' : 'Onayla & Aktifleştir'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
