'use client';

import React, { useState } from 'react';
import { PLANS } from '@/config/plans';
import { Check, CreditCard, X, MessageSquare, Mail, Phone, Send, Sparkles } from 'lucide-react';

// ─── Satış iletişim bilgileri — buradan değiştirin ──────────────────────────
const SALES_WHATSAPP = '905555555555'; // Başında 90 ile ülke kodu
const SALES_EMAIL    = 'info@qrmenu.com';
// ─────────────────────────────────────────────────────────────────────────────

type BillingManagerProps = {
  activePlanId: string;
  businessName: string;
  userEmail: string;
};

type ModalState = {
  open: boolean;
  planId: string;
  planName: string;
};

export default function BillingManager({
  activePlanId,
  businessName,
  userEmail,
}: BillingManagerProps) {
  const [modal, setModal] = useState<ModalState>({ open: false, planId: '', planName: '' });
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const openModal = (planId: string, planName: string) => {
    setPhone('');
    setMessage(`Merhaba, "${planName}" paketi hakkında bilgi almak istiyorum.`);
    setSent(false);
    setModal({ open: true, planId, planName });
  };

  const closeModal = () => setModal({ open: false, planId: '', planName: '' });

  // WhatsApp ile gönder
  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `🔔 *Paket Talebi*\n` +
      `📦 Paket: ${modal.planName}\n` +
      `🏢 İşletme: ${businessName}\n` +
      `📧 E-posta: ${userEmail}\n` +
      `📱 Telefon: ${phone || 'Belirtilmedi'}\n` +
      `💬 Mesaj: ${message}`
    );
    window.open(`https://wa.me/${SALES_WHATSAPP}?text=${text}`, '_blank');
    setSent(true);
  };

  // E-posta ile gönder
  const handleEmail = () => {
    const subject = encodeURIComponent(`Paket Talebi — ${modal.planName} | ${businessName}`);
    const body = encodeURIComponent(
      `Paket Talebi\n\n` +
      `Paket: ${modal.planName}\n` +
      `İşletme: ${businessName}\n` +
      `E-posta: ${userEmail}\n` +
      `Telefon: ${phone || 'Belirtilmedi'}\n\n` +
      `Mesaj:\n${message}`
    );
    window.open(`mailto:${SALES_EMAIL}?subject=${subject}&body=${body}`, '_blank');
    setSent(true);
  };

  return (
    <>
      <div className="flex flex-col gap-8">

        {/* Aktif paket kartı */}
        <div className="p-6 rounded-2xl border border-stone-200 bg-stone-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest block">Aktif Paket</span>
            <div className="flex items-center gap-2 mt-1.5">
              <h3 className="text-lg font-bold text-black">
                {PLANS.find((p) => p.id === activePlanId)?.name || 'Başlangıç'} Paketi
              </h3>
              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-bold px-2 py-0.5 rounded-full">
                Aktif
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Bilgi notu */}
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-amber-50 border border-amber-200">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-stone-700 font-medium leading-relaxed">
            Paket yükseltme veya değişiklik için ekibimizle iletişime geçin. 
            Paketler WhatsApp, e-posta veya telefon üzerinden manuel olarak aktifleştirilmektedir.
          </p>
        </div>

        <div className="h-px bg-stone-200 w-full" />

        {/* Paket kartları */}
        <div>
          <h3 className="text-base font-bold text-black mb-6">Paketler</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const isCurrent = plan.id === activePlanId;

              return (
                <div
                  key={plan.id}
                  className={`p-6 rounded-2xl border flex flex-col justify-between relative transition-all duration-300 ${
                    isCurrent
                      ? 'border-indigo-400 bg-indigo-50/60 shadow-lg shadow-indigo-100'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute top-0 right-6 -translate-y-1/2 bg-indigo-600 text-[8px] font-bold uppercase tracking-widest text-white px-2 py-0.5 rounded-full">
                      Aktif Paket
                    </span>
                  )}

                  <div>
                    <h4 className="text-base font-bold text-black">{plan.name}</h4>
                    <p className="text-[10px] text-stone-500 mt-1 font-light leading-relaxed">{plan.description}</p>

                    <div className="h-px bg-stone-200 my-4" />

                    <ul className="flex flex-col gap-3 text-xs mb-6">
                      {plan.features.slice(0, 5).map((feat, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className={`w-3.5 h-3.5 shrink-0 ${feat.included ? 'text-indigo-500' : 'text-stone-300'}`} />
                          <span className={feat.included ? 'text-black font-medium' : 'text-stone-400 line-through font-light'}>
                            {feat.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    disabled={isCurrent}
                    onClick={() => !isCurrent && openModal(plan.id, plan.name)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isCurrent
                        ? 'bg-indigo-100 text-indigo-600 border border-indigo-200 cursor-default'
                        : 'bg-stone-900 hover:bg-stone-800 text-white cursor-pointer hover:shadow-md active:scale-[0.98]'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Aktif Sürüm
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-3.5 h-3.5" />
                        İletişime Geç
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alt iletişim satırı */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-stone-200 bg-stone-50">
          <div>
            <p className="text-sm font-bold text-black">Sorunuz mu var?</p>
            <p className="text-xs text-stone-500 mt-0.5">Satış ekibimiz size yardımcı olmaktan mutluluk duyar.</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${SALES_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </a>
            <a
              href={`mailto:${SALES_EMAIL}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-black text-xs font-bold transition-all"
            >
              <Mail className="w-4 h-4" />
              E-posta
            </a>
          </div>
        </div>

      </div>

      {/* ── İletişim Modalı ───────────────────────────────────────────────── */}
      {modal.open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">

            {/* Modal başlık */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
              <div>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Paket Talebi</p>
                <h4 className="text-base font-black text-black mt-0.5">{modal.planName} Paketi</h4>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sent ? (
              /* Gönderildi durumu */
              <div className="px-6 py-10 flex flex-col items-center gap-4 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <h5 className="text-base font-black text-black">Talebiniz İletildi!</h5>
                  <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                    Ekibimiz en kısa sürede size geri dönüş yapacak.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="mt-2 px-6 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-all"
                >
                  Kapat
                </button>
              </div>
            ) : (
              /* Form */
              <div className="px-6 py-5 flex flex-col gap-4">

                {/* Bilgi satırları */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">İşletme</label>
                    <div className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-black truncate">
                      {businessName}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">E-posta</label>
                    <div className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-black truncate">
                      {userEmail}
                    </div>
                  </div>
                </div>

                {/* Telefon */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-black">Telefon Numaranız</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+90 555 000 00 00"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-400 focus:bg-white text-sm outline-none text-black font-medium transition-all"
                    />
                  </div>
                </div>

                {/* Mesaj */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-black">Mesajınız</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-400 focus:bg-white text-sm outline-none text-black font-medium resize-none transition-all"
                  />
                </div>

                {/* Gönderim butonları */}
                <div className="flex flex-col gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 active:scale-[0.98]"
                  >
                    <MessageSquare className="w-4.5 h-4.5" />
                    WhatsApp ile Gönder
                  </button>
                  <button
                    type="button"
                    onClick={handleEmail}
                    className="w-full py-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-black text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Mail className="w-4.5 h-4.5" />
                    E-posta ile Gönder
                  </button>
                </div>

                <p className="text-center text-[10px] text-stone-400 font-medium">
                  Ekibimiz genellikle 24 saat içinde geri dönüş yapar.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
