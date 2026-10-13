import React, { useRef, useCallback, useState } from 'react';
import { Heart, MapPin, Pause } from 'lucide-react';
import { WorkItem } from '../types';
import { useLiveCardController } from '../hooks/useLiveCardController';

interface WorkCardProps {
  work: WorkItem;
  onSelect: (work: WorkItem) => void;
  onToggleLike: (workId: string, e: React.MouseEvent) => void;
  isLiked?: boolean;
  hideDistance?: boolean;
}

export const WorkCard: React.FC<WorkCardProps> = ({
  work,
  onSelect,
  onToggleLike,
  isLiked = false,
  hideDistance = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const posterImgRef = useRef<HTMLImageElement>(null);
  const [likePopping, setLikePopping] = useState(false);

  const isVideo = work.mediaType === 'video' && Boolean(work.previewVideoUrl || work.videoUrl);
  const previewSrc = work.previewVideoUrl || work.videoUrl;

  const getCardEl = useCallback(() => cardRef.current, []);
  const getVideoContainerEl = useCallback(() => videoContainerRef.current, []);
  const getPosterImgEl = useCallback(() => posterImgRef.current, []);

  const {
    isPausedByHold,
    handlePointerDown,
    handlePointerUpOrCancel,
    isHolding
  } = useLiveCardController(
    work.id,
    getCardEl,
    getVideoContainerEl,
    getPosterImgEl,
    isVideo ? 'video' : 'image',
    previewSrc,
    work.image
  );

  // Click handler (disregard if triggered by long-press hold-to-pause)
  const handleClick = (e: React.MouseEvent) => {
    if (isHolding) {
      e.preventDefault();
      return;
    }
    onSelect(work);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLikePopping(true);
    setTimeout(() => setLikePopping(false), 300);

    // Native haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {
        // safe no-op
      }
    }

    onToggleLike(work.id, e);
  };

  // Natural aspect ratio styling for dynamic Pinterest masonry
  const getAspectRatioClasses = () => {
    switch (work.aspectRatio) {
      case 'tall':
        return 'aspect-[3/4.2]';
      case 'extra-tall':
        return 'aspect-[9/16]';
      case 'square':
        return 'aspect-square';
      case 'standard':
      default:
        return 'aspect-[4/5]';
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUpOrCancel}
      onPointerCancel={handlePointerUpOrCancel}
      onPointerLeave={handlePointerUpOrCancel}
      className="group relative w-full mb-2 cursor-pointer select-none overflow-hidden rounded-[18px] bg-neutral-900 transform-gpu active:scale-[0.985]"
      style={{
        opacity: 0.88,
        transform: 'scale(1.0)',
        contentVisibility: 'auto',
        containIntrinsicSize: '300px 420px'
      }}
    >
      {/* Container with natural aspect ratio */}
      <div className={`relative w-full ${getAspectRatioClasses()} overflow-hidden bg-neutral-900`}>
        {/* Poster photograph (base image) */}
        <img
          ref={posterImgRef}
          src={work.image}
          alt={work.title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Video Pool mounting container (receives pooled recycled <video>) */}
        {isVideo && (
          <div
            ref={videoContainerRef}
            className="absolute inset-0 z-[1] h-full w-full overflow-hidden pointer-events-none"
          />
        )}

        {/* Long-press pause indicator (ultra quiet Apple glass overlay) */}
        {isPausedByHold && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 transition-opacity duration-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white/90 shadow-sm">
              <Pause size={12} className="fill-white" />
            </div>
          </div>
        )}

        {/* Top-right floating like button with scale-pop */}
        <button
          type="button"
          onClick={handleLikeClick}
          aria-label="В избранное"
          className={`absolute top-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/35 backdrop-blur-md text-white transition-all duration-200 hover:bg-black/60 active:scale-90 ${
            likePopping ? 'scale-125' : 'scale-100'
          }`}
        >
          <Heart
            size={16}
            className={`transition-colors duration-200 ${
              isLiked
                ? 'fill-rose-500 text-rose-500 stroke-rose-500'
                : 'text-white/90 hover:text-white'
            }`}
          />
        </button>

        {/* Subtle dark gradient overlay at bottom for ultra-clean legibility */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none z-10" />

        {/* Card info: Distance & Price */}
        <div className={`absolute inset-x-0 bottom-0 p-2.5 flex items-end ${hideDistance ? 'justify-end' : 'justify-between'} text-white pointer-events-none z-10`}>
          {/* Distance */}
          {!hideDistance && (
            <div className="flex items-center gap-1 text-[11px] font-medium tracking-tight text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              <MapPin size={11} className="text-white/80" />
              <span>{work.creator.distanceText}</span>
            </div>
          )}

          {/* Price */}
          <div className="text-[12px] font-semibold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {work.priceFormatted}
          </div>
        </div>
      </div>
    </div>
  );
};
