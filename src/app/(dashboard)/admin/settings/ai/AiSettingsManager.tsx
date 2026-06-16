'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { updatePlatformAiSettings, testOpenAiConnectionAction } from '@/app/actions/ai-settings';
import { Sparkles, Key, Cpu, HelpCircle, Save, CheckCircle2, XCircle } from 'lucide-react';

type AiSettingsManagerProps = {
  initialSettings: {
    aiEnabled: boolean;
    openaiApiKey: string;
    aiModel: string;
    maxTokens: number;
    temperature: number;
  };
};

export default function AiSettingsManager({ initialSettings }: AiSettingsManagerProps) {
  const { showToast } = useToast();
  const [aiEnabled, setAiEnabled] = useState(initialSettings.aiEnabled);
  const [openaiApiKey, setOpenaiApiKey] = useState(initialSettings.openaiApiKey);
  const [aiModel, setAiModel] = useState(initialSettings.aiModel);
  const [maxTokens, setMaxTokens] = useState(initialSettings.maxTokens);
  const [temperature, setTemperature] = useState(initialSettings.temperature);

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const isDirty =
    aiEnabled !== initialSettings.aiEnabled ||
    openaiApiKey !== initialSettings.openaiApiKey ||
    aiModel !== initialSettings.aiModel ||
    maxTokens !== initialSettings.maxTokens ||
    temperature !== initialSettings.temperature;

  const handleSave = async () => {
    setLoading(true);
    const res = await updatePlatformAiSettings({
      aiEnabled,
      openaiApiKey,
      aiModel,
      maxTokens: Number(maxTokens),
      temperature: Number(temperature),
    });

    if (res.success) {
      showToast('Yapay zeka sistem ayarları kaydedildi.', 'success');
      // Invalidate test results when saved
      setTestResult(null);
    } else {
      showToast(res.error || 'Ayarlar kaydedilemedi.', 'error');
    }
    setLoading(false);
  };

  const handleTestConnection = async () => {
    if (!openaiApiKey) {
      showToast('Lütfen önce bir API Anahtarı girin.', 'error');
      return;
    }
    setTesting(true);
    setTestResult(null);

    const res = await testOpenAiConnectionAction(openaiApiKey, aiModel, 'platform');
    if (res.success) {
      setTestResult({
        success: true,
        message: '✅ API bağlantısı başarılı',
      });
      showToast('API bağlantısı başarılı.', 'success');
    } else {
      setTestResult({
        success: false,
        message: `❌ Hata: ${res.error || 'Bilinmeyen bir hata oluştu.'}`,
      });
      showToast('API bağlantısı başarısız.', 'error');
    }
    setTesting(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl text-black">
      
      {/* Master Toggle */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black text-black">Yapay Zeka Master Anahtarı</span>
            <span className="text-xs text-stone-500 font-medium mt-1 leading-relaxed">
              Bu özellik kapatıldığında tüm platformdaki AI özellikleri tamamen pasif duruma gelir.
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

      {/* Main Configurations Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex flex-col gap-5">
        
        {/* API Key */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-black flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-stone-500" />
            OpenAI API Anahtarı
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !openaiApiKey}
              className="px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-black text-stone-700 transition-colors shrink-0 disabled:opacity-50"
            >
              {testing ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}
            </button>
          </div>
          <p className="text-[10px] text-stone-500 font-medium leading-relaxed">
            Buraya gireceğiniz API anahtarı veritabanında şifrelenmiş (AES-256) olarak saklanır. Maskeli gösterim aktif durumdadır.
          </p>
        </div>

        {/* Test Result Alert Banner */}
        {testResult && (
          <div className={`p-4 rounded-xl border text-xs font-bold flex items-start gap-2.5 ${
            testResult.success 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="h-px bg-stone-100 w-full my-1" />

        {/* AI Model Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-black flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-stone-500" />
            AI Model Seçimi
          </label>
          <select
            value={aiModel}
            onChange={(e) => setAiModel(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
          >
            <option value="gpt-4o-mini">gpt-4o-mini (Önerilen - Hızlı & Ekonomik)</option>
            <option value="gpt-4o">gpt-4o (Gelişmiş & Yüksek Performans)</option>
            <option value="gpt-3.5-turbo">gpt-3.5-turbo (Eski Model)</option>
          </select>
        </div>

        {/* Parameters Group */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Max Tokens */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-black flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
              Maksimum Jetton (maxTokens)
            </label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value) || 0)}
              min="1"
              max="4096"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Temperature */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-black flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
              Sıcaklık (temperature: {temperature})
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

        </div>

      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-2">
        <button
          onClick={handleSave}
          disabled={loading || !isDirty}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black tracking-wide transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/15 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Save className="w-4.5 h-4.5" />
          {loading ? 'Kaydediliyor...' : 'Yapay Zeka Ayarlarını Kaydet'}
        </button>
      </div>

    </div>
  );
}
