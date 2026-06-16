'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { getThemeById } from '@/config/themes';
import type { CategoryView } from '@/config/themes';
import {
  Search,
  ShoppingCart,
  Flame,
  Plus,
  Minus,
  X,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  UtensilsCrossed,
  Sparkles,
  MapPin,
  Clock,
  Info,
  Receipt,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

// ─── Types ────────────────────────────────────────────────────────────────────

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

type QrMenuProps = {
  business: {
    name: string;
    description: string | null;
    whatsappNumber: string | null;
    showCalories: boolean;
    allowOrders: boolean;
    logoUrl: string | null;
    coverVideoUrl: string | null;
    coverImageUrl: string | null;
    themeId: string;
    openingHours: string | null;
    serviceType: string;
    address: string | null;
    instagramUrl: string | null;
    locationUrl: string | null;
    reviewsUrl: string | null;
    slug: string;
  };
  categories: CategoryType[];
  hasWhatsAppOrder: boolean;
  hasNutrients: boolean;
  // When true, the menu is display-only: no cart, ordering or waiter-call UI.
  viewOnly?: boolean;
};

type CartItem = {
  product: ProductType;
  quantity: number;
};

// ─── Category image resolver ──────────────────────────────────────────────────

const CATEGORY_FALLBACKS: Record<string, string> = {
  salata: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=75',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=75',
  tatli: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=75',
  dessert: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=75',
  içecek: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&auto=format&fit=crop&q=75',
  drink: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&auto=format&fit=crop&q=75',
  makarna: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600&auto=format&fit=crop&q=75',
  pasta: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600&auto=format&fit=crop&q=75',
  et: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=600&auto=format&fit=crop&q=75',
  meat: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=600&auto=format&fit=crop&q=75',
  deniz: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=600&auto=format&fit=crop&q=75',
  seafood: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=600&auto=format&fit=crop&q=75',
};

const THEME_PLACEHOLDERS: Record<string, string> = {
  'modern-cafe': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=75',
  'premium-restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=75',
  'fast-food': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&auto=format&fit=crop&q=75',
  'minimal': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=75',
  'dark-mode': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format&fit=crop&q=75',
  'luxury-gold': 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=600&auto=format&fit=crop&q=75',
  'coffee-house': 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=600&auto=format&fit=crop&q=75',
  'street-food': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=75',
  'fine-dining': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=75',
  'neon-style': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=75',
  'sef-klasik': 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&auto=format&fit=crop&q=75',
  'premium-3d-gourmet': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&auto=format&fit=crop&q=75',
  'premium-cyber-bistro': 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=600&auto=format&fit=crop&q=75',
  'premium-retro-news': 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&auto=format&fit=crop&q=75',
};

function getCategoryImage(cat: CategoryType, themeId: string = 'modern-cafe'): string {
  if (cat.categoryImageUrl) return cat.categoryImageUrl;
  const firstWithImage = cat.products.find((p) => p.isActive && p.imageUrl);
  if (firstWithImage?.imageUrl) return firstWithImage.imageUrl;
  const nameLower = cat.name.toLowerCase();
  for (const [key, url] of Object.entries(CATEGORY_FALLBACKS)) {
    if (nameLower.includes(key)) return url;
  }
  return THEME_PLACEHOLDERS[themeId] || THEME_PLACEHOLDERS['modern-cafe'];
}

function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase().split('?')[0];
  return lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.webm') || lowerUrl.endsWith('.mov');
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

  useEffect(() => {
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

// ─── Premium Logo / Monogram ──────────────────────────────────────────────────

function BusinessLogoOrMonogram({
  logoUrl,
  name,
  size = 'md',
  dark = true,
}: {
  logoUrl: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  dark?: boolean;
}) {
  const sizeMap = { sm: 'w-9 h-9 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-20 h-20 text-xl' };
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  if (logoUrl) {
    return (
      <MediaDisplay
        src={logoUrl}
        alt={name}
        className={`${sizeMap[size]} rounded-full object-cover`}
        autoPlay
        loop
        controls={false}
      />
    );
  }

  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center font-bold tracking-widest border ${
        dark
          ? 'bg-white/10 border-white/20 text-white backdrop-blur-sm'
          : 'bg-stone-100 border-stone-200 text-stone-700'
      }`}
    >
      {initials}
    </div>
  );
}

// ─── Category Navigation Cards (Scroll-based) ─────────────────────────────────

type CategoryNavProps = {
  categories: CategoryType[];
  theme: ReturnType<typeof getThemeById>;
  categoryView: CategoryView;
  onScrollToCategory: (catId: string) => void;
};

function CategoryNavCards({ categories, theme, categoryView, onScrollToCategory }: CategoryNavProps) {
  const isDark = [
    'dark-mode','neon-style','premium-restaurant','luxury-gold',
    'fine-dining','street-food','premium-3d-gourmet','premium-cyber-bistro',
  ].includes(theme.id);

  // ── IMAGE_GRID ──────────────────────────────────────────────────────────────
  if (categoryView === 'IMAGE_GRID') {
    return (
      <div className="px-4 pt-5 pb-2">
        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-3 ${isDark ? 'text-zinc-500' : 'text-stone-400'}`}>
          Kategoriler
        </p>
        <div className="grid grid-cols-2 gap-3.5">
          {categories.map((cat) => {
            const img = getCategoryImage(cat, theme.id);
            return (
              <button
                key={cat.id}
                onClick={() => onScrollToCategory(cat.id)}
                className="relative rounded-[20px] overflow-hidden aspect-square cursor-pointer group"
              >
                {img ? (
                  <MediaDisplay
                    src={img}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    autoPlay
                    loop
                    controls={false}
                    fallback={<div className={`w-full h-full ${isDark ? 'bg-zinc-800' : 'bg-stone-100'}`} />}
                  />
                ) : (
                  <div className={`w-full h-full ${isDark ? 'bg-zinc-800' : 'bg-stone-100'}`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-center">
                  <p className="text-white font-bold text-sm leading-tight">{cat.name}</p>
                  <p className="text-white/70 text-[10px] font-medium mt-0.5">{cat.products.filter(p=>p.isActive).length} ürün</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── SHOWCASE ────────────────────────────────────────────────────────────────
  if (categoryView === 'SHOWCASE') {
    return (
      <div className="px-4 pt-5 pb-2 flex flex-col gap-3">
        <div>
          <p className="text-[10px] font-light tracking-[0.3em] uppercase text-amber-500 mb-1">Menu</p>
          <h2 className={`text-base font-light tracking-wider ${theme.fontHeader} ${isDark ? 'text-white' : 'text-stone-900'}`}>
            Kategorilerimiz
          </h2>
        </div>
        {categories.map((cat) => {
          const img = getCategoryImage(cat, theme.id);
          return (
            <button
              key={cat.id}
              onClick={() => onScrollToCategory(cat.id)}
              className="relative rounded-xl overflow-hidden h-36 w-full cursor-pointer group"
            >
              {img ? (
                <MediaDisplay
                  src={img}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  autoPlay
                  loop
                  controls={false}
                  fallback={<div className={`w-full h-full ${isDark ? 'bg-zinc-800' : 'bg-stone-100'}`} />}
                />
              ) : (
                <div className={`w-full h-full ${isDark ? 'bg-zinc-800' : 'bg-stone-100'}`} />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
              <div className="absolute inset-y-0 left-0 flex flex-col justify-center px-5">
                <p className="text-amber-400 text-[10px] font-semibold tracking-widest uppercase mb-1">
                  {cat.products.filter(p=>p.isActive).length} ürün
                </p>
                <h3 className={`text-white text-xl font-light tracking-wide ${theme.fontHeader}`}>{cat.name}</h3>
                <div className="flex items-center gap-1 text-white/50 text-xs mt-2 group-hover:text-amber-400 transition-colors">
                  <span>Git</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // ── MAGAZINE ────────────────────────────────────────────────────────────────
  if (categoryView === 'MAGAZINE') {
    return (
      <div className="px-4 pt-5 pb-2">
        <p className={`text-[9px] font-bold uppercase tracking-[0.25em] mb-3 ${isDark ? 'text-zinc-500' : 'text-stone-400'}`}>
          Kategoriler
        </p>
        {categories.length > 0 && (() => {
          const cat = categories[0];
          const img = getCategoryImage(cat, theme.id);
          return (
            <button
              key={cat.id}
              onClick={() => onScrollToCategory(cat.id)}
              className="relative w-full rounded-2xl overflow-hidden h-44 mb-3 cursor-pointer group"
            >
              {img ? (
                <MediaDisplay
                  src={img}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-105"
                  autoPlay
                  loop
                  controls={false}
                  fallback={<div className={`w-full h-full ${isDark ? 'bg-zinc-800' : 'bg-amber-100'}`} />}
                />
              ) : (
                <div className={`w-full h-full ${isDark ? 'bg-zinc-800' : 'bg-amber-100'}`} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold mb-1">{cat.products.filter(p=>p.isActive).length} ürün</p>
                <h3 className={`text-white text-xl font-bold ${theme.fontHeader}`}>{cat.name}</h3>
              </div>
            </button>
          );
        })()}
        <div className="grid grid-cols-2 gap-3">
          {categories.slice(1).map((cat) => {
            const img = getCategoryImage(cat, theme.id);
            return (
              <button
                key={cat.id}
                onClick={() => onScrollToCategory(cat.id)}
                className="relative rounded-xl overflow-hidden h-28 cursor-pointer group"
              >
                {img ? (
                  <MediaDisplay
                    src={img}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                    autoPlay
                    loop
                    controls={false}
                    fallback={<div className={`w-full h-full ${isDark ? 'bg-zinc-800' : 'bg-amber-55'}`} />}
                  />
                ) : (
                  <div className={`w-full h-full ${isDark ? 'bg-zinc-800' : 'bg-amber-50'}`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2.5 text-left">
                  <h4 className={`text-white text-sm font-bold ${theme.fontHeader} leading-tight`}>{cat.name}</h4>
                  <p className="text-white/55 text-[9px] mt-0.5">{cat.products.filter(p=>p.isActive).length} ürün</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── MASONRY ─────────────────────────────────────────────────────────────────
  if (categoryView === 'MASONRY') {
    return (
      <div className="px-4 pt-5 pb-2">
        <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${theme.fontHeader} ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
          Kategoriler
        </p>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat, i) => {
            const img = getCategoryImage(cat, theme.id);
            const isTall = i % 3 === 0;
            return (
              <button
                key={cat.id}
                onClick={() => onScrollToCategory(cat.id)}
                className={`relative rounded-xl overflow-hidden cursor-pointer group ${isTall ? 'h-44' : 'h-28'}`}
              >
                {img ? (
                  <MediaDisplay
                    src={img}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    autoPlay
                    loop
                    controls={false}
                    fallback={<div className={`w-full h-full ${isDark ? 'bg-zinc-800' : 'bg-stone-200'}`} />}
                  />
                ) : (
                  <div className={`w-full h-full ${isDark ? 'bg-zinc-800' : 'bg-stone-200'}`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-left">
                  <h4 className={`text-white font-black text-sm ${theme.fontHeader} leading-tight`}>{cat.name}</h4>
                  <p className="text-white/55 text-[10px] mt-0.5">{cat.products.filter(p=>p.isActive).length} ürün</p>
                </div>
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${theme.accentColor.includes('yellow') ? 'bg-yellow-400' : theme.accentColor.includes('fuchsia') ? 'bg-fuchsia-500' : 'bg-amber-500'} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── LUXURY_CATALOG ──────────────────────────────────────────────────────────
  if (categoryView === 'LUXURY_CATALOG') {
    return (
      <div className="px-4 pt-6 pb-2 flex flex-col gap-3">
        <div className="text-center mb-1">
          <p className={`text-[9px] tracking-[0.35em] uppercase font-light mb-1.5 ${isDark ? 'text-zinc-600' : 'text-stone-400'}`}>
            Our Menu
          </p>
          <div className={`mx-auto w-12 h-px ${isDark ? 'bg-amber-500/50' : 'bg-stone-400/40'}`} />
        </div>
        {categories.map((cat) => {
          const img = getCategoryImage(cat, theme.id);
          return (
            <button
              key={cat.id}
              onClick={() => onScrollToCategory(cat.id)}
              className="relative w-full h-40 overflow-hidden cursor-pointer group"
            >
              {img ? (
                <MediaDisplay
                  src={img}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 brightness-75"
                  autoPlay
                  loop
                  controls={false}
                  fallback={<div className={`w-full h-full ${isDark ? 'bg-zinc-900' : 'bg-stone-200'}`} />}
                />
              ) : (
                <div className={`w-full h-full ${isDark ? 'bg-zinc-900' : 'bg-stone-200'}`} />
              )}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-500" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-amber-300/80 text-[9px] tracking-[0.3em] uppercase font-light mb-1.5">
                  {cat.products.filter(p=>p.isActive).length} ürün
                </p>
                <h3 className={`text-white text-lg font-light tracking-[0.15em] uppercase ${theme.fontHeader}`}>{cat.name}</h3>
                <div className="mt-2.5 flex items-center gap-1.5 text-white/40 text-[10px] group-hover:text-amber-300 transition-colors tracking-widest uppercase">
                  <span>Keşfet</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // CLASSIC_LIST — no category nav cards (handled by sticky pills)
  return null;
}

// ─── Premium Splash Screen ─────────────────────────────────────────────────────

type SplashProps = {
  business: QrMenuProps['business'];
  theme: ReturnType<typeof getThemeById>;
  leaving: boolean;
  onEnter: () => void;
};

function SplashScreen({ business, theme, leaving, onEnter }: SplashProps) {
  // Per-theme exit animations
  const exitMap: Record<string, string> = {
    'modern-cafe':          'opacity-0 scale-[0.96] translate-y-3',
    'premium-restaurant':   '-translate-y-full opacity-0 duration-500',
    'fast-food':            'scale-75 opacity-0 rotate-2 duration-350',
    'minimal':              '-translate-x-full opacity-0 duration-400',
    'dark-mode':            'opacity-0 blur-sm duration-300',
    'luxury-gold':          'scale-110 opacity-0 blur-md duration-500',
    'coffee-house':         'translate-y-8 opacity-0',
    'street-food':          '-translate-y-full -skew-y-2 opacity-0',
    'fine-dining':          'opacity-0 scale-[0.98] duration-700',
    'neon-style':           'scale-90 opacity-0 brightness-150 duration-350',
    'premium-3d-gourmet':   'opacity-0 scale-[0.96] duration-400',
    'premium-cyber-bistro': 'opacity-0 -translate-x-4 duration-300',
    'premium-retro-news':   'opacity-0 scale-[0.97] duration-400',
    'sef-klasik':           'opacity-0 duration-300',
  };

  const exitAnim = leaving ? (exitMap[theme.id] || 'opacity-0 scale-[0.96]') : 'opacity-100 scale-100';

  // Per-theme overlay gradients
  const overlayMap: Record<string, string> = {
    'modern-cafe':          'from-stone-950/92 via-stone-900/55 to-stone-950/90',
    'premium-restaurant':   'from-zinc-950 via-zinc-950/50 to-zinc-950/95',
    'fast-food':            'from-zinc-950/95 via-red-950/30 to-zinc-950/90',
    'minimal':              'from-zinc-950 via-zinc-900/80 to-zinc-950',
    'dark-mode':            'from-zinc-950/96 via-zinc-900/50 to-zinc-950',
    'luxury-gold':          'from-black/97 via-amber-950/20 to-black',
    'coffee-house':         'from-orange-950/95 via-orange-900/50 to-orange-950/90',
    'street-food':          'from-zinc-950/97 via-yellow-950/15 to-zinc-950',
    'fine-dining':          'from-slate-950/97 via-slate-950/45 to-slate-950',
    'neon-style':           'from-slate-950/97 via-purple-950/25 to-slate-950',
    'premium-3d-gourmet':   'from-stone-950/97 via-stone-900/45 to-stone-950',
    'premium-cyber-bistro': 'from-zinc-950/98 via-red-950/20 to-zinc-950',
    'premium-retro-news':   'from-stone-950/95 via-stone-800/40 to-stone-950',
  };
  const overlay = overlayMap[theme.id] || 'from-black/90 via-black/50 to-black/92';

  const finalCoverVideo = business.coverVideoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-diced-tomatoes-falling-on-a-plate-of-salad-40621-large.mp4';
  const finalCoverImage = business.coverImageUrl || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&auto=format&fit=crop&q=85';

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col max-w-md mx-auto text-white select-none transition-all ease-in-out duration-500 ${theme.fontBody} ${exitAnim}`}
    >
      {/* Background media */}
      <div className="absolute inset-0 z-0 bg-black overflow-hidden">
        {business.coverVideoUrl ? (
          <video
            src={finalCoverVideo}
            autoPlay loop muted playsInline
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.40) saturate(1.05)' }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={finalCoverImage}
            alt={business.name}
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.35) saturate(1.05)' }}
          />
        )}
        <div className={`absolute inset-0 bg-gradient-to-t ${overlay}`} />
      </div>

      {/* ── Content container ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-between px-7 pt-20 pb-12">
        
        {/* Top Section: Logo, Welcome Text, Name, Tagline */}
        <div className="flex flex-col items-center text-center">
          {/* Circular Logo Container */}
          <div className="w-28 h-28 rounded-full border-2 border-amber-500/40 flex items-center justify-center p-1.5 bg-black/55 backdrop-blur-md shadow-2xl mb-6">
            <BusinessLogoOrMonogram logoUrl={business.logoUrl} name={business.name} size="lg" dark />
          </div>

          <p className="text-[11px] font-bold tracking-[0.25em] text-amber-500/90 uppercase mb-2">
            HOŞ GELDİNİZ
          </p>

          <h1 className={`text-4xl ${theme.fontHeader} font-bold text-white leading-tight tracking-tight`}>
            {business.name}
          </h1>

          {/* Golden Separator */}
          <div className="flex items-center justify-center gap-3 w-40 my-3.5">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-500/50" />
            <div className="w-1.5 h-1.5 rotate-45 bg-amber-500" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-500/50" />
          </div>

          {business.description && (
            <p className="text-sm text-stone-200 font-medium leading-relaxed max-w-[280px]">
              {business.description}
            </p>
          )}
        </div>

        {/* Center Section: Big circular double-ring CTA button with pulsing rings */}
        <div className="relative flex-1 flex items-center justify-center my-8">
          {/* Soft glow behind button */}
          <span className="pointer-events-none absolute w-44 h-44 rounded-full bg-[radial-gradient(circle,rgba(212,165,116,0.35)_0%,transparent_70%)] blur-md animate-[ctaGlow_3.5s_ease-in-out_infinite]" />
          {/* Expanding ripple rings (staggered) */}
          <span className="pointer-events-none absolute w-36 h-36 rounded-full border-2 border-[#d4a574]/70 animate-[menuRipple_3s_ease-out_infinite]" />
          <span className="pointer-events-none absolute w-36 h-36 rounded-full border-2 border-[#d4a574]/70 animate-[menuRipple_3s_ease-out_infinite] [animation-delay:1s]" />
          <span className="pointer-events-none absolute w-36 h-36 rounded-full border-2 border-[#d4a574]/70 animate-[menuRipple_3s_ease-out_infinite] [animation-delay:2s]" />
          <button
            onClick={onEnter}
            className="relative z-10 w-36 h-36 rounded-full border border-amber-500/20 flex items-center justify-center p-2 group hover:border-amber-400/40 transition-all duration-300 active:scale-95 cursor-pointer shadow-[0_0_35px_rgba(245,158,11,0.06)] bg-transparent"
          >
            <div className="w-full h-full rounded-full bg-[#dfba88] text-stone-900 group-hover:bg-[#ebd0ab] transition-colors flex flex-col items-center justify-center gap-1.5 shadow-2xl border border-amber-300/30">
              <BookOpen className="w-6.5 h-6.5 text-stone-900" />
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-900 leading-tight">
                MENÜYÜ<br/>GÖRÜNTÜLE
              </span>
            </div>
          </button>
        </div>

        {/* Bottom Section: Social / Navigation buttons */}
        <div className="w-full flex items-center justify-center gap-3 flex-wrap">
          {/* Instagram Link */}
          {business.instagramUrl && (
            <a
              href={business.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#e1306c] hover:bg-[#c13584] text-white text-[11px] font-black tracking-wide border border-[#e1306c]/20 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              Instagram
            </a>
          )}

          {/* Location Link */}
          {business.locationUrl && (
            <a
              href={business.locationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#0f9d58] hover:bg-[#0b8043] text-white text-[11px] font-black tracking-wide border border-[#0f9d58]/20 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              Konum
            </a>
          )}

          {/* Comments Link */}
          {business.reviewsUrl && (
            <a
              href={business.reviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-[11px] font-black tracking-wide border border-[#1a73e8]/20 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Yorumlar
            </a>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function QrMenu({ business, categories, hasWhatsAppOrder, hasNutrients, viewOnly = false }: QrMenuProps) {
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [splashDismissed, setSplashDismissed] = useState(false);
  const [splashLeaving, setSplashLeaving] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const isInitiated = useRef(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`qr_cart_${business.slug}`);
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage:', e);
    } finally {
      isInitiated.current = true;
    }
  }, [business.slug]);

  // Save cart to localStorage when it changes
  useEffect(() => {
    if (!isInitiated.current) return;
    try {
      localStorage.setItem(`qr_cart_${business.slug}`, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [cart, business.slug]);

  // category section refs for smooth scroll navigation
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const theme = useMemo(() => getThemeById(business.themeId), [business.themeId]);

  // "Şef Klasik" theme uses a compact reference-style header instead of the big hero
  const isSefKlasik = theme.id === 'sef-klasik';

  const isCategoryLandingFullScreen = useMemo(() => [
    'premium-restaurant',
    'luxury-gold',
    'fine-dining',
    'coffee-house',
    'sef-klasik'
  ].includes(theme.id), [theme.id]);

  const [viewMode, setViewMode] = useState<'categories' | 'menu'>(
    isCategoryLandingFullScreen ? 'categories' : 'menu'
  );

  const showCategoryNav = theme.categoryView !== 'CLASSIC_LIST';

  const activeCategories = useMemo(
    () => categories.filter((c) => c.products.some((p) => p.isActive)),
    [categories]
  );

  // Smooth scroll to a category section
  const scrollToCategory = useCallback((catId: string) => {
    const el = categoryRefs.current[catId];
    if (el) {
      // account for sticky header height
      const offset = 72;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  const handleCategoryClick = useCallback((catId: string) => {
    if (isCategoryLandingFullScreen) {
      setViewMode('menu');
      setTimeout(() => {
        const el = categoryRefs.current[catId];
        if (el) {
          const offset = 72;
          const top = el.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 80);
    } else {
      scrollToCategory(catId);
    }
  }, [isCategoryLandingFullScreen, scrollToCategory]);

  // Dismiss splash
  const handleEnterMenu = useCallback(() => {
    setSplashLeaving(true);
    // Şef Klasik hands off quickly to the gold reveal curtain on the menu
    setTimeout(() => setSplashDismissed(true), isSefKlasik ? 260 : 500);
  }, [isSefKlasik]);

  // Cart ops
  const addToCart = (product: ProductType, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
    showToast(`${product.name} sepete eklendi.`, 'success');
  };

  const removeFromCart = (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === productId);
      if (existing && existing.quantity === 1) return prev.filter((i) => i.product.id !== productId);
      return prev.map((i) => i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const updateCartQuantity = (productId: string, amount: number) => {
    setCart((prev) =>
      prev.map((i) => i.product.id === productId ? { ...i, quantity: i.quantity + amount } : i)
          .filter((i) => i.quantity > 0)
    );
  };

  const getProductQuantity = (productId: string) => cart.find((i) => i.product.id === productId)?.quantity ?? 0;

  const cartTotal = useMemo(() => cart.reduce((acc, cur) => acc + cur.product.price * cur.quantity, 0), [cart]);
  const cartItemCount = useMemo(() => cart.reduce((acc, cur) => acc + cur.quantity, 0), [cart]);

  const handleSendOrder = () => {
    if (cart.length === 0) return;
    showToast('Siparişiniz başarıyla alındı! Afiyet olsun.', 'success');
    setCart([]);
    setCartOpen(false);
  };

  const showCaloriesGlobally = business.showCalories && hasNutrients;

  // Filtered products for search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return activeCategories;
    const q = searchQuery.toLowerCase();
    return activeCategories
      .map((cat) => ({
        ...cat,
        products: cat.products.filter(
          (p) => p.isActive && (p.name.toLowerCase().includes(q) || (p.description?.toLowerCase() ?? '').includes(q))
        ),
      }))
      .filter((cat) => cat.products.length > 0);
  }, [activeCategories, searchQuery]);

  const isDark = [
    'dark-mode','neon-style','premium-restaurant','luxury-gold',
    'fine-dining','street-food','premium-3d-gourmet','premium-cyber-bistro',
  ].includes(theme.id);

  const visualTheme = useMemo(() => ({
    badgeBg: isDark ? 'bg-zinc-900/90 text-zinc-100 border-zinc-800' : 'bg-white/95 text-stone-900 border-stone-200',
    pillActive: isDark ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-stone-900 text-white shadow-lg shadow-stone-900/10',
    pillInactive: isDark ? 'bg-zinc-900/50 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200' : 'bg-stone-100 border border-stone-200/50 text-stone-600 hover:text-stone-950',
    heroGradient: isDark ? 'from-indigo-950/40 via-purple-950/25 to-zinc-950' : 'from-stone-200/40 via-orange-100/20 to-stone-50',
    subTextColor: isDark ? 'text-zinc-400' : 'text-stone-500',
    isDark,
  }), [isDark]);

  // ── Splash ────────────────────────────────────────────────────────────────
  if (!splashDismissed) {
    return (
      <SplashScreen
        business={business}
        theme={theme}
        leaving={splashLeaving}
        onEnter={handleEnterMenu}
      />
    );
  }

  // ── Main menu ─────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen ${theme.bgMain} ${theme.fontBody} pb-32 relative w-full max-w-md mx-auto shadow-2xl border-x border-current/5`}>

      {/* Gold reveal curtain — wipes up to open the menu (Şef Klasik) */}
      {isSefKlasik && <div className="menu-reveal-curtain" />}

      {/* Glow strip (Neon theme) */}
      {theme.hasGlow && (
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-fuchsia-500 via-purple-600 to-cyan-500 animate-pulse shadow-[0_0_15px_rgba(217,70,239,0.5)] z-20" />
      )}

      {/* ── COMPACT HEADER (Şef Klasik) ───────────────────────────────────── */}
      {isSefKlasik && (
        <div className="sticky top-0 z-30 h-14 px-3 flex items-center justify-center bg-[#faf9f7]/85 backdrop-blur-md border-b border-stone-200/70">
          <button
            onClick={() => { setSplashLeaving(false); setSplashDismissed(false); }}
            className="absolute left-3 w-9 h-9 rounded-lg border border-stone-200 bg-white flex items-center justify-center text-stone-700 hover:bg-stone-50 active:scale-95 transition-all"
            aria-label="Geri"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className={`${theme.fontHeader} text-base font-semibold tracking-wide text-stone-900`}>
            {business.name}
          </h1>
        </div>
      )}

      {/* ── HEADER (hero — other themes) ────────────────────────────────────── */}
      {!isSefKlasik && (
      <div className={`relative pt-12 pb-6 px-6 bg-gradient-to-b ${visualTheme.heroGradient} overflow-hidden`}>
        <div className="absolute w-44 h-44 rounded-full bg-indigo-500/8 blur-3xl -top-10 -left-10 pointer-events-none" />
        <div className="flex flex-col items-center text-center">
          {/* Large logo */}
          <div className="mb-4">
            <BusinessLogoOrMonogram
              logoUrl={business.logoUrl}
              name={business.name}
              size="lg"
              dark={isDark}
            />
          </div>

          <h1 className={`text-2xl ${theme.fontHeader} font-black tracking-tight text-current mb-2 flex items-center gap-2`}>
            {business.name}
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          </h1>

          {business.description && (
            <p className={`text-xs ${visualTheme.subTextColor} max-w-xs leading-relaxed font-medium mb-4`}>
              {business.description}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap justify-center text-[10px] font-semibold">
            <span className={`px-2.5 py-1 rounded-full border ${visualTheme.badgeBg} flex items-center gap-1`}>
              <Clock className="w-3 h-3 text-indigo-400" />
              {business.openingHours ? `Açık (${business.openingHours})` : 'Açık'}
            </span>
            <span className={`px-2.5 py-1 rounded-full border ${visualTheme.badgeBg} flex items-center gap-1`}>
              <MapPin className="w-3 h-3 text-amber-500" />
              {business.serviceType === 'SELF_SERVIS' ? 'Self Servis' :
               business.serviceType === 'HER_IKISI' ? 'Masa & Self Servis' :
               'Masa Servisi'}
            </span>
          </div>
        </div>
      </div>
      )}

      {/* ── CATEGORY VISUAL NAVIGATION ─────────────────────────────────────── */}
      {showCategoryNav && activeCategories.length > 0 && (!isCategoryLandingFullScreen || viewMode === 'categories') && (
        <CategoryNavCards
          categories={activeCategories}
          theme={theme}
          categoryView={theme.categoryView}
          onScrollToCategory={handleCategoryClick}
        />
      )}

      {/* ── STICKY SEARCH + PILL NAV ────────────────────────────────────────── */}
      {(!isCategoryLandingFullScreen || viewMode === 'menu') && (
        <div className="sticky top-0 z-30 bg-current/5 backdrop-blur-xl border-b border-current/5 px-4 py-3 flex flex-col gap-3">
          {isCategoryLandingFullScreen && viewMode === 'menu' && (
            <button
              onClick={() => setViewMode('categories')}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all mb-1 cursor-pointer bg-current/10 border border-current/15 text-current hover:bg-current/15 active:scale-98"
            >
              ← Kategorilere Dön
            </button>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40 text-current" />
            <input
              type="text"
              placeholder="Ürün ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-current/5 border border-current/10 text-xs outline-none focus:border-current/30 text-current placeholder:opacity-40 transition-all font-medium"
            />
          </div>

          {/* Category scroll pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
            {activeCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${visualTheme.pillInactive}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── ALL PRODUCTS (always visible or only in menu view Mode) ──────────────── */}
      {(!isCategoryLandingFullScreen || viewMode === 'menu') && (
        <div className="px-4 py-6 flex flex-col gap-10">
          {(searchQuery ? filteredCategories : activeCategories).length > 0 ? (
            (searchQuery ? filteredCategories : activeCategories).map((cat) => {
              const products = searchQuery
                ? cat.products
                : cat.products.filter((p) => p.isActive);
              if (products.length === 0) return null;

              return (
                <div
                  key={cat.id}
                  ref={(el) => { categoryRefs.current[cat.id] = el; }}
                  className="flex flex-col gap-4 scroll-mt-20"
                >
                  {/* Category header */}
                  <div className="flex items-center justify-between border-b border-current/8 pb-2.5">
                    <h2 className={`text-sm ${theme.fontHeader} font-black uppercase tracking-widest opacity-90`}>
                      {cat.name}
                    </h2>
                    <span className="text-[10px] opacity-35 font-bold">{products.length} ürün</span>
                  </div>

                  {/* Product cards */}
                  <div className="flex flex-col gap-3">
                    {products.map((prod) => {
                      const qty = getProductQuantity(prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => setSelectedProduct(prod)}
                          className={`group rounded-2xl ${theme.bgCard} ${theme.borderColor} cursor-pointer transition-all duration-250 relative border ${isSefKlasik ? 'flex items-stretch overflow-hidden min-h-[110px]' : 'p-3 flex gap-4 items-center hover:scale-[1.01] active:scale-[0.99]'}`}
                        >
                          {/* Product image */}
                          <div className={`overflow-hidden shrink-0 bg-current/5 relative ${isSefKlasik ? 'w-[100px] self-stretch' : 'w-20 h-20 rounded-xl border border-current/5'}`}>
                            {prod.imageUrl ? (
                              <MediaDisplay
                                src={prod.imageUrl}
                                alt={prod.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                autoPlay
                                loop
                                controls={false}
                                fallback={<div className="w-full h-full flex items-center justify-center opacity-30 text-lg">🍔</div>}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center opacity-30 text-lg">🍔</div>
                            )}
                            {qty > 0 && (
                              <span className="absolute top-1 left-1 bg-rose-500 text-white font-mono text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                                {qty}
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <div className={`flex-1 min-w-0 ${isSefKlasik ? 'p-3 flex flex-col' : ''}`}>
                            <h3 className={`font-black text-sm text-current truncate`}>{prod.name}</h3>
                            {prod.description && (
                              <p className={`text-[10px] ${visualTheme.subTextColor} leading-normal line-clamp-2 mt-0.5 font-light`}>
                                {prod.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-2.5">
                              <span className={`font-black text-xs`}>{prod.price} TL</span>
                              {showCaloriesGlobally && prod.calories && (
                                <span className="text-[7px] bg-amber-500/10 text-amber-500 px-1 rounded flex items-center gap-0.5 font-mono font-bold">
                                  <Flame className="w-2.5 h-2.5" /> {prod.calories} kcal
                                </span>
                              )}
                            </div>
                          </div>

                          {/* AllowOrders Quick Add button */}
                          {business.allowOrders && (
                            <div className={`shrink-0 z-10 self-center ${isSefKlasik ? 'pr-3' : 'pl-1'}`}>
                              {qty > 0 ? (
                                <div className="flex items-center gap-1.5 bg-current/5 rounded-xl border border-current/10 p-0.5" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={(e) => removeFromCart(prod.id, e)}
                                    className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-current flex items-center justify-center active:scale-90 transition-transform"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="text-xs font-black min-w-[12px] text-center">{qty}</span>
                                  <button
                                    onClick={(e) => addToCart(prod, e)}
                                    className={`w-6 h-6 rounded-lg ${theme.accentColor} flex items-center justify-center active:scale-90 transition-transform`}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => addToCart(prod, e)}
                                  className={`w-7 h-7 rounded-xl ${theme.accentColor} flex items-center justify-center active:scale-90 hover:scale-[1.05] transition-all`}
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center text-xs opacity-40 flex flex-col items-center gap-4 bg-current/5 rounded-3xl p-6">
              <UtensilsCrossed className="w-10 h-10" />
              <span className="font-bold">Aramanızla eşleşen ürün bulunamadı.</span>
            </div>
          )}
        </div>
      )}

      {/* ── FLOATING CART BUTTON ────────────────────────────────────────────── */}
      {!viewOnly && (business.allowOrders ? (
        cart.length > 0 && (
          <div className="fixed bottom-6 inset-x-6 z-40 max-w-sm mx-auto">
            <button
              onClick={() => setCartOpen(true)}
              className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-between shadow-2xl shadow-indigo-600/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-extrabold text-sm tracking-wide"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="absolute -top-2 -right-2 bg-rose-500 text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {cartItemCount}
                  </span>
                </div>
                <span>Siparişi İncele</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/10 py-1 px-3 rounded-lg">
                <span>{cartTotal.toFixed(2)} TL</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )
      ) : (
        cartTotal > 0 && (
          <div className="fixed bottom-6 right-6 z-40">
            <button
              onClick={() => setCartOpen(true)}
              className="py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white flex items-center gap-2 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 font-extrabold text-xs tracking-wider border border-white/10 cursor-pointer"
            >
              <Receipt className="w-4 h-4 shrink-0" />
              <span>Hesabım: {cartTotal.toFixed(2)} TL</span>
            </button>
          </div>
        )
      ))}

      {/* ── PRODUCT DETAIL SHEET ─────────────────────────────────────────────── */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end justify-center">
          <div className="absolute inset-0" onClick={() => setSelectedProduct(null)} />
          <div className={`w-full max-w-md ${theme.bgCard} ${theme.borderColor} rounded-t-[32px] p-6 shadow-2xl relative z-10 border-t max-h-[90vh] overflow-y-auto`}
               style={{ animation: 'slideUp 0.3s ease-out' }}>
            <div className="w-12 h-1 bg-current/10 rounded-full mx-auto mb-6" />
            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 text-current opacity-40 hover:opacity-100 p-2 rounded-full hover:bg-current/5">
              <X className="w-5 h-5" />
            </button>

            {selectedProduct.imageUrl ? (
              <div className="w-full h-52 rounded-2xl overflow-hidden border border-current/5 mb-5">
                <MediaDisplay
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay={false}
                  loop={false}
                  fallback={
                    <div className="w-full h-full flex items-center justify-center opacity-25">
                      <UtensilsCrossed className="w-10 h-10" />
                    </div>
                  }
                />
              </div>
            ) : (
              <div className="w-full h-28 rounded-2xl bg-current/5 border border-current/5 mb-5 flex items-center justify-center opacity-25">
                <UtensilsCrossed className="w-10 h-10" />
              </div>
            )}

            <h3 className={`text-lg font-extrabold ${theme.textTitle}`}>{selectedProduct.name}</h3>
            <span className={`text-base font-black block mt-1.5 ${theme.textPrice}`}>{selectedProduct.price.toFixed(2)} TL</span>

            {selectedProduct.description && (
              <p className={`text-xs mt-4 leading-relaxed font-medium opacity-75 ${theme.textDesc}`}>{selectedProduct.description}</p>
            )}

            {showCaloriesGlobally && selectedProduct.calories && (
              <div className="mt-5 p-4 rounded-2xl bg-current/5 border border-current/10 flex flex-col gap-3">
                <h5 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 opacity-80">
                  <Flame className="w-4 h-4 text-amber-500" />
                  Besin Değerleri
                </h5>
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                  {[
                    { val: selectedProduct.calories, label: 'Kcal' },
                    { val: `${selectedProduct.protein || 0}g`, label: 'Protein' },
                    { val: `${selectedProduct.carbs || 0}g`, label: 'Karb' },
                    { val: `${selectedProduct.fat || 0}g`, label: 'Yağ' },
                  ].map(({ val, label }) => (
                    <div key={label} className="flex flex-col p-2 bg-current/5 rounded-xl border border-current/5">
                      <span className="font-extrabold text-xs">{val}</span>
                      <span className="text-[8px] opacity-55 mt-0.5 uppercase">{label}</span>
                    </div>
                  ))}
                </div>
                <p className="flex items-center gap-1 text-[8px] opacity-40 justify-center">
                  <Info className="w-3 h-3" /> Tahmini hesaplanmıştır.
                </p>
              </div>
            )}

            {!viewOnly && (
              <div className="mt-8 flex gap-3">
                {getProductQuantity(selectedProduct.id) > 0 && (
                  <div className="flex items-center gap-4 bg-current/5 border border-current/10 px-4 rounded-2xl">
                    <button onClick={() => removeFromCart(selectedProduct.id)} className="p-1 text-current"><Minus className="w-4 h-4" /></button>
                    <span className="text-sm font-black font-mono min-w-[20px] text-center">{getProductQuantity(selectedProduct.id)}</span>
                    <button onClick={() => addToCart(selectedProduct)} className="p-1 text-current"><Plus className="w-4 h-4" /></button>
                  </div>
                )}
                <button
                  onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                  className={`flex-1 py-4 rounded-2xl ${theme.accentColor} font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg`}
                >
                  <Plus className="w-4 h-4" />
                  {business.allowOrders
                    ? (getProductQuantity(selectedProduct.id) > 0 ? 'Daha Fazla Ekle' : 'Sepete Ekle')
                    : (getProductQuantity(selectedProduct.id) > 0 ? 'Daha Fazla Ekle' : 'Hesabıma Ekle')
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CART DRAWER ──────────────────────────────────────────────────────── */}
      {!viewOnly && cartOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end justify-center">
          <div className="absolute inset-0" onClick={() => setCartOpen(false)} />
          <div className={`w-full max-w-md ${theme.bgCard} ${theme.borderColor} rounded-t-[32px] p-6 shadow-2xl flex flex-col gap-6 relative z-10 max-h-[90vh] overflow-y-auto border-t`}
               style={{ animation: 'slideUp 0.3s ease-out' }}>
            <div className="w-12 h-1 bg-current/10 rounded-full mx-auto mb-2" />

            <div className="flex justify-between items-center border-b border-current/5 pb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-indigo-400" />
                {business.allowOrders ? 'Siparişinizi Tamamlayın' : 'Hesabım / Seçilenler'}
              </h3>
              <button onClick={() => setCartOpen(false)} className="p-1.5 rounded-full hover:bg-current/10 text-current opacity-60">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto divide-y divide-current/5">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between pt-3.5 first:pt-0">
                  <div className="min-w-0 pr-4">
                    <h4 className="text-xs font-bold text-white truncate">{item.product.name}</h4>
                    <span className="text-[10px] text-zinc-400 font-semibold font-mono">{item.product.price.toFixed(2)} TL</span>
                  </div>
                  <div className="flex items-center gap-3 bg-current/5 border border-current/10 px-2.5 py-1 rounded-xl">
                    <button onClick={() => updateCartQuantity(item.product.id, -1)} className="p-0.5 text-current opacity-70 hover:opacity-100"><Minus className="w-3.5 h-3.5" /></button>
                    <span className="text-xs font-black text-white min-w-[15px] text-center font-mono">{item.quantity}</span>
                    <button onClick={() => updateCartQuantity(item.product.id, 1)} className="p-0.5 text-current opacity-70 hover:opacity-100"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-current/5 pt-5">
              <div className="flex justify-between items-center text-xs font-bold text-white mb-5">
                <span className="opacity-75">Toplam Tutar</span>
                <span className="text-lg font-black text-indigo-400">{cartTotal.toFixed(2)} TL</span>
              </div>
              {business.allowOrders ? (
                <button onClick={handleSendOrder} className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/25">
                  <MessageSquare className="w-5 h-5 shrink-0" />
                  Siparişi Tamamla
                </button>
              ) : (
                <button onClick={() => setCartOpen(false)} className="w-full py-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-extrabold text-center transition-all">
                  Kapat
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
