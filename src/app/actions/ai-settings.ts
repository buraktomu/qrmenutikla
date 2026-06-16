'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { encrypt, decrypt } from '@/lib/encryption';
import { OpenAI } from 'openai';
import { z } from 'zod';

// Zod schemas for validation
const platformAiSettingsSchema = z.object({
  aiEnabled: z.boolean(),
  openaiApiKey: z.string().nullable().optional(),
  aiModel: z.string().min(1, 'Model seçimi zorunludur.'),
  maxTokens: z.number().int().min(1, 'Max tokens 1 veya daha büyük olmalıdır.'),
  temperature: z.number().min(0).max(2, 'Temperature 0 ile 2 arasında olmalıdır.'),
});

const businessAiSettingsSchema = z.object({
  useOwnApiKey: z.boolean(),
  customOpenAiKey: z.string().nullable().optional(),
});

// Helper: Mask API Key
export function maskApiKey(key: string | null | undefined): string {
  if (!key) return '';
  const prefix = key.startsWith('sk-') ? 'sk-' : key.slice(0, 3);
  const suffix = key.slice(-4);
  return `${prefix}****${suffix}`;
}

// Helper: Verify the user is a Super Admin
async function verifyAdminRole() {
  const session = await auth();
  if (!session?.user?.email) return false;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  return user?.role === 'SUPER_ADMIN';
}

// Helper: Verify the user owns the business
async function verifyBusinessOwnership(businessId: string) {
  const session = await auth();
  if (!session?.user?.email) return false;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { businesses: true },
  });

  if (user?.role === 'SUPER_ADMIN') return true;

  return user?.businesses.some((b) => b.id === businessId) || false;
}

/**
 * Retrieves the platform AI settings. Returns settings with a masked API key.
 */
export async function getPlatformAiSettings() {
  const isAdmin = await verifyAdminRole();
  if (!isAdmin) throw new Error('Yetkisiz erişim.');

  const row = await prisma.platformSetting.findUnique({
    where: { id: 'global' },
  });

  if (!row) {
    return {
      aiEnabled: true,
      openaiApiKey: '',
      aiModel: 'gpt-4o-mini',
      maxTokens: 500,
      temperature: 0.7,
    };
  }

  // Decrypt and mask
  const decryptedKey = row.openaiApiKey ? decrypt(row.openaiApiKey) : '';
  const maskedKey = decryptedKey ? maskApiKey(decryptedKey) : '';

  return {
    aiEnabled: row.aiEnabled,
    openaiApiKey: maskedKey,
    aiModel: row.aiModel,
    maxTokens: row.maxTokens,
    temperature: row.temperature,
  };
}

/**
 * Updates the platform AI settings.
 */
export async function updatePlatformAiSettings(data: any) {
  const isAdmin = await verifyAdminRole();
  if (!isAdmin) return { success: false, error: 'Yetkisiz erişim.' };

  const validation = platformAiSettingsSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { aiEnabled, openaiApiKey, aiModel, maxTokens, temperature } = validation.data;

  try {
    // Check if the api key was actually changed
    const existing = await prisma.platformSetting.findUnique({
      where: { id: 'global' },
    });

    let finalApiKeyEncrypted = existing?.openaiApiKey || null;

    if (openaiApiKey === '') {
      finalApiKeyEncrypted = null;
    } else if (openaiApiKey && !openaiApiKey.includes('****')) {
      // It's a new plain text key, encrypt it
      finalApiKeyEncrypted = encrypt(openaiApiKey);
    }

    await prisma.platformSetting.upsert({
      where: { id: 'global' },
      update: {
        aiEnabled,
        openaiApiKey: finalApiKeyEncrypted,
        aiModel,
        maxTokens,
        temperature,
      },
      create: {
        id: 'global',
        aiEnabled,
        openaiApiKey: finalApiKeyEncrypted,
        aiModel,
        maxTokens,
        temperature,
      },
    });

    revalidatePath('/admin/settings');
    revalidatePath('/admin/settings/ai');
    revalidatePath('/dashboard/menu');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Ayarlar kaydedilirken hata oluştu.' };
  }
}

/**
 * Retrieves AI settings for a specific business.
 */
export async function getBusinessAiSettings(businessId: string) {
  const hasAccess = await verifyBusinessOwnership(businessId);
  if (!hasAccess) throw new Error('Yetkisiz erişim.');

  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });

  if (!business) throw new Error('İşletme bulunamadı.');

  const decryptedKey = business.customOpenAiKey ? decrypt(business.customOpenAiKey) : '';
  const maskedKey = decryptedKey ? maskApiKey(decryptedKey) : '';

  return {
    useOwnApiKey: business.useOwnApiKey,
    customOpenAiKey: maskedKey,
  };
}

/**
 * Updates AI settings for a specific business.
 */
export async function updateBusinessAiSettings(businessId: string, data: any) {
  const hasAccess = await verifyBusinessOwnership(businessId);
  if (!hasAccess) return { success: false, error: 'Yetkisiz erişim.' };

  const validation = businessAiSettingsSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { useOwnApiKey, customOpenAiKey } = validation.data;

  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) return { success: false, error: 'İşletme bulunamadı.' };

    let finalApiKeyEncrypted = business.customOpenAiKey || null;

    if (customOpenAiKey === '') {
      finalApiKeyEncrypted = null;
    } else if (customOpenAiKey && !customOpenAiKey.includes('****')) {
      finalApiKeyEncrypted = encrypt(customOpenAiKey);
    }

    await prisma.business.update({
      where: { id: businessId },
      data: {
        useOwnApiKey,
        customOpenAiKey: finalApiKeyEncrypted,
      },
    });

    revalidatePath('/dashboard/profile');
    return { success: true, error: null };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Ayarlar kaydedilirken hata oluştu.' };
  }
}

/**
 * Connection test for OpenAI API Key.
 */
export async function testOpenAiConnectionAction(
  submittedKey: string,
  model: string,
  context: 'platform' | 'business',
  businessId?: string
) {
  let resolvedKey = submittedKey;

  // Resolve masked key if needed
  if (submittedKey.includes('****')) {
    if (context === 'platform') {
      const settings = await prisma.platformSetting.findUnique({
        where: { id: 'global' },
      });
      if (settings?.openaiApiKey) {
        resolvedKey = decrypt(settings.openaiApiKey);
      }
    } else if (context === 'business' && businessId) {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });
      if (business?.customOpenAiKey) {
        resolvedKey = decrypt(business.customOpenAiKey);
      }
    }
  }

  if (!resolvedKey) {
    return { success: false, error: 'API Anahtarı boş olamaz.' };
  }

  try {
    const client = new OpenAI({ apiKey: resolvedKey });
    await client.chat.completions.create({
      model: model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Ping' }],
      max_tokens: 5,
    });
    return { success: true };
  } catch (error: any) {
    console.error('OpenAI Connection Test Error:', error);
    return {
      success: false,
      error: error.message || 'API bağlantısı başarısız oldu.',
    };
  }
}
