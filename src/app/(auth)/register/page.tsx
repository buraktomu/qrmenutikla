'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QrCode, User, Mail, Building2, Globe, Lock, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { registerUser } from '@/app/actions/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper to slugify Turkish string inputs on the fly
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9 -]/g, '') // Remove invalid chars
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-'); // Collapse double dashes
  };

  const handleBusinessNameChange = (val: string) => {
    setBusinessName(val);
    setSlug(slugify(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !businessName || !slug || !password || !confirmPassword) {
      showToast('Lütfen tüm alanları doldurun.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Şifreler uyuşmuyor.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Şifre en az 6 karakter olmalıdır.', 'error');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('businessName', businessName);
    formData.append('slug', slug);
    formData.append('password', password);

    try {
      const res = await registerUser(null, formData);

      if (res?.success) {
        showToast('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...', 'success');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        showToast(res?.error || 'Kayıt sırasında bir hata oluştu.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Bir sistem hatası oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-stone-50 text-stone-850 min-h-screen flex items-center justify-center relative py-12 px-6 overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute w-[450px] h-[450px] bg-indigo-500/5 rounded-full blur-3xl -top-20 -left-20 pointer-events-none -z-10 animate-pulse" />
      <div className="absolute w-[450px] h-[450px] bg-purple-500/5 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none -z-10 animate-pulse" />

      <div className="max-w-md w-full flex flex-col items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center group-hover:border-indigo-500/50 transition-all duration-300">
            <QrCode className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-lg tracking-tight text-stone-900 leading-none">QR Menü AI</span>
            <span className="text-[10px] text-stone-400 font-semibold tracking-widest uppercase mt-0.5">Hemen Başlayın</span>
          </div>
        </Link>

        {/* Card */}
        <div className="w-full bg-white border border-stone-200/80 rounded-3xl p-8 shadow-xl shadow-stone-200/40">
          <h2 className="text-2xl font-bold text-stone-900 text-center">Hesap Oluştur</h2>
          <p className="text-xs text-stone-500 text-center mt-1.5 font-light">
            İşletmenizi kaydedin ve ilk QR menünüzü hazırlayın.
          </p>

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            {/* Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-600">Adınız Soyadınız</label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Burak Yılmaz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/20 text-sm outline-none transition-all placeholder:text-stone-400 text-stone-850"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-600">E-Posta Adresi</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/20 text-sm outline-none transition-all placeholder:text-stone-400 text-stone-850"
                />
              </div>
            </div>

            {/* Business Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-600">Restoran/Kafe Adı</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Bistro Cafe & Restoran"
                  value={businessName}
                  onChange={(e) => handleBusinessNameChange(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/20 text-sm outline-none transition-all placeholder:text-stone-400 text-stone-850"
                />
              </div>
            </div>

            {/* Slug Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-600">Menü URL Bağlantısı</label>
              <div className="relative">
                <Globe className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="bistro-cafe"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/20 text-sm outline-none transition-all placeholder:text-stone-400 text-stone-850 font-mono text-xs"
                />
              </div>
              <span className="text-[10px] text-stone-450 px-1">
                Ziyaretçi menü adresi: <strong className="text-stone-600 font-semibold text-[10px]">qrmenu.ai/menu/{slug || '...'}</strong>
              </span>
            </div>

            {/* Password Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-600">Şifre</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/20 text-sm outline-none transition-all placeholder:text-stone-400 text-stone-850"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-600">Şifre Tekrar</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/20 text-sm outline-none transition-all placeholder:text-stone-400 text-stone-850"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
             <button
              type="submit"
              disabled={loading}
              className="mt-3 w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Hesap Oluşturuluyor...' : 'Kayıt Ol'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="h-px bg-stone-150 my-5" />

          <p className="text-xs text-stone-500 text-center font-light">
            Zaten bir hesabınız var mı?{' '}
            <Link href="/login" className="text-indigo-600 hover:underline font-medium">
              Giriş Yapın
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
