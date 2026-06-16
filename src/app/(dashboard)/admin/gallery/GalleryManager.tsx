'use client';

import React, { useState, useRef } from 'react';
import { useToast } from '@/components/ToastProvider';
import { addGalleryImage, deleteGalleryImage } from '@/app/actions/admin';
import {
  Plus,
  Trash2,
  Save,
  Image as ImageIcon,
  UploadCloud,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type GalleryImage = {
  id: string;
  categoryKey: string;
  title: string;
  imageUrl: string;
};

type GalleryManagerProps = {
  initialImages: GalleryImage[];
};

function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const cleanUrl = url.split('?')[0];
  return /\.(mp4|webm|mov)$/i.test(cleanUrl);
}

function isImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const cleanUrl = url.split('?')[0];
  return /\.(png|jpg|jpeg|webp)$/i.test(cleanUrl);
}

function MediaDisplay({
  src,
  alt,
  className,
  loading = 'lazy',
  autoPlay = false,
  loop = false,
  controls = true,
  fallback,
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  fallback?: React.ReactNode;
}) {
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return fallback ? <>{fallback}</> : null;
  }

  if (isVideoUrl(src)) {
    return (
      <video
        src={src}
        className={className}
        controls={controls}
        autoPlay={autoPlay}
        loop={loop}
        muted
        playsInline
        preload="metadata"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setHasError(true)}
    />
  );
}

export default function GalleryManager({ initialImages }: GalleryManagerProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [loading, setLoading] = useState(false);

  // Form State
  const [category, setCategory] = useState('Kahve');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);

    if (xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.url) {
            setImageUrl(data.url);
            showToast('Dosya başarıyla yüklendi.', 'success');
          } else {
            showToast(data.error || 'Dosya yüklenemedi.', 'error');
          }
        } catch (e) {
          showToast('Dosya yükleme hatası oluştu.', 'error');
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          showToast(data.error || 'Dosya yüklenemedi.', 'error');
        } catch {
          showToast('Dosya yükleme hatası oluştu.', 'error');
        }
      }
      setUploading(false);
      setUploadProgress(null);
    };

    xhr.onerror = () => {
      showToast('Dosya yükleme hatası oluştu.', 'error');
      setUploading(false);
      setUploadProgress(null);
    };

    const fd = new FormData();
    fd.append('file', file);
    xhr.send(fd);
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl) return;

    setLoading(true);
    const res = await addGalleryImage(category, title, imageUrl);
    if (res.success) {
      showToast('Görsel başarıyla ortak galeriye eklendi.', 'success');
      setTitle('');
      setImageUrl('');
      // Update local state by refetching or appending (re-loading page is safer to get absolute server state)
      router.refresh();
      window.location.reload();
    } else {
      showToast(res.error || 'Görsel eklenemedi.', 'error');
    }
    setLoading(false);
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Bu görseli ortak galeriden kaldırmak istediğinize emin misiniz?')) return;

    setLoading(true);
    const res = await deleteGalleryImage(imageId);
    if (res.success) {
      showToast('Görsel ortak galeriden kaldırıldı.', 'success');
      setImages(prev => prev.filter(img => img.id !== imageId));
      router.refresh();
    } else {
      showToast(res.error || 'Görsel silinemedi.', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Form Section */}
      <form onSubmit={handleAddImage} className="lg:col-span-4 p-6 rounded-2xl border border-stone-200 bg-white flex flex-col gap-4 shadow-sm">
        <h3 className="text-sm font-black text-black flex items-center gap-2 border-b border-stone-100 pb-3">
          <Plus className="w-4 h-4 text-indigo-600" />
          Galeriye Görsel Ekle
        </h3>
        
        {/* Category Key */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-stone-500 uppercase tracking-wider">Kategori Grubu</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-250 text-xs text-black font-extrabold outline-none cursor-pointer focus:border-indigo-500 transition-colors"
          >
            {['Kahve', 'Çay', 'Soğuk İçecekler', 'Burger', 'Pizza', 'Tatlılar', 'Sandviçler', 'Salatalar', 'Fast Food', 'Ana Yemekler'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-stone-500 uppercase tracking-wider">Görsel Adı / Başlık</label>
          <input
            type="text"
            required
            placeholder="örn. Americano, Double Burger"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-250 text-xs text-black font-semibold outline-none focus:border-indigo-500 transition-all placeholder:text-stone-400"
          />
        </div>

        {/* Image Upload */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-stone-500 uppercase tracking-wider">Görsel Dosyası</label>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleImageSelect(f); }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-250 hover:border-indigo-500 rounded-xl p-5 bg-stone-50/50 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
          >
            <input
              type="file"
              accept="image/*,video/*"
              ref={fileInputRef}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }}
              className="hidden"
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2 w-full">
                <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                {uploadProgress !== null && (
                  <div className="w-full max-w-[200px] bg-stone-250 border border-stone-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                <span className="text-[10px] text-indigo-600 font-black">Yükleniyor... %{uploadProgress ?? 0}</span>
              </div>
            ) : (
              <>
                <UploadCloud className="w-7 h-7 text-stone-400" />
                <span className="text-xs font-black text-black">Galeriden / kameradan seçin veya sürükleyin</span>
                <span className="text-[10px] text-stone-400 font-bold">Görsel (maks 2MB) veya Video (maks 50MB) yükleyebilirsiniz</span>
              </>
            )}
          </div>
          {imageUrl && (
            <div className="relative w-full h-28 rounded-xl overflow-hidden border border-stone-200 mt-1">
              <MediaDisplay src={imageUrl} alt="Önizleme" className="w-full h-full object-cover" controls autoPlay={false} loop={false} />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-white/90 border border-stone-200 text-red-600 hover:bg-red-50 transition-colors"
                title="Görseli kaldır"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || uploading || !imageUrl}
          className="w-full mt-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-600 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50 shadow-md"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Ekleniyor...' : 'Galeriye Kaydet'}
        </button>
      </form>

      {/* Images Grid */}
      <div className="lg:col-span-8 p-6 rounded-2xl border border-stone-200 bg-white grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-1 shadow-sm">
        {images.length > 0 ? (
          images.map((img) => (
            <div 
              key={img.id}
              className="p-3 bg-stone-50 border border-stone-150 rounded-xl flex flex-col justify-between group relative"
            >
              <div className="w-full h-24 rounded-lg bg-white border border-stone-200 overflow-hidden relative mb-2.5">
                <MediaDisplay src={img.imageUrl} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" autoPlay loop controls={false} />
                <span className="absolute top-1 left-1 text-[8px] bg-white/95 text-black px-1.5 py-0.5 rounded font-black border border-stone-200 uppercase tracking-wider">
                  {img.categoryKey}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-extrabold text-black truncate max-w-[100px]" title={img.title}>
                  {img.title}
                </span>
                <button
                  disabled={loading}
                  onClick={() => handleDeleteImage(img.id)}
                  className="p-1 rounded bg-white text-stone-500 hover:text-red-650 border border-stone-200 hover:border-red-200 shrink-0 transition-colors"
                  title="Görseli Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-stone-400 gap-2">
            <ImageIcon className="w-10 h-10 opacity-40 animate-pulse" />
            <span className="text-xs italic">Ortak galeride görsel bulunmuyor.</span>
          </div>
        )}
      </div>

    </div>
  );
}
