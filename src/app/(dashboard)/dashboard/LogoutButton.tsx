'use client';

import React from 'react';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <button
      onClick={handleSignOut}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 transition-all shadow-sm active:scale-98"
    >
      <LogOut className="w-4 h-4" />
      Oturumu Kapat
    </button>
  );
}
