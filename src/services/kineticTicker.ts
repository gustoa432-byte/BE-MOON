import { videoPool, isLowEndDevice } from './videoPool';
import { QualityTier, getQualityTier, resolveQualityPosterUrl } from './qualityMedia';

export interface CardKineticRegistration {
  id: string;
  getCardEl: () => HTMLDivElement | null;
  getVideoContainerEl: () => HTMLDivElement | null;
  getPosterImgEl?: () => HTMLImageElement | null;
  mediaType: 'image' | 'video';
  previewSrc?: string;
  poster?: string;
  isPausedByHold: boolean;

  // 3-Tier Quality State
  currentQualityTier: QualityTier;
  pendingQualityTier: QualityTier | null;
  pendingTierSince: number;
  lastTierSwitchTimestamp: number;

  // Current physics values
  current: {
    scale: number;
    opacity: number;
    playbackRate: number;
    focus: number;
  };

  // Target physics values
  target: {
    scale: number;
    opacity: number;
    playbackRate: number;
    focus: number;
    isInViewport: boolean;
    isSleeping: boolean;
  };

  lastAppliedRate: number;
}

const registeredCards = new Map<string, CardKineticRegistration>();
let globalRafId: number | null = null;
let isTickerActive = false;
let isTickingScheduled = false;

// Soft organic falloff
const easeSoft = (t: number) => 1 - Math.pow(Math.max(0, Math.min(1, 1 - t)), 5);
const lerp = (current: number, target: number, factor: number) =>
  current + (target - current) * factor;

/**
 * Apply quality tier switch to video pool and poster element
 */
function applyQualityTier(card: CardKineticRegistration, newTier: QualityTier) {
  card.currentQualityTier = newTier;
  card.pendingQualityTier = null;
  card.lastTierSwitchTimestamp = performance.now();

  // 1. Update Video Pool quality tier
  if (card.mediaType === 'video' && card.previewSrc) {
    videoPool.changeVideoQuality(card.id, card.previewSrc, newTier);
  }

  // 2. Update Poster image resolution via direct DOM mutation
  if (card.poster) {
    const posterImg = card.getPosterImgEl ? card.getPosterImgEl() : null;
    if (posterImg) {
      const newPosterUrl = resolveQualityPosterUrl(card.poster, newTier);
      if (posterImg.src !== newPosterUrl) {
        posterImg.src = newPosterUrl;
      }
    }
  }
}

function stepGlobalPhysics() {
  let hasPendingTransitions = false;
  let activeCardsCount = 0;
  const now = performance.now();

  const scaleDamping = isLowEndDevice ? 0.055 : 0.065;
  const opacityDamping = isLowEndDevice ? 0.10 : 0.12;
  const rateDamping = isLowEndDevice ? 0.10 : 0.12;

  registeredCards.forEach((card) => {
    // If card is far off-screen, maintain sleep state
    if (card.target.isSleeping) {
      return;
    }

    activeCardsCount++;
    const curr = card.current;
    const tgt = card.target;

    // 1. Lazy luxury scale with inertia
    const nextScale = lerp(curr.scale, tgt.scale, scaleDamping);
    const nextOpacity = lerp(curr.opacity, tgt.opacity, opacityDamping);
    const nextRate = lerp(curr.playbackRate, tgt.playbackRate, rateDamping);
    const nextFocus = lerp(curr.focus, tgt.focus, 0.10);

    curr.scale = nextScale;
    curr.opacity = nextOpacity;
    curr.playbackRate = nextRate;
    curr.focus = nextFocus;

    // Hot path: direct style transform
    const cardEl = card.getCardEl();
    if (cardEl) {
      cardEl.style.opacity = nextOpacity.toFixed(3);
      cardEl.style.transform = `scale(${nextScale.toFixed(4)})`;
    }

    // Direct playbackRate and play state on pooled video
    if (card.mediaType === 'video') {
      const videoEl = videoPool.getVideoForCard(card.id);
      if (videoEl) {
        if (tgt.isInViewport && !card.isPausedByHold) {
          if (Math.abs(nextRate - card.lastAppliedRate) > 0.035) {
            try {
              videoEl.playbackRate = Math.max(0.5, Math.min(1.0, nextRate));
              card.lastAppliedRate = nextRate;
            } catch {
              // Browser limit fallback
            }
          }
          if (videoEl.paused) {
            const p = videoEl.play();
            if (p !== undefined) p.catch(() => {});
          }
        } else if (card.isPausedByHold) {
          if (!videoEl.paused) {
            videoEl.pause();
          }
        }
      }
    }

    // 2. Dynamic Quality Hysteresis check during physics step
    const targetTier = getQualityTier(tgt.focus, isLowEndDevice);
    if (card.currentQualityTier !== targetTier) {
      if (targetTier > card.currentQualityTier) {
        // Upgrade: Instant switch to high resolution
        applyQualityTier(card, targetTier);
      } else {
        // Downgrade: Check 200ms hysteresis hold time
        if (card.pendingQualityTier !== targetTier) {
          card.pendingQualityTier = targetTier;
          card.pendingTierSince = now;
        } else if (now - card.pendingTierSince >= 200) {
          if (now - card.lastTierSwitchTimestamp >= 200) {
            applyQualityTier(card, targetTier);
          }
        }
      }
    } else {
      card.pendingQualityTier = null;
    }

    const diff =
      Math.abs(curr.scale - tgt.scale) +
      Math.abs(curr.opacity - tgt.opacity) +
      Math.abs(curr.playbackRate - tgt.playbackRate);

    if (diff > 0.0008 || card.pendingQualityTier !== null) {
      hasPendingTransitions = true;
    }
  });

  if (hasPendingTransitions && activeCardsCount > 0) {
    globalRafId = requestAnimationFrame(stepGlobalPhysics);
  } else {
    isTickerActive = false;
    globalRafId = null;
  }
}

