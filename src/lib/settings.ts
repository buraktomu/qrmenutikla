import { prisma } from '@/lib/prisma';

export type PlatformSettings = {
  aiEnabled: boolean;
  orderingEnabled: boolean;
};

// Safe defaults used before the row exists or if the table is missing
// (e.g. before the migration has been applied).
const DEFAULTS: PlatformSettings = {
  aiEnabled: true,
  orderingEnabled: true,
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
    };
  } catch {
    return DEFAULTS;
  }
}
