import { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import {
  registerKineticCard,
  unregisterKineticCard,
  updateCardTargets,
  requestPhysicsTick,
  CardKineticRegistration
} from '../services/kineticTicker';

export function useLiveCardController(
  cardId: string,
  getCardEl: () => HTMLDivElement | null,
  getVideoContainerEl: () => HTMLDivElement | null,
  getPosterImgEl?: () => HTMLImageElement | null,
  mediaType: 'image' | 'video' = 'image',
  previewSrc?: string,
  poster?: string
) {
  const [isPausedByHold, setIsPausedByHold] = useState(false);
  const isPausedByHoldRef = useRef(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);

  // Persistent registration reference
  const regRef = useRef<CardKineticRegistration>({
    id: cardId,
    getCardEl,
    getVideoContainerEl,
    getPosterImgEl,
    mediaType,
    previewSrc,
    poster,
    isPausedByHold: false,
    currentQualityTier: 1.0,
    pendingQualityTier: null,
    pendingTierSince: 0,
    lastTierSwitchTimestamp: 0,
    current: {
      scale: 1.0,
      opacity: 1.0,
      playbackRate: 1.0,
      focus: 1.0
    },
    target: {
      scale: 1.0,
      opacity: 1.0,
      playbackRate: 1.0,
      focus: 1.0,
      isInViewport: true,
      isSleeping: false
    },
    lastAppliedRate: 1.0
  });

  // Keep live references updated
  useEffect(() => {
    const reg = regRef.current;
    reg.id = cardId;
    reg.getCardEl = getCardEl;
    reg.getVideoContainerEl = getVideoContainerEl;
    reg.getPosterImgEl = getPosterImgEl;
    reg.mediaType = mediaType;
    reg.previewSrc = previewSrc;
    reg.poster = poster;
    reg.isPausedByHold = isPausedByHold;
  }, [cardId, getCardEl, getVideoContainerEl, getPosterImgEl, mediaType, previewSrc, poster, isPausedByHold]);

  // Register with global ticker on mount
  useLayoutEffect(() => {
    const reg = regRef.current;
    registerKineticCard(reg);

    // Double-rAF guarantee for immediate video container readiness and playback
    const raf1 = requestAnimationFrame(() => {
      updateCardTargets(reg);
      requestPhysicsTick();
      const raf2 = requestAnimationFrame(() => {
        updateCardTargets(reg);
        requestPhysicsTick();
      });
      return () => cancelAnimationFrame(raf2);
    });

    return () => {
      cancelAnimationFrame(raf1);
      unregisterKineticCard(cardId);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, [cardId]);

  // Long-press hold-to-pause (Apple-grade 295ms deliberate threshold)
  const handlePointerDown = useCallback(() => {
    isHoldingRef.current = false;
    holdTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      isPausedByHoldRef.current = true;
      setIsPausedByHold(true);

      const reg = regRef.current;
      reg.isPausedByHold = true;
      updateCardTargets(reg);
      requestPhysicsTick();

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(6);
        } catch {}
      }
    }, 295);
  }, []);

  const handlePointerUpOrCancel = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (isPausedByHoldRef.current) {
      isPausedByHoldRef.current = false;
      setIsPausedByHold(false);

      const reg = regRef.current;
      reg.isPausedByHold = false;
      updateCardTargets(reg);
      requestPhysicsTick();
    }
  }, []);

  return {
    isPausedByHold,
    handlePointerDown,
    handlePointerUpOrCancel,
    isHolding: isHoldingRef.current
  };
}
