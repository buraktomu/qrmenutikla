'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { importTextMenuAction, saveEasyMenuAction } from '@/app/actions/menu';
import { 
  Sparkles, 
  FileText, 
  Camera, 
  Trash2, 
  Loader2, 
  Plus, 
  AlertTriangle, 
  Check, 
  FileImage,
  UploadCloud
} from 'lucide-react';

type EasyMenuManagerProps = {
  businessId: string;
  onSuccess: () => void;
};

type ParsedProduct = {
  name: string;
  price: number | null;
  description: string;
};

type ParsedCategory = {
  name: string;
  products: ParsedProduct[];
};

export default function EasyMenuManager({ businessId, onSuccess }: EasyMenuManagerProps) {
  const { showToast } = useToast();
  const [activeMode, setActiveMode] = useState<'text' | 'photo'>('text');

  // Text Mode State
  const [textMenu, setTextMenu] = useState('');
  const [importingText, setImportingText] = useState(false);

  // Photo Mode State
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [parsingPhotos, setParsingPhotos] = useState(false);
  
  // OCR Preview / Edit State
  const [previewData, setPreviewData] = useState<ParsedCategory[] | null>(null);
  const [savingMenu, setSavingMenu] = useState(false);

  const handleTextImport = async () => {
    if (!textMenu.trim()) {
      showToast('Lütfen menü metnini girin.', 'error');
      return;
    }
    setImportingText(true);
    const res = await importTextMenuAction(businessId, textMenu);
    if (res.success) {
      showToast('Menü başarıyla aktarıldı.', 'success');
      setTextMenu('');
      onSuccess();
    } else {
      showToast(res.error || 'Menü aktarılamadı.', 'error');
    }
    setImportingText(false);
  };

  const handlePhotoSelect = async (files: FileList | null) => {
    if (!files) return;
    if (files.length + uploadedUrls.length > 10) {
      showToast('En fazla 10 adet fotoğraf yükleyebilirsiniz.', 'error');
      return;
    }
    setUploadingFiles(true);
    const urls = [...uploadedUrls];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(Math.round((i / files.length) * 100));

        const fd = new FormData();
        fd.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: fd,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            urls.push(data.url);
          }
        }
      }
      setUploadedUrls(urls);
      showToast('Fotoğraflar yüklendi. Şimdi "Analiz Et" butonuna basarak işleyebilirsiniz.', 'success');
    } catch {
      showToast('Fotoğraflar yüklenirken hata oluştu.', 'error');
    } finally {
      setUploadingFiles(false);
      setUploadProgress(null);
    }
  };

  const handleAnalyzePhotos = async () => {
    if (uploadedUrls.length === 0) {
      showToast('Lütfen önce menü fotoğrafları yükleyin.', 'error');
      return;
    }
    setParsingPhotos(true);
    
    try {
      const response = await fetch('/api/menu/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          imageUrls: uploadedUrls,
        }),
      });

      const responseText = await response.text();
      if (!responseText.trim()) {
        showToast('AI/OCR boş cevap döndürdü.', 'error');
        setParsingPhotos(false);
        return;
      }

      if (!response.ok) {
        let errorMsg = 'Analiz isteği başarısız oldu.';
        try {
          const errJson = JSON.parse(responseText);
          errorMsg = errJson.error || errorMsg;
        } catch {
          errorMsg = `Sunucu hatası: ${response.status}`;
        }
        showToast(errorMsg, 'error');
        setParsingPhotos(false);
        return;
      }

      let res: any;
      try {
        res = JSON.parse(responseText);
      } catch {
        showToast('Analiz sonucu geçersiz formatta (JSON değil).', 'error');
        setParsingPhotos(false);
        return;
      }

      if (res.success && res.categories) {
        setPreviewData(res.categories);
        showToast('Fotoğraflar başarıyla analiz edildi. Lütfen aşağıdaki bilgileri onaylayın.', 'success');
      } else {
        showToast(res.error || 'Fotoğraflar analiz edilemedi.', 'error');
      }
    } catch (err: any) {
      console.error('OCR Client Error:', err);
      showToast('Bağlantı hatası oluştu, lütfen internetinizi kontrol edin.', 'error');
    } finally {
      setParsingPhotos(false);
    }
  };

  const handleRemoveUploadedPhoto = (indexToRemove: number) => {
    setUploadedUrls(uploadedUrls.filter((_, idx) => idx !== indexToRemove));
  };

  // Preview Actions
  const handleUpdateCategoryName = (catIdx: number, newName: string) => {
    if (!previewData) return;
    const updated = [...previewData];
    updated[catIdx].name = newName;
    setPreviewData(updated);
  };

  const handleUpdateProduct = (catIdx: number, prodIdx: number, fields: Partial<ParsedProduct>) => {
    if (!previewData) return;
    const updated = [...previewData];
    updated[catIdx].products[prodIdx] = {
      ...updated[catIdx].products[prodIdx],
      ...fields
    };
    setPreviewData(updated);
  };

  const handleRemoveProduct = (catIdx: number, prodIdx: number) => {
    if (!previewData) return;
    const updated = [...previewData];
    updated[catIdx].products = updated[catIdx].products.filter((_, idx) => idx !== prodIdx);
    setPreviewData(updated);
  };

  const handleSaveMenuFromPreview = async () => {
    if (!previewData || previewData.length === 0) return;

    // Verify if there are any products with empty prices
    let hasEmptyPrices = false;
    previewData.forEach((cat) => {
      cat.products.forEach((prod) => {
        if (prod.price === null || isNaN(prod.price)) {
          hasEmptyPrices = true;
        }
      });
    });

    if (hasEmptyPrices) {
      if (!confirm('Bazı ürünlerin fiyatları girilmemiş veya tanımsız görünüyor. Devam etmek istiyor musunuz? (Fiyatlar 0 olarak kaydedilir)')) {
        return;
      }
    }

    setSavingMenu(true);
    const res = await saveEasyMenuAction(businessId, previewData);
    if (res.success) {
      showToast('Kategoriler ve ürünler menünüze başarıyla aktarıldı!', 'success');
      setPreviewData(null);
      setUploadedUrls([]);
      onSuccess();
    } else {
      showToast(res.error || 'Kaydetme işlemi başarısız oldu.', 'error');
    }
    setSavingMenu(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl text-black">
      
      {/* Mode Switches */}
      <div className="flex gap-2 p-1 bg-stone-100 rounded-xl border border-stone-250 w-fit text-xs font-black">
        <button
          onClick={() => { setActiveMode('text'); setPreviewData(null); }}
          className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5 ${activeMode === 'text' ? 'bg-white text-black shadow-sm' : 'text-stone-600 hover:text-black'}`}
        >
          <FileText className="w-4 h-4" />
          Hızlı Metinle Menü Ekle
        </button>
        <button
          onClick={() => { setActiveMode('photo'); setPreviewData(null); }}
          className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5 ${activeMode === 'photo' ? 'bg-white text-black shadow-sm' : 'text-stone-600 hover:text-black'}`}
        >
          <Camera className="w-4 h-4" />
          Fotoğraftan Menü Aktar
        </button>
      </div>

      {/* Mode A: Fast Text */}
      {activeMode === 'text' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-black text-black">Hızlı Metin Girişi</h3>
            <p className="text-xs text-stone-500 font-medium leading-relaxed">
              Sol tarafa kategori adı, alt satırlarına ise tire (-) ile başlayan ürünleri fiyat ve açıklama bilgileriyle birlikte yazın.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-stone-700">Metin Şablonu</label>
              <textarea
                value={textMenu}
                onChange={(e) => setTextMenu(e.target.value)}
                placeholder={`Burgerler\n- Cheeseburger | 250 TL | Nefis Cheddar Peyniri\n- Smokehouse Burger | 295 TL | Özel Barbekü Soslu\n\nİçecekler\n- Cola | 60 TL\n- Ayran | 45 TL`}
                rows={10}
                className="w-full bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-xs font-mono font-semibold outline-none resize-none"
              />
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 flex flex-col gap-4 text-xs">
              <span className="font-black text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-4.5 h-4.5 text-indigo-600" />
                İpucu & Kurallar
              </span>
              <ul className="list-disc pl-4 space-y-2.5 text-stone-700 font-semibold leading-relaxed">
                <li>Kategori isimlerini düz metin satırı olarak yazın.</li>
                <li>Ürünleri her zaman <code className="bg-indigo-100/80 text-indigo-950 px-1 rounded font-mono">-</code> ile başlatın.</li>
                <li>Özellikleri <code className="bg-indigo-100/80 text-indigo-950 px-1 rounded font-mono">|</code> (pipe) karakteriyle ayırın.</li>
                <li>Sıralama: <code className="bg-indigo-100/80 text-indigo-950 px-1.5 rounded font-mono">Ürün Adı | Fiyat | Açıklama</code> şeklindedir.</li>
                <li>Aynı isimli kategori varsa ürünler doğrudan o kategorinin içine eklenir.</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end border-t border-stone-100 pt-4 mt-2">
            <button
              onClick={handleTextImport}
              disabled={importingText || !textMenu.trim()}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-lg transition-all active:scale-98 disabled:opacity-50"
            >
              {importingText ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Metin İşleniyor...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Menüye Aktar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Mode B: Photo Mode */}
      {activeMode === 'photo' && !previewData && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-black text-black">Fotoğraftan Otomatik Menü Aktarma</h3>
            <p className="text-xs text-stone-500 font-medium leading-relaxed">
              Mevcut kağıt menünüzün en fazla 10 adet net fotoğrafını yükleyin. Yapay zeka tüm kategorileri, ürünleri ve fiyatları sizin için okuyup hazırlayacaktır.
            </p>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files) handlePhotoSelect(e.dataTransfer.files);
            }}
            onClick={() => document.getElementById('easy-menu-photos')?.click()}
            className="border-2 border-dashed border-stone-200 hover:border-indigo-500 rounded-2xl p-8 bg-stone-50/50 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
          >
            <input
              type="file"
              id="easy-menu-photos"
              accept="image/*"
              multiple
              onChange={(e) => handlePhotoSelect(e.target.files)}
              className="hidden"
            />
            {uploadingFiles ? (
              <div className="flex flex-col items-center gap-2 w-full">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                {uploadProgress !== null && (
                  <div className="w-full max-w-[200px] bg-stone-200 border border-stone-250 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                <span className="text-xs font-black text-indigo-600">Dosyalar Yükleniyor... %{uploadProgress ?? 0}</span>
              </div>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-stone-400" />
                <span className="text-xs font-black text-black">Menü Fotoğraflarını Seçin veya Sürükleyin</span>
                <span className="text-[10px] text-stone-400 font-bold">Maksimum 10 adet fotoğraf (Görsel dosyaları)</span>
              </>
            )}
          </div>

          {/* Uploaded Files Grid list */}
          {uploadedUrls.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-stone-700">Yüklenmiş Fotoğraflar ({uploadedUrls.length}/10)</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {uploadedUrls.map((url, idx) => (
                  <div key={url} className="relative rounded-xl border border-stone-200 aspect-square group overflow-hidden bg-stone-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Menu Page ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveUploadedPhoto(idx)}
                      className="absolute top-1.5 right-1.5 p-1 bg-white/95 rounded-lg border border-stone-200 text-red-650 hover:bg-red-50 transition-colors"
                      title="Görseli kaldır"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analyze Actions Button */}
          <div className="flex justify-end border-t border-stone-100 pt-4 mt-2">
            <button
              onClick={handleAnalyzePhotos}
              disabled={parsingPhotos || uploadedUrls.length === 0}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-lg transition-all active:scale-98 disabled:opacity-50"
            >
              {parsingPhotos ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Yapay Zeka Menüyü Okuyor... (OCR)
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Menüyü Analiz Et (AI/OCR)
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* OCR Preview & Edit Confirmation View */}
      {activeMode === 'photo' && previewData && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex flex-col gap-6 animate-fade-in">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-black text-black">Menü Analiz Önizleme / Onay</h3>
                <p className="text-xs text-stone-500 font-medium leading-relaxed">
                  Aşağıdaki verileri inceleyin, yanlış okunan kategori isimlerini, fiyatları ve açıklamaları doğrudan düzenleyin. Kaydetmek istediğinizde "Menüye Aktar" butonuna basın.
                </p>
              </div>
              <button
                onClick={() => setPreviewData(null)}
                className="text-xs text-stone-600 hover:text-black font-black border border-stone-200 px-3 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100"
              >
                Geri Dön
              </button>
            </div>
          </div>

          {/* Editable Categories & Products */}
          <div className="flex flex-col gap-6">
            {previewData.map((cat, catIdx) => (
              <div key={catIdx} className="bg-stone-50/50 p-5 rounded-2xl border border-stone-200 flex flex-col gap-4">
                
                {/* Category Header Edit Input */}
                <div className="flex flex-col gap-1.5 max-w-sm">
                  <label className="text-[10px] font-black text-stone-500 tracking-wider uppercase">Kategori Adı</label>
                  <input
                    type="text"
                    value={cat.name}
                    onChange={(e) => handleUpdateCategoryName(catIdx, e.target.value)}
                    className="w-full bg-white border border-stone-250 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-bold text-black"
                  />
                </div>

                {/* Products Grid inside this category */}
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-12 gap-3 text-[10px] font-black text-stone-500 tracking-wider uppercase px-2">
                    <span className="col-span-4">Ürün Adı</span>
                    <span className="col-span-2">Fiyat</span>
                    <span className="col-span-5">Açıklama</span>
                    <span className="col-span-1 text-center">İşlem</span>
                  </div>

                  {cat.products.map((prod, prodIdx) => (
                    <div key={prodIdx} className="grid grid-cols-12 gap-3 items-center bg-white p-2.5 rounded-xl border border-stone-150 shadow-sm relative">
                      {/* Name */}
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={prod.name}
                          onChange={(e) => handleUpdateProduct(catIdx, prodIdx, { name: e.target.value })}
                          className="w-full bg-stone-50/50 border border-stone-200 focus:border-indigo-500 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs font-semibold text-black"
                        />
                      </div>

                      {/* Price input + error if null */}
                      <div className="col-span-2 relative">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={prod.price === null ? '' : prod.price}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : parseFloat(e.target.value);
                              handleUpdateProduct(catIdx, prodIdx, { price: val });
                            }}
                            placeholder="Belirtilmedi"
                            className={`w-full bg-stone-50/50 border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-black ${
                              prod.price === null || prod.price === 0 ? 'border-amber-400 focus:border-amber-500 bg-amber-50/20' : 'border-stone-200 focus:border-indigo-500 focus:bg-white'
                            }`}
                          />
                          {(prod.price === null || prod.price === 0) && (
                            <span className="absolute right-2 text-amber-600" title="Fiyat bulunamadı, lütfen kontrol edin!">
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={prod.description}
                          onChange={(e) => handleUpdateProduct(catIdx, prodIdx, { description: e.target.value })}
                          className="w-full bg-stone-50/50 border border-stone-200 focus:border-indigo-500 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs font-semibold text-black"
                        />
                      </div>

                      {/* Remove item */}
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(catIdx, prodIdx)}
                          className="p-1.5 text-red-650 hover:bg-red-50 rounded-lg transition-colors border border-stone-150 hover:border-red-200"
                          title="Ürünü sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {cat.products.length === 0 && (
                    <div className="text-center py-4 text-xs font-semibold text-stone-500 bg-white border border-stone-150 rounded-xl">
                      Bu kategoride hiç ürün kalmadı.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Confirm Import Actions */}
          <div className="flex justify-end gap-3 border-t border-stone-100 pt-4 mt-2">
            <button
              onClick={() => setPreviewData(null)}
              className="px-5 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-black text-stone-700"
            >
              Vazgeç
            </button>
            <button
              onClick={handleSaveMenuFromPreview}
              disabled={savingMenu || previewData.length === 0}
              className="px-6 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 active:scale-98 disabled:opacity-50"
            >
              {savingMenu ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sisteme Aktarılıyor...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Menüye Aktar ({previewData.reduce((acc, c) => acc + c.products.length, 0)} Ürün)
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
