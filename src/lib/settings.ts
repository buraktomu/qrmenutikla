import { prisma } from '@/lib/prisma';

export type PlatformSettings = {
  aiEnabled: boolean;
  orderingEnabled: boolean;
  openaiApiKey: string | null;
  aiModel: string;
  maxTokens: number;
  temperature: number;
};

// Safe defaults used before the row exists or if the table is missing
const DEFAULTS: PlatformSettings = {
  aiEnabled: true,
  orderingEnabled: true,
  openaiApiKey: null,
  aiModel: 'gpt-4o-mini',
  maxTokens: 500,
  temperature: 0.7,
};

/**
 * Reads the platform-wide feature flags controlled by the Super Admin.
 * Never throws — falls back to enabled defaults so the public menu and
 * dashboard keep working even if the settings row/table is not present yet.
 */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const row = await prisma.platformSetting.findUnique({
      where: { id: 'global' },
    });
    if (!row) return DEFAULTS;
    return {
      aiEnabled: row.aiEnabled,
      orderingEnabled: row.orderingEnabled,
      openaiApiKey: row.openaiApiKey,
      aiModel: row.aiModel,
      maxTokens: row.maxTokens,
      temperature: row.temperature,
    };
  } catch {
    return DEFAULTS;
  }
}
