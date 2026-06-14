'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { deleteUser, updateUserRole } from '@/app/actions/admin';
import { 
  Search, 
  Trash2, 
  Shield, 
  User, 
  ExternalLink,
  ChevronDown
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

      {/* Users Table */}
      <div className="overflow-x-auto border border-stone-200 rounded-2xl bg-white shadow-sm">
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
                            className="p-1.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-600 hover:text-indigo-650 hover:bg-indigo-50 hover:border-indigo-100 transition-colors"
                            title="QR Menüyü Canlı Gör"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
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

    </div>
  );
}
