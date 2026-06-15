'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { deleteUser, updateUserRole, updateUserPassword } from '@/app/actions/admin';
import {
  Search,
  Trash2,
  Shield,
  User,
  ExternalLink,
  ChevronDown,
  KeyRound,
  Eye,
  EyeOff,
  X,
  Save
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type UserWithBusiness = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  businesses: {
    name: string;
    slug: string;
    subscription: {
      planId: string;
    } | null;
  }[];
};

type UserTableProps = {
  initialUsers: UserWithBusiness[];
};

export default function UserTable({ initialUsers }: UserTableProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<UserWithBusiness[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SUPER_ADMIN' | 'BUSINESS_OWNER'>('ALL');
  const [loading, setLoading] = useState<string | null>(null); // tracks user id currently executing operation

  // Password change modal state
  const [pwUser, setPwUser] = useState<UserWithBusiness | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!pwUser) return;
    if (newPassword.length < 6) {
      showToast('Şifre en az 6 karakter olmalıdır.', 'error');
      return;
    }
    setPwLoading(true);
    const res = await updateUserPassword(pwUser.id, newPassword);
    if (res.success) {
      showToast(`${pwUser.name} için yeni şifre kaydedildi.`, 'success');
      setPwUser(null);
      setNewPassword('');
      setShowPw(false);
    } else {
      showToast(res.error || 'Şifre güncellenemedi.', 'error');
    }
    setPwLoading(false);
  };

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'SUPER_ADMIN' ? 'BUSINESS_OWNER' : 'SUPER_ADMIN';
    const confirmMessage = currentRole === 'SUPER_ADMIN' 
      ? 'Bu kullanıcının Süper Admin yetkilerini kaldırmak istediğinize emin misiniz?'
      : 'Bu kullanıcıyı Süper Admin yapmak istediğinize emin misiniz?';

    if (!confirm(confirmMessage)) return;

    setLoading(userId);
    const res = await updateUserRole(userId, nextRole);
    if (res.success) {
      showToast('Kullanıcı rolü başarıyla güncellendi.', 'success');
      // Update local state
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: nextRole } : u));
      router.refresh();
    } else {
      showToast(res.error || 'İşlem başarısız.', 'error');
    }
    setLoading(null);
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`"${userName}" kullanıcısını ve bu kullanıcıya ait TÜM işletme/menü verilerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
      return;
    }

    setLoading(userId);
    const res = await deleteUser(userId);
    if (res.success) {
      showToast('Kullanıcı ve bağlı tüm veriler silindi.', 'success');
      setUsers(prev => prev.filter(u => u.id !== userId));
      router.refresh();
    } else {
      showToast(res.error || 'Silme işlemi başarısız.', 'error');
    }
    setLoading(null);
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = 
      roleFilter === 'ALL' || 
      user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex flex-col gap-6">
      
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="İsim veya e-posta ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-250 text-xs text-black font-semibold outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-stone-400"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto self-stretch sm:self-auto justify-end">
          <span className="text-xs text-stone-500 font-bold hidden md:inline">Rol Filtresi:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-250 text-xs text-black font-extrabold outline-none cursor-pointer focus:border-indigo-500 transition-all"
          >
            <option value="ALL">Tüm Roller</option>
            <option value="SUPER_ADMIN">Süper Admin</option>
            <option value="BUSINESS_OWNER">İşletme Sahibi</option>
          </select>
        </div>

      </div>

      {/* Users Table — desktop */}
      <div className="hidden md:block overflow-x-auto border border-stone-200 rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-stone-200 text-stone-500 font-black uppercase tracking-wider bg-stone-50/50">
              <th className="p-4">Kullanıcı Bilgileri</th>
              <th className="p-4">Rol</th>
              <th className="p-4">İşletme Adı</th>
              <th className="p-4">Abonelik Planı</th>
              <th className="p-4">Kayıt Tarihi</th>
              <th className="p-4 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-150">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const business = user.businesses[0];
                const plan = business?.subscription?.planId || null;
                const isSuperAdmin = user.role === 'SUPER_ADMIN';
                const isOpLoading = loading === user.id;

                return (
                  <tr key={user.id} className="hover:bg-stone-50/50 text-black font-bold">
                    
                    {/* User Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                          isSuperAdmin 
                            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600' 
                            : 'bg-stone-100 border-stone-200 text-stone-600'
                        }`}>
                          {isSuperAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-black text-sm">{user.name}</span>
                          <span className="text-[10px] text-stone-500 font-mono font-medium">{user.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="p-4">
                      <button
                        disabled={isOpLoading}
                        onClick={() => handleRoleChange(user.id, user.role)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black transition-all active:scale-95 disabled:opacity-50 ${
                          isSuperAdmin 
                            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 hover:bg-indigo-500/15' 
                            : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                        title="Rolü değiştirmek için tıklayın"
                      >
                        {isSuperAdmin ? 'Süper Admin' : 'İşletme Sahibi'}
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </button>
                    </td>

                    {/* Business Name */}
                    <td className="p-4">
                      {business ? (
                        <div className="flex flex-col">
                          <span className="text-black text-sm">{business.name}</span>
                          <span className="text-[10px] text-stone-400 font-mono font-medium">/menu/{business.slug}</span>
                        </div>
                      ) : (
                        <span className="text-stone-400 italic">İşletme Kurulmamış</span>
                      )}
                    </td>

                    {/* Subscription Plan */}
                    <td className="p-4">
                      {business ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase border tracking-wider ${
                          plan === 'premium' ? 'bg-indigo-50 border-indigo-150 text-indigo-600' :
                          plan === 'pro' ? 'bg-purple-50 border-purple-150 text-purple-600' :
                          'bg-stone-50 border-stone-250 text-stone-600'
                        }`}>
                          {plan || 'starter'}
                        </span>
                      ) : (
                        <span className="text-stone-400 font-mono font-semibold">-</span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="p-4 text-stone-500 font-medium">
                      {new Date(user.createdAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {business && (
                          <a
                            href={`/menu/${business.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-colors"
                            title="QR Menüyü Canlı Gör"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => { setPwUser(user); setNewPassword(''); setShowPw(false); }}
                          className="p-1.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-colors"
                          title="Şifre Değiştir"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          disabled={isOpLoading}
                          onClick={() => handleDelete(user.id, user.name)}
                          className="p-1.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-600 hover:text-red-650 hover:bg-red-50 hover:border-red-100 transition-colors disabled:opacity-50"
                          title="Kullanıcıyı Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-stone-400 italic">
                  Kullanıcı bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Users — mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => {
            const business = user.businesses[0];
            const plan = business?.subscription?.planId || null;
            const isSuperAdmin = user.role === 'SUPER_ADMIN';
            const isOpLoading = loading === user.id;

            return (
              <div key={user.id} className="border border-stone-200 rounded-2xl bg-white shadow-sm p-4 flex flex-col gap-3 text-black">
                {/* Top: identity + actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border shrink-0 ${
                      isSuperAdmin
                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600'
                        : 'bg-stone-100 border-stone-200 text-stone-600'
                    }`}>
                      {isSuperAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-extrabold text-black text-sm truncate">{user.name}</span>
                      <span className="text-[10px] text-stone-500 font-mono font-medium truncate">{user.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {business && (
                      <a
                        href={`/menu/${business.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-stone-50 border border-stone-200 text-stone-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-colors"
                        title="QR Menüyü Canlı Gör"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => { setPwUser(user); setNewPassword(''); setShowPw(false); }}
                      className="p-2 rounded-lg bg-stone-50 border border-stone-200 text-stone-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-colors"
                      title="Şifre Değiştir"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      disabled={isOpLoading}
                      onClick={() => handleDelete(user.id, user.name)}
                      className="p-2 rounded-lg bg-stone-50 border border-stone-200 text-stone-600 hover:text-red-650 hover:bg-red-50 hover:border-red-100 transition-colors disabled:opacity-50"
                      title="Kullanıcıyı Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-xs border-t border-stone-100 pt-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-stone-400 font-black uppercase tracking-wider">Rol</span>
                    <button
                      disabled={isOpLoading}
                      onClick={() => handleRoleChange(user.id, user.role)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black transition-all active:scale-95 disabled:opacity-50 w-fit ${
                        isSuperAdmin
                          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600'
                          : 'bg-stone-50 border-stone-200 text-stone-600'
                      }`}
                      title="Rolü değiştirmek için tıklayın"
                    >
                      {isSuperAdmin ? 'Süper Admin' : 'İşletme Sahibi'}
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-stone-400 font-black uppercase tracking-wider">Abonelik</span>
                    {business ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase border tracking-wider w-fit ${
                        plan === 'premium' ? 'bg-indigo-50 border-indigo-150 text-indigo-600' :
                        plan === 'pro' ? 'bg-purple-50 border-purple-150 text-purple-600' :
                        'bg-stone-50 border-stone-250 text-stone-600'
                      }`}>
                        {plan || 'starter'}
                      </span>
                    ) : (
                      <span className="text-stone-400 font-mono font-semibold">-</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 col-span-2">
                    <span className="text-[9px] text-stone-400 font-black uppercase tracking-wider">İşletme</span>
                    {business ? (
                      <div className="flex flex-col">
                        <span className="text-black font-bold">{business.name}</span>
                        <span className="text-[10px] text-stone-400 font-mono font-medium">/menu/{business.slug}</span>
                      </div>
                    ) : (
                      <span className="text-stone-400 italic">İşletme Kurulmamış</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 col-span-2">
                    <span className="text-[9px] text-stone-400 font-black uppercase tracking-wider">Kayıt Tarihi</span>
                    <span className="text-stone-500 font-medium">
                      {new Date(user.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-stone-400 italic border border-stone-200 rounded-2xl bg-white">
            Kullanıcı bulunamadı.
          </div>
        )}
      </div>

      {/* Password change modal */}
      {pwUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-stone-200 rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-stone-150 pb-3 mb-5">
              <h4 className="text-sm font-black text-black flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                Şifre Değiştir
              </h4>
              <button onClick={() => setPwUser(null)} className="text-stone-500 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500 font-medium mb-4">
              <strong className="text-black font-extrabold">{pwUser.name}</strong> ({pwUser.email}) için yeni bir şifre belirleyin. Eski şifre geri getirilemez.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-black">Yeni Şifre</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:border-indigo-500 focus:bg-white text-sm outline-none text-black font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleChangePassword}
              disabled={pwLoading}
              className="w-full mt-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 shadow-md"
            >
              <Save className="w-4 h-4" />
              {pwLoading ? 'Kaydediliyor...' : 'Yeni Şifreyi Kaydet'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
