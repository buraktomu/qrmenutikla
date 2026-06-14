'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  QrCode,
  ArrowRight,
  Check,
  Minus,
  Menu,
  X,
  ChefHat,
  Lock,
  Zap,
  Sparkles,
} from 'lucide-react';
import { PLANS } from '@/config/plans';
import ThreeDHero from '@/components/ThreeDHero';

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/* Theme presets for the interactive showcase                          */
/* ------------------------------------------------------------------ */

interface ThemePreset {
  id: string;
  name: string;
  font: string;
  bgClass: string;
  textClass: string;
  accentClass: string;
  accentBg: string;
  borderClass: string;
  title: string;
  categories: string[];
  items: { name: string; price: string; desc: string; image: string; calories: number }[];
}

const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'bistro',
    name: 'Bistro Klasik',
    font: 'font-sans',
    bgClass: 'bg-stone-50',
    textClass: 'text-stone-900',
    accentClass: 'text-amber-800',
    accentBg: 'bg-amber-800 text-white',
    borderClass: 'border-stone-200',
    title: "L'Avenue Bistro",
    categories: ['Tümü', 'Kahveler', 'Burgerler'],
    items: [
      {
        name: 'Bistro Special Burger',
        price: '295 TL',
        desc: 'Brioche ekmeğinde karamelize soğan, tütsü cheddar ve özel ev sosu.',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&auto=format&fit=crop',
        calories: 680,
      },
      {
        name: 'Caffe Latte Double',
        price: '85 TL',
        desc: 'İki shot arabica çekirdeği, taze krema kıvamında süt.',
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=120&auto=format&fit=crop',
        calories: 140,
      },
    ],
  },
  {
    id: 'dining',
    name: 'Fine Dining Lüx',
    font: 'font-serif tracking-wide',
    bgClass: 'bg-zinc-950',
    textClass: 'text-zinc-200',
    accentClass: 'text-amber-400',
    accentBg: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    borderClass: 'border-zinc-800',
    title: "L'Ambroisie",
    categories: ['Kav', 'Başlangıç', 'Ana Yemek'],
    items: [
      {
        name: 'Trüflü Fırın Antrikot',
        price: '680 TL',
        desc: 'Taze kuşkonmaz püre yatağında, kemik iliği sosu ve trüf mantarı.',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=120&auto=format&fit=crop',
        calories: 810,
      },
      {
        name: 'Mango Soslu Somon Ceviche',
        price: '380 TL',
        desc: 'Misket limonu marineli taze somon, kişniş, avokado ve çıtır mor soğan.',
        image: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=120&auto=format&fit=crop',
        calories: 320,
      },
    ],
  },
  {
    id: 'steakhouse',
    name: 'Steakhouse Rustik',
    font: 'font-mono tracking-tighter uppercase',
    bgClass: 'bg-stone-900',
    textClass: 'text-stone-100',
    accentClass: 'text-red-500',
    accentBg: 'bg-red-600 text-white',
    borderClass: 'border-stone-800',
    title: 'Iron & Fire Grill',
    categories: ['Dry Aged', 'Burgers', 'Sides'],
    items: [
      {
        name: 'Dry Aged T-Bone',
        price: '790 TL',
        desc: '28 gün meşe odunu isiyle dinlendirilmiş kemikli pirzola.',
        image: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=120&auto=format&fit=crop',
        calories: 980,
      },
      {
        name: 'Tava Eritme Patates',
        price: '190 TL',
        desc: 'Sıcak cheddar, füme et parçacıkları ve çıtır baharatlı patates.',
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=120&auto=format&fit=crop',
        calories: 520,
      },
    ],
  },
  {
    id: 'patisserie',
    name: 'Patisserie Narin',
    font: 'font-sans font-light',
    bgClass: 'bg-[#faf6f0]',
    textClass: 'text-[#544439]',
    accentClass: 'text-[#cb8c75]',
    accentBg: 'bg-[#cb8c75] text-white rounded-full',
    borderClass: 'border-[#ebdcd0]',
    title: 'Maison de Sucre',
    categories: ['Pastalar', 'Çaylar', 'Makaron'],
    items: [
      {
        name: 'Sebastian Cheesecake',
        price: '185 TL',
        desc: 'İçi kremamsı akışkan, üzeri karamelize yanık İspanyol cheesecake.',
        image: 'https://images.unsplash.com/photo-1524351199679-46cddf530c04?w=120&auto=format&fit=crop',
        calories: 430,
      },
      {
        name: 'Fıstıklı Makaron',
        price: '75 TL',
        desc: 'Antep fıstıklı ezmeli el yapımı İtalyan kurabiyesi.',
        image: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=120&auto=format&fit=crop',
        calories: 115,
      },
    ],
  },
  {
    id: 'asian',
    name: 'Uzak Doğu Modern',
    font: 'font-serif tracking-normal',
    bgClass: 'bg-emerald-950',
    textClass: 'text-amber-200',
    accentClass: 'text-yellow-400',
    accentBg: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    borderClass: 'border-emerald-900',
    title: 'Sakura Sushi Bar',
    categories: ['Tümü', 'Sushi', 'Ramen'],
    items: [
      {
        name: 'Tokyo Special Ramen',
        price: '380 TL',
        desc: 'Taze el yapımı noodle, 12 saat kaynatılmış kemik suyu, marine yumurta.',
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=120&auto=format&fit=crop',
        calories: 720,
      },
      {
        name: "Chef's Sushi Platter",
        price: '620 TL',
        desc: '4pcs Sake Roll, 4pcs California Roll, 2pcs Salmon Nigiri.',
        image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=120&auto=format&fit=crop',
        calories: 460,
      },
    ],
  },
  {
    id: 'retro',
    name: 'Retro Diner',
    font: 'font-mono tracking-wider uppercase',
    bgClass: 'bg-rose-50',
    textClass: 'text-rose-950',
    accentClass: 'text-cyan-600',
    accentBg: 'bg-cyan-600 text-white',
    borderClass: 'border-rose-200',
    title: 'Route 66 Diner',
    categories: ['All', 'Hotdogs', 'Shakes'],
    items: [
      {
        name: 'Classic American Hotdog',
        price: '240 TL',
        desc: 'Izgara sosis, tatlı hardal relish, çıtır soğan ve karamelize lahana.',
        image: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=120&auto=format&fit=crop',
        calories: 540,
      },
      {
        name: 'Strawberry Diner Shake',
        price: '140 TL',
        desc: 'Gerçek çilek taneleri, Maraş usulü dondurma ve taze krema.',
        image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=120&auto=format&fit=crop',
        calories: 420,
      },
    ],
  },
  {
    id: 'healthy',
    name: 'Sağlıklı & Botanik',
    font: 'font-sans font-light',
    bgClass: 'bg-[#fcfbf9]',
    textClass: 'text-emerald-900',
    accentClass: 'text-emerald-700',
    accentBg: 'bg-emerald-100 text-emerald-800 rounded-full',
    borderClass: 'border-emerald-100',
    title: 'The Green Garden',
    categories: ['Tümü', 'Kaseler', 'Detoks'],
    items: [
      {
        name: 'Avokado Poşe Yumurta',
        price: '220 TL',
        desc: 'Ekşi mayalı çıtır ekmek, ezilmiş avokado, sızma zeytinyağı ve çörek otu.',
        image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=120&auto=format&fit=crop',
        calories: 380,
      },
      {
        name: 'Detoks Yeşil Smoothie',
        price: '120 TL',
        desc: 'Taze ıspanak, yeşil elma, salatalık, misket limonu ve zencefil.',
        image: 'https://images.unsplash.com/photo-1610970881699-44a5587caa90?w=120&auto=format&fit=crop',
        calories: 160,
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Static content                                                      */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    no: '01',
    title: 'QR kodu tarar',
    text: 'Müşteriniz masadaki QR standını telefon kamerasıyla okutur. Uygulama indirmeden, kayıt olmadan saniyeler içinde menünüz açılır.',
  },
  {
    no: '02',
    title: 'Menüyü keşfeder',
    text: 'İştah açıcı fotoğraflar, AI ile yazılmış açıklamalar ve tahmini kalori bilgisiyle ürünleri inceler, sepetine ekler.',
  },
  {
    no: '03',
    title: 'Tek tıkla çağırır',
    text: 'Masa numarasını girer; garson çağırır veya hesap ister. Talep anında mutfak ve servis ekranınıza düşer.',
  },
];

const FAQS = [
  {
    q: 'Kurulum ne kadar sürüyor?',
    a: 'Kayıt olduktan sonra menünüzü oluşturup QR kodunuzu indirmeniz ortalama 15 dakika sürer. Teknik bilgi gerekmez; ürünlerinizi yazarsınız, gerisini panel halleder.',
  },
  {
    q: 'Siparişlerden komisyon alıyor musunuz?',
    a: 'Hayır. Sabit aylık abonelik dışında hiçbir ücret yoktur. Müşterinizle aranıza girmeyiz; sipariş ve hesap talepleri doğrudan size iletilir.',
  },
  {
    q: 'Müşterilerimin verileri toplanıyor mu?',
    a: 'Hayır. Menüyü açan ziyaretçiden kayıt, çerez veya kişisel veri istenmez. KVKK kapsamında saklanacak müşteri verisi oluşmaz.',
  },
  {
    q: 'Menüyü sonradan değiştirebilir miyim?',
    a: 'Evet, panelden yaptığınız her değişiklik (fiyat, ürün, tema) anında yayına yansır. QR kodunuz hep aynı kalır, yeniden bastırmanız gerekmez.',
  },
  {
    q: 'AI menü asistanı ne yapıyor?',
    a: 'Ürün adını yazarsınız; iştah açıcı açıklamayı, tahmini kalori ve besin bilgisini sizin yerinize üretir. Pro ve Premium paketlerde sunulur.',
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<string>('bistro');

  const currentThemePreset = THEME_PRESETS.find((t) => t.id === activeTheme) || THEME_PRESETS[0];
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  /* Kamera dalış ilerlemesi (0: kuşbakışı masa → 1: QR kodu tam ekran) */
  const morphRef = useRef<number>(0);

  /* Smooth scroll */
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  /* Entrance + scroll reveals */
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !pageRef.current) {
      morphRef.current = 0; // animasyon yoksa sabit kuşbakışı kadraj
      return;
    }

    const ctx = gsap.context(() => {
      /* Hero: one orchestrated entrance with stagger */
      gsap.fromTo(
        '[data-hero-reveal]',
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.09, delay: 0.1 }
      );
      /* Sinematik dalış: hero pinlenir, scroll kamerayı masaya daldırır */
      if (heroRef.current) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: '+=1600',
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            onUpdate: (self) => {
              morphRef.current = self.progress;
            },
          },
        });
        /* Yazılar kalır; sadece scroll ipucu temizlenir */
        tl.to('#hero-hint', { opacity: 0, duration: 0.08 }, 0.02);

        /* Final: 3D sahne söner, telefon sahneyi devralır */
        tl.to(
          '#hero-scene',
          { opacity: 0, scale: 1.08, ease: 'power1.in', duration: 0.22 },
          0.7
        );
        tl.fromTo(
          '#hero-menu-phone',
          { opacity: 0, y: 180, scale: 0.85 },
          { opacity: 1, y: 0, scale: 1, ease: 'power2.out', duration: 0.28 },
          0.68
        );
      }

      /* Sections: reveal on scroll */
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 36 },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 85%' },
          }
        );
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={pageRef}
      className="bg-[#faf9f6] text-stone-900 min-h-screen font-sans selection:bg-red-200 selection:text-red-900"
    >
      {/* ============================== HEADER ============================== */}
      <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-[#faf9f6]/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center transition-transform duration-300 group-hover:-rotate-6">
              <QrCode className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-base tracking-tight text-stone-900">QR Menü AI</span>
              <span className="text-[9px] text-red-700 font-bold tracking-[0.2em] uppercase mt-1">Gastronomi</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
            <a href="#nasil" className="hover:text-stone-900 transition-colors">Nasıl Çalışır</a>
            <a href="#temalar" className="hover:text-stone-900 transition-colors">Temalar</a>
            <a href="#ozellikler" className="hover:text-stone-900 transition-colors">Özellikler</a>
            <a href="#fiyatlar" className="hover:text-stone-900 transition-colors">Fiyatlar</a>
            <a href="#sss" className="hover:text-stone-900 transition-colors">SSS</a>
          </nav>

          <div className="hidden md:flex items-center gap-5">
            <Link href="/login" className="text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors">
              Giriş Yap
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 rounded-xl bg-white text-sm font-bold text-stone-900 border border-purple-500/20 shadow-[0_4px_16px_rgba(168,85,247,0.12)] hover:shadow-[0_6px_22px_rgba(168,85,247,0.22)] hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              Kaydol
            </Link>
          </div>

          <button
            aria-label={mobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            className="md:hidden p-2 rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-b border-stone-200 bg-[#faf9f6] px-6 py-6 flex flex-col gap-4 text-stone-700 font-medium shadow-sm">
            {[
              ['#nasil', 'Nasıl Çalışır'],
              ['#temalar', 'Temalar'],
              ['#ozellikler', 'Özellikler'],
              ['#fiyatlar', 'Fiyatlar'],
              ['#sss', 'SSS'],
            ].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="hover:text-stone-900 py-1 block">
                {label}
              </a>
            ))}
            <div className="h-px bg-stone-200 my-1" />
            <Link href="/login" className="hover:text-stone-900 py-1 block">Giriş Yap</Link>
            <Link href="/register" className="w-full py-3 rounded-xl bg-white text-center text-sm font-bold text-stone-900 border border-purple-500/20 shadow-[0_4px_16px_rgba(168,85,247,0.12)] block">
              Kaydol
            </Link>
          </div>
        )}
      </header>

      {/* ============================== HERO (sinematik masa sahnesi) ============================== */}
      <section ref={heroRef} className="relative h-[100svh] overflow-hidden border-b border-stone-200">
        {/* Full-bleed 3D sahne: kuşbakışı masa → scroll'da QR standına dalış */}
        <div id="hero-scene" className="absolute inset-0">
          <ThreeDHero progressRef={morphRef} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 h-full flex items-center pointer-events-none">
          {/* Copy — sahnenin üzerinde, solda */}
          <div id="hero-copy" className="max-w-xl flex flex-col items-start pointer-events-auto">
            <div
              data-hero-reveal
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-200 bg-red-50 text-[11px] text-red-700 font-bold tracking-wide"
            >
              <ChefHat className="w-3.5 h-3.5" />
              Restoran ve kafeler için AI destekli menü
            </div>

            <h1
              data-hero-reveal
              className="mt-7 font-serif text-[clamp(2.6rem,6vw,4.6rem)] leading-[1.04] tracking-tight text-stone-900"
            >
              Kâğıt menüyü unutun.
              <br />
              Masanız artık{' '}
              <em className="not-italic relative inline-block text-red-600">
                konuşuyor
                <svg
                  aria-hidden
                  className="absolute -bottom-2 left-0 w-full h-3 text-red-600/70"
                  viewBox="0 0 200 12"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path d="M2 9 C 50 2, 150 2, 198 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </em>
              .
            </h1>

            <p data-hero-reveal className="mt-7 text-base text-stone-600 leading-relaxed max-w-[52ch]">
              Müşteriniz QR kodu okutur; şık, hızlı ve yapay zekâ destekli dijital menünüz saniyeler içinde açılır.
              Uygulama yok, komisyon yok, kişisel veri yok — sadece sipariş.
            </p>

            <div data-hero-reveal className="mt-9 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                href="/register"
                className="px-7 py-3.5 rounded-xl bg-white text-sm font-bold text-stone-900 border border-purple-500/25 shadow-[0_6px_22px_rgba(168,85,247,0.15)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.25)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group"
              >
                Kaydol
                <ArrowRight className="w-4 h-4 text-purple-650 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#temalar"
                className="px-7 py-3.5 rounded-lg border border-stone-300 text-sm font-semibold text-stone-700 hover:border-stone-900 hover:text-stone-900 transition-colors flex items-center justify-center"
              >
                Temaları İncele
              </a>
            </div>

            {/* Quiet proof line — no big-number dashboard template */}
            <p data-hero-reveal className="mt-9 text-[13px] text-stone-500">
              <span className="font-semibold text-stone-800">%0 komisyon</span>
              <span className="mx-2 text-stone-300">·</span>
              <span className="font-semibold text-stone-800">15 dakikada</span> kurulum
              <span className="mx-2 text-stone-300">·</span>
              <span className="font-semibold text-stone-800">10</span> profesyonel tema
            </p>
          </div>
        </div>

        {/* Final sahnesi: QR okundu → telefon menüyü gösterir */}
        <div
          id="hero-menu-phone"
          className="absolute z-20 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-[16%] top-1/2 -translate-y-1/2 w-[250px] md:w-[300px] opacity-0 pointer-events-none"
        >
          {/* Durum çipi */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-stone-900 text-white text-xs font-bold whitespace-nowrap shadow-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            QR okundu — menü açıldı
          </div>

          {/* iPhone 14 Pro oranı: 71.5 × 147.5 mm ≈ aspect 71/147 */}
          <div className="relative w-full aspect-[71/147] bg-stone-950 rounded-[48px] p-[10px] shadow-2xl border border-stone-800">
            {/* Yan tuşlar */}
            <div className="absolute -left-[2px] top-[18%] w-[3px] h-8 bg-stone-800 rounded-l" />
            <div className="absolute -left-[2px] top-[28%] w-[3px] h-12 bg-stone-800 rounded-l" />
            <div className="absolute -right-[2px] top-[22%] w-[3px] h-16 bg-stone-800 rounded-r" />

            <div className="relative w-full h-full rounded-[38px] bg-stone-50 overflow-hidden flex flex-col p-4 pt-14 text-stone-900">
              {/* Dynamic Island */}
              <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-[88px] h-[26px] bg-stone-950 rounded-full z-20" />

              <div className="border-b border-stone-200 pb-3 mb-3 text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600">Bistro L&apos;Avenue</span>
                <h4 className="text-sm font-bold text-stone-950 mt-1 font-serif">Günün Menüsü</h4>
              </div>

              <div className="flex flex-col gap-2.5 flex-1 min-h-0">
                {[
                  ['Bistro Burger', '295 TL', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&auto=format&fit=crop'],
                  ['Barista Latte', '85 TL', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=120&auto=format&fit=crop'],
                  ['Napoli Pizza', '340 TL', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=120&auto=format&fit=crop'],
                  ['Sebastian Cheesecake', '185 TL', 'https://images.unsplash.com/photo-1524351199679-46cddf530c04?w=120&auto=format&fit=crop'],
                ].map(([name, price, img]) => (
                  <div key={name} className="p-2.5 bg-white rounded-xl border border-stone-200 flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-lg bg-stone-100 shrink-0 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-stone-900 truncate">{name}</div>
                      <div className="text-[11px] text-stone-500 font-medium mt-0.5">{price}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-3">
                <div className="p-3 text-white bg-red-600 rounded-xl text-xs font-bold text-center">
                  🔔 Garson Çağır · Hesap İste
                </div>
                {/* Home indicator */}
                <div className="mt-2.5 mx-auto w-24 h-1 rounded-full bg-stone-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll ipucu */}
        <div
          id="hero-hint"
          className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 pointer-events-none"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">
            Kaydır — masaya yaklaş
          </span>
          <span className="w-px h-9 bg-stone-300 overflow-hidden relative">
            <span className="absolute inset-x-0 top-0 h-3 bg-red-600 animate-bounce" />
          </span>
        </div>
      </section>

      {/* ============================== NASIL ÇALIŞIR ============================== */}
      <section id="nasil" className="py-24 border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div data-reveal className="max-w-2xl mb-16">
            <span className="text-xs font-bold text-red-700 uppercase tracking-[0.18em]">Ürün deneyimi</span>
            <h2 className="font-serif text-[clamp(1.9rem,3.5vw,2.8rem)] text-stone-900 mt-3 leading-tight">
              Masadan mutfağa, üç adımda
            </h2>
            <p className="text-[15px] text-stone-600 mt-4 leading-relaxed max-w-[58ch]">
              Kişisel veri toplamadan, KVKK&apos;ya tam uyumlu ve komisyonsuz doğrudan sipariş deneyimi.
            </p>
          </div>

          {/* Editorial numbered list — not three identical cards */}
          <div className="flex flex-col">
            {STEPS.map((step, i) => (
              <div
                key={step.no}
                data-reveal
                className={`grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-baseline py-9 ${
                  i < STEPS.length - 1 ? 'border-b border-stone-200' : ''
                }`}
              >
                <span className="md:col-span-2 font-serif text-5xl md:text-6xl text-red-600/25 leading-none select-none">
                  {step.no}
                </span>
                <h3 className="md:col-span-4 text-xl font-bold text-stone-900">{step.title}</h3>
                <p className="md:col-span-6 text-sm text-stone-600 leading-relaxed max-w-[58ch]">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== TEMA SHOWCASE ============================== */}
      <section id="temalar" className="py-24 border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-start">
            {/* Left: copy + theme pills */}
            <div data-reveal className="lg:col-span-7 flex flex-col">
              <span className="text-xs font-bold text-red-700 uppercase tracking-[0.18em]">Canlı önizleme</span>
              <h2 className="font-serif text-[clamp(1.9rem,3.5vw,2.8rem)] text-stone-900 mt-3 leading-tight">
                Her restoranın karakteri farklıdır.
                <br />
                Menüsü de öyle olmalı.
              </h2>
              <p className="text-[15px] text-stone-600 mt-5 leading-relaxed max-w-[58ch]">
                Bistro kafeniz için sıcak krem tonları ve klasik serifler; sushi salonunuz için derin zümrüt ve altın.
                Bir temaya tıklayın, telefondaki değişimi izleyin — panelden tek tıkla aynı şekilde değişir.
              </p>

              <div className="flex flex-wrap gap-2 mt-9">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setActiveTheme(preset.id)}
                    aria-pressed={activeTheme === preset.id}
                    className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all border ${
                      activeTheme === preset.id
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:text-stone-900'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              <div className="mt-10 pt-8 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl">
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm font-bold text-stone-900 block">Canlı arayüz geçişi</span>
                    <span className="text-[13px] text-stone-500 mt-1 block leading-relaxed">
                      Temanızı panelden güncelleyin, müşterilerinize anında yansısın.
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm font-bold text-stone-900 block">Logo & banner kişiselleştirme</span>
                    <span className="text-[13px] text-stone-500 mt-1 block leading-relaxed">
                      Kendi logonuz ve kapak fotoğrafınızla marka kimliğinizi koruyun.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: interactive phone */}
            <div data-reveal className="lg:col-span-5 flex justify-center lg:justify-end lg:sticky lg:top-24">
              <div className="relative w-[280px] h-[540px] bg-stone-950 rounded-[44px] p-3 shadow-2xl border border-stone-800 flex flex-col overflow-hidden">
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-6 bg-stone-950 rounded-b-2xl z-20" />

                <div
                  className={`w-full h-full rounded-[34px] overflow-hidden flex flex-col text-left p-4 pt-8 transition-colors duration-300 ${currentThemePreset.bgClass} ${currentThemePreset.textClass} ${currentThemePreset.font}`}
                >
                  <div className={`border-b pb-3 mb-3 text-center ${currentThemePreset.borderClass}`}>
                    <span className={`text-[8.5px] font-black uppercase tracking-[0.18em] ${currentThemePreset.accentClass}`}>
                      {currentThemePreset.title}
                    </span>
                    <h4 className="text-[12px] font-black mt-1">Günün Menüsü</h4>
                  </div>

                  <div className="flex gap-1 pb-2 text-[8.5px] font-bold">
                    {currentThemePreset.categories.map((c, idx) => (
                      <span
                        key={idx}
                        className={`px-2.5 py-1 rounded shrink-0 ${idx === 0 ? currentThemePreset.accentBg : 'bg-black/5 opacity-55'}`}
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2.5 overflow-y-auto flex-1 mt-1 scrollbar-none">
                    {currentThemePreset.items.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 bg-white/50 rounded-xl border flex gap-3 items-center transition-colors duration-300 ${currentThemePreset.borderClass}`}
                      >
                        <div className="w-11 h-11 rounded-lg bg-black/5 shrink-0 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[9.5px] font-black leading-tight">{item.name}</div>
                          <div className="text-[7.5px] opacity-75 line-clamp-1 mt-0.5">{item.desc}</div>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[9px] font-black">{item.price}</span>
                            <span className="text-[7px] px-1 bg-black/5 rounded font-medium opacity-80">
                              🥗 {item.calories} kcal
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={`mt-3 p-3 text-center text-[9px] font-black cursor-pointer transition-all ${currentThemePreset.accentBg}`}>
                    Hesap İste veya Garson Çağır
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================== ÖZELLİKLER ============================== */}
      <section id="ozellikler" className="py-24 border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div data-reveal className="max-w-2xl mb-14">
            <span className="text-xs font-bold text-red-700 uppercase tracking-[0.18em]">Altyapı</span>
            <h2 className="font-serif text-[clamp(1.9rem,3.5vw,2.8rem)] text-stone-900 mt-3 leading-tight">
              Mutfakta hız, veride güven
            </h2>
          </div>

          {/* Varied layout: one wide feature + two supporting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
            <div data-reveal className="md:col-span-2 grid grid-cols-1 md:grid-cols-12 gap-6 items-start pb-12 border-b border-stone-200">
              <div className="md:col-span-1">
                <Sparkles className="w-6 h-6 text-red-600" />
              </div>
              <div className="md:col-span-5">
                <h3 className="text-xl font-bold text-stone-900">AI menü asistanı</h3>
                <p className="text-sm text-stone-600 leading-relaxed mt-3 max-w-[52ch]">
                  Ürünün adını yazın, gerisini bırakın: iştah açıcı açıklama metni, tahmini kalori ve besin değerleri
                  saniyeler içinde üretilir. Menü yazarlığıyla uğraşmadan profesyonel bir vitrin elde edersiniz.
                </p>
              </div>
              <div className="md:col-span-6 bg-stone-50 rounded-xl border border-stone-200 p-5">
                <p className="text-[11px] font-bold text-stone-400 uppercase tracking-[0.15em]">Örnek üretim</p>
                <p className="text-[13px] text-stone-700 mt-2 leading-relaxed">
                  <span className="font-bold">&ldquo;Trüflü Antrikot&rdquo;</span> →{' '}
                  <span className="italic font-serif">
                    &ldquo;Taze kuşkonmaz püre yatağında, kemik iliği sosu ve trüf mantarıyla 28 gün dinlendirilmiş antrikot.&rdquo;
                  </span>{' '}
                  <span className="text-stone-500">· ~810 kcal</span>
                </p>
              </div>
            </div>

            <div data-reveal className="flex items-start gap-5">
              <Lock className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-stone-900">KVKK uyumlu, veri toplamayan mimari</h3>
                <p className="text-sm text-stone-600 leading-relaxed mt-3 max-w-[52ch]">
                  Ziyaretçi menüyü açarken hiçbir kayıt, çerez veya kişisel veri istenmez. Müşteri verisi
                  depolanmadığı için veri ihlali riski baştan ortadan kalkar.
                </p>
              </div>
            </div>

            <div data-reveal className="flex items-start gap-5">
              <Zap className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-stone-900">Zayıf şebekede bile anında açılır</h3>
                <p className="text-sm text-stone-600 leading-relaxed mt-3 max-w-[52ch]">
                  Sunucu tarafı önbellekleme ve optimize görseller sayesinde menü, yoğun saatlerdeki mobil
                  şebekelerde dahi beklemeden yüklenir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================== FİYATLAR ============================== */}
      <section id="fiyatlar" className="py-24 border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6">
          <div data-reveal className="max-w-2xl mb-14">
            <span className="text-xs font-bold text-red-700 uppercase tracking-[0.18em]">Fiyatlandırma</span>
            <h2 className="font-serif text-[clamp(1.9rem,3.5vw,2.8rem)] text-stone-900 mt-3 leading-tight">
              Komisyon yok. Sürpriz yok.
            </h2>
            <p className="text-[15px] text-stone-600 mt-4 leading-relaxed max-w-[58ch]">
              Sabit aylık abonelik; istediğiniz zaman yükseltin veya iptal edin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {PLANS.map((plan) => {
              const popular = !!plan.popular;
              return (
                <div
                  key={plan.id}
                  data-reveal
                  className={`rounded-2xl p-7 flex flex-col ${
                    popular
                      ? 'bg-stone-900 text-white shadow-2xl md:-mt-4 md:mb-4'
                      : 'bg-white border border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-bold ${popular ? 'text-white' : 'text-stone-900'}`}>{plan.name}</h3>
                    {popular && (
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] bg-red-600 text-white px-2.5 py-1 rounded-full">
                        Popüler
                      </span>
                    )}
                  </div>
                  <p className={`text-[13px] mt-2 leading-relaxed ${popular ? 'text-stone-400' : 'text-stone-500'}`}>
                    {plan.description}
                  </p>

                  <ul className="mt-7 flex flex-col gap-3 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[13px]">
                        {f.included ? (
                          <Check className={`w-4 h-4 shrink-0 mt-0.5 ${popular ? 'text-red-500' : 'text-red-600'}`} />
                        ) : (
                          <Minus className={`w-4 h-4 shrink-0 mt-0.5 ${popular ? 'text-stone-600' : 'text-stone-300'}`} />
                        )}
                        <span
                          className={
                            f.included
                              ? popular
                                ? 'text-stone-200'
                                : 'text-stone-700'
                              : popular
                                ? 'text-stone-600 line-through'
                                : 'text-stone-400 line-through'
                          }
                        >
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/register"
                    className={`mt-8 py-3 rounded-lg text-center text-sm font-bold transition-colors ${
                      popular
                        ? 'bg-red-600 text-white hover:bg-red-500'
                        : 'border border-stone-300 text-stone-800 hover:border-stone-900'
                    }`}
                  >
                    {plan.name} ile Başla
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================== SSS ============================== */}
      <section id="sss" className="py-24 border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div data-reveal className="lg:col-span-4">
            <span className="text-xs font-bold text-red-700 uppercase tracking-[0.18em]">SSS</span>
            <h2 className="font-serif text-[clamp(1.9rem,3vw,2.5rem)] text-stone-900 mt-3 leading-tight">
              Aklınızda kalanlar
            </h2>
            <p className="text-sm text-stone-600 mt-4 leading-relaxed">
              Cevabını bulamadığınız bir soru mu var?{' '}
              <Link href="/register" className="text-purple-650 font-bold underline underline-offset-4 decoration-purple-300 hover:decoration-purple-650">
                Kaydolun
              </Link>
              , kendiniz görün.
            </p>
          </div>

          <div data-reveal className="lg:col-span-8 flex flex-col divide-y divide-stone-200 border-y border-stone-200">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group py-5">
                <summary className="flex items-center justify-between cursor-pointer list-none text-[15px] font-semibold text-stone-900 hover:text-red-700 transition-colors">
                  {faq.q}
                  <span className="ml-4 shrink-0 text-stone-400 transition-transform duration-300 group-open:rotate-45">
                    <X className="w-4 h-4 rotate-45" />
                  </span>
                </summary>
                <p className="mt-3 text-sm text-stone-600 leading-relaxed max-w-[65ch]">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== CTA ============================== */}
      <section className="py-24 bg-stone-900 relative overflow-hidden">
        <span
          aria-hidden
          className="absolute -top-10 left-0 right-0 text-center font-serif font-bold text-[16vw] leading-none text-white/[0.04] select-none pointer-events-none whitespace-nowrap"
        >
          afiyet olsun
        </span>
        <div data-reveal className="max-w-3xl mx-auto px-6 text-center relative">
          <h2 className="font-serif text-[clamp(2rem,4.5vw,3.4rem)] text-white leading-tight">
            Bu akşamki servise yetişir.
          </h2>
          <p className="text-stone-400 text-[15px] mt-5 leading-relaxed max-w-[50ch] mx-auto">
            Menünüzü oluşturun, QR kodunuzu indirin, masaya koyun. Hepsi bu.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 rounded-xl bg-white text-sm font-bold text-stone-900 border border-purple-500/25 shadow-[0_6px_22px_rgba(168,85,247,0.15)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.25)] hover:scale-[1.01] active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2 group"
            >
              Kaydol
              <ArrowRight className="w-4 h-4 text-purple-650 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-lg border border-stone-700 text-sm font-semibold text-stone-300 hover:text-white hover:border-stone-500 transition-colors inline-flex items-center justify-center"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </section>

      {/* ============================== FOOTER ============================== */}
      <footer className="py-14 bg-stone-950 text-sm text-stone-500">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between gap-10">
            <div className="flex flex-col gap-3 max-w-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
                  <QrCode className="w-4 h-4" />
                </div>
                <span className="font-bold text-white text-sm">QR Menü AI</span>
              </div>
              <p className="text-[13px] leading-relaxed text-stone-500">
                Restoran ve kafeler için yapay zekâ destekli, komisyonsuz QR menü platformu.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 text-[13px]">
              <div className="flex flex-col gap-2.5">
                <span className="text-stone-300 font-semibold mb-1">Ürün</span>
                <a href="#nasil" className="hover:text-white transition-colors">Nasıl Çalışır</a>
                <a href="#temalar" className="hover:text-white transition-colors">Temalar</a>
                <a href="#fiyatlar" className="hover:text-white transition-colors">Fiyatlar</a>
              </div>
              <div className="flex flex-col gap-2.5">
                <span className="text-stone-300 font-semibold mb-1">Hesap</span>
                <Link href="/login" className="hover:text-white transition-colors">Giriş Yap</Link>
                <Link href="/register" className="hover:text-white transition-colors">Kayıt Ol</Link>
              </div>
              <div className="flex flex-col gap-2.5">
                <span className="text-stone-300 font-semibold mb-1">Yasal</span>
                <span className="text-stone-600 cursor-not-allowed" title="Yakında">KVKK Aydınlatma Metni</span>
                <span className="text-stone-600 cursor-not-allowed" title="Yakında">Kullanım Koşulları</span>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-stone-800 text-[12px] text-stone-600">
            © 2026 QR Menü AI. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  );
}
