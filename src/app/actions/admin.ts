'use server';

import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { cleanToRelativePath } from '@/lib/imageUtils';

// Helper: Verify the user is a Super Admin
async function verifyAdminRole() {
  const session = await auth();
  if (!session?.user?.email) return false;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  return user?.role === 'SUPER_ADMIN';
}

/**
 * Updates the platform-wide feature flags (AI + ordering/waiter-call).
 * Affects ALL businesses at once. Super Admin only.
 */
export async function updatePlatformSettings(data: { aiEnabled: boolean; orderingEnabled: boolean }) {
  const isAdmin = await verifyAdminRole();
  if (!isAdmin) return { success: false, error: 'Yetkisiz erişim.' };

  try {
    await prisma.platformSetting.upsert({
      where: { id: 'global' },
      update: { aiEnabled: data.aiEnabled, orderingEnabled: data.orderingEnabled },
      create: { id: 'global', aiEnabled: data.aiEnabled, orderingEnabled: data.orderingEnabled },
    });

    // Refresh anything that depends on these flags
    revalidatePath('/admin/settings');
    revalidatePath('/dashboard/menu');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Ayarlar güncellenemedi.' };
  }
}

/**
 * Toggles a business status between ACTIVE and SUSPENDED.
 */
export async function toggleBusinessStatus(businessId: string, currentStatus: string) {
  const isAdmin = await verifyAdminRole();
  if (!isAdmin) return { success: false, error: 'Yetkisiz erişim.' };

  const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

  try {
    await prisma.business.update({
      where: { id: businessId },
      data: { status: newStatus },
    });
    
    revalidatePath('/admin');
    revalidatePath('/admin/users');
    revalidatePath('/admin/businesses');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'İşlem sırasında hata oluştu.' };
  }
}

/**
 * Updates a business subscription plan directly.
 */
export async function updateBusinessSubscription(businessId: string, newPlanId: string) {
  const isAdmin = await verifyAdminRole();
  if (!isAdmin) return { success: false, error: 'Yetkisiz erişim.' };

  try {
    await prisma.subscription.upsert({
      where: { businessId },
      update: {
        planId: newPlanId,
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 Year extended
      },
      create: {
        businessId,
        planId: newPlanId,
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/users');
    revalidatePath('/admin/businesses');
    revalidatePath('/admin/subscriptions');
    revalidatePath('/admin/approvals');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Abonelik güncellenemedi.' };
  }
}

/**
 * Marks a pending business subscription as ACTIVE (admin approval) with the
 * chosen plan. Reuses the same upsert behaviour as updateBusinessSubscription.
 */
export async function approveBusiness(businessId: string, planId: string) {
  const isAdmin = await verifyAdminRole();
  if (!isAdmin) return { success: false, error: 'Yetkisiz erişim.' };

  try {
    await prisma.subscription.upsert({
      where: { businessId },
      update: {
        planId,
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      create: {
        businessId,
        planId,
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/approvals');
    revalidatePath('/admin/businesses');
    revalidatePath('/admin/subscriptions');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Onaylama sırasında hata oluştu.' };
  }
}

/**
 * Deletes a stock image from the common gallery.
 */
export async function deleteGalleryImage(imageId: string) {
  const isAdmin = await verifyAdminRole();
  if (!isAdmin) return { success: false, error: 'Yetkisiz erişim.' };

  try {
    await prisma.commonGalleryImage.delete({
      where: { id: imageId },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/gallery');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Görsel silinemedi.' };
  }
}

/**
 * Adds an image to the common gallery.
 */
export async function addGalleryImage(categoryKey: string, title: string, imageUrl: string) {
  const isAdmin = await verifyAdminRole();
  if (!isAdmin) return { success: false, error: 'Yetkisiz erişim.' };

  if (!categoryKey || !title || !imageUrl) {
    return { success: false, error: 'Lütfen tüm alanları doldurun.' };
  }

  try {
    await prisma.commonGalleryImage.create({
      data: {
        categoryKey,
        title,
        imageUrl: cleanToRelativePath(imageUrl) || '',
      },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/gallery');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Görsel eklenemedi.' };
  }
}

/**
 * Deletes a user by ID (cascades to delete business & menu).
 */
export async function deleteUser(userId: string) {
  const isAdmin = await verifyAdminRole();
  if (!isAdmin) return { success: false, error: 'Yetkisiz erişim.' };

  try {
    // Prevent admin from deleting themselves
    const session = await auth();
    const currentUser = await prisma.user.findUnique({
      where: { email: session?.user?.email || '' },
    });
    if (currentUser?.id === userId) {
      return { success: false, error: 'Kendi hesabınızı silemezsiniz.' };
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/users');
    revalidatePath('/admin/businesses');
    revalidatePath('/admin/subscriptions');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Kullanıcı silinemedi.' };
  }
}

/**
 * Resets/changes a user's password (Super Admin only).
 * Stores a new bcrypt hash — plaintext is never persisted or retrievable.
 */
export async function updateUserPassword(userId: string, newPassword: string) {
  const isAdmin = await verifyAdminRole();
  if (!isAdmin) return { success: false, error: 'Yetkisiz erişim.' };

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Şifre en az 6 karakter olmalıdır.' };
  }

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Şifre güncellenemedi.' };
  }
}

/**
 * Updates a user's role.
 */
export async function updateUserRole(userId: string, newRole: string) {
  const isAdmin = await verifyAdminRole();
  if (!isAdmin) return { success: false, error: 'Yetkisiz erişim.' };

  try {
    // Prevent admin from changing their own role
    const session = await auth();
    const currentUser = await prisma.user.findUnique({
      where: { email: session?.user?.email || '' },
    });
    if (currentUser?.id === userId) {
      return { success: false, error: 'Kendi rolünüzü değiştiremezsiniz.' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/users');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Kullanıcı rolü güncellenemedi.' };
  }
}

