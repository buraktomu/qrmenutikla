import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ShieldAlert, Clock, Mail, Phone, MessageSquare } from 'lucide-react';
import LogoutButton from './LogoutButton';

export default async function NestedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Load user business and subscription
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      businesses: {
        include: {
          subscription: true,
        },
      },
    },
  });

  if (!dbUser) {
    redirect('/login');
  }

  // Super admins bypass subscription check
  if (dbUser.role === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  const business = dbUser.businesses[0];
  const subscription = business?.subscription;

  // If subscription is not ACTIVE (e.g. PENDING, PAST_DUE, CANCELED, or null)
  if (!subscription || subscription.status !== 'ACTIVE') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 text-black">
        
        {/* Glow Effects */}
        <div className="absolute w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-3xl top-1/4 left-1/4 pointer-events-none -z-10" />
        <div className="absolute w-[350px] h-[350px] bg-purple-500/5 rounded-full blur-3xl bottom-1/4 right-1/4 pointer-events-none -z-10" />

        <div className="max-w-xl w-full bg-white border border-stone-200/80 rounded-3xl p-8 shadow-xl shadow-stone-200/40 flex flex-col items-center text-center">
          
          {/* Hourglass/Pending Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 mb-6 animate-pulse">
            <Clock className="w-8 h-8" />
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-black text-black tracking-tight">Yöneticinin İzni Bekleniyor</h2>
          
          {/* Subheading */}
          <p className="text-xs text-stone-500 font-bold mt-1.5 uppercase tracking-wider">
            Hesap Onayı & Paket Ataması Bekleniyor
          </p>

          <div className="h-px bg-stone-100 w-full my-5" />

          {/* Detail Text */}
          <p className="text-sm text-stone-700 leading-relaxed font-medium">
            Kayıt işleminiz başarıyla tamamlandı. QR menünüzü hazırlamak ve paneli kullanabilmek için yöneticinin hesabınızı onaylayıp bir paket (Başlangıç, Pro veya Premium) tanımlaması gerekmektedir.
          </p>
          
          <p className="text-xs text-stone-500 leading-relaxed font-semibold mt-4 bg-stone-50 border border-stone-150 p-3.5 rounded-xl w-full">
            Plan ataması manuel olarak yapılacaktır. Lütfen satış/destek ekibimizle iletişime geçerek üyeliğinizi aktif ettirin.
          </p>

          {/* Contact Methods */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-6">
            <a 
              href="mailto:destek@qrmenu.com"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-xs font-black text-black transition-colors"
            >
              <Mail className="w-4 h-4 text-stone-500" />
              E-posta Gönder
            </a>
            <a 
              href="https://wa.me/905555555555" // Replace with actual support whatsapp or let it be placeholder
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-xs font-black text-black transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-stone-500" />
              WhatsApp Destek
            </a>
          </div>

          <div className="h-px bg-stone-100 w-full my-6" />

          {/* User Profile Card */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full bg-stone-50/50 border border-stone-150 rounded-2xl p-4">
            <div className="text-left flex flex-col gap-0.5 text-xs">
              <span className="font-extrabold text-black">{dbUser.name}</span>
              <span className="text-stone-500 font-mono font-medium">{dbUser.email}</span>
              {business && (
                <span className="text-[10px] text-stone-400 font-semibold uppercase mt-1">
                  İşletme: {business.name}
                </span>
              )}
            </div>
            <LogoutButton />
          </div>

        </div>
      </div>
    );
  }

  return <>{children}</>;
}
