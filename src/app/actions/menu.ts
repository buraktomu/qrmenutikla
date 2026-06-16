'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import {
  generateProductDescription,
  predictCaloriesAndMacros,
  suggestProductCategory,
  generateCampaignText
} from '@/lib/openai';
import { getPlatformSettings } from '@/lib/settings';

const AI_DISABLED_MSG = 'Yapay zeka özelliği yönetici tarafından geçici olarak kapatılmıştır.';

// -------------------------------------------------------------
// SCHEMAS
// -------------------------------------------------------------
const categorySchema = z.object({
  name: z.string().min(2, 'Kategori adı en az 2 karakter olmalıdır.'),
  categoryImageUrl: z.string().optional().nullable(),
});

const productSchema = z.object({
  name: z.string().min(2, 'Ürün adı en az 2 karakter olmalıdır.'),
  price: z.number().min(0, 'Fiyat 0 veya daha yüksek olmalıdır.'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isCommonImage: z.boolean().default(false),
  commonImageKey: z.string().optional(),
  calories: z.number().nullable().optional(),
  protein: z.number().nullable().optional(),
  carbs: z.number().nullable().optional(),
  fat: z.number().nullable().optional(),
  isActive: z.boolean().default(true),
});

// Helper: Ensure user owns the business containing the resource
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

// Helper: Check active subscription limit
async function verifySubscriptionLimits(businessId: string, type: 'categories' | 'products') {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { 
      subscription: { include: { plan: true } },
      categories: { include: { products: true } },
    },
  });

  if (!business) return false;

  const plan = business.subscription?.plan;
  if (!plan) return false; // No plan details

  if (type === 'categories') {
    return business.categories.length < plan.maxCategories;
  } else {
    let count = 0;
    business.categories.forEach(c => count += c.products.length);
    return count < plan.maxProducts;
  }
}

// -------------------------------------------------------------
// CATEGORY ACTIONS
// -------------------------------------------------------------
export async function createCategory(businessId: string, name: string) {
  const owner = await verifyBusinessOwnership(businessId);
  if (!owner) return { success: false, error: 'Yetkisiz erişim.' };

  const isWithinLimit = await verifySubscriptionLimits(businessId, 'categories');
  if (!isWithinLimit) {
    return { success: false, error: 'Bu özellik için Pro pakete geçmelisiniz.' };
  }

  const validation = categorySchema.safeParse({ name });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  try {
    // Determine sort order
    const count = await prisma.category.count({ where: { businessId } });

    await prisma.category.create({
      data: {
        businessId,
        name,
        sortOrder: count,
      },
    });

    revalidatePath('/dashboard/menu');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Kategori oluşturulurken hata oluştu.' };
  }
}

export async function updateCategory(businessId: string, categoryId: string, name: string, categoryImageUrl?: string | null) {
  const owner = await verifyBusinessOwnership(businessId);
  if (!owner) return { success: false, error: 'Yetkisiz erişim.' };

  const validation = categorySchema.safeParse({ name, categoryImageUrl });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  try {
    await prisma.category.update({
      where: { id: categoryId, businessId },
      data: { name, categoryImageUrl: categoryImageUrl ?? null },
    });

    revalidatePath('/dashboard/menu');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Kategori güncellenemedi.' };
  }
}

export async function deleteCategory(businessId: string, categoryId: string) {
  const owner = await verifyBusinessOwnership(businessId);
  if (!owner) return { success: false, error: 'Yetkisiz erişim.' };

  try {
    await prisma.category.delete({
      where: { id: categoryId, businessId },
    });

    revalidatePath('/dashboard/menu');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Kategori silinirken hata oluştu.' };
  }
}

export async function reorderCategories(businessId: string, categoryIds: string[]) {
  const owner = await verifyBusinessOwnership(businessId);
  if (!owner) return { success: false, error: 'Yetkisiz erişim.' };

  try {
    await prisma.$transaction(
      categoryIds.map((id, index) =>
        prisma.category.update({
          where: { id, businessId },
          data: { sortOrder: index },
        })
      )
    );

    revalidatePath('/dashboard/menu');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Sıralama güncellenemedi.' };
  }
}

