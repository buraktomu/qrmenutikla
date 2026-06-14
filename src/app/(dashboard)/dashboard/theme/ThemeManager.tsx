'use client';

import React, { useState, useMemo } from 'react';
import { useToast } from '@/components/ToastProvider';
import { updateBusinessSettings } from '@/app/actions/business';
import { THEMES, getThemeById, ThemeConfig } from '@/config/themes';
import { 
  CheckCircle2, 
  Save, 
  Sparkles, 
  Flame, 
  Plus, 
  ShoppingCart,
  ChevronRight,
  Info,
  Hand,
  Receipt,
  Mail,
  MessageCircle,
  X,
  BookOpen,
  MapPin,
  Clock
} from 'lucide-react';

type ThemeManagerProps = {
  business: {
    id: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
    allowOrders: boolean;
    showCalories: boolean;
    themeId: string;
    instagramUrl: string | null;
    locationUrl: string | null;
    reviewsUrl: string | null;
  };
  hasThemeSelectionLimit: boolean;
};

export default function ThemeManager({ business, hasThemeSelectionLimit }: ThemeManagerProps) {
  const { showToast } = useToast();
  
  const [selectedThemeId, setSelectedThemeId] = useState(business.themeId);
  const [loading, setLoading] = useState(false);
  const [premiumThemeContact, setPremiumThemeContact] = useState<ThemeConfig | null>(null);

  // Find currently active preview theme configuration
  const activePreviewTheme = useMemo(() => {
    return getThemeById(selectedThemeId);
  }, [selectedThemeId]);

  const handleSaveTheme = async () => {
    if (activePreviewTheme?.isPremiumAddon) {
      setPremiumThemeContact(activePreviewTheme);
      showToast('Bu premium bir temadır. Aktifleştirmek için lütfen satın alma talebi gönderin.', 'info');
      return;
    }

    setLoading(true);
    try {
      const res = await updateBusinessSettings(business.id, {
        name: business.name,
        phone: '', 
        address: '', 
        whatsappNumber: '', 
        showCalories: business.showCalories, 
        allowOrders: business.allowOrders,
        themeId: selectedThemeId,
      });

      if (res.success) {
        showToast('Tema tercihi başarıyla güncellendi.', 'success');
      } else {
        showToast(res.error || 'Tema kaydedilirken bir hata oluştu.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Sistem hatası oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isDarkPreview = useMemo(() => {
    const darkThemes = ['dark-mode', 'neon-style', 'premium-restaurant', 'luxury-gold', 'fine-dining', 'street-food', 'premium-3d-gourmet', 'premium-cyber-bistro'];
    return darkThemes.includes(selectedThemeId);
  }, [selectedThemeId]);

  const isCategoryLandingFullScreen = useMemo(() => {
    return [
      'premium-restaurant',
      'luxury-gold',
      'fine-dining',
      'coffee-house'
    ].includes(selectedThemeId);
  }, [selectedThemeId]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start w-full">
      
      {/* LEFT SECTION: Big interactive theme boxes (Clean Light Theme) */}
      <div className="xl:col-span-5 flex flex-col gap-6 p-6 md:p-8 rounded-3xl border border-zinc-200 bg-white shadow-xl shadow-zinc-100/60">
        <div>
          <h3 className="text-base font-black text-zinc-900 border-b border-zinc-100 pb-3">Kullanılabilir Tasarımlar</h3>
          <p className="text-[10px] text-zinc-400 mt-1 font-medium">İşletmenizin ambiyansına en uygun temayı aşağıdaki kutulardan seçin. Premium temaları önizleyebilir ve talep edebilirsiniz.</p>
        </div>

        {/* Large Box Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {THEMES.map((theme, index) => {
            const isLocked = hasThemeSelectionLimit && index > 2 && !theme.isPremiumAddon;
            const isSelected = selectedThemeId === theme.id;
            
            // Background previews
            const isDarkTheme = ['dark-mode', 'neon-style', 'premium-restaurant', 'luxury-gold', 'fine-dining', 'street-food', 'premium-3d-gourmet', 'premium-cyber-bistro'].includes(theme.id);
            const mainBgClass = theme.bgMain.split(' ')[0] || 'bg-stone-50';
            const cardBgClass = theme.bgCard.split(' ')[0] || 'bg-white';

            return (
              <button
                type="button"
                key={theme.id}
                disabled={isLocked}
                onClick={() => {
                  setSelectedThemeId(theme.id);
                  if (theme.isPremiumAddon) {
                    setPremiumThemeContact(theme);
                  }
                }}
                className={`group relative flex flex-col justify-between p-5 rounded-2xl border-2 text-left transition-all duration-300 overflow-hidden cursor-pointer ${isSelected ? 'border-indigo-600 bg-indigo-50/10 shadow-lg shadow-indigo-500/5' : 'border-zinc-200/80 bg-zinc-50 hover:bg-zinc-100/80 hover:border-zinc-300'} ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                
                {/* Visual Accent representation at top */}
                <div className="flex justify-between items-start w-full mb-6 z-10">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                      {theme.name}
                      {theme.isPremiumAddon && (
                        <span className="text-[8px] bg-amber-500/10 text-amber-700 px-1.5 py-0.5 rounded font-black tracking-wide">PREMIUM</span>
                      )}
                    </span>
                    <span className="text-[9px] text-zinc-400 font-mono mt-0.5 uppercase tracking-wider">
                      {theme.fontHeader.split(' ')[0]} / {theme.fontBody.split(' ')[0]}
                    </span>
                  </div>

                  {isSelected && !theme.isPremiumAddon ? (
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
                  ) : null}
                  
                  {theme.isPremiumAddon ? (
                    <span className="text-[8px] bg-amber-100 border border-amber-200 text-amber-800 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                      {theme.priceLabel || 'Ücretli'}
                    </span>
                  ) : isLocked ? (
                    <span className="text-[8px] bg-zinc-200 border border-zinc-300 text-zinc-500 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                      Starter Kilitli
                    </span>
                  ) : null}
                </div>

                {/* Swatch Previews */}
                <div className="flex items-center justify-between w-full mt-auto z-10">
                  <div className="flex items-center gap-3">
                    {/* Colors Preview Ring */}
                    <div className="flex -space-x-1.5 overflow-hidden">
                      <span className={`w-4 h-4 rounded-full border border-zinc-200 ${mainBgClass}`} />
                      <span className={`w-4 h-4 rounded-full border border-zinc-200 ${cardBgClass}`} />
                      <span className={`w-4 h-4 rounded-full ${theme.accentColor.split(' ')[0]}`} />
                    </div>
                    
                    {/* Style Pill tag */}
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${isDarkTheme ? 'bg-zinc-900 text-zinc-300' : 'bg-white border border-zinc-200 text-zinc-600'}`}>
                      {isDarkTheme ? 'Koyu Stil' : 'Açık Stil'}
                    </span>
                  </div>

                  {theme.isPremiumAddon && (
                    <span className="text-[8px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Ücret için danışın
                    </span>
                  )}
                </div>

                {/* Highlight Glow Effect on hover */}
                <div className="absolute -right-6 -bottom-6 w-12 h-12 rounded-full bg-indigo-500/5 group-hover:scale-150 transition-transform duration-500" />
              </button>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="flex justify-end border-t border-zinc-100 pt-5 mt-4">
          <button
            onClick={handleSaveTheme}
            disabled={loading}
            className={`px-6 py-3.5 rounded-xl text-white text-xs font-bold tracking-wider transition-all flex items-center gap-2.5 shadow-lg active:scale-98 disabled:opacity-50 ${
              activePreviewTheme?.isPremiumAddon 
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/15' 
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-650/15'
            }`}
          >
            {activePreviewTheme?.isPremiumAddon ? (
              <>
                <MessageCircle className="w-4 h-4" />
                PREMIUM TEMA SATIN AL / DANIŞ
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {loading ? 'KAYDEDİLİYOR...' : 'TEMA TERCİHİNİ KAYDET'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* RIGHT SECTION: Premium Mockup Phone Screen Preview */}
      <div className="xl:col-span-7 flex flex-col items-center gap-6 xl:sticky xl:top-6 w-full">
        <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          İşletme Teması Canlı Önizleme (Giriş - Orta - Son)
        </span>

        {/* 3 Mockup Phones Grid Container */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full justify-items-center">

          {/* PHONE 1: Giriş (Açılış / Splash Screen) */}
          <div className="flex flex-col items-center gap-2 w-full">
            <span className="text-[9px] font-bold text-zinc-400">1. Giriş (Açılış/Splash)</span>
            <div className="w-full max-w-[220px] h-[450px] rounded-[32px] border-[8px] border-zinc-900 bg-zinc-900 shadow-2xl relative overflow-hidden flex flex-col justify-between select-none">
              
              {/* Notch */}
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-3 rounded-full bg-black z-50" />
              
              {/* Splash Background Cover */}
              <div className="absolute inset-0 z-0">
                <img
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=70"
                  alt="cover"
                  className="w-full h-full object-cover brightness-[0.35]"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${isDarkPreview ? 'from-black/95 via-black/40 to-black/85' : 'from-stone-900/90 via-stone-900/30 to-stone-900/80'}`} />
              </div>

              {/* Splash Content */}
              <div className="relative z-10 flex-1 w-full h-full flex flex-col items-center justify-between px-3 pt-6 pb-4 text-white">
                <div className="flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full border border-amber-500/40 flex items-center justify-center p-0.5 bg-black/45 backdrop-blur-md mb-1.5 mt-2">
                    {business.logoUrl ? (
                      <img src={business.logoUrl} alt="logo" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-[9px] font-black">{business.name.substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <p className="text-[6px] font-black tracking-[0.2em] text-amber-500/90 uppercase mb-0.5">HOŞ GELDİNİZ</p>
                  <h3 className={`text-[11px] font-bold line-clamp-1 ${activePreviewTheme.fontHeader}`}>{business.name}</h3>
                  
                  <div className="flex items-center justify-center gap-1 w-12 my-1">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-500/40" />
                    <div className="w-1 h-1 rotate-45 bg-amber-500" />
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-500/40" />
                  </div>
                </div>

                <div className="my-auto flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border border-amber-500/20 flex items-center justify-center p-1 bg-transparent">
                    <div className="w-full h-full rounded-full bg-[#dfba88] text-stone-900 flex flex-col items-center justify-center gap-0.5 shadow-lg">
                      <BookOpen className="w-3.5 h-3.5 text-stone-900" />
                      <span className="text-[5px] font-black uppercase tracking-wider text-center leading-tight">
                        MENÜYÜ<br/>GÖRÜNTÜLE
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full flex items-center justify-center gap-1 flex-wrap text-[6px] font-bold">
                  {business.instagramUrl && (
                    <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/90 backdrop-blur-sm flex items-center gap-0.5 shadow">
                      Instagram
                    </span>
                  )}
                  {business.locationUrl && (
                    <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/90 backdrop-blur-sm flex items-center gap-0.5 shadow">
                      Konum
                    </span>
                  )}
                  {business.reviewsUrl && (
                    <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/90 backdrop-blur-sm flex items-center gap-0.5 shadow">
                      Yorumlar
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom indicator */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-14 h-0.5 rounded-full bg-zinc-800 z-55" />
            </div>
          </div>

          {/* PHONE 2: Orta (Kategori Karşılama) */}
          <div className="flex flex-col items-center gap-2 w-full">
            <span className="text-[9px] font-bold text-zinc-400">
              2. Orta ({isCategoryLandingFullScreen ? 'Kategori - Tam Ekran' : 'Kategori - Liste'})
            </span>
            <div className="w-full max-w-[220px] h-[450px] rounded-[32px] border-[8px] border-zinc-900 bg-zinc-900 shadow-2xl relative overflow-hidden flex flex-col justify-between select-none">
              
              {/* Notch */}
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-3 rounded-full bg-black z-50" />
              
              {/* Screen Content */}
              <div className={`w-full h-full ${activePreviewTheme.bgMain} ${activePreviewTheme.fontBody} overflow-y-auto pt-6 pb-8 flex flex-col justify-between transition-colors duration-300 scrollbar-none relative`}>
                {activePreviewTheme.hasGlow && (
                  <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-fuchsia-500 via-purple-650 to-cyan-500" />
                )}

                <div>
                  {/* Header */}
                  <header className="px-3 pt-3 pb-2 flex flex-col items-center text-center border-b border-current/5">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-current/10 bg-zinc-950 flex items-center justify-center font-bold text-[10px] text-white">
                      {business.logoUrl ? (
                        <img src={business.logoUrl} alt="logo" className="w-full h-full object-cover" />
                      ) : (
                        business.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <h1 className={`text-xs ${activePreviewTheme.fontHeader} font-black text-current mt-1`}>
                      {business.name}
                    </h1>
                    <p className="text-[7px] opacity-65 leading-relaxed font-light line-clamp-1 max-w-[140px] mt-0.5">
                      {business.description || 'Lezzetli tatların en doğru adresi.'}
                    </p>
                  </header>

                  <div className="px-3 pt-2 pb-1 text-[7px] font-bold uppercase tracking-wider text-current/40 text-center">
                    Kategoriler
                  </div>

                  {/* Dynamic Category Preview */}
                  {(() => {
                    const mockCategories = [
                      { id: 'cat-1', name: 'Burgerler', count: 6, img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=70' },
                      { id: 'cat-2', name: 'Tatlılar', count: 4, img: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=300&q=70' },
                      { id: 'cat-3', name: 'İçecekler', count: 8, img: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&q=70' },
                      { id: 'cat-4', name: 'Salatalar', count: 3, img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=70' },
                    ];

                    const view = activePreviewTheme.categoryView;

                    if (view === 'IMAGE_GRID') {
                      return (
                        <div className="grid grid-cols-2 gap-2 p-2">
                          {mockCategories.map(cat => (
                            <div key={cat.id} className="relative rounded-xl overflow-hidden h-14 bg-zinc-800 border border-current/5 shadow-sm">
                              <img src={cat.img} alt={cat.name} className="absolute inset-0 w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                              <div className="absolute bottom-1 left-2 text-left">
                                <p className="text-white font-bold text-[8px] leading-tight">{cat.name}</p>
                                <p className="text-white/60 text-[6px]">{cat.count} ürün</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    if (view === 'SHOWCASE') {
                      return (
                        <div className="flex flex-col gap-2 p-2">
                          {mockCategories.slice(0, 3).map(cat => (
                            <div key={cat.id} className="relative rounded-lg overflow-hidden h-14 bg-zinc-800 border border-current/5">
                              <img src={cat.img} alt={cat.name} className="absolute inset-0 w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/30 to-transparent" />
                              <div className="absolute inset-y-0 left-3 flex flex-col justify-center text-left">
                                <p className="text-amber-400 text-[5px] font-semibold tracking-wider uppercase mb-0.5">{cat.count} ürün</p>
                                <h4 className={`text-white text-[9px] font-bold ${activePreviewTheme.fontHeader}`}>{cat.name}</h4>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    if (view === 'MAGAZINE') {
                      return (
                        <div className="flex flex-col gap-2 p-2">
                          <div className="relative rounded-xl overflow-hidden h-20 bg-zinc-800 border border-current/5">
                            <img src={mockCategories[0].img} alt={mockCategories[0].name} className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                            <div className="absolute bottom-1.5 left-3 text-left">
                              <p className="text-white/60 text-[5px] uppercase tracking-wider">{mockCategories[0].count} ürün</p>
                              <h4 className={`text-white text-[9px] font-bold ${activePreviewTheme.fontHeader}`}>{mockCategories[0].name}</h4>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {mockCategories.slice(1, 3).map(cat => (
                              <div key={cat.id} className="relative rounded-lg overflow-hidden h-12 bg-zinc-800 border border-current/5">
                                <img src={cat.img} alt={cat.name} className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="absolute bottom-1 left-2 text-left">
                                  <h4 className={`text-white text-[8px] font-bold ${activePreviewTheme.fontHeader} leading-tight`}>{cat.name}</h4>
                                  <p className="text-white/65 text-[5px]">{cat.count} ürün</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (view === 'MASONRY') {
                      return (
                        <div className="flex gap-2 p-2">
                          {/* Left Column */}
                          <div className="flex-1 flex flex-col gap-2">
                            {/* Card 1: Burgerler (tall) */}
                            <div className="relative rounded-lg overflow-hidden bg-zinc-800 border border-current/5 h-20">
                              <img src={mockCategories[0].img} alt={mockCategories[0].name} className="absolute inset-0 w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                              <div className="absolute bottom-1 left-2 text-left">
                                <h4 className={`text-white text-[8px] font-bold ${activePreviewTheme.fontHeader} leading-tight`}>{mockCategories[0].name}</h4>
                                <p className="text-white/50 text-[5px]">{mockCategories[0].count} ürün</p>
                              </div>
                            </div>
                            {/* Card 3: İçecekler (short) */}
                            <div className="relative rounded-lg overflow-hidden bg-zinc-800 border border-current/5 h-12">
                              <img src={mockCategories[2].img} alt={mockCategories[2].name} className="absolute inset-0 w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                              <div className="absolute bottom-1 left-2 text-left">
                                <h4 className={`text-white text-[8px] font-bold ${activePreviewTheme.fontHeader} leading-tight`}>{mockCategories[2].name}</h4>
                                <p className="text-white/50 text-[5px]">{mockCategories[2].count} ürün</p>
                              </div>
                            </div>
                          </div>

                          {/* Right Column */}
                          <div className="flex-1 flex flex-col gap-2">
                            {/* Card 2: Tatlılar (short) */}
                            <div className="relative rounded-lg overflow-hidden bg-zinc-800 border border-current/5 h-12">
                              <img src={mockCategories[1].img} alt={mockCategories[1].name} className="absolute inset-0 w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                              <div className="absolute bottom-1 left-2 text-left">
                                <h4 className={`text-white text-[8px] font-bold ${activePreviewTheme.fontHeader} leading-tight`}>{mockCategories[1].name}</h4>
                                <p className="text-white/50 text-[5px]">{mockCategories[1].count} ürün</p>
                              </div>
                            </div>
                            {/* Card 4: Salatalar (tall) */}
                            <div className="relative rounded-lg overflow-hidden bg-zinc-800 border border-current/5 h-20">
                              <img src={mockCategories[3].img} alt={mockCategories[3].name} className="absolute inset-0 w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                              <div className="absolute bottom-1 left-2 text-left">
                                <h4 className={`text-white text-[8px] font-bold ${activePreviewTheme.fontHeader} leading-tight`}>{mockCategories[3].name}</h4>
                                <p className="text-white/50 text-[5px]">{mockCategories[3].count} ürün</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (view === 'LUXURY_CATALOG') {
                      return (
                        <div className="flex flex-col gap-2 p-2">
                          {mockCategories.slice(0, 3).map(cat => (
                            <div key={cat.id} className="relative w-full h-14 overflow-hidden bg-black border border-amber-500/10">
                              <img src={cat.img} alt={cat.name} className="absolute inset-0 w-full h-full object-cover brightness-50" />
                              <div className="absolute inset-0 bg-black/40" />
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <p className="text-amber-300/85 text-[5px] tracking-wider uppercase mb-0.5">{cat.count} ürün</p>
                                <h4 className={`text-white text-[8px] tracking-widest uppercase font-light ${activePreviewTheme.fontHeader}`}>{cat.name}</h4>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    // CLASSIC_LIST
                    return (
                      <div className="flex flex-col p-2.5 divide-y divide-current/5">
                        {mockCategories.map(cat => (
                          <div key={cat.id} className="py-2 flex items-center justify-between text-[9px] font-medium text-current/80">
                            <span>{cat.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

              </div>

              {/* Bottom indicator */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-14 h-0.5 rounded-full bg-zinc-800 z-55" />
            </div>
          </div>

          {/* PHONE 3: Son (Ürün Menü Listesi) */}
          <div className="flex flex-col items-center gap-2 w-full">
            <span className="text-[9px] font-bold text-zinc-400">3. Son (Ürün Listesi/Menü)</span>
            <div className="w-full max-w-[220px] h-[450px] rounded-[32px] border-[8px] border-zinc-900 bg-zinc-900 shadow-2xl relative overflow-hidden flex flex-col justify-between select-none">
              
              {/* Notch */}
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-3 rounded-full bg-black z-50" />
              
              {/* Screen Content */}
              <div className={`w-full h-full ${activePreviewTheme.bgMain} ${activePreviewTheme.fontBody} overflow-y-auto pt-6 pb-12 flex flex-col justify-between transition-colors duration-300 scrollbar-none relative`}>
                {activePreviewTheme.hasGlow && (
                  <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-fuchsia-500 via-purple-650 to-cyan-500" />
                )}

                <div>
                  {/* Back button if full-screen category */}
                  {isCategoryLandingFullScreen && (
                    <div className="px-3 pt-2">
                      <div className="w-full py-1 rounded-lg text-[6px] font-black flex items-center justify-center gap-1 bg-current/10 border border-current/15 text-current/80">
                        ← Kategorilere Dön
                      </div>
                    </div>
                  )}

                  {/* Search Bar mockup */}
                  <div className="px-3 pt-2">
                    <div className="w-full px-2 py-1 rounded-lg bg-current/5 border border-current/10 text-[7px] text-current/40 flex items-center gap-1">
                      <span>Ürün ara...</span>
                    </div>
                  </div>

                  {/* Mockup Pills */}
                  <div className="px-3 py-2 flex gap-1 overflow-x-auto scrollbar-none border-b border-current/5">
                    <span className={`px-2 py-0.5 rounded-md text-[7px] font-black ${isDarkPreview ? 'bg-indigo-50 text-white' : 'bg-stone-900 text-white'}`}>Tümü</span>
                    <span className={`px-2 py-0.5 rounded-md text-[7px] font-black ${isDarkPreview ? 'bg-zinc-900/50 text-zinc-400' : 'bg-stone-100 text-stone-600'}`}>Sıcaklar</span>
                    <span className={`px-2 py-0.5 rounded-md text-[7px] font-black ${isDarkPreview ? 'bg-zinc-900/50 text-zinc-400' : 'bg-stone-100 text-stone-600'}`}>Tatlılar</span>
                  </div>

                  {/* Sample Product Cards */}
                  <div className="px-3 py-2.5 flex flex-col gap-2">
                    
                    {/* Product 1 */}
                    <div className={`p-2 rounded-xl ${activePreviewTheme.bgCard} ${activePreviewTheme.borderColor} border flex gap-2 items-center`}>
                      <div className="w-8 h-8 bg-current/10 rounded-lg shrink-0 flex items-center justify-center font-bold text-sm">🍔</div>
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className={`text-[8px] font-bold truncate ${activePreviewTheme.textTitle}`}>Gourmet Burger</h4>
                        <p className={`text-[6px] line-clamp-1 opacity-60 leading-normal mt-0.5 ${activePreviewTheme.textDesc}`}>180gr dana köfte ve peynir.</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className={`text-[8px] font-black ${activePreviewTheme.textPrice}`}>295 TL</span>
                        </div>
                      </div>
                      {business.allowOrders && (
                        <div className="pl-0.5 shrink-0">
                          <span className={`w-4 h-4 rounded-md flex items-center justify-center ${activePreviewTheme.accentColor} font-bold text-[8px]`}>
                            <Plus className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product 2 */}
                    <div className={`p-2 rounded-xl ${activePreviewTheme.bgCard} ${activePreviewTheme.borderColor} border flex gap-2 items-center`}>
                      <div className="w-8 h-8 bg-current/10 rounded-lg shrink-0 flex items-center justify-center font-bold text-sm">☕</div>
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className={`text-[8px] font-bold truncate ${activePreviewTheme.textTitle}`}>Caffe Latte</h4>
                        <p className={`text-[6px] line-clamp-1 opacity-60 leading-normal mt-0.5 ${activePreviewTheme.textDesc}`}>Çift shot espresso.</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className={`text-[8px] font-black ${activePreviewTheme.textPrice}`}>85 TL</span>
                        </div>
                      </div>
                      {business.allowOrders && (
                        <div className="pl-0.5 shrink-0">
                          <span className={`w-4 h-4 rounded-md flex items-center justify-center ${activePreviewTheme.accentColor} font-bold text-[8px]`}>
                            <Plus className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* Mock Floating Cart Bar OR Waiter Quick Actions */}
                <div className="px-3 py-2 mt-auto">
                  {business.allowOrders ? (
                    <div className={`w-full py-2 px-2.5 rounded-lg ${activePreviewTheme.accentColor} flex items-center justify-between text-[7px] font-black tracking-wide shadow`}>
                      <div className="flex items-center gap-1">
                        <ShoppingCart className="w-2.5 h-2.5" />
                        <span>Sepetim (1)</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <span>380 TL</span>
                        <ChevronRight className="w-2 h-2" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5 w-full">
                      <div className="py-1.5 rounded-lg bg-indigo-600 text-white flex items-center justify-center gap-0.5 text-[7px] font-black uppercase tracking-wider shadow">
                        <Hand className="w-2.5 h-2.5" />
                        Garson
                      </div>
                      <div className="py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white flex items-center justify-center gap-0.5 text-[7px] font-black uppercase tracking-wider shadow">
                        <Receipt className="w-2.5 h-2.5" />
                        Hesap
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom indicator */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-14 h-0.5 rounded-full bg-zinc-800 z-55" />
            </div>
          </div>

        </div>

        <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 max-w-[450px] text-center font-medium leading-relaxed">
          <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>Canlı önizleme sırasıyla Giriş (Hoş Geldiniz), Orta (Kategoriler) ve Son (Ürünler) ekranlarından oluşmaktadır.</span>
        </div>
      </div>

      {/* Premium Theme Purchase Inquiry Modal */}
      {premiumThemeContact && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200 text-left">
            <button 
              onClick={() => setPremiumThemeContact(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-750 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="font-black text-stone-900 text-base">{premiumThemeContact.name}</h4>
                <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest mt-0.5">Premium Özel Tasarım</p>
              </div>
            </div>

            <p className="text-xs text-stone-650 leading-relaxed mb-6 font-medium">
              Bu özel premium tema paketi işletmenize prestij kazandırmak için özel olarak tasarlanmıştır. Temayı hemen menünüzde aktif etmek için bizimle iletişime geçebilirsiniz.
            </p>

            {/* Price Details */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between mb-6">
              <span className="text-xs font-semibold text-stone-500">Tek Seferlik Aktivasyon Ücreti:</span>
              <span className="text-lg font-black text-stone-900">{premiumThemeContact.priceLabel || 'Fiyat Alınız'}</span>
            </div>

            {/* Support Actions */}
            <div className="flex flex-col gap-3">
              {/* WhatsApp Line */}
              <a
                href={`https://wa.me/905380509930?text=Merhaba,%20${encodeURIComponent(premiumThemeContact.name)}%20premium%20temasını%20satın%20almak%20ve%20menümde%20aktif%20etmek%20istiyorum.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/15"
              >
                <MessageCircle className="w-4.5 h-4.5" />
                WHATSAPP İLE TALEBİ İLET
              </a>

              {/* Email Line */}
              <a
                href={`mailto:destek@qrmenuai.com?subject=Premium%20Tema%20Talebi%20-%20${encodeURIComponent(premiumThemeContact.name)}&body=Merhaba,%0D%0A%0D%0A${encodeURIComponent(business.name)}%20işletmem%20için%20${encodeURIComponent(premiumThemeContact.name)}%20premium%20temasını%20satın%20almak%20ve%20aktif%20etmek%20istiyorum.%20Detayları%20ve%20ödeme%20yöntemlerini%20paylaşabilir%20misiniz?`}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-650/15"
              >
                <Mail className="w-4.5 h-4.5" />
                E-POSTA İLE TALEBİ İLET
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
