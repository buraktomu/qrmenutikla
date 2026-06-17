'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

const branchSchema = z.object({
  name: z.string().min(2, 'Şube adı en az 2 karakter olmalıdır.'),
  slug: z.string().min(2, 'QR slug en az 2 karakter olmalıdır.').regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, sayı ve tire (-) içerebilir.'),
  menuId: z.string().min(1, 'Menü seçimi zorunludur.'),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  googleReviewUrl: z.string().optional().nullable(),
  instagramUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

async function verifyBusinessOwnership(businessId: string) {
  const session = await auth();
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { businesses: true },
  });

  if (user?.role === 'SUPER_ADMIN') return user;

  const hasBusiness = user?.businesses.some((b) => b.id === businessId);
  return hasBusiness ? user : null;
}

export async function createBranchAction(businessId: string, data: any) {
  const owner = await verifyBusinessOwnership(businessId);
  if (!owner) return { success: false, error: 'Yetkisiz erişim.' };

  const validation = branchSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  try {
    // Check if slug is unique (both branch and business slugs)
    const existingBranch = await prisma.branch.findUnique({
      where: { slug: data.slug }
    });
    const existingBusiness = await prisma.business.findUnique({
      where: { slug: data.slug }
    });

    if (existingBranch || existingBusiness) {
      return { success: false, error: 'Bu QR slug adresi zaten kullanımda.' };
    }

    await prisma.branch.create({
      data: {
        businessId,
        menuId: data.menuId,
        name: data.name,
        slug: data.slug,
        address: data.address || null,
        phone: data.phone || null,
        googleReviewUrl: data.googleReviewUrl || null,
        instagramUrl: data.instagramUrl || null,
        isActive: data.isActive ?? true,
      }
    });

    revalidatePath('/dashboard/branches');
    return { success: true };
  } catch (error: any) {
    console.error('createBranchAction error:', error);
    return { success: false, error: error.message || 'Şube oluşturulurken bir hata oluştu.' };
  }
}

export async function updateBranchAction(businessId: string, branchId: string, data: any) {
  const owner = await verifyBusinessOwnership(businessId);
  if (!owner) return { success: false, error: 'Yetkisiz erişim.' };

  const validation = branchSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  try {
    // Check if slug is unique
    const existingBranch = await prisma.branch.findFirst({
      where: { slug: data.slug, NOT: { id: branchId } }
    });
    const existingBusiness = await prisma.business.findUnique({
      where: { slug: data.slug }
    });

    if (existingBranch || existingBusiness) {
      return { success: false, error: 'Bu QR slug adresi zaten kullanımda.' };
    }

    await prisma.branch.update({
      where: { id: branchId, businessId },
      data: {
        menuId: data.menuId,
        name: data.name,
        slug: data.slug,
        address: data.address || null,
        phone: data.phone || null,
        googleReviewUrl: data.googleReviewUrl || null,
        instagramUrl: data.instagramUrl || null,
        isActive: data.isActive ?? true,
      }
    });

    revalidatePath('/dashboard/branches');
    return { success: true };
  } catch (error: any) {
    console.error('updateBranchAction error:', error);
    return { success: false, error: error.message || 'Şube güncellenirken bir hata oluştu.' };
  }
}

export async function toggleBranchActiveAction(businessId: string, branchId: string, isActive: boolean) {
  const owner = await verifyBusinessOwnership(businessId);
  if (!owner) return { success: false, error: 'Yetkisiz erişim.' };

  try {
    await prisma.branch.update({
      where: { id: branchId, businessId },
      data: { isActive }
    });

    revalidatePath('/dashboard/branches');
    return { success: true };
  } catch (error: any) {
    console.error('toggleBranchActiveAction error:', error);
    return { success: false, error: 'İşlem sırasında hata oluştu.' };
  }
}

export async function createMenuAction(businessId: string, name: string) {
  const owner = await verifyBusinessOwnership(businessId);
  if (!owner) return { success: false, error: 'Yetkisiz erişim.' };

  if (!name.trim()) return { success: false, error: 'Menü adı en az 2 karakter olmalıdır.' };

  try {
    const newMenu = await prisma.menu.create({
      data: {
        businessId,
        name: name.trim()
      }
    });

    revalidatePath('/dashboard/branches');
    revalidatePath('/dashboard/menu');
    return { success: true, menu: newMenu };
  } catch (error: any) {
    console.error('createMenuAction error:', error);
    return { success: false, error: error.message || 'Menü oluşturulurken bir hata oluştu.' };
  }
}
