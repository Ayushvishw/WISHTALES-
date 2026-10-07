import type { TemplateConfig } from "./templates/schema";

export type PhotoTier = { photos: number; addMinor: number };

/** Story templates: the template price includes 2 photos; every 2 more add a little. */
export const DEFAULT_PHOTO_TIERS: PhotoTier[] = [
  { photos: 2, addMinor: 0 },
  { photos: 4, addMinor: 5000 },
  { photos: 6, addMinor: 10000 },
  { photos: 8, addMinor: 15000 },
];

/** The template's photo tiers. Templates without tiers have one flat price for any number of photos. */
export function photoTiers(t: Pick<TemplateConfig, "photos" | "photoTiers">): PhotoTier[] {
  return t.photoTiers?.length ? t.photoTiers : [{ photos: t.photos.max, addMinor: 0 }];
}

/** The smallest tier that fits this many photos. */
export function tierFor(t: Pick<TemplateConfig, "photos" | "photoTiers">, count: number): PhotoTier {
  const tiers = photoTiers(t);
  return tiers.find((x) => x.photos >= count) ?? tiers[tiers.length - 1];
}

/** What the customer pays for this template with this many photos. */
export function priceFor(t: Pick<TemplateConfig, "priceMinor" | "photos" | "photoTiers">, count: number): number {
  return t.priceMinor + tierFor(t, count).addMinor;
}

/** The highest price, with the most photos. */
export function maxPrice(t: Pick<TemplateConfig, "priceMinor" | "photos" | "photoTiers">): number {
  const tiers = photoTiers(t);
  return t.priceMinor + tiers[tiers.length - 1].addMinor;
}

/** The memory game needs at least this many photos, so it only appears from the 4-photo tier up. */
export const MEMORY_MIN_PHOTOS = 3;
