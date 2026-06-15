'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { completeMockSubscription } from '@/app/actions/billing';
import { PLANS } from '@/config/plans';
import { 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  ArrowLeft, 
  Sparkles,
  Loader2 
} from 'lucide-react';
import Link from 'next/link';

function CheckoutSimulatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const businessId = searchParams.get('business_id') || '';
  const planId = searchParams.get('plan_id') || 'starter';
  const successUrl = searchParams.get('success_url') || '/dashboard/billing';
  const cancelUrl = searchParams.get('cancel_url') || '/dashboard/billing';

  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const plan = PLANS.find((p) => p.id === planId) || PLANS[0];

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvv || !cardName) {
      showToast('Lütfen kart bilgilerini eksiksız doldurun.', 'error');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate 1.5s gateway delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const res = await completeMockSubscription(businessId, planId);
      
      if (res.success) {
        showToast('Ödeme başarıyla doğrulandı! Paketiniz yükseltildi.', 'success');
        router.push(successUrl);
      } else {
        showToast(res.error || 'Ödeme kaydedilemedi.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Ödeme işlenirken sistem hatası oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background glow */}
      <div className="absolute w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl -top-10 -left-10 pointer-events-none -z-10" />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch bg-zinc-900/40 border border-zinc-800 rounded-3xl p-5 sm:p-8 backdrop-blur-md shadow-2xl relative">
        
        {/* Cancel / back */}
        <Link
          href={cancelUrl}
          className="md:absolute md:-top-12 md:left-2 col-span-full flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors -mt-2 mb-2 md:m-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Ödemeyi İptal Et ve Geri Dön
        </Link>

        {/* Left column - details */}
        <div className="md:col-span-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-800 pb-6 md:pb-0 md:pr-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Güvenli Test Sayfası
            </div>
            
            <h2 className="text-xl font-bold text-white mt-4">{plan.name} Paketi Aboneliği</h2>
            <p className="text-xs text-zinc-500 font-light mt-1">İşletmeniz için akıllı QR menü kiralama ödemesi.</p>
            
            <div className="my-8 flex items-baseline gap-1 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
              <span className="text-3xl font-extrabold text-white">{plan.price} TL</span>
              <span className="text-xs text-zinc-500">/Ay (KDV Dahil)</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>256-bit SSL Koruma Simülasyonu</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>İstediğiniz bilgileri girerek ödeme yapabilirsiniz.</span>
            </div>
          </div>
        </div>

        {/* Right column - card input details */}
        <form onSubmit={handlePay} className="md:col-span-7 flex flex-col gap-5 justify-between pt-2 md:pt-0 md:pl-4">
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              Kart Bilgileri
            </h3>
            
            {/* Cardholder Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Kart Sahibinin Adı</label>
              <input
                type="text"
                required
                placeholder="Ahmet Yılmaz"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-850 focus:border-indigo-500 text-sm outline-none text-white font-medium"
              />
            </div>

            {/* Card Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Kart Numarası</label>
              <input
                type="text"
                required
                maxLength={19}
                placeholder="4000 1234 5678 9010"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-850 focus:border-indigo-500 text-sm outline-none text-white font-mono"
              />
            </div>

            {/* Expiry & CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Son Kullanma Tarihi</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  placeholder="AA/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-850 focus:border-indigo-500 text-sm outline-none text-white text-center font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">CVV (Güvenlik Kodu)</label>
                <input
                  type="password"
                  required
                  maxLength={3}
                  placeholder="•••"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-850 focus:border-indigo-500 text-sm outline-none text-white text-center font-mono"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 active:scale-98 disabled:opacity-50 mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                Ödeme İşleniyor...
              </>
            ) : (
              `Ödemeyi Güvenle Yap (${plan.price} TL)`
            )}
          </button>
        </form>

      </div>
    </div>
  );
}

export default function CheckoutSimulatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-xs">Yükleniyor...</div>}>
      <CheckoutSimulatorContent />
    </Suspense>
  );
}
