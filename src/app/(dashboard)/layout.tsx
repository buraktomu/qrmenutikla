'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { 
  QrCode, 
  LayoutDashboard, 
  Settings, 
  MenuSquare, 
  CreditCard, 
  ShieldAlert, 
  LogOut, 
  Menu, 
  X, 
  User,
  Palette,
  Users,
  Building2,
  SlidersHorizontal,
  BadgeCheck,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);

  const handleSignOut = async () => {
    deleteCookie('session_active');
    await signOut({ redirect: false });
    showToast('Başarıyla çıkış yapıldı.', 'success');
    router.push('/login');
  };

  const userRole = (session?.user as any)?.role;

  // Conditional Nav Links based on role
  const navLinks = userRole === 'SUPER_ADMIN'
    ? [
        { href: '/admin', label: 'Genel Özet', icon: LayoutDashboard },
        { href: '/admin/approvals', label: 'Onay Bekleyenler', icon: BadgeCheck },
        { href: '/admin/users', label: 'Kullanıcı Yönetimi', icon: Users },
        { href: '/admin/businesses', label: 'İşletme Yönetimi', icon: Building2 },
        { href: '/admin/subscriptions', label: 'Abonelik Yönetimi', icon: CreditCard },
        { href: '/admin/gallery', label: 'Ortak Görsel Galerisi', icon: Palette },
        { href: '/admin/settings', label: 'Sistem Ayarları', icon: SlidersHorizontal },
        { href: '/admin/settings/ai', label: 'AI Sistem Ayarları', icon: Sparkles },
      ]
    : [
        { href: '/dashboard', label: 'Özet Panel', icon: LayoutDashboard },
        { href: '/dashboard/menu', label: 'Menü Yönetimi', icon: MenuSquare },
        { href: '/dashboard/qr', label: 'QR Kod Oluşturucu', icon: QrCode },
        { href: '/dashboard/theme', label: 'Tema Seçimi', icon: Palette },
        { href: '/dashboard/profile', label: 'Profil & Ayarlar', icon: Settings },
        { href: '/dashboard/billing', label: 'Abonelik & Ödeme', icon: CreditCard },
      ];

  // Guard: Verify session cookie on mount and redirect to /login if missing
  React.useEffect(() => {
    if (status === 'loading') return;

    if (status === 'authenticated') {
      const active = getCookie('session_active');
      if (!active) {
        // Main session exists but session_active cookie is missing -> browser was closed.
        signOut({ redirect: false }).then(() => {
          router.push('/login');
          router.refresh();
        });
        return;
      }
      setIsVerifyingSession(false);

      if (userRole === 'SUPER_ADMIN' && pathname.startsWith('/dashboard')) {
        router.push('/admin');
      }
    } else if (status === 'unauthenticated') {
      setIsVerifyingSession(false);
      router.push('/login');
    }
  }, [userRole, status, pathname, router]);

  if (status === 'loading' || isVerifyingSession) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-3xl top-1/4 left-1/4 pointer-events-none -z-10" />
        <div className="absolute w-[350px] h-[350px] bg-purple-500/5 rounded-full blur-3xl bottom-1/4 right-1/4 pointer-events-none -z-10" />
        
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center">
            <QrCode className="w-6 h-6 text-indigo-600 animate-spin [animation-duration:3s]" />
          </div>
          <span className="text-xs text-stone-500 font-bold tracking-widest uppercase mt-2">
            Güvenli Oturum Kontrol Ediliyor...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 text-black min-h-screen flex flex-col md:flex-row">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-stone-200 bg-white p-6 justify-between">
        <div>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 px-2 mb-10 group">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center group-hover:border-indigo-500/50 transition-all">
              <QrCode className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-black">QR Menü AI</span>
              <span className="text-[9px] text-zinc-550 tracking-wider font-semibold uppercase mt-0.5">Yönetim</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/dashboard' && link.href !== '/admin' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-600 shadow-sm' : 'text-stone-600 hover:text-black hover:bg-stone-50'}`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Sign Out */}
        <div className="flex flex-col gap-4 border-t border-stone-150 pt-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600">
              <User className="w-4 h-4" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold text-black truncate">{session?.user?.name || 'Yükleniyor...'}</span>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5">{userRole === 'SUPER_ADMIN' ? 'Süper Admin' : 'İşletme Sahibi'}</span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:text-red-650 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Oturumu Kapat
          </button>
        </div>
      </aside>

      {/* Header - Mobile */}
      <header className="md:hidden border-b border-stone-200 bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center">
            <QrCode className="w-4.5 h-4.5 text-indigo-600" />
          </div>
          <span className="font-bold text-sm text-black">QR Menü AI</span>
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:text-black"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-white z-30 px-6 py-6 flex flex-col justify-between border-t border-stone-200">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-600 shadow-sm' : 'text-stone-600 hover:text-black'}`}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-col gap-4 border-t border-stone-200 pt-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                <User className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-black">{session?.user?.name}</span>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5">{userRole === 'SUPER_ADMIN' ? 'Süper Admin' : 'İşletme'}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleSignOut();
              }}
              className="flex items-center gap-3 py-3 text-sm font-semibold text-red-500"
            >
              <LogOut className="w-5 h-5" />
              Oturumu Kapat
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>

    </div>
  );
}
