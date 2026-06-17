'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { encrypt, decrypt } from '@/lib/encryption';
import { z } from 'zod';
import { maskApiKey } from '@/lib/maskApiKey';

// Zod schemas for validation
const platformAiSettingsSchema = z.object({
  aiEnabled: z.boolean(),
  openaiApiKey: z.string().nullable().optional(),
  geminiApiKey: z.string().nullable().optional(),
  anthropicApiKey: z.string().nullable().optional(),
  aiProvider: z.string().default('openai'),
  aiModel: z.string().min(1, 'Model seçimi zorunludur.'),
  maxTokens: z.number().int().min(1, 'Max tokens 1 veya daha büyük olmalıdır.'),
  temperature: z.number().min(0).max(2, 'Temperature 0 ile 2 arasında olmalıdır.'),
});

const businessAiSettingsSchema = z.object({
  useOwnApiKey: z.boolean(),
  customOpenAiKey: z.string().nullable().optional(),
  customGeminiKey: z.string().nullable().optional(),
  customAnthropicKey: z.string().nullable().optional(),
  customAiProvider: z.string().default('openai'),
});

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
 * Retrieves the platform AI settings. Returns settings with masked API keys.
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
      geminiApiKey: '',
      anthropicApiKey: '',
      aiProvider: 'openai',
      aiModel: 'gpt-4o-mini',
      maxTokens: 500,
      temperature: 0.7,
    };
  }

  // Decrypt and mask all keys
  const decryptedOpenai = row.openaiApiKey ? decrypt(row.openaiApiKey) : '';
  const decryptedGemini = row.geminiApiKey ? decrypt(row.geminiApiKey) : '';
  const decryptedAnthropic = row.anthropicApiKey ? decrypt(row.anthropicApiKey) : '';

  return {
    aiEnabled: row.aiEnabled,
    openaiApiKey: decryptedOpenai ? maskApiKey(decryptedOpenai) : '',
    geminiApiKey: decryptedGemini ? maskApiKey(decryptedGemini) : '',
    anthropicApiKey: decryptedAnthropic ? maskApiKey(decryptedAnthropic) : '',
    aiProvider: row.aiProvider || 'openai',
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

  const {
    aiEnabled,
    openaiApiKey,
    geminiApiKey,
    anthropicApiKey,
    aiProvider,
    aiModel,
    maxTokens,
    temperature
  } = validation.data;

  try {
    const existing = await prisma.platformSetting.findUnique({
      where: { id: 'global' },
    });

    // OpenAI Key resolution
    let finalOpenaiKey = existing?.openaiApiKey || null;
    if (openaiApiKey === '') {
      finalOpenaiKey = null;
    } else if (openaiApiKey && !openaiApiKey.includes('****')) {
      finalOpenaiKey = encrypt(openaiApiKey);
    }

    // Gemini Key resolution
    let finalGeminiKey = existing?.geminiApiKey || null;
    if (geminiApiKey === '') {
      finalGeminiKey = null;
    } else if (geminiApiKey && !geminiApiKey.includes('****')) {
      finalGeminiKey = encrypt(geminiApiKey);
    }

    // Anthropic Key resolution
    let finalAnthropicKey = existing?.anthropicApiKey || null;
    if (anthropicApiKey === '') {
      finalAnthropicKey = null;
    } else if (anthropicApiKey && !anthropicApiKey.includes('****')) {
      finalAnthropicKey = encrypt(anthropicApiKey);
    }

    await prisma.platformSetting.upsert({
      where: { id: 'global' },
      update: {
        aiEnabled,
        openaiApiKey: finalOpenaiKey,
        geminiApiKey: finalGeminiKey,
        anthropicApiKey: finalAnthropicKey,
        aiProvider,
        aiModel,
        maxTokens,
        temperature,
      },
      create: {
        id: 'global',
        aiEnabled,
        openaiApiKey: finalOpenaiKey,
        geminiApiKey: finalGeminiKey,
        anthropicApiKey: finalAnthropicKey,
        aiProvider,
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

  const decOpenai = business.customOpenAiKey ? decrypt(business.customOpenAiKey) : '';
  const decGemini = business.customGeminiKey ? decrypt(business.customGeminiKey) : '';
  const decAnthropic = business.customAnthropicKey ? decrypt(business.customAnthropicKey) : '';

  return {
    useOwnApiKey: business.useOwnApiKey,
    customOpenAiKey: decOpenai ? maskApiKey(decOpenai) : '',
    customGeminiKey: decGemini ? maskApiKey(decGemini) : '',
    customAnthropicKey: decAnthropic ? maskApiKey(decAnthropic) : '',
    customAiProvider: business.customAiProvider || 'openai',
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

  const {
    useOwnApiKey,
    customOpenAiKey,
    customGeminiKey,
    customAnthropicKey,
    customAiProvider
  } = validation.data;

  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) return { success: false, error: 'İşletme bulunamadı.' };

    // OpenAI key encryption
    let finalOpenai = business.customOpenAiKey || null;
    if (customOpenAiKey === '') {
      finalOpenai = null;
    } else if (customOpenAiKey && !customOpenAiKey.includes('****')) {
      finalOpenai = encrypt(customOpenAiKey);
    }

    // Gemini key encryption
    let finalGemini = business.customGeminiKey || null;
    if (customGeminiKey === '') {
      finalGemini = null;
    } else if (customGeminiKey && !customGeminiKey.includes('****')) {
      finalGemini = encrypt(customGeminiKey);
    }

    // Anthropic key encryption
    let finalAnthropic = business.customAnthropicKey || null;
    if (customAnthropicKey === '') {
      finalAnthropic = null;
    } else if (customAnthropicKey && !customAnthropicKey.includes('****')) {
      finalAnthropic = encrypt(customAnthropicKey);
    }

    await prisma.business.update({
      where: { id: businessId },
      data: {
        useOwnApiKey,
        customOpenAiKey: finalOpenai,
        customGeminiKey: finalGemini,
        customAnthropicKey: finalAnthropic,
        customAiProvider,
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
 * Universal connection test action supporting multiple providers.
 */
export async function testOpenAiConnectionAction(
  submittedKey: string,
  model: string,
  context: 'platform' | 'business',
  businessId?: string,
  provider: 'openai' | 'gemini' | 'anthropic' = 'openai'
) {
  let resolvedKey = submittedKey;

  // Resolve masked key if needed
  if (submittedKey.includes('****')) {
    if (context === 'platform') {
      const settings = await prisma.platformSetting.findUnique({
        where: { id: 'global' },
      });
      if (provider === 'openai' && settings?.openaiApiKey) {
        resolvedKey = decrypt(settings.openaiApiKey);
      } else if (provider === 'gemini' && settings?.geminiApiKey) {
        resolvedKey = decrypt(settings.geminiApiKey);
      } else if (provider === 'anthropic' && settings?.anthropicApiKey) {
        resolvedKey = decrypt(settings.anthropicApiKey);
      }
    } else if (context === 'business' && businessId) {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });
      if (provider === 'openai' && business?.customOpenAiKey) {
        resolvedKey = decrypt(business.customOpenAiKey);
      } else if (provider === 'gemini' && business?.customGeminiKey) {
        resolvedKey = decrypt(business.customGeminiKey);
      } else if (provider === 'anthropic' && business?.customAnthropicKey) {
        resolvedKey = decrypt(business.customAnthropicKey);
      }
    }
  }

  if (!resolvedKey) {
    return { success: false, error: 'API Anahtarı boş olamaz.' };
  }

  try {
    const { testAiConnection } = await import('@/lib/openai');
    const result = await testAiConnection(provider, resolvedKey, model);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: any) {
    console.error('Connection Test Error:', error);
    return {
      success: false,
      error: error.message || 'API bağlantısı başarısız oldu.',
    };
  }
}