// -------------------------------------------------------------
// PRODUCT ACTIONS
// -------------------------------------------------------------
export async function createProduct(businessId: string, categoryId: string, data: any) {
  const owner = await verifyBusinessOwnership(businessId);
  if (!owner) return { success: false, error: 'Yetkisiz erişim.' };

  const isWithinLimit = await verifySubscriptionLimits(businessId, 'products');
  if (!isWithinLimit) {
    return { success: false, error: 'Bu özellik için Pro pakete geçmelisiniz.' };
  }

  // Ensure category belongs to this business
  const category = await prisma.category.findFirst({
    where: { id: categoryId, businessId },
  });
  if (!category) return { success: false, error: 'Kategori bulunamadı.' };

  const validation = productSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  try {
    const count = await prisma.product.count({ where: { categoryId } });
    
    await prisma.product.create({
      data: {
        categoryId,
        name: data.name,
        price: data.price,
        description: data.description,
        imageUrl: data.imageUrl,
        isCommonImage: data.isCommonImage,
        commonImageKey: data.commonImageKey,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        isActive: data.isActive,
        sortOrder: count,
      },
    });

    revalidatePath('/dashboard/menu');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Ürün oluşturulurken hata oluştu.' };
  }
}

export async function updateProduct(businessId: string, categoryId: string, productId: string, data: any) {
  const owner = await verifyBusinessOwnership(businessId);
  if (!owner) return { success: false, error: 'Yetkisiz erişim.' };

  // Ensure category and product belong to this business
  const category = await prisma.category.findFirst({
    where: { id: categoryId, businessId },
  });
  if (!category) return { success: false, error: 'Yetkisiz kategori.' };

  const validation = productSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  try {
    await prisma.product.update({
      where: { id: productId, categoryId },
      data: {
        name: data.name,
        price: data.price,
        description: data.description,
        imageUrl: data.imageUrl,
        isCommonImage: data.isCommonImage,
        commonImageKey: data.commonImageKey,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        isActive: data.isActive,
      },
    });

    revalidatePath('/dashboard/menu');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Ürün güncellenirken hata oluştu.' };
  }
}

export async function deleteProduct(businessId: string, categoryId: string, productId: string) {
  const owner = await verifyBusinessOwnership(businessId);
  if (!owner) return { success: false, error: 'Yetkisiz erişim.' };

  // Ensure category belongs to this business
  const category = await prisma.category.findFirst({
    where: { id: categoryId, businessId },
  });
  if (!category) return { success: false, error: 'Yetkisiz kategori.' };

  try {
    await prisma.product.delete({
      where: { id: productId, categoryId },
    });

    revalidatePath('/dashboard/menu');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Ürün silinirken hata oldu.' };
  }
}

// -------------------------------------------------------------
// AI ACTIONS
// -------------------------------------------------------------
async function getSessionBusinessId(): Promise<string | undefined> {
  const session = await auth();
  if (!session?.user?.email) return undefined;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { businesses: true },
  });
  return user?.businesses[0]?.id;
}

export async function getAIDescription(productName: string, categoryName: string) {
  const settings = await getPlatformSettings();
  if (!settings.aiEnabled) return { success: false, error: AI_DISABLED_MSG };
  const businessId = await getSessionBusinessId();
  try {
    const desc = await generateProductDescription(productName, categoryName, businessId);
    return { success: true, result: desc };
  } catch (error) {
    return { success: false, error: 'Yapay zeka açıklaması üretilemedi.' };
  }
}

export async function getAIMacros(productName: string, description: string) {
  const settings = await getPlatformSettings();
  if (!settings.aiEnabled) return { success: false, error: AI_DISABLED_MSG };
  const businessId = await getSessionBusinessId();
  try {
    const macros = await predictCaloriesAndMacros(productName, description, businessId);
    return { success: true, result: macros };
  } catch (error) {
    return { success: false, error: 'Makro değerleri hesaplanamadı.' };
  }
}

export async function getAICategory(productName: string) {
  const settings = await getPlatformSettings();
  if (!settings.aiEnabled) return { success: false, error: AI_DISABLED_MSG };
  const businessId = await getSessionBusinessId();
  try {
    const cat = await suggestProductCategory(productName, businessId);
    return { success: true, result: cat };
  } catch (error) {
    return { success: false, error: 'Kategori önerisi alınamadı.' };
  }
}

export async function getAICampaign(productName: string, discount: number) {
  const settings = await getPlatformSettings();
  if (!settings.aiEnabled) return { success: false, error: AI_DISABLED_MSG };
  const businessId = await getSessionBusinessId();
  try {
    const campaign = await generateCampaignText(productName, discount, businessId);
    return { success: true, result: campaign };
  } catch (error) {
    return { success: false, error: 'Kampanya metni oluşturulamadı.' };
  }
}
