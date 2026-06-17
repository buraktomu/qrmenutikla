'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { COMMON_GALLERY } from '@/config/gallery';
import { 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  reorderCategories, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getAIDescription,
  getAIMacros,
  getAICampaign
} from '@/app/actions/menu';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  ToggleLeft, 
  ToggleRight, 
  Image as ImageIcon, 
  Save,
  X,
  Flame,
  Volume2,
  UploadCloud,
  Loader2
} from 'lucide-react';
import EasyMenuManager from './EasyMenuManager';

type ProductType = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  isCommonImage: boolean;
  commonImageKey: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  isActive: boolean;
};

type CategoryType = {
  id: string;
  name: string;
  sortOrder: number;
  categoryImageUrl?: string | null;
  products: ProductType[];
};

type MenuManagerProps = {
  businessId: string;
  initialCategories: CategoryType[];
  hasAI: boolean;
  hasNutrients: boolean;
  hasWhatsApp: boolean;
  dbGalleryImages?: {
    categoryKey: string;
    title: string;
    imageUrl: string;
  }[];
  menus?: {
    id: string;
    name: string;
  }[];
  activeMenuId: string;
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

export default function MenuManager({ 
  businessId, 
  initialCategories, 
  hasAI, 
  hasNutrients, 
  hasWhatsApp,
  dbGalleryImages = [],
  menus = [],
  activeMenuId
}: MenuManagerProps) {
  const { showToast } = useToast();
  const router = useRouter();

  const combinedGallery = React.useMemo(() => {
    const gallery: Record<string, { title: string; imageUrl: string }[]> = {};
    
    // Copy static gallery
    Object.keys(COMMON_GALLERY).forEach((catKey) => {
      gallery[catKey] = [...COMMON_GALLERY[catKey]];
    });

    // Merge database gallery
    dbGalleryImages.forEach((img) => {
      if (!img.imageUrl || !img.categoryKey) return;
      if (!isImageUrl(img.imageUrl)) return;

      const cat = img.categoryKey;
      if (!gallery[cat]) {
        gallery[cat] = [];
      }
      if (!gallery[cat].some((existing) => existing.imageUrl === img.imageUrl)) {
        gallery[cat].push({
          title: img.title,
          imageUrl: img.imageUrl,
        });
      }
    });

    return gallery;
  }, [dbGalleryImages]);
  const [categories, setCategories] = useState<CategoryType[]>(initialCategories);
  const [activeManagerTab, setActiveManagerTab] = useState<'classic' | 'easy'>('classic');
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    initialCategories[0]?.id || ''
  );

  // Loading States
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});

  // Modals Toggles
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catEditing, setCatEditing] = useState<CategoryType | null>(null);
  const [catNameInput, setCatNameInput] = useState('');
  const [catImageUrlInput, setCatImageUrlInput] = useState('');

  const [prodModalOpen, setProdModalOpen] = useState(false);
  const [prodEditing, setProdEditing] = useState<ProductType | null>(null);

  // Product Form State
  const [pName, setPName] = useState('');
  const [pPrice, setPPrice] = useState('0');
  const [pDesc, setPDesc] = useState('');
  const [pActive, setPActive] = useState(true);
  const [pImageType, setPImageType] = useState<'url' | 'common'>('url');
  const [pImageUrl, setPImageUrl] = useState('');
  const [pCommonKey, setPCommonKey] = useState('');
  const selectedCommonImageUrl = React.useMemo(() => {
    if (!pCommonKey) return null;
    let foundUrl: string | null = null;
    Object.keys(combinedGallery).forEach((catKey) => {
      const found = combinedGallery[catKey].find((img) => img.imageUrl === pCommonKey);
      if (found) foundUrl = found.imageUrl;
    });
    return foundUrl;
  }, [pCommonKey, combinedGallery]);
  const [pCalories, setPCalories] = useState('');
  const [pProtein, setPProtein] = useState('');
  const [pCarbs, setPCarbs] = useState('');
  const [pFat, setPFat] = useState('');

  // AI Campaign Copywriting State
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [campaignProd, setCampaignProd] = useState<ProductType | null>(null);
  const [campaignText, setCampaignText] = useState('');
  const [discountPercent, setDiscountPercent] = useState(15);

  // Image upload (device gallery / camera / drag-drop)
  const [uploadingProdImage, setUploadingProdImage] = useState(false);
  const [uploadingCatImage, setUploadingCatImage] = useState(false);
  const [prodUploadProgress, setProdUploadProgress] = useState<number | null>(null);
  const [catUploadProgress, setCatUploadProgress] = useState<number | null>(null);
  const prodImageInputRef = useRef<HTMLInputElement>(null);
  const catImageInputRef = useRef<HTMLInputElement>(null);

  const uploadImageFile = (file: File, onProgress?: (pct: number) => void): Promise<string | null> => {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.url) {
              resolve(data.url as string);
              return;
            }
            showToast(data.error || 'Dosya yüklenemedi.', 'error');
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
        resolve(null);
      };

      xhr.onerror = () => {
        showToast('Dosya yükleme hatası oluştu.', 'error');
        resolve(null);
      };

      const fd = new FormData();
      fd.append('file', file);
      xhr.send(fd);
    });
  };

  const handleProdImageSelect = async (file: File) => {
    setUploadingProdImage(true);
    setProdUploadProgress(0);
    const url = await uploadImageFile(file, (pct) => {
      setProdUploadProgress(pct);
    });
    if (url) {
      setPImageUrl(url);
      showToast('Dosya başarıyla yüklendi.', 'success');
    }
    setUploadingProdImage(false);
    setProdUploadProgress(null);
  };

  const handleCatImageSelect = async (file: File) => {
    setUploadingCatImage(true);
    setCatUploadProgress(0);
    const url = await uploadImageFile(file, (pct) => {
      setCatUploadProgress(pct);
    });
    if (url) {
      setCatImageUrlInput(url);
      showToast('Dosya başarıyla yüklendi.', 'success');
    }
    setUploadingCatImage(false);
    setCatUploadProgress(null);
  };

  const activeCategory = categories.find((c) => c.id === activeCategoryId);

  // -------------------------------------------------------------
  // CATEGORY OPERATIONS
  // -------------------------------------------------------------
  const handleOpenCatModal = (cat: CategoryType | null = null) => {
    setCatEditing(cat);
    setCatNameInput(cat ? cat.name : '');
    setCatImageUrlInput(cat?.categoryImageUrl || '');
    setCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameInput.trim()) return;

    setLoading(true);
    let res;

    if (catEditing) {
      res = await updateCategory(businessId, catEditing.id, catNameInput, catImageUrlInput || null);
    } else {
      res = await createCategory(businessId, catNameInput, activeMenuId);
    }

    if (res.success) {
      showToast(catEditing ? 'Kategori güncellendi.' : 'Kategori oluşturuldu.', 'success');
      window.location.reload();
    } else {
      showToast(res.error || 'İşlem başarısız.', 'error');
    }
    setLoading(false);
    setCatModalOpen(false);
  };

  const handleDeleteCat = async (catId: string) => {
    if (!confirm('Bu kategoriyi ve içindeki tüm ürünleri silmek istediğinize emin misiniz?')) return;

    const res = await deleteCategory(businessId, catId);
    if (res.success) {
      showToast('Kategori silindi.', 'success');
      window.location.reload();
    } else {
      showToast(res.error || 'Silinemedi.', 'error');
    }
  };

  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    const newCats = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newCats.length) return;

    // Swap sortOrder
    const temp = newCats[index];
    newCats[index] = newCats[targetIndex];
    newCats[targetIndex] = temp;

    const idsOrdered = newCats.map((c) => c.id);
    const res = await reorderCategories(businessId, idsOrdered);

    if (res.success) {
      setCategories(newCats);
      showToast('Kategori sırası güncellendi.', 'success');
    } else {
      showToast(res.error || 'Sıralama güncellenemedi.', 'error');
    }
  };

  // -------------------------------------------------------------
  // PRODUCT OPERATIONS
  // -------------------------------------------------------------
  const handleOpenProdModal = (prod: ProductType | null = null) => {
    setProdEditing(prod);
    if (prod) {
      setPName(prod.name);
      setPPrice(prod.price.toString());
      setPDesc(prod.description || '');
      setPActive(prod.isActive);
      setPImageType(prod.isCommonImage ? 'common' : 'url');
      setPImageUrl(prod.imageUrl || '');
      let initialCommonKey = prod.commonImageKey || '';
      if (initialCommonKey && !initialCommonKey.startsWith('http') && !initialCommonKey.startsWith('/uploads')) {
        Object.keys(combinedGallery).forEach((catKey) => {
          const found = combinedGallery[catKey].find((img) => img.title === initialCommonKey);
          if (found) initialCommonKey = found.imageUrl;
        });
      }
      setPCommonKey(initialCommonKey);
      setPCalories(prod.calories?.toString() || '');
      setPProtein(prod.protein?.toString() || '');
      setPCarbs(prod.carbs?.toString() || '');
      setPFat(prod.fat?.toString() || '');
    } else {
      setPName('');
      setPPrice('0');
      setPDesc('');
      setPActive(true);
      setPImageType('url');
      setPImageUrl('');
      setPCommonKey('');
      setPCalories('');
      setPProtein('');
      setPCarbs('');
      setPFat('');
    }
    setProdModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !activeCategoryId) return;

    setLoading(true);
    
    // Choose selected image url
    let resolvedImageUrl = pImageUrl;
    let finalCommonKey = pCommonKey;
    if (pImageType === 'common' && pCommonKey) {
      resolvedImageUrl = pCommonKey;
      let matchedTitle = '';
      Object.keys(combinedGallery).forEach((catKey) => {
        const found = combinedGallery[catKey].find((img) => img.imageUrl === pCommonKey);
        if (found) matchedTitle = found.title;
      });
      finalCommonKey = matchedTitle || pCommonKey;
    }

    const payload = {
      name: pName,
      price: parseFloat(pPrice) || 0,
      description: pDesc,
      imageUrl: resolvedImageUrl,
      isCommonImage: pImageType === 'common',
      commonImageKey: finalCommonKey,
      calories: pCalories ? parseInt(pCalories) : null,
      protein: pProtein ? parseFloat(pProtein) : null,
      carbs: pCarbs ? parseFloat(pCarbs) : null,
      fat: pFat ? parseFloat(pFat) : null,
      isActive: pActive,
    };

    let res;
    if (prodEditing) {
      res = await updateProduct(businessId, activeCategoryId, prodEditing.id, payload);
    } else {
      res = await createProduct(businessId, activeCategoryId, payload);
    }

    if (res.success) {
      showToast(prodEditing ? 'Ürün güncellendi.' : 'Ürün eklendi.', 'success');
      window.location.reload();
    } else {
      showToast(res.error || 'İşlem başarısız.', 'error');
    }
    setLoading(false);
    setProdModalOpen(false);
  };

  const handleDeleteProd = async (productId: string) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;

    const res = await deleteProduct(businessId, activeCategoryId, productId);
    if (res.success) {
      showToast('Ürün silindi.', 'success');
      window.location.reload();
    } else {
      showToast(res.error || 'Silinemedi.', 'error');
    }
  };

  // -------------------------------------------------------------
  // AI HELPERS
  // -------------------------------------------------------------
  const triggerAiDescription = async () => {
    if (!pName) {
      showToast('Açıklama üretmek için önce ürün adını yazmalısınız.', 'error');
      return;
    }

    setAiLoading((prev) => ({ ...prev, desc: true }));
    try {
      const catName = activeCategory?.name || 'Yemek';
      const res = await getAIDescription(pName, catName);
      if (res.success && res.result) {
        setPDesc(res.result);
        showToast('Yapay zeka açıklaması başarıyla üretildi.', 'success');
      } else {
        showToast('AI açıklaması oluşturulamadı.', 'error');
      }
    } catch {
      showToast('AI bağlantısında sorun oluştu.', 'error');
    } finally {
      setAiLoading((prev) => ({ ...prev, desc: false }));
    }
  };

  const triggerAiNutrition = async () => {
    if (!pName) {
      showToast('Tahmin yapmak için önce ürün adını yazmalısınız.', 'error');
      return;
    }

    setAiLoading((prev) => ({ ...prev, nutrition: true }));
    try {
      const res = await getAIMacros(pName, pDesc);
      if (res.success && res.result) {
        setPCalories(res.result.calories.toString());
        setPProtein(res.result.protein.toString());
        setPCarbs(res.result.carbs.toString());
        setPFat(res.result.fat.toString());
        showToast('AI kalori ve makro değerleri hesaplandı!', 'success');
      } else {
        showToast('Makro değerleri hesaplanamadı.', 'error');
      }
    } catch {
      showToast('AI bağlantısında sorun oluştu.', 'error');
    } finally {
      setAiLoading((prev) => ({ ...prev, nutrition: false }));
    }
  };

  const triggerCampaignText = async () => {
    if (!campaignProd) return;
    setAiLoading((prev) => ({ ...prev, campaign: true }));
    try {
      const res = await getAICampaign(campaignProd.name, discountPercent);
      if (res.success && res.result) {
        setCampaignText(res.result);
      } else {
        showToast('Kampanya metni oluşturulamadı.', 'error');
      }
    } catch {
      showToast('AI bağlantısında sorun oluştu.', 'error');
    } finally {
      setAiLoading((prev) => ({ ...prev, campaign: false }));
    }
  };

  return (
    <div className="flex flex-col gap-6 text-black">
      
      {/* Menu Selector */}
      {menus.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-stone-700">Düzenlenen Menü:</span>
            <select
              value={activeMenuId}
              onChange={(e) => router.push(`/dashboard/menu?menuId=${e.target.value}`)}
              className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-250 focus:border-indigo-500 focus:bg-white text-xs outline-none text-black font-extrabold"
            >
              {menus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[10px] text-stone-400 font-bold sm:text-right">
            Menüleri ve şubeleri şube yönetiminden organize edebilirsiniz.
          </p>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 bg-stone-100 rounded-xl border border-stone-250 w-fit text-xs font-black">
        <button
          onClick={() => setActiveManagerTab('classic')}
          className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5 ${activeManagerTab === 'classic' ? 'bg-white text-black shadow-sm' : 'text-stone-600 hover:text-black'}`}
        >
          🗂️ Klasik Yönetim
        </button>
        <button
          onClick={() => setActiveManagerTab('easy')}
          className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5 ${activeManagerTab === 'easy' ? 'bg-white text-black shadow-sm' : 'text-stone-600 hover:text-black'}`}
        >
          ⚡ Kolay Menü Ekle
        </button>
      </div>

      {activeManagerTab === 'easy' ? (
        <EasyMenuManager businessId={businessId} onSuccess={() => window.location.reload()} activeMenuId={activeMenuId} />
      ) : (
        <>
          {/* Category Tabs Wrapper */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-black">Menü İçeriği</h2>
          <p className="text-xs text-black font-semibold mt-0.5">Kategorileri sıralayabilir, ürünleri düzenleyebilirsiniz.</p>
        </div>
        
        {/* Create Category Trigger */}
        <button
          onClick={() => handleOpenCatModal(null)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-600 text-white text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/10 active:scale-98"
        >
          <Plus className="w-4 h-4" />
          Kategori Ekle
        </button>
      </div>

      {/* Categories Grid Table */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
        {categories
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((cat, index) => {
            const isActive = cat.id === activeCategoryId;
            return (
              <div 
                key={cat.id}
                className={`flex items-center gap-1 p-1 rounded-xl transition-all ${isActive ? 'bg-indigo-50/50 border border-indigo-200' : 'bg-transparent border border-transparent'}`}
              >
                <button
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${isActive ? 'text-indigo-600' : 'text-black hover:text-indigo-600'}`}
                >
                  {cat.name} ({cat.products.length})
                </button>
                
                {/* Category action buttons */}
                <div className="flex items-center gap-0.5 text-black px-1 border-l border-stone-200 ml-1">
                  <button 
                    disabled={index === 0}
                    onClick={() => handleMoveCategory(index, 'up')}
                    className="p-1 rounded hover:bg-stone-100 hover:text-black disabled:opacity-20 shrink-0 transition-colors"
                    title="Yukarı Taşı"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    disabled={index === categories.length - 1}
                    onClick={() => handleMoveCategory(index, 'down')}
                    className="p-1 rounded hover:bg-stone-100 hover:text-black disabled:opacity-20 shrink-0 transition-colors"
                    title="Aşağı Taşı"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleOpenCatModal(cat)}
                    className="p-1 rounded hover:bg-stone-100 hover:text-black shrink-0 transition-colors"
                    title="Düzenle"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteCat(cat.id)}
                    className="p-1 rounded hover:bg-stone-100 hover:text-red-650 shrink-0 transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* PRODUCTS LIST SECTION */}
      {activeCategory ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <div className="text-xs text-black font-semibold">
              Mevcut Seçim: <strong className="text-black font-extrabold">{activeCategory.name}</strong> ({activeCategory.products.length} Ürün)
            </div>
            <button
              onClick={() => handleOpenProdModal(null)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              Ürün Ekle
            </button>
          </div>

          {activeCategory.products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCategory.products.map((prod) => (
                <div 
                  key={prod.id}
                  className={`p-4 rounded-2xl border bg-white flex gap-4 items-start shadow-sm ${prod.isActive ? 'border-stone-200' : 'border-dashed border-stone-300 opacity-60'}`}
                >
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl bg-stone-50 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                    {prod.imageUrl ? (
                      <MediaDisplay
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        controls={false}
                        fallback={<ImageIcon className="w-6 h-6 text-stone-300" />}
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-stone-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-black truncate">{prod.name}</h4>
                      {!prod.isActive && (
                        <span className="text-[9px] bg-stone-100 text-black border border-stone-200 px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0">
                          Pasif
                        </span>
                      )}
                    </div>
                    {prod.description && (
                      <p className="text-xs text-black font-medium line-clamp-1 mt-0.5">{prod.description}</p>
                    )}
                    <div className="text-xs font-extrabold text-indigo-600 mt-1">{prod.price.toFixed(2)} TL</div>
                    
                    {/* Nutrient details preview */}
                    {hasNutrients && prod.calories && (
                      <div className="flex items-center gap-2 text-[9px] text-black font-mono font-bold mt-2 bg-stone-50 px-2 py-0.5 rounded border border-stone-200 w-fit">
                        <Flame className="w-2.5 h-2.5 text-amber-600" />
                        <span>{prod.calories} kcal | F:{prod.fat}g | C:{prod.carbs}g | P:{prod.protein}g</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 shrink-0 self-center">
                    <button
                      onClick={() => handleOpenProdModal(prod)}
                      className="p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-black transition-colors"
                      title="Düzenle"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {hasAI && (
                      <button
                        onClick={() => {
                          setCampaignProd(prod);
                          setCampaignText('');
                          setCampaignModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-stone-50 hover:bg-indigo-50 border border-stone-200 text-indigo-600 hover:text-indigo-700 transition-colors"
                        title="AI Kampanya Üret"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteProd(prod.id)}
                      className="p-2 rounded-xl bg-stone-50 hover:bg-red-50 border border-stone-200 text-red-650 hover:text-red-700 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl border border-dashed border-stone-300 text-black text-sm font-semibold">
              Bu kategoride henüz ürün bulunmuyor. Yeni ürün eklemek için sağ üstteki düğmeyi tıklayın.
            </div>
          )}
        </div>
      ) : (
        <div className="p-16 text-center rounded-2xl border border-dashed border-stone-300 text-black text-sm font-semibold flex flex-col items-center gap-4">
          <div className="w-12 h-12 text-black flex items-center justify-center">🍽️</div>
          <div>
            <h3 className="font-extrabold text-black text-base">Önce bir kategori oluşturun</h3>
            <p className="text-xs text-black font-medium mt-1 max-w-xs mx-auto">Ürün ekleyebilmek için önce bir kategori (örn. Kahveler, Burgerler) gerekir. Kategoriyi oluşturunca &quot;Ürün Ekle&quot; düğmesi görünecektir.</p>
          </div>
          <button
            onClick={() => handleOpenCatModal(null)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-2 transition-all active:scale-98 shadow-md"
          >
            <Plus className="w-4 h-4" />
            İlk Kategoriyi Ekle
          </button>
        </div>
      )}
        </>
      )}

      {/* -------------------------------------------------------------
          CATEGORY DIALOG MODAL
         ------------------------------------------------------------- */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-stone-200 rounded-3xl p-6 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-stone-150 pb-3 mb-5">
              <h4 className="text-sm font-black text-black">
                {catEditing ? 'Kategoriyi Güncelle' : 'Yeni Kategori Ekle'}
              </h4>
              <button onClick={() => setCatModalOpen(false)} className="text-black hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-black">Kategori Adı</label>
                <input
                  type="text"
                  required
                  placeholder="örn. Kahveler, Burgerler, Çaylar"
                  value={catNameInput}
                  onChange={(e) => setCatNameInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white text-sm outline-none text-black font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-black">Kategori Görseli <span className="font-normal text-stone-400">(isteğe bağlı)</span></label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleCatImageSelect(f); }}
                  onClick={() => catImageInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-200 hover:border-indigo-500 rounded-xl p-5 bg-stone-50/50 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                >
                  <input
                    type="file"
                    accept="image/*,video/*"
                    ref={catImageInputRef}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCatImageSelect(f); }}
                    className="hidden"
                  />
                  {uploadingCatImage ? (
                    <div className="flex flex-col items-center gap-2 w-full">
                      <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                      {catUploadProgress !== null && (
                        <div className="w-full max-w-[200px] bg-stone-250 border border-stone-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-150"
                            style={{ width: `${catUploadProgress}%` }}
                          />
                        </div>
                      )}
                      <span className="text-[10px] text-indigo-600 font-black">Yükleniyor... %{catUploadProgress ?? 0}</span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-7 h-7 text-stone-400" />
                      <span className="text-xs font-black text-black">Galeriden / kameradan seçin veya sürükleyin</span>
                      <span className="text-[10px] text-stone-400 font-bold">Resim (maks 2MB) veya Video (maks 50MB) yükleyebilirsiniz</span>
                    </>
                  )}
                </div>
                {catImageUrlInput && (
                  <div className="relative w-full h-28 rounded-xl overflow-hidden border border-stone-200 mt-1">
                    <MediaDisplay src={catImageUrlInput} alt="Önizleme" className="w-full h-full object-cover" controls autoPlay={false} loop={false} />
                    <button
                      type="button"
                      onClick={() => setCatImageUrlInput('')}
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
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-600 text-white text-xs font-black transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 shadow-md"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          PRODUCT DIALOG MODAL
         ------------------------------------------------------------- */}
      {prodModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white border border-stone-200 rounded-3xl p-6 shadow-2xl animate-fade-in-up my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-stone-150 pb-3 mb-5">
              <h4 className="text-sm font-black text-black flex items-center gap-2">
                <span>🍽️</span>
                {prodEditing ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
              </h4>
              <button onClick={() => setProdModalOpen(false)} className="text-black hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex flex-col gap-5 text-black">
              {/* Product Basic Fields Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-black">Ürün Adı</label>
                  <input
                    type="text"
                    required
                    placeholder="örn. Caffe Latte"
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white text-sm outline-none text-black font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-black">Fiyat (TL)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="85.00"
                    value={pPrice}
                    onChange={(e) => setPPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white text-sm outline-none text-black font-semibold font-mono"
                  />
                </div>
              </div>

              {/* Description & AI */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-black">Ürün Açıklaması</label>
                  {hasAI && (
                    <button
                      type="button"
                      disabled={aiLoading.desc}
                      onClick={triggerAiDescription}
                      className="inline-flex items-center gap-1 text-[10px] text-indigo-750 hover:text-indigo-600 font-black bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition-all"
                    >
                      <Sparkles className="w-3 h-3" />
                      {aiLoading.desc ? 'Yazılıyor...' : 'AI ile Açıklama Yaz'}
                    </button>
                  )}
                </div>
                <textarea
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  rows={3}
                  placeholder="Ürünün malzemelerini ve hazırlık tarzını belirtin."
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white text-sm outline-none text-black font-semibold resize-none"
                />
              </div>

              {/* Images Source Selector */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-bold text-black">Ürün Görseli</label>
                <div className="flex gap-2 p-1 bg-stone-50 rounded-xl border border-stone-200 w-fit text-xs">
                  <button
                    type="button"
                    onClick={() => setPImageType('url')}
                    className={`px-3 py-1.5 rounded-lg font-black transition-all ${pImageType === 'url' ? 'bg-white text-black shadow-sm' : 'text-black/60'}`}
                  >
                    Cihazdan Yükle
                  </button>
                  <button
                    type="button"
                    onClick={() => setPImageType('common')}
                    className={`px-3 py-1.5 rounded-lg font-black transition-all ${pImageType === 'common' ? 'bg-white text-black shadow-sm' : 'text-black/60'}`}
                  >
                    Ortak Galeri Görseli
                  </button>
                </div>

                {pImageType === 'url' ? (
                  <div className="flex flex-col gap-2">
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleProdImageSelect(f); }}
                      onClick={() => prodImageInputRef.current?.click()}
                      className="border-2 border-dashed border-stone-200 hover:border-indigo-500 rounded-xl p-5 bg-stone-50/50 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                    >
                      <input
                        type="file"
                        accept="image/*,video/*"
                        ref={prodImageInputRef}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleProdImageSelect(f); }}
                        className="hidden"
                      />
                      {uploadingProdImage ? (
                        <div className="flex flex-col items-center gap-2 w-full">
                          <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                          {prodUploadProgress !== null && (
                            <div className="w-full max-w-[200px] bg-stone-250 border border-stone-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-indigo-600 h-full rounded-full transition-all duration-150"
                                style={{ width: `${prodUploadProgress}%` }}
                              />
                            </div>
                          )}
                          <span className="text-[10px] text-indigo-600 font-black">Yükleniyor... %{prodUploadProgress ?? 0}</span>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="w-7 h-7 text-stone-400" />
                          <span className="text-xs font-black text-black">Galeriden / kameradan seçin veya sürükleyin</span>
                          <span className="text-[10px] text-stone-400 font-bold">Görsel (maks 2MB) veya Video (maks 50MB) yükleyebilirsiniz</span>
                        </>
                      )}
                    </div>
                    {pImageUrl && (
                      <div className="relative w-full h-28 rounded-xl overflow-hidden border border-stone-200">
                        <MediaDisplay src={pImageUrl} alt="Önizleme" className="w-full h-full object-cover" controls autoPlay={false} loop={false} />
                        <button
                          type="button"
                          onClick={() => setPImageUrl('')}
                          className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-white/90 border border-stone-200 text-red-600 hover:bg-red-50 transition-colors"
                          title="Görseli kaldır"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <select
                        value={pCommonKey}
                        onChange={(e) => setPCommonKey(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white text-xs outline-none text-black font-bold appearance-none"
                      >
                        <option value="">Ortak galeriden bir görsel seçin...</option>
                        {Object.keys(combinedGallery).map((catKey) => (
                          <optgroup key={catKey} label={catKey} className="bg-white text-black font-bold">
                            {combinedGallery[catKey].map((img) => (
                              <option key={img.imageUrl} value={img.imageUrl} className="text-black font-semibold">
                                {catKey} - {img.title}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    {selectedCommonImageUrl && (
                      <div className="relative w-full h-28 rounded-xl overflow-hidden border border-stone-200">
                        <MediaDisplay src={selectedCommonImageUrl} alt="Ortak Görsel Önizleme" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPCommonKey('')}
                          className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-white/90 border border-stone-200 text-red-600 hover:bg-red-50 transition-colors"
                          title="Görseli kaldır"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Nutrition & Calories (Conditional based on active package limits) */}
              {hasNutrients && (
                <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-stone-150 pb-2">
                    <h5 className="text-xs font-black text-black flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      Kalori ve Makro Besin Bilgileri
                    </h5>
                    {hasAI && (
                      <button
                        type="button"
                        disabled={aiLoading.nutrition}
                        onClick={triggerAiNutrition}
                        className="inline-flex items-center gap-1 text-[9px] text-amber-800 hover:text-amber-600 font-black bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 transition-all"
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        {aiLoading.nutrition ? 'Hesaplanıyor...' : 'AI ile Değerleri Tahmin Et'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-black font-bold">Kalori (kcal)</label>
                      <input
                        type="number"
                        placeholder="250"
                        value={pCalories}
                        onChange={(e) => setPCalories(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 focus:border-indigo-500 text-center outline-none text-black font-mono font-bold"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-black font-bold">Protein (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="8"
                        value={pProtein}
                        onChange={(e) => setPProtein(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 focus:border-indigo-500 text-center outline-none text-black font-mono font-bold"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-black font-bold">Karbonh. (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="30"
                        value={pCarbs}
                        onChange={(e) => setPCarbs(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 focus:border-indigo-500 text-center outline-none text-black font-mono font-bold"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-black font-bold">Yağ (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="10"
                        value={pFat}
                        onChange={(e) => setPFat(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 focus:border-indigo-500 text-center outline-none text-black font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-xs font-bold text-black">Ürün Satışa Açık / Aktif</span>
                <button
                  type="button"
                  onClick={() => setPActive(!pActive)}
                  className="text-black transition-colors"
                >
                  {pActive ? (
                    <ToggleRight className="w-9 h-9 text-indigo-600" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-stone-300" />
                  )}
                </button>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-600 text-white text-xs font-black transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2 shadow-md"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Kaydediliyor...' : 'Ürünü Kaydet'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          AI CAMPAIGN COPYWRITING MODAL
         ------------------------------------------------------------- */}
      {campaignModalOpen && campaignProd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-stone-200 rounded-3xl p-6 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-stone-150 pb-3 mb-5">
              <h4 className="text-sm font-black text-black flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                AI Sosyal Medya Kampanyası
              </h4>
              <button onClick={() => setCampaignModalOpen(false)} className="text-black hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-black">
              <p className="text-xs text-black font-semibold">
                <strong className="text-black font-extrabold">{campaignProd.name}</strong> ürünü için indirim kampanyası metni oluşturun.
              </p>

              {/* Discount Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-black">İndirim Oranı (%)</label>
                <input
                  type="number"
                  min="5"
                  max="95"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 15)}
                  className="w-24 px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white text-sm outline-none text-black text-center font-bold font-mono"
                />
              </div>

              {/* Generate button */}
              <button
                onClick={triggerCampaignText}
                disabled={aiLoading.campaign}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-600 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 disabled:opacity-50 shadow-md"
              >
                <Volume2 className="w-3.5 h-3.5" />
                {aiLoading.campaign ? 'Metin Hazırlanıyor...' : 'Reklam Metni Üret'}
              </button>

              {/* Campaign text result */}
              {campaignText && (
                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-[10px] text-black font-black uppercase tracking-wider">Metin Kopyala</label>
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-black font-bold whitespace-pre-wrap leading-relaxed select-all relative group cursor-pointer" onClick={() => {
                    navigator.clipboard.writeText(campaignText);
                    showToast('Kopyalandı!', 'success');
                  }}>
                    {campaignText}
                    <span className="absolute top-1 right-2 text-[8px] bg-indigo-600 text-white px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Kopyala</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
