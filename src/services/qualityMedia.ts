// Three-Tier Quality System for Previews (Videos + Posters)
// Level A (Center, focus >= 0.65): Tier 1.0 (Maximum sharpness)
// Level B (Near periphery, 0.25 <= focus < 0.65): Tier 0.75 (Balanced)
// Level C (Far periphery in Active Zone, focus < 0.25): Tier 0.5 (Low decoder overhead)

import { isLowEndDevice } from './videoPool';

export type QualityTier = 1.0 | 0.75 | 0.5;

/**
 * Determine the quality tier based on continuous kinetic focus value
 */
export function getQualityTier(focus: number, isLowEnd: boolean = isLowEndDevice): QualityTier {
  if (isLowEnd) {
    if (focus >= 0.75) return 0.75;
    return 0.5;
  }

  if (focus >= 0.65) return 1.0;
  if (focus >= 0.25) return 0.75;
  return 0.5;
}

/**
 * Resolve video preview URL according to quality tier
 * e.g. /videos/preview/barber.mp4 -> /videos/preview/barber-1.0.mp4, barber-0.75.mp4, barber-0.5.mp4
 */
export function resolveQualityVideoUrl(baseSrc: string, tier: QualityTier): string {
  if (!baseSrc) return '';

  // Handle local preview video formats
  if (baseSrc.includes('/videos/preview/')) {
    // Check if already suffixed
    const cleanBase = baseSrc.replace(/-(1\.0|0\.75|0\.5)\.mp4$/, '.mp4');
    return cleanBase.replace(/\.mp4$/, `-${tier.toFixed(tier === 1.0 ? 1 : 2)}.mp4`);
  }

  // If local direct filename without folder prefix
  if (baseSrc.endsWith('.mp4')) {
    const cleanBase = baseSrc.replace(/-(1\.0|0\.75|0\.5)\.mp4$/, '.mp4');
    return cleanBase.replace(/\.mp4$/, `-${tier.toFixed(tier === 1.0 ? 1 : 2)}.mp4`);
  }

  // Handle remote or CDN URL with query parameters
  try {
    const url = new URL(baseSrc, window.location.origin);
    url.searchParams.set('tier', tier.toString());
    return url.toString();
  } catch {
    return baseSrc;
  }
}

/**
 * Resolve poster photograph URL according to quality tier
 * Optimizes Unsplash CDN image resolution and compression per tier
 */
export function resolveQualityPosterUrl(baseSrc: string, tier: QualityTier): string {
  if (!baseSrc) return '';

  // Handle Unsplash dynamic CDN resizing
  if (baseSrc.includes('images.unsplash.com')) {
    let width = 900;
    let quality = 85;

    if (tier === 0.75) {
      width = 600;
      quality = 70;
    } else if (tier === 0.5) {
      width = 380;
      quality = 55;
    }

    try {
      const url = new URL(baseSrc);
      url.searchParams.set('w', width.toString());
      url.searchParams.set('q', quality.toString());
      return url.toString();
    } catch {
      return baseSrc;
    }
  }

  // Handle local poster format if present: /images/poster/{name}-{tier}.webp
  if (baseSrc.includes('/images/poster/')) {
    const cleanBase = baseSrc.replace(/-(1\.0|0\.75|0\.5)\.webp$/, '.webp');
    return cleanBase.replace(/\.webp$/, `-${tier.toFixed(tier === 1.0 ? 1 : 2)}.webp`);
  }

  return baseSrc;
}
