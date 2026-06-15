'use client';

import React, { useState, useRef } from 'react';
import { useToast } from '@/components/ToastProvider';
import { updateBusinessSettings } from '@/app/actions/business';
import { 
  Building2, 
  Phone, 
  MapPin, 
  MessageSquare, 
  Flame, 
  Save, 
  Video,
  ShoppingBag,
  UploadCloud,
  Loader2,
  Trash2,
  Clock,
} from 'lucide-react';

type ProfileFormProps = {
  business: {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
    whatsappNumber: string | null;
    showCalories: boolean;
    allowOrders: boolean;
    logoUrl: string | null;
    coverVideoUrl: string | null;
    coverImageUrl: string | null;
    themeId: string;
    description: string | null;
    openingHours: string | null;
    serviceType: string;
    instagramUrl: string | null;
    locationUrl: string | null;
    reviewsUrl: string | null;
  };
  hasThemeSelectionLimit: boolean;
};

export default function ProfileForm({ business }: ProfileFormProps) {
  const { showToast } = useToast();
  
  const [name, setName] = useState(business.name);
  const [phone, setPhone] = useState(business.phone || '');
  const [address, setAddress] = useState(business.address || '');
  const [whatsappNumber, setWhatsappNumber] = useState(business.whatsappNumber || '');
  const [showCalories, setShowCalories] = useState(business.showCalories);
  const [allowOrders, setAllowOrders] = useState(business.allowOrders);
  const [logoUrl, setLogoUrl] = useState(business.logoUrl || '');
  const [coverVideoUrl, setCoverVideoUrl] = useState(business.coverVideoUrl || '');
  const [coverImageUrl, setCoverImageUrl] = useState(business.coverImageUrl || '');
  const [description, setDescription] = useState(business.description || '');
  const [openingHours, setOpeningHours] = useState(business.openingHours || '09:00 - 23:00');
  const [serviceType, setServiceType] = useState<'MASA_SERVISI' | 'SELF_SERVIS' | 'HER_IKISI'>(
    (business.serviceType as 'MASA_SERVISI' | 'SELF_SERVIS' | 'HER_IKISI') || 'MASA_SERVISI'
  );
  const [instagramUrl, setInstagramUrl] = useState(business.instagramUrl || '');
  const [locationUrl, setLocationUrl] = useState(business.locationUrl || '');
  const [reviewsUrl, setReviewsUrl] = useState(business.reviewsUrl || '');
  const [loading, setLoading] = useState(false);

  // File Upload State
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Input refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, target: 'logo' | 'video' | 'image') => {
    const fd = new FormData();
    fd.append('file', file);
    
    if (target === 'logo') setUploadingLogo(true);
    if (target === 'video') setUploadingVideo(true);
    if (target === 'image') setUploadingImage(true);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (data.url) {
        if (target === 'logo') setLogoUrl(data.url);
        if (target === 'video') setCoverVideoUrl(data.url);
        if (target === 'image') setCoverImageUrl(data.url);
        showToast('Dosya başarıyla yüklendi.', 'success');
      } else {
        showToast(data.error || 'Dosya yüklenemedi.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Dosya yükleme hatası.', 'error');
    } finally {
      setUploadingLogo(false);
      setUploadingVideo(false);
      setUploadingImage(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, target: 'logo' | 'video' | 'image') => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file, target);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      showToast('İşletme adı zorunludur.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await updateBusinessSettings(business.id, {
        name,
        phone,
        address,
        whatsappNumber,
        showCalories,
        allowOrders,
        logoUrl,
        coverVideoUrl,
        coverImageUrl,
        themeId: business.themeId,
        description,
        openingHours,
        serviceType,
        instagramUrl,
        locationUrl,
        reviewsUrl,
      });

      if (res.success) {
        showToast('İşletme ayarları başarıyla güncellendi.', 'success');
      } else {
        showToast(res.error || 'Ayarlar kaydedilirken hata oluştu.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Bir sistem hatası oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderDropzone = (
    type: 'logo' | 'video' | 'image',
    currentValue: string,
    uploading: boolean,
    accept: string,
    inputRef: React.RefObject<HTMLInputElement | null>,
    label: string
  ) => {
    return (
      <div className="flex flex-col gap-1.5 w-full text-black">
        <label className="text-xs font-black text-black">{label}</label>
        
        {currentValue ? (
          <div className="relative border border-stone-200 rounded-2xl p-4 bg-stone-50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-hidden">
              {type !== 'video' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentValue} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-stone-200" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <Video className="w-6 h-6 text-indigo-600" />
                </div>
              )}
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-black truncate">{currentValue.split('/').pop()}</span>
                <span className="text-[9px] text-black font-mono font-bold tracking-tight mt-0.5 truncate">{currentValue}</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => {
                if (type === 'logo') setLogoUrl('');
                if (type === 'video') setCoverVideoUrl('');
                if (type === 'image') setCoverImageUrl('');
              }}
              className="p-2.5 rounded-xl hover:bg-red-50 text-red-650 transition-colors shrink-0"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, type)}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-stone-200 hover:border-indigo-500 rounded-2xl p-6 bg-stone-50/50 hover:bg-indigo-50/5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
          >
            <input
              type="file"
              ref={inputRef}
              accept={accept}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, type);
              }}
              className="hidden"
            />
            {uploading ? (
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8 text-black" />
            )}
            <div>
              <span className="text-xs font-black text-black">Yüklemek için tıklayın veya sürükleyin</span>
              <p className="text-[10px] text-black mt-1 font-bold">Dosyayı buraya bırakabilirsiniz</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl text-black">
      
      {/* Main card in clean premium light mode style */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-8 shadow-xl shadow-stone-100 flex flex-col gap-6 text-black">
        
        <div>
          <h3 className="text-base font-black text-black border-b border-stone-150 pb-3">İşletme Temel Bilgileri</h3>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-black">İşletme Adı</label>
          <div className="relative">
            <Building2 className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/10 text-sm outline-none transition-all text-black font-semibold"
            />
          </div>
        </div>

        {/* Description / Slogan */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-black">İşletme Açıklaması / Alt Başlık (Slogan)</label>
          <div className="relative">
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="En taze kahveler ve el yapımı özel burgerlerin adresi."
              className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/10 text-sm outline-none transition-all text-black font-semibold"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-black">İşletme Telefon Numarası</label>
          <div className="relative">
            <Phone className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+90 212 000 0000"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/10 text-sm outline-none transition-all text-black font-medium"
            />
          </div>
        </div>

        {/* Address */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-black">İşletme Adresi</label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-black absolute left-3.5 top-3.5" />
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              placeholder="Örnek Mah. Kadıköy / İstanbul"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/10 text-sm outline-none transition-all text-black resize-none font-medium"
            />
          </div>
        </div>

        <div>
          <h3 className="text-base font-black text-black border-b border-stone-150 pb-3 mt-4">Sipariş & Gösterim Ayarları</h3>
        </div>

        {/* WhatsApp Order phone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-black">WhatsApp Sipariş Hattı</label>
          <div className="relative">
            <MessageSquare className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="5555555555"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/10 text-sm outline-none transition-all text-black font-mono font-bold"
            />
          </div>
          <span className="text-[10px] text-black px-1 font-bold">
            Müşterilerin sepetteki siparişlerini gönderebilmesi için ülke kodlu (örn: 90555...) WhatsApp numaranız.
          </span>
        </div>

        {/* Calorie Option Toggle */}
        <div className="flex items-center justify-between p-4.5 rounded-xl bg-stone-50 border border-stone-200 mt-2">
          <div className="flex items-center gap-3">
            <Flame className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="flex flex-col text-black">
              <span className="text-xs font-bold text-black">Kalori ve Besin Bilgilerini Göster</span>
              <span className="text-[10px] text-black font-bold mt-0.5">Açıldığında müşteriler ürün detaylarında kalori ve besin değerlerini görebilir.</span>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showCalories}
              onChange={(e) => setShowCalories(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Table Service Ordering Toggle */}
        <div className="flex items-center justify-between p-4.5 rounded-xl bg-stone-50 border border-stone-200">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="flex flex-col text-black">
              <span className="text-xs font-bold text-black">Masadan Sipariş Almayı Aktif Et</span>
              <span className="text-[10px] text-black font-bold mt-0.5">Açıkken sepet sistemi etkindir; kapalıyken müşteriler sadece garson çağırma/hesap butonlarını kullanabilir.</span>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={allowOrders}
              onChange={(e) => setAllowOrders(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Opening Hours */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-black">Çalışma Saatleri</label>
          <div className="relative">
            <Clock className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              placeholder="09:00 - 23:00"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/10 text-sm outline-none transition-all text-black font-semibold"
            />
          </div>
          <span className="text-[10px] text-stone-500 px-1">QR menüde "Açık (09:00 - 23:00)" badge'inde görünür.</span>
        </div>

        {/* Service Type */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-black">Servis Tipi</label>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: 'MASA_SERVISI', label: 'Masa Servisi', icon: '🪑' },
              { value: 'SELF_SERVIS', label: 'Self Servis', icon: '🛒' },
              { value: 'HER_IKISI', label: 'Her İkisi', icon: '✅' },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setServiceType(opt.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
                  serviceType === opt.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300'
                }`}
              >
                <span className="text-lg">{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
          <span className="text-[10px] text-stone-500 px-1">QR menüde servis tipi badge'inde görünür.</span>
        </div>

        <div>
          <h3 className="text-base font-black text-black border-b border-stone-150 pb-3 mt-4">Görsel Özelleştirme & Karşılama Ekranı</h3>
        </div>

        {/* Drag & Drop File Upload Zones */}
        {renderDropzone('logo', logoUrl, uploadingLogo, 'image/*', logoInputRef, 'Logo Görselini Seçin veya Sürükleyin')}
        {renderDropzone('video', coverVideoUrl, uploadingVideo, 'video/*', videoInputRef, 'Karşılama Ekranı Arka Plan Videosunu Seçin veya Sürükleyin')}
        {renderDropzone('image', coverImageUrl, uploadingImage, 'image/*', imageInputRef, 'Yedek Karşılama Ekranı Arka Plan Görselini Seçin veya Sürükleyin')}

        <div className="flex flex-col gap-4 border-t border-stone-150 pt-5 mt-2">
          <h4 className="text-xs font-black text-stone-700 tracking-wider uppercase">Karşılama Ekranı Buton Bağlantıları</h4>
          
          {/* Instagram URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-black">Instagram URL</label>
            <input
              type="text"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/isletmeniz"
              className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/10 text-sm outline-none transition-all text-black font-semibold"
            />
          </div>

          {/* Location URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-black">Google Haritalar (Konum) URL</label>
            <input
              type="text"
              value={locationUrl}
              onChange={(e) => setLocationUrl(e.target.value)}
              placeholder="https://maps.google.com/?q=..."
              className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/10 text-sm outline-none transition-all text-black font-semibold"
            />
          </div>

          {/* Reviews URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-black">Google Yorumlar URL</label>
            <input
              type="text"
              value={reviewsUrl}
              onChange={(e) => setReviewsUrl(e.target.value)}
              placeholder="https://g.page/r/.../review"
              className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/10 text-sm outline-none transition-all text-black font-semibold"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end border-t border-stone-150 pt-6 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-600 text-white text-xs font-black tracking-wide transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/15 active:scale-98 disabled:opacity-50"
          >
            <Save className="w-4.5 h-4.5" />
            {loading ? 'Kaydediliyor...' : 'AYARLARI KAYDET'}
          </button>
        </div>

      </div>
    </form>
  );
}