export function requestPhysicsTick() {
  if (!isTickerActive && registeredCards.size > 0) {
    isTickerActive = true;
    globalRafId = requestAnimationFrame(stepGlobalPhysics);
  }
}

export function registerKineticCard(card: CardKineticRegistration) {
  registeredCards.set(card.id, card);
  updateCardTargets(card, true); // true for initial mount (instant tier assignment without hysteresis)
  requestPhysicsTick();
}

export function unregisterKineticCard(id: string) {
  registeredCards.delete(id);
  videoPool.releaseVideo(id);
  if (registeredCards.size === 0 && globalRafId) {
    cancelAnimationFrame(globalRafId);
    globalRafId = null;
    isTickerActive = false;
  }
}

export function updateCardTargets(card: CardKineticRegistration, isInitialMount: boolean = false) {
  const cardEl = card.getCardEl();
  if (!cardEl) return;

  const rect = cardEl.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;

  // Active Zone = Visible Screen + 25% top + 25% bottom (≈ 1.5 screens)
  const sleepMargin = 0.25;
  const isSleeping =
    rect.bottom < -windowHeight * sleepMargin ||
    rect.top > windowHeight * (1 + sleepMargin);

  const isInViewport = rect.bottom > 0 && rect.top < windowHeight;

  if (isSleeping) {
    if (!card.target.isSleeping) {
      // Transition to sleep: release video from pool to completely free decoder RAM
      card.target.isSleeping = true;
      card.target.isInViewport = false;
      card.target.playbackRate = 0.5;
      card.target.opacity = 0.78;
      card.target.scale = 1.0;
      card.target.focus = 0.0;
      card.pendingQualityTier = null;

      cardEl.style.willChange = 'auto';

      if (card.mediaType === 'video') {
        videoPool.releaseVideo(card.id);
      }
    }
    return;
  }

  // Active in 1.5 screen zone
  if (card.target.isSleeping) {
    card.target.isSleeping = false;
    cardEl.style.willChange = 'transform, opacity';
  }

  card.target.isInViewport = isInViewport;

  // Continuous Apple-grade focus calculation
  const cardCenter = rect.top + rect.height / 2;
  const relPos = cardCenter / windowHeight;

  // Broad luxury active center covering upper and central viewport
  let focus = 0;
  if (relPos < 0.45) {
    focus = Math.min(1.0, Math.max(0.82, 1 - Math.max(0, -rect.top) / (windowHeight * 0.35)));
  } else {
    const distanceFromCenter = Math.abs(relPos - 0.45);
    const normalizedDist = Math.min(1, distanceFromCenter / 0.40);
    focus = Math.max(0, 1 - easeSoft(normalizedDist));
  }

  card.target.focus = focus;
  card.target.playbackRate = card.isPausedByHold
    ? 0.5
    : isInViewport
    ? Math.max(0.5, Math.min(1.0, 0.5 + 0.5 * focus))
    : 0.5;

  card.target.opacity = isInViewport ? 0.90 + 0.10 * focus : 0.80;
  card.target.scale = 1.0 + focus * (card.mediaType === 'image' ? 0.026 : 0.020);

  // 3-Tier Quality Determination
  const targetTier = getQualityTier(focus, isLowEndDevice);
  const now = performance.now();

  if (isInitialMount) {
    // Initial mount: direct tier assignment without waiting
    card.currentQualityTier = targetTier;
    card.pendingQualityTier = null;
    card.lastTierSwitchTimestamp = now;
  } else if (card.currentQualityTier !== targetTier) {
    if (targetTier > card.currentQualityTier) {
      // Immediate upgrade
      applyQualityTier(card, targetTier);
    } else {
      // Downgrade with 200ms hold hysteresis
      if (card.pendingQualityTier !== targetTier) {
        card.pendingQualityTier = targetTier;
        card.pendingTierSince = now;
      } else if (now - card.pendingTierSince >= 200 && now - card.lastTierSwitchTimestamp >= 200) {
        applyQualityTier(card, targetTier);
      }
    }
  } else {
    card.pendingQualityTier = null;
  }

  // Immediate Video Pool Lease in 1.5 screen zone
  if (card.mediaType === 'video' && card.previewSrc) {
    const container = card.getVideoContainerEl();
    if (container) {
      const isNearCenter = focus >= 0.5;
      const videoEl = videoPool.leaseVideo(
        card.id,
        card.previewSrc,
        card.poster || '',
        isNearCenter,
        card.currentQualityTier
      );
      if (videoEl) {
        if (videoEl.parentElement !== container) {
          container.appendChild(videoEl);
        }
        if (videoEl.paused && !card.isPausedByHold) {
          const p = videoEl.play();
          if (p !== undefined) p.catch(() => {});
        }
      }
    }
  }
}

export function recalculateAllTargets() {
  registeredCards.forEach((card) => {
    updateCardTargets(card);
  });
  requestPhysicsTick();
}

if (typeof window !== 'undefined') {
  const handleScrollResize = () => {
    if (!isTickingScheduled) {
      isTickingScheduled = true;
      requestAnimationFrame(() => {
        recalculateAllTargets();
        isTickingScheduled = false;
      });
    }
  };

  window.addEventListener('scroll', handleScrollResize, { passive: true });
  window.addEventListener('resize', handleScrollResize, { passive: true });
}
