'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useToast } from '@/components/ToastProvider';
import { 
  createBranchAction, 
  updateBranchAction, 
  toggleBranchActiveAction, 
  createMenuAction 
} from '@/app/actions/branches';
import { 
  Store, 
  Plus, 
  UploadCloud,
  Trash2,
  Edit, 
  QrCode, 
  MapPin, 
  Phone, 
  Globe, 
  Check, 
  Copy, 
  Download, 
  X, 
  Loader2, 
  ToggleLeft, 
  ToggleRight,
  Sparkles,
  BookOpen
} from 'lucide-react';

type Branch = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  googleReviewUrl: string | null;
  instagramUrl: string | null;
  locationUrl: string | null;
  coverVideoUrl: string | null;
  slogan: string | null;
  logoUrl: string | null;
  isActive: boolean;
  menuId: string;
  menu: {
    id: string;
    name: string;
  };
};

type Menu = {
  id: string;
  name: string;
};

type BranchesManagerProps = {
  businessId: string;
  businessName: string;
  initialBranches: any[];
  initialMenus: Menu[];
};

export default function BranchesManager({
  businessId,
  businessName,
  initialBranches,
  initialMenus,
}: BranchesManagerProps) {
  const { showToast } = useToast();
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [menus, setMenus] = useState<Menu[]>(initialMenus);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [selectedMenuId, setSelectedMenuId] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [coverVideoUrl, setCoverVideoUrl] = useState('');
  const [slogan, setSlogan] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoProgress, setLogoProgress] = useState<number | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File, target: 'logo' | 'video') => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);

    if (target === 'logo') {
      setUploadingLogo(true);
      setLogoProgress(0);
    } else {
      setUploadingVideo(true);
      setVideoProgress(0);
    }

    const cleanup = () => {
      if (target === 'logo') {
        setUploadingLogo(false);
        setLogoProgress(null);
      } else {
        setUploadingVideo(false);
        setVideoProgress(null);
      }
    };

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        if (target === 'logo') setLogoProgress(percent);
        else setVideoProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.url) {
            if (target === 'logo') setLogoUrl(data.url);
            else setCoverVideoUrl(data.url);
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
      cleanup();
    };

    xhr.onerror = () => {
      showToast('Dosya yükleme hatası.', 'error');
      cleanup();
    };

    const fd = new FormData();
    fd.append('file', file);
    xhr.send(fd);
  };

  const renderDropzone = (
    target: 'logo' | 'video',
    currentUrl: string,
    uploading: boolean,
    progress: number | null,
    accept: string,
    inputRef: React.RefObject<HTMLInputElement | null>,
    placeholder: string
  ) => {
    return (
      <div className="flex flex-col gap-2">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFileUpload(f, target);
          }}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-stone-200 hover:border-indigo-500 rounded-xl p-4 bg-stone-50/50 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
        >
          <input
            type="file"
            accept={accept}
            ref={inputRef}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f, target);
            }}
            className="hidden"
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <Loader2 className="w-6 h-6 text-indigo-650 animate-spin" />
              {progress !== null && (
                <div className="w-full max-w-[150px] bg-stone-200 border border-stone-250 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-650 h-full rounded-full transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
              <span className="text-[10px] text-indigo-600 font-bold">Yükleniyor... %{progress ?? 0}</span>
            </div>
          ) : (
            <>
              <UploadCloud className="w-6 h-6 text-stone-400" />
              <span className="text-[11px] font-bold text-black">{placeholder}</span>
              <span className="text-[9px] text-stone-400 font-semibold">Tıklayın veya sürükleyin</span>
            </>
          )}
        </div>
        {currentUrl && (
          <div className="relative w-full h-24 rounded-xl overflow-hidden border border-stone-200 mt-1 flex items-center justify-center bg-stone-50">
            {target === 'logo' ? (
              <img src={currentUrl} alt="Şube Logosu" className="h-full object-contain p-2" />
            ) : (
              <video src={currentUrl} className="h-full w-full object-cover" controls muted playsInline />
            )}
            <button
              type="button"
              onClick={() => {
                if (target === 'logo') setLogoUrl('');
                else setCoverVideoUrl('');
              }}
              className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-white/90 border border-stone-200 text-red-650 hover:bg-red-50 transition-colors shadow-sm"
              title="Kaldır"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Inline Menu creation state
  const [showNewMenuInput, setShowNewMenuInput] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [creatingMenu, setCreatingMenu] = useState(false);

  // QR Modal state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrBranch, setQrBranch] = useState<Branch | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [qrCopied, setQrCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Automatically slugify name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!editingBranch) {
      // Slugify name
      const slugified = val
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setSlug(slugified);
    }
  };

  // Open Add/Edit Modal
  const openModal = (branch: Branch | null = null) => {
    if (branch) {
      setEditingBranch(branch);
      setName(branch.name);
      setSlug(branch.slug);
      setSelectedMenuId(branch.menuId);
      setAddress(branch.address || '');
      setPhone(branch.phone || '');
      setGoogleReviewUrl(branch.googleReviewUrl || '');
      setInstagramUrl(branch.instagramUrl || '');
      setLocationUrl(branch.locationUrl || '');
      setCoverVideoUrl(branch.coverVideoUrl || '');
      setSlogan(branch.slogan || '');
      setLogoUrl(branch.logoUrl || '');
      setIsActive(branch.isActive);
    } else {
      setEditingBranch(null);
      setName('');
      setSlug('');
      setSelectedMenuId(menus[0]?.id || '');
      setAddress('');
      setPhone('');
      setGoogleReviewUrl('');
      setInstagramUrl('');
      setLocationUrl('');
      setCoverVideoUrl('');
      setSlogan('');
      setLogoUrl('');
      setIsActive(true);
    }
    setShowNewMenuInput(false);
    setNewMenuName('');
    setIsModalOpen(true);
  };

  // Handle Branch Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !selectedMenuId) {
      showToast('Lütfen zorunlu alanları doldurun.', 'error');
      return;
    }

    setSubmitting(true);
    const data = {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      menuId: selectedMenuId,
      address: address.trim() || null,
      phone: phone.trim() || null,
      googleReviewUrl: googleReviewUrl.trim() || null,
      instagramUrl: instagramUrl.trim() || null,
      locationUrl: locationUrl.trim() || null,
      coverVideoUrl: coverVideoUrl.trim() || null,
      slogan: slogan.trim() || null,
      logoUrl: logoUrl.trim() || null,
      isActive,
    };

    let res;
    if (editingBranch) {
      res = await updateBranchAction(businessId, editingBranch.id, data);
    } else {
      res = await createBranchAction(businessId, data);
    }

    if (res.success) {
      showToast(editingBranch ? 'Şube güncellendi.' : 'Şube oluşturuldu.', 'success');
      // Reload page state or fetch again
      window.location.reload();
    } else {
      showToast(res.error || 'İşlem başarısız.', 'error');
    }
    setSubmitting(false);
  };

  // Toggle active state
  const handleToggleActive = async (branch: Branch) => {
    const newStatus = !branch.isActive;
    // optimistic update
    setBranches(prev =>
      prev.map(b => b.id === branch.id ? { ...b, isActive: newStatus } : b)
    );

    const res = await toggleBranchActiveAction(businessId, branch.id, newStatus);
    if (!res.success) {
      showToast(res.error || 'Durum değiştirilemedi.', 'error');
      // rollback
      setBranches(prev =>
        prev.map(b => b.id === branch.id ? { ...b, isActive: branch.isActive } : b)
      );
    } else {
      showToast(`${branch.name} şubesi ${newStatus ? 'aktif' : 'pasif'} yapıldı.`, 'success');
    }
  };

  // Create menu inline
  const handleCreateMenuInline = async () => {
    if (!newMenuName.trim()) {
      showToast('Lütfen menü ismi girin.', 'error');
      return;
    }
    setCreatingMenu(true);
    const res = await createMenuAction(businessId, newMenuName.trim());
    if (res.success && res.menu) {
      showToast(`"${newMenuName}" menüsü oluşturuldu.`, 'success');
      setMenus(prev => [...prev, res.menu]);
      setSelectedMenuId(res.menu.id);
      setShowNewMenuInput(false);
      setNewMenuName('');
    } else {
      showToast(res.error || 'Menü oluşturulamadı.', 'error');
    }
    setCreatingMenu(false);
  };

  // Open QR modal
  const openQrModal = (branch: Branch) => {
    setQrBranch(branch);
    const url = `${window.location.protocol}//${window.location.host}/menu/${branch.slug}`;
    setQrUrl(url);
    setQrModalOpen(true);
  };

  // Render QR Canvas
  useEffect(() => {
    if (qrModalOpen && qrUrl && qrCanvasRef.current) {
      QRCode.toCanvas(
        qrCanvasRef.current,
        qrUrl,
        {
          width: 260,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        },
        (err) => {
          if (err) console.error('QR rendering error:', err);
        }
      );
    }
  }, [qrModalOpen, qrUrl]);

  // Copy QR URL
  const handleCopyQrUrl = async () => {
    if (!qrUrl) return;
    try {
      await navigator.clipboard.writeText(qrUrl);
      setQrCopied(true);
      showToast('Şube menü bağlantısı kopyalandı.', 'success');
      setTimeout(() => setQrCopied(false), 2000);
    } catch {
      showToast('Bağlantı kopyalanamadı.', 'error');
    }
  };

  // Download QR Code
  const handleDownloadQr = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas || !qrBranch) return;

    const downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = 1000;
    downloadCanvas.height = 1000;

    QRCode.toCanvas(
      downloadCanvas,
      qrUrl,
      {
        width: 1000,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      },
      (error) => {
        if (error) {
          showToast('QR indirilemedi.', 'error');
          return;
        }
        const link = document.createElement('a');
        link.download = `${qrBranch.slug}-qr-menu.png`;
        link.href = downloadCanvas.toDataURL('image/png');
        link.click();
        showToast('QR kod indirildi.', 'success');
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Action Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-indigo-650" />
          <span className="text-sm font-black text-stone-700">Şubeleriniz ({branches.length})</span>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-600/10 transition-all active:scale-98"
        >
          <Plus className="w-4 h-4" />
          Yeni Şube Ekle
        </button>
      </div>

      {/* Branches Grid */}
      {branches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
          <Store className="w-12 h-12 text-stone-300" />
          <span className="text-sm font-black text-black">Henüz Şube Eklenmemiş</span>
          <p className="text-xs text-stone-500 max-w-sm leading-relaxed font-semibold">
            İşletmeniz için ilk şubenizi oluşturarak başlayın. Şubenize özel QR kod üretebilir ve istediğiniz menüyü bağlayabilirsiniz.
          </p>
          <button
            onClick={() => openModal()}
            className="mt-2 px-4 py-2 text-xs font-black text-indigo-600 border border-stone-250 rounded-xl hover:bg-stone-50 transition-all"
          >
            İlk Şubeyi Oluştur
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {branches.map((branch) => (
            <div 
              key={branch.id} 
              className={`bg-white rounded-2xl border transition-all duration-200 p-5 flex flex-col gap-4 shadow-sm ${
                branch.isActive ? 'border-stone-200' : 'border-stone-200 opacity-65 bg-stone-50/50'
              }`}
            >
              
              {/* Card Header */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-black text-black truncate">{branch.name}</span>
                  <span className="text-[10px] font-mono text-stone-500 mt-1 truncate">/menu/{branch.slug}</span>
                </div>
                
                {/* Active Toggle & Edit Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleActive(branch)}
                    className="p-1 hover:bg-stone-100 rounded-lg text-stone-700 transition-colors"
                    title={branch.isActive ? 'Şubeyi Pasifleştir' : 'Şubeyi Aktifleştir'}
                  >
                    {branch.isActive ? (
                      <ToggleRight className="w-6 h-6 text-indigo-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-stone-400" />
                    )}
                  </button>
                  <button
                    onClick={() => openModal(branch)}
                    className="p-1.5 border border-stone-200 bg-stone-50 hover:bg-stone-100 rounded-lg text-stone-600 hover:text-black transition-colors"
                    title="Düzenle"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="h-px bg-stone-100 w-full" />

              {/* Connected Menu Details */}
              <div className="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100/50 rounded-xl px-3 py-2 text-xs text-indigo-950 font-bold">
                <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Bağlı Menü: </span>
                <span className="font-black text-indigo-600 truncate">{branch.menu.name}</span>
              </div>

              {/* Branch Contact Details */}
              <div className="flex flex-col gap-2 text-[11px] text-stone-600 font-semibold leading-relaxed">
                {branch.address && (
                  <div className="flex items-start gap-1.5 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{branch.address}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{branch.phone}</span>
                  </div>
                )}
              </div>

              {/* Social URLs Badge Indicators */}
              <div className="flex gap-2 flex-wrap mt-1">
                {branch.googleReviewUrl && (
                  <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-150 text-blue-700 text-[9px] font-bold flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Google Yorumları
                  </span>
                )}
                {branch.instagramUrl && (
                  <span className="px-2 py-0.5 rounded bg-pink-50 border border-pink-150 text-pink-700 text-[9px] font-bold flex items-center gap-1">
                    <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg> Instagram
                  </span>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="mt-2 pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  onClick={() => openQrModal(branch)}
                  disabled={!branch.isActive}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-850 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98 disabled:opacity-50"
                >
                  <QrCode className="w-4 h-4" />
                  QR Kodu Göster
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT BRANCH MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl p-6 max-w-lg w-full relative z-10 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <h3 className="text-sm font-black text-black flex items-center gap-2">
                <Store className="w-5 h-5 text-indigo-650" />
                {editingBranch ? 'Şubeyi Düzenle' : 'Yeni Şube Ekle'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-stone-400 hover:text-black hover:bg-stone-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-xs">
              
              {/* SECTION 1: GENEL BİLGİLER */}
              <div className="flex flex-col gap-3">
                <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-stone-500 border-b border-stone-100 pb-1.5">Genel Bilgiler</h4>
                
                {/* Name input */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-stone-700">Şube Adı <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={handleNameChange}
                    placeholder="Örn: Özhamur FSM"
                    className="w-full bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2.5 font-semibold outline-none text-black"
                  />
                </div>

                {/* Slug input */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-stone-700">QR Slug Adresi <span className="text-red-500">*</span></label>
                  <div className="flex items-center bg-stone-50 border border-stone-200 focus-within:border-indigo-500 focus-within:bg-white rounded-xl overflow-hidden pr-3 text-black">
                    <span className="pl-3 text-stone-400 font-semibold select-none font-mono">/menu/</span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      placeholder="ozhamur-fsm"
                      className="flex-1 bg-transparent border-none outline-none py-2.5 font-mono font-semibold"
                    />
                  </div>
                  <span className="text-[10px] text-stone-400 font-semibold leading-relaxed">
                    Bu şubenin QR kodunun yönleneceği özgün web adresi slugıdır (küçük harf, sayı ve tire).
                  </span>
                </div>

                {/* Menu selection */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-stone-700">Bağlanacak Menü <span className="text-red-500">*</span></label>
                    <button
                      type="button"
                      onClick={() => setShowNewMenuInput(!showNewMenuInput)}
                      className="text-[10px] font-black text-indigo-600 hover:text-indigo-500 flex items-center gap-0.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Yeni Menü Oluştur
                    </button>
                  </div>

                  {showNewMenuInput && (
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex gap-2 items-center mb-2 animate-fade-in text-black">
                      <input
                        type="text"
                        value={newMenuName}
                        onChange={(e) => setNewMenuName(e.target.value)}
                        placeholder="Yeni Menü İsmi (Örn: Gece Menüsü)"
                        className="flex-1 bg-white border border-stone-250 rounded-lg px-2.5 py-1.5 font-semibold outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCreateMenuInline}
                        disabled={creatingMenu}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-black shrink-0 disabled:opacity-50"
                      >
                        {creatingMenu ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Kaydet'}
                      </button>
                    </div>
                  )}

                  <select
                    value={selectedMenuId}
                    onChange={(e) => setSelectedMenuId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2.5 font-semibold outline-none text-black"
                  >
                    {menus.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-stone-700">Şube Telefonu</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Örn: 0224 444 0 444"
                      className="w-full bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2.5 font-semibold outline-none text-black"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-auto py-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4.5 h-4.5 text-indigo-600 bg-stone-50 border-stone-200 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="isActive" className="font-bold text-stone-700 select-none">
                      Şube Aktif
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-stone-700">Şube Açık Adresi</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Örn: Fethiye Mah. FSM Bulvarı No: 120, Nilüfer/Bursa"
                    rows={2}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2.5 font-semibold outline-none resize-none text-black"
                  />
                </div>
              </div>

              {/* SECTION 2: KARŞILAMA EKRANI BUTON BAĞLANTILARI */}
              <div className="flex flex-col gap-3">
                <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-stone-500 border-b border-stone-100 pb-1.5">Karşılama Ekranı Buton Bağlantıları</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-stone-700">Instagram URL</label>
                    <input
                      type="url"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      placeholder="https://instagram.com/sube"
                      className="w-full bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2.5 font-semibold outline-none text-black"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-stone-700">Google Haritalar (Konum) URL</label>
                    <input
                      type="url"
                      value={locationUrl}
                      onChange={(e) => setLocationUrl(e.target.value)}
                      placeholder="https://maps.google.com/?q=..."
                      className="w-full bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2.5 font-semibold outline-none text-black"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-stone-700">Google Yorumlar URL</label>
                  <input
                    type="url"
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    placeholder="https://g.page/r/sube-yorum-linki"
                    className="w-full bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2.5 font-semibold outline-none text-black"
                  />
                </div>
              </div>

              {/* SECTION 3: ŞUBEYE ÖZEL İÇERİKLER */}
              <div className="flex flex-col gap-3">
                <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-stone-500 border-b border-stone-100 pb-1.5">Şubeye Özel İçerikler</h4>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-stone-700">Slogan</label>
                  <input
                    type="text"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    placeholder="Örn: Lezzetin En Doğal Hali"
                    className="w-full bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2.5 font-semibold outline-none text-black"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-stone-700">Şube Logosu <span className="font-normal text-stone-400">(isteğe bağlı)</span></label>
                    {renderDropzone('logo', logoUrl, uploadingLogo, logoProgress, 'image/*', logoInputRef, 'Logo Seçin veya Sürükleyin')}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-stone-700">Şube Karşılama Videosu <span className="font-normal text-stone-400">(isteğe bağlı)</span></label>
                    {renderDropzone('video', coverVideoUrl, uploadingVideo, videoProgress, 'video/*', videoInputRef, 'Arka Plan Videosu')}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 border-t border-stone-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-black text-stone-700"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingLogo || uploadingVideo}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg transition-all active:scale-98 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Şubeyi Kaydet'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* QR CODE DISPLAY MODAL */}
      {qrModalOpen && qrBranch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="absolute inset-0" onClick={() => setQrModalOpen(false)} />
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl p-6 max-w-sm w-full relative z-10 flex flex-col items-center gap-5 text-center">
            
            <div className="w-full flex justify-between items-center border-b border-stone-100 pb-3 text-left">
              <span className="text-sm font-black text-black truncate">{qrBranch.name} QR Kodu</span>
              <button onClick={() => setQrModalOpen(false)} className="p-1 text-stone-400 hover:text-black hover:bg-stone-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Canvas Render */}
            <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl">
              <canvas ref={qrCanvasRef} className="mx-auto" />
            </div>

            {/* QR Details */}
            <div className="flex flex-col gap-1 w-full text-xs">
              <span className="font-black text-black">Şube Menü Bağlantısı</span>
              <span className="font-mono text-[10px] text-stone-500 break-all select-all border border-stone-150 p-2 bg-stone-50/50 rounded-xl mt-1.5">
                {qrUrl}
              </span>
            </div>

            {/* QR Actions */}
            <div className="grid grid-cols-2 gap-3 w-full mt-2">
              <button
                onClick={handleCopyQrUrl}
                className="py-3 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
              >
                {qrCopied ? <Check className="w-4 h-4 text-emerald-650" /> : <Copy className="w-4 h-4 text-stone-500" />}
                {qrCopied ? 'Kopyalandı' : 'Linki Kopyala'}
              </button>
              <button
                onClick={handleDownloadQr}
                className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98"
              >
                <Download className="w-4 h-4" />
                QR İndir (PNG)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
