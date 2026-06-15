'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { updatePlatformSettings } from '@/app/actions/admin';
import { Sparkles, Bell, Save, AlertTriangle } from 'lucide-react';

type SettingsManagerProps = {
  initialSettings: {
    aiEnabled: boolean;
    orderingEnabled: boolean;
  };
};

export default function SettingsManager({ initialSettings }: SettingsManagerProps) {
  const { showToast } = useToast();
  const [aiEnabled, setAiEnabled] = useState(initialSettings.aiEnabled);
  const [orderingEnabled, setOrderingEnabled] = useState(initialSettings.orderingEnabled);
  const [loading, setLoading] = useState(false);

  const dirty =
    aiEnabled !== initialSettings.aiEnabled ||
    orderingEnabled !== initialSettings.orderingEnabled;

  const handleSave = async () => {
    setLoading(true);
    const res = await updatePlatformSettings({ aiEnabled, orderingEnabled });
    if (res.success) {
      showToast('Sistem ayarları güncellendi.', 'success');
    } else {
      showToast(res.error || 'Ayarlar kaydedilemedi.', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      {/* AI master switch */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black text-black">Yapay Zeka Sistemi</span>
            <span className="text-xs text-stone-500 font-medium mt-1 leading-relaxed">
              Kapatıldığında tüm işletmelerde AI açıklama, kalori/makro tahmini ve kampanya metni
              özellikleri devre dışı kalır (paket hakları olsa bile).
            </span>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
          <input
            type="checkbox"
            checked={aiEnabled}
            onChange={(e) => setAiEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-stone-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-stone-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
        </label>
      </div>

      {/* Ordering / waiter-call master switch */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black text-black">Sipariş & Garson Çağırma</span>
            <span className="text-xs text-stone-500 font-medium mt-1 leading-relaxed">
              Kapatıldığında tüm QR menülerde sepet/sipariş ve garson çağırma akışı gizlenir; menü
              yalnızca görüntüleme modunda çalışır (işletme ayarı açık olsa bile).
            </span>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
          <input
            type="checkbox"
            checked={orderingEnabled}
            onChange={(e) => setOrderingEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-stone-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-stone-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
        </label>
      </div>

      {/* Warning when something is off */}
      {(!aiEnabled || !orderingEnabled) && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-stone-700 font-medium leading-relaxed">
            Bu ayarlar <strong>tüm işletmeleri</strong> aynı anda etkiler. Kapalı özellikler hiçbir
            işletmede kullanılamaz.
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading || !dirty}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black tracking-wide transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/15 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
        </button>
      </div>
    </div>
  );
}
