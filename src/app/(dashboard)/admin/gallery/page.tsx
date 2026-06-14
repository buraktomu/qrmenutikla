import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import GalleryManager from './GalleryManager';

export default async function AdminGalleryPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Double check admin role
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (currentUser?.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  // Load common gallery images
  const galleryImages = await prisma.commonGalleryImage.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex flex-col gap-8 text-black">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-black tracking-tight">Ortak Görsel Galerisi</h1>
        <p className="text-sm text-stone-600 font-medium mt-1">İşletmelerin kategori görseli tanımlarken veya ürün eklerken kullanabileceği ortak sistem kütüphanesi.</p>
      </div>

      {/* Gallery Manager Component */}
      <GalleryManager initialImages={galleryImages} />

    </div>
  );
}
