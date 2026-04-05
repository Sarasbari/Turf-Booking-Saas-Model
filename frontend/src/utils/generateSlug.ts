/**
 * Generate a URL-safe slug from turf name and city.
 *
 * @example
 *   generateSlug('Sportz Nation', 'Mira Road')
 *   // → 'sportz-nation-mira-road'
 */
export function generateSlug(name: string, city: string): string {
  const raw = `${name} ${city}`;
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // remove special chars
    .replace(/\s+/g, '-')            // spaces → hyphens
    .replace(/-+/g, '-')             // collapse multiple hyphens
    .replace(/^-|-$/g, '');           // trim leading/trailing hyphens
}
