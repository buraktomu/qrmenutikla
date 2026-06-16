export function maskApiKey(key?: string | null): string {
  if (!key) return "";
  const prefix = key.startsWith("sk-") ? "sk-" : key.slice(0, 3);
  const suffix = key.slice(-4);
  return `${prefix}****${suffix}`;
}
