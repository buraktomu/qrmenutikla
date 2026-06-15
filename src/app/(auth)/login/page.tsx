'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { QrCode, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const errorParam = searchParams.get('error');
  React.useEffect(() => {
    if (errorParam === 'CredentialsSignin') {
      showToast('E-posta veya şifre hatalı. Lütfen kontrol edin.', 'error');
    }
  }, [errorParam, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Lütfen tüm alanları doldurun.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        showToast('Giriş başarısız. Lütfen şifrenizi kontrol edin.', 'error');
      } else {
        // Set session-only cookie to expire when the browser is closed
        if (typeof document !== 'undefined') {
          document.cookie = `session_active=true; path=/; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
        }
        showToast('Başarıyla giriş yapıldı. Yönlendiriliyorsunuz...', 'success');
        // Route by role so Super Admins land on /admin directly (no dashboard bounce)
        const activeSession = await getSession();
        const role = (activeSession?.user as any)?.role;
        router.push(role === 'SUPER_ADMIN' ? '/admin' : '/dashboard');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      showToast('Beklenmeyen bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-stone-50 text-stone-850 min-h-screen flex items-center justify-center relative px-6 overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute w-[450px] h-[450px] bg-indigo-500/5 rounded-full blur-3xl -top-20 -left-20 pointer-events-none -z-10 animate-pulse" />
      <div className="absolute w-[450px] h-[450px] bg-purple-500/5 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none -z-10 animate-pulse" />

      <div className="max-w-md w-full flex flex-col items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center group-hover:border-indigo-500/50 transition-all duration-300">
            <QrCode className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-lg tracking-tight text-stone-900 leading-none">QR Menü AI</span>
            <span className="text-[10px] text-stone-400 font-semibold tracking-widest uppercase mt-0.5">Yönetim Paneli</span>
          </div>
        </Link>

        {/* Card */}
        <div className="w-full bg-white border border-stone-200/80 rounded-3xl p-8 shadow-xl shadow-stone-200/40">
          <h2 className="text-2xl font-bold text-stone-900 text-center">Hoş Geldiniz</h2>
          <p className="text-xs text-stone-500 text-center mt-1.5 font-light">
            Hesabınıza giriş yaparak QR menünüzü yönetin.
          </p>

          <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-stone-600">E-Posta Adresi</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/20 text-sm outline-none transition-all placeholder:text-stone-400 text-stone-850 font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-stone-600">Şifre</label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/20 text-sm outline-none transition-all placeholder:text-stone-400 text-stone-850 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="h-px bg-stone-150 my-6" />

          <p className="text-xs text-stone-500 text-center font-light">
            Henüz bir hesabınız yok mu?{' '}
            <Link href="/register" className="text-indigo-600 hover:underline font-medium">
              Hemen Kaydolun
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-400 text-xs">Yükleniyor...</div>}>
      <LoginContent />
    </Suspense>
  );
}
