import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getThemeById } from '@/config/themes';
import { PLANS } from '@/config/plans';
import { 
  Users, 
  MenuSquare, 
  Layers, 
  QrCode, 
  ExternalLink, 
  CreditCard, 
  Palette, 
  CheckCircle2 
} from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Load user business and subscription
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      businesses: {
        include: {
          categories: {
            include: {
              products: true,
            },
          },
          subscription: {
            include: {
              plan: true,
            },
          },
          visitorLogs: {
            orderBy: { date: 'asc' },
            take: 7, // Last 7 days
          },
        },
      },
    },
  });

  if (user?.role === 'SUPER_ADMIN') {
    redirect('/admin');
  }

  const business = user?.businesses[0];

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center text-black">
        <QrCode className="w-16 h-16 text-black animate-pulse" />
        <h2 className="text-xl font-black text-black">İşletme Bulunamadı</h2>
        <p className="text-sm text-black max-w-sm">
          Hesabınıza atanmış bir işletme bulunmuyor. Lütfen destek ekibiyle iletişime geçin.
        </p>
      </div>
    );
  }

  // Calculate metrics
  const totalCategories = business.categories.length;
  let totalProducts = 0;
  business.categories.forEach((cat) => {
    totalProducts += cat.products.length;
  });

  const subscription = business.subscription;
  const activePlanId = subscription?.planId || 'starter';
  const planDetails = PLANS.find((p) => p.id === activePlanId) || PLANS[0];
  const activeTheme = getThemeById(business.themeId);

  // Generate visitor chart coordinates and stats
  const visitorData = business.visitorLogs || [];
  const maxVisitorCount = Math.max(...visitorData.map((d) => d.count), 10);
  const totalVisitorsLast7Days = visitorData.reduce((acc, curr) => acc + curr.count, 0);

  // Chart plotting configurations (SVG based)
  const chartHeight = 120;
  const chartWidth = 500;
  const points = visitorData.map((d, index) => {
    const x = visitorData.length > 1 ? (index / (visitorData.length - 1)) * chartWidth : chartWidth / 2;
    const y = chartHeight - (d.count / maxVisitorCount) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col gap-8 text-black">
      
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-black tracking-tight">Merhaba, {session.user.name}</h1>
          <p className="text-sm text-black font-semibold mt-1">
            {business.name} işletmenizin özet raporu ve hızlı kontrolleri.
          </p>
        </div>
        
        {/* Quick Public Link */}
        <a
          href={`/menu/${business.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-stone-250 hover:bg-stone-50 text-sm font-bold text-indigo-600 transition-all shadow-md self-start md:self-auto"
        >
          Canlı QR Menüyü Aç
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Visitor Stats */}
        <div className="p-6 rounded-2xl border border-stone-200 bg-white flex justify-between items-start shadow-sm">
          <div>
            <span className="text-xs font-black text-black uppercase tracking-wide">Ziyaretçiler (7 Gün)</span>
            <div className="text-3xl font-extrabold text-black mt-2">{totalVisitorsLast7Days}</div>
            <span className="text-[10px] text-black font-semibold block mt-1">QR Kod tarama trafiği</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 border border-indigo-500/10">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Categories Stats */}
        <div className="p-6 rounded-2xl border border-stone-200 bg-white flex justify-between items-start shadow-sm">
          <div>
            <span className="text-xs font-black text-black uppercase tracking-wide">Kategori Sayısı</span>
            <div className="text-3xl font-extrabold text-black mt-2">{totalCategories}</div>
            <span className="text-[10px] text-black font-semibold block mt-1">Menüdeki ana gruplar</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-650 border border-purple-500/10">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Products Stats */}
        <div className="p-6 rounded-2xl border border-stone-200 bg-white flex justify-between items-start shadow-sm">
          <div>
            <span className="text-xs font-black text-black uppercase tracking-wide">Toplam Ürün</span>
            <div className="text-3xl font-extrabold text-black mt-2">{totalProducts}</div>
            <span className="text-[10px] text-black font-semibold block mt-1">Aktif listelenen lezzetler</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/10">
            <MenuSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Theme Stats */}
        <div className="p-6 rounded-2xl border border-stone-200 bg-white flex justify-between items-start shadow-sm">
          <div>
            <span className="text-xs font-black text-black uppercase tracking-wide">Aktif Tema</span>
            <div className="text-3xl font-extrabold text-black mt-2 truncate max-w-[150px]">{activeTheme.name}</div>
            <span className="text-[10px] text-black font-semibold block mt-1">QR menü görsel tasarımı</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/10">
            <Palette className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Section - Graph & Limits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Visitor graph (SVG rendered line chart) */}
        <div className="lg:col-span-8 p-6 rounded-2xl border border-stone-200 bg-white shadow-sm flex flex-col justify-between min-h-[320px]">
          <div>
            <h3 className="text-base font-black text-black">Menü Görüntülenme Trafiği</h3>
            <p className="text-xs text-black font-semibold mt-0.5">Son 7 güne ait günlük tarama istatistikleri.</p>
          </div>

          {visitorData.length > 0 ? (
            <div className="my-6">
              <div className="relative w-full overflow-hidden h-[120px]">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                  {/* Gradients definition */}
                  <defs>
                    <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Area fill */}
                  <polygon
                    points={`0,${chartHeight} ${points} ${chartWidth},${chartHeight}`}
                    fill="url(#chartGlow)"
                  />

                  {/* SVG Line */}
                  <polyline
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="3"
                    points={points}
                  />

                  {/* Data Circles */}
                  {visitorData.map((d, index) => {
                    const x = visitorData.length > 1 ? (index / (visitorData.length - 1)) * chartWidth : chartWidth / 2;
                    const y = chartHeight - (d.count / maxVisitorCount) * chartHeight;
                    return (
                      <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="#fff"
                        stroke="#4f46e5"
                        strokeWidth="2.5"
                      />
                    );
                  })}
                </svg>
              </div>
              
              {/* Labels */}
              <div className="flex justify-between text-[10px] text-black font-bold font-mono px-2 pt-2 border-t border-stone-200">
                {visitorData.map((d, i) => {
                  const dateString = new Date(d.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
                  return <span key={i}>{dateString}</span>;
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-black text-xs italic font-bold">
              Ziyaretçi verisi henüz toplanmadı.
            </div>
          )}

          <div className="text-[10px] text-black font-mono font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Menünüz QR taramalarına hazır ve aktif durumda.</span>
          </div>
        </div>

        {/* Subscription Limits */}
        <div className="lg:col-span-4 p-6 rounded-2xl border border-stone-200 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-black">Paket Kullanım Durumu</h3>
            <p className="text-xs text-black font-semibold mt-0.5">Mevcut abonelik limitleriniz ve aktif haklarınız.</p>
          </div>

          <div className="flex flex-col gap-5 my-6">
            {/* Category Limit Bar */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-black">Kategoriler</span>
                <span className="text-black font-extrabold">{totalCategories} / {planDetails.limits.maxCategories}</span>
              </div>
              <div className="w-full h-2 rounded bg-stone-100 overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded transition-all duration-500" 
                  style={{ width: `${Math.min((totalCategories / planDetails.limits.maxCategories) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Product Limit Bar */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-black">Ürünler</span>
                <span className="text-black font-extrabold">{totalProducts} / {planDetails.limits.maxProducts}</span>
              </div>
              <div className="w-full h-2 rounded bg-stone-100 overflow-hidden">
                <div 
                  className="h-full bg-purple-650 rounded transition-all duration-500" 
                  style={{ width: `${Math.min((totalProducts / planDetails.limits.maxProducts) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* AI Capability Banner */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-150 flex items-center justify-between text-xs">
              <span className="text-black font-bold">Yapay Zeka Erişimi</span>
              <span className={`font-extrabold ${planDetails.features.find((f)=>f.text.includes('AI'))?.included ? 'text-indigo-600' : 'text-stone-400'}`}>
                {planDetails.features.find((f)=>f.text.includes('AI'))?.included ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          </div>

          <Link
            href="/dashboard/billing"
            className="w-full py-2.5 rounded-xl bg-white border border-stone-250 hover:bg-stone-50 text-center text-xs font-extrabold text-black transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <CreditCard className="w-4 h-4 text-indigo-600" />
            Planı Yükselt / Faturalama
          </Link>
        </div>

      </div>

    </div>
  );
}
