'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { encrypt } from '@/lib/encryption';

const businessUpdateSchema = z.object({
  name: z.string().min(2, 'İşletme adı en az 2 karakter olmalıdır.'),
  phone: z.string().optional(),
  address: z.string().optional(),
  whatsappNumber: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return '';
      const cleaned = val.replace(/\D/g, '');
      if (cleaned.length === 10 && cleaned.startsWith('5')) {
        return '90' + cleaned;
      }
      return cleaned;
    }),
  showCalories: z.boolean().default(false),
  allowOrders: z.boolean().default(true),
  logoUrl: z.string().optional(),
  coverVideoUrl: z.string().optional(),
  coverImageUrl: z.string().optional(),
  coverOpacity: z.number().min(0).max(1).default(0.50),
  themeId: z.string().min(2, 'Lütfen geçerli bir tema seçin.'),
  description: z.string().optional(),
  openingHours: z.string().optional(),
  serviceType: z.enum(['MASA_SERVISI', 'SELF_SERVIS', 'HER_IKISI']).default('MASA_SERVISI'),
  instagramUrl: z.string().optional(),
  locationUrl: z.string().optional(),
  reviewsUrl: z.string().optional(),
  useOwnApiKey: z.boolean().default(false),
  customOpenAiKey: z.string().nullable().optional(),
});

export async function updateBusinessSettings(
  businessId: string,
  formData: {
    name: string;
    phone: string;
    address: string;
    whatsappNumber: string;
    showCalories: boolean;
    allowOrders: boolean;
    logoUrl?: string;
    coverVideoUrl?: string;
    coverImageUrl?: string;
    coverOpacity?: number;
    themeId: string;
    description?: string;
    openingHours?: string;
    serviceType?: 'MASA_SERVISI' | 'SELF_SERVIS' | 'HER_IKISI';
    instagramUrl?: string;
    locationUrl?: string;
    reviewsUrl?: string;
    useOwnApiKey?: boolean;
    customOpenAiKey?: string | null;
  }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'Oturum açmanız gerekiyor.' };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { businesses: true },
  });

  const business = user?.businesses.find((b) => b.id === businessId);
  if (!business && user?.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Yetkisiz erişim. Bu işletmeyi düzenleyemezsiniz.' };
  }

  const validation = businessUpdateSchema.safeParse(formData);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const {
    name,
    phone,
    address,
    whatsappNumber,
    showCalories,
    allowOrders,
    logoUrl,
    coverVideoUrl,
    coverImageUrl,
    coverOpacity,
    themeId,
    description,
    openingHours,
    serviceType,
    instagramUrl,
    locationUrl,
    reviewsUrl,
    useOwnApiKey,
    customOpenAiKey,
  } = validation.data;

  try {
    let finalApiKeyEncrypted = business?.customOpenAiKey || null;

    if (customOpenAiKey === '') {
      finalApiKeyEncrypted = null;
    } else if (customOpenAiKey && !customOpenAiKey.includes('****')) {
      finalApiKeyEncrypted = encrypt(customOpenAiKey);
    }

    await prisma.business.update({
      where: { id: businessId },
      data: {
        name,
        phone,
        address,
        whatsappNumber,
        showCalories,
        allowOrders,
        logoUrl,
        coverVideoUrl,
        coverImageUrl,
        coverOpacity,
        themeId,
        description,
        openingHours: openingHours || null,
        serviceType: serviceType || 'MASA_SERVISI',
        instagramUrl: instagramUrl || null,
        locationUrl: locationUrl || null,
        reviewsUrl: reviewsUrl || null,
        useOwnApiKey,
        customOpenAiKey: finalApiKeyEncrypted,
      },
    });

    revalidatePath('/dashboard/profile');
    revalidatePath(`/menu/${business?.slug || ''}`);
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Update business settings error:', error);
    return { success: false, error: 'İşletme ayarları güncellenirken bir hata oluştu.' };
  }
}
