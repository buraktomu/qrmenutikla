/**
 * Sanitizes image URLs to ensure locally uploaded files are saved as relative paths
 * starting with /uploads/ instead of absolute URLs.
 */
export function cleanToRelativePath(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/\/uploads\/[^\s?#]+/);
  if (match) {
    return match[0];
  }
  return url;
}
