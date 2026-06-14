'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useToast } from '@/components/ToastProvider';
import { 
  Download, 
  Copy, 
  Check, 
  Printer, 
  Settings, 
  QrCode 
} from 'lucide-react';

type QrGeneratorProps = {
  businessSlug: string;
  businessName: string;
};

export default function QrGenerator({ businessSlug, businessName }: QrGeneratorProps) {
  const { showToast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [qrSize, setQrSize] = useState<number>(300);
  const [qrColor, setQrColor] = useState<string>('#000000');

  // Compute public menu URL (absolute path fallback)
  const [menuUrl, setMenuUrl] = useState('');

  useEffect(() => {
    // Determine host dynamically on the client
    setMenuUrl(`${window.location.protocol}//${window.location.host}/menu/${businessSlug}`);
  }, [businessSlug]);

  useEffect(() => {
    if (!menuUrl || !canvasRef.current) return;

    QRCode.toCanvas(
      canvasRef.current,
      menuUrl,
      {
        width: qrSize,
        margin: 2,
        color: {
          dark: qrColor,
          light: '#ffffff',
        },
      },
      (error) => {
        if (error) console.error('QR Code generation error:', error);
      }
    );
  }, [menuUrl, qrSize, qrColor]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      showToast('Menü bağlantısı kopyalandı.', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Bağlantı kopyalanamadı.', 'error');
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create virtual high-res canvas for printing quality (1000px)
    const downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = 1000;
    downloadCanvas.height = 1000;

    QRCode.toCanvas(
      downloadCanvas,
      menuUrl,
      {
        width: 1000,
        margin: 2,
        color: {
          dark: qrColor,
          light: '#ffffff',
        },
      },
      (error) => {
        if (error) {
          showToast('QR indirilirken hata oluştu.', 'error');
          return;
        }

        const link = document.createElement('a');
        link.download = `${businessSlug}-qr-menu.png`;
        link.href = downloadCanvas.toDataURL('image/png');
        link.click();
        showToast('QR kod yüksek çözünürlüklü olarak indirildi.', 'success');
      }
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Left Column - Preview Card */}
      <div className="lg:col-span-5 p-8 rounded-3xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm flex flex-col items-center text-center">
        <h3 className="text-sm font-bold text-zinc-400 mb-6">QR Kod Canlı Önizleme</h3>
        
        {/* QR container */}
        <div className="p-4 rounded-2xl bg-white border border-zinc-800 flex items-center justify-center shadow-2xl relative overflow-hidden group">
          <canvas ref={canvasRef} className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px]" />
        </div>

        <div className="mt-6 font-mono text-[10px] text-zinc-500 break-all max-w-[240px]">
          {menuUrl}
        </div>
      </div>

      {/* Right Column - Customizer & Actions */}
      <div className="lg:col-span-7 flex flex-col gap-6 p-6 rounded-2xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-sm">
        
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-400" />
            Tasarım & İndirme Ayarları
          </h3>
          <p className="text-xs text-zinc-500 font-light mt-0.5">QR kodunuzun renklerini ve indirme seçeneklerini yapılandırın.</p>
        </div>

        <div className="h-px bg-zinc-900" />

        {/* Color picker */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-400">QR Kod Rengi</label>
          <div className="flex gap-2">
            {[
              { label: 'Siyah', hex: '#000000' },
              { label: 'Lacivert', hex: '#1e3a8a' },
              { label: 'Kahve', hex: '#7c2d12' },
              { label: 'Zümrüt', hex: '#064e3b' },
              { label: 'Mor', hex: '#581c87' },
            ].map((col) => (
              <button
                key={col.hex}
                onClick={() => setQrColor(col.hex)}
                className={`w-7 h-7 rounded-full border border-zinc-700 transition-all ${qrColor === col.hex ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-950 scale-105' : 'hover:scale-102'}`}
                style={{ backgroundColor: col.hex }}
                title={col.label}
              />
            ))}
          </div>
        </div>

        {/* Custom Actions */}
        <div className="flex flex-col gap-3 mt-4">
          {/* Copy URL */}
          <button
            onClick={handleCopyLink}
            className="w-full py-3 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Kopyalandı' : 'Menü Bağlantısını Kopyala'}
          </button>

          {/* Download High Res */}
          <button
            onClick={handleDownload}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/10 active:scale-98"
          >
            <Download className="w-4 h-4" />
            Yüksek Çözünürlüklü İndir (PNG)
          </button>
        </div>

        {/* Print Alert Warning Banner */}
        <div className="mt-2 p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 text-xs flex items-start gap-3">
          <Printer className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-bold text-zinc-300">Baskı Tavsiyesi</span>
            <p className="text-zinc-500 font-light leading-relaxed">
              Masalara yerleştirmek için QR kodunuzu indirip en az 300 DPI kalitede çıktı alınız. Kare kod boyutunu masa stantları için en az 4x4 cm olacak şekilde ayarlamanız tarama hızını artırır.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
