// Native-Grade Video Pool Singleton for BE’MOON with 3-Tier Dynamic Quality Management
// Recycles and caps active HTMLVideoElement instances (6 on low-end, 8 on standard)
// Seamless quality tier switching (1.0 / 0.75 / 0.5) with zero black frames.

import { QualityTier, resolveQualityVideoUrl } from './qualityMedia';

export const isLowEndDevice =
  typeof navigator !== 'undefined' &&
  (((navigator.hardwareConcurrency || 4) <= 4) ||
   ((navigator as unknown as { deviceMemory?: number }).deviceMemory || 4) <= 4);

export const MAX_ACTIVE_VIDEOS = isLowEndDevice ? 6 : 8;

interface PooledVideoEntry {
  element: HTMLVideoElement;
  ownerCardId: string | null;
  currentSrc: string | null;
  currentTier: QualityTier | null;
  lastUsedTimestamp: number;
}

class VideoPoolService {
  private pool: PooledVideoEntry[] = [];
  private cardToPoolMap = new Map<string, PooledVideoEntry>();

  constructor() {
    if (typeof document !== 'undefined') {
      for (let i = 0; i < MAX_ACTIVE_VIDEOS; i++) {
        const video = document.createElement('video');
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.loop = true;
        video.autoplay = true;
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('x5-playsinline', 'true');
        video.setAttribute('playsinline', 'true');
        video.className = 'absolute inset-0 z-[1] h-full w-full object-cover pointer-events-none';
        video.style.opacity = '1';

        this.pool.push({
          element: video,
          ownerCardId: null,
          currentSrc: null,
          currentTier: null,
          lastUsedTimestamp: 0
        });
      }
    }
  }

  /**
   * Acquire or attach a video element for an active card in the 1.5 screen zone
   */
  leaseVideo(
    cardId: string,
    baseSrc: string,
    poster: string,
    isNearCenter: boolean = true,
    tier: QualityTier = 1.0
  ): HTMLVideoElement | null {
    if (typeof document === 'undefined') return null;

    const resolvedSrc = resolveQualityVideoUrl(baseSrc, tier);

    // 1. If already leased to this card, update tier / src if needed
    let entry = this.cardToPoolMap.get(cardId);
    if (entry) {
      entry.lastUsedTimestamp = Date.now();
      if (entry.currentTier !== tier || entry.currentSrc !== resolvedSrc) {
        this.applySrcChange(entry, resolvedSrc, tier);
      }
      entry.element.preload = isNearCenter ? 'auto' : 'metadata';
      return entry.element;
    }

    // 2. Find an unowned / idle video element in the pool
    const idleEntry = this.pool.find((e) => e.ownerCardId === null);
    if (idleEntry) {
      entry = idleEntry;
    } else {
      // 3. Pool is saturated: Evict Least-Recently Used (LRU) video
      let oldest: PooledVideoEntry = this.pool[0];
      for (const item of this.pool) {
        if (item.lastUsedTimestamp < oldest.lastUsedTimestamp) {
          oldest = item;
        }
      }
      this.evictEntry(oldest);
      entry = oldest;
    }

    // Assign to new card
    entry.ownerCardId = cardId;
    entry.currentSrc = resolvedSrc;
    entry.currentTier = tier;
    entry.lastUsedTimestamp = Date.now();
    entry.element.poster = poster;
    entry.element.preload = 'auto';
    entry.element.style.opacity = '1';

    if (entry.element.src !== resolvedSrc) {
      entry.element.src = resolvedSrc;
    }

    this.cardToPoolMap.set(cardId, entry);
    return entry.element;
  }

  /**
   * Update video quality tier seamlessly with continuous time persistence
   */
  changeVideoQuality(cardId: string, baseSrc: string, newTier: QualityTier) {
    const entry = this.cardToPoolMap.get(cardId);
    if (!entry) return;

    if (entry.currentTier === newTier) return;

    const resolvedSrc = resolveQualityVideoUrl(baseSrc, newTier);
    if (entry.currentSrc === resolvedSrc) return;

    this.applySrcChange(entry, resolvedSrc, newTier);
  }

  private applySrcChange(entry: PooledVideoEntry, newSrc: string, newTier: QualityTier) {
    const vid = entry.element;
    const prevTime = vid.currentTime || 0;
    const wasPlaying = !vid.paused;

    entry.currentSrc = newSrc;
    entry.currentTier = newTier;
    vid.src = newSrc;

    try {
      if (prevTime > 0) {
        vid.currentTime = prevTime;
      }
    } catch {
      // safe fallback
    }

    if (wasPlaying) {
      const p = vid.play();
      if (p !== undefined) p.catch(() => {});
    }
  }

  /**
   * Return and detach a video from a sleeping card, fully releasing GPU memory
   */
  releaseVideo(cardId: string) {
    const entry = this.cardToPoolMap.get(cardId);
    if (!entry) return;
    this.evictEntry(entry);
  }

  private evictEntry(entry: PooledVideoEntry) {
    if (entry.ownerCardId) {
      this.cardToPoolMap.delete(entry.ownerCardId);
      entry.ownerCardId = null;
    }

    const vid = entry.element;
    try {
      vid.pause();
      if (vid.parentElement) {
        vid.parentElement.removeChild(vid);
      }
      // Native Rule: wipe src and call load() to free decoder RAM
      vid.removeAttribute('src');
      vid.src = '';
      vid.load();
    } catch {
      // Safe no-op
    }

    entry.currentSrc = null;
    entry.currentTier = null;
    entry.lastUsedTimestamp = 0;
  }

  getVideoForCard(cardId: string): HTMLVideoElement | null {
    return this.cardToPoolMap.get(cardId)?.element || null;
  }

  getCurrentTierForCard(cardId: string): QualityTier | null {
    return this.cardToPoolMap.get(cardId)?.currentTier || null;
  }
}

export const videoPool = new VideoPoolService();
