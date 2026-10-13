import React, { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { WorkItem } from '../types';
import { WorkCard } from './WorkCard';
import { preloadPosters } from '../services/posterPreload';

interface MasonryFeedProps {
  works: WorkItem[];
  onSelectWork: (work: WorkItem) => void;
  onToggleLike: (workId: string, e: React.MouseEvent) => void;
  likedIds: Set<string>;
  isLoading?: boolean;
}

export const MasonryFeed: React.FC<MasonryFeedProps> = ({
  works,
  onSelectWork,
  onToggleLike,
  likedIds,
  isLoading = false
}) => {
  // Preload initial posters (Level 1 Lifecycle)
  useEffect(() => {
    if (works.length > 0) {
      const imageUrls = works.map((w) => w.image);
      preloadPosters(imageUrls, 0, 14);
    }
  }, [works]);

  // Skeleton Loading State
  if (isLoading) {
    return (
      <div
        style={{ paddingTop: 'max(6px, env(safe-area-inset-top, 6px))' }}
        className="w-full px-2 pb-24"
      >
        <div className="mx-auto max-w-2xl grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-2">
            <div className="w-full aspect-[3/4.2] rounded-[18px] bg-neutral-900/80 animate-pulse" />
            <div className="w-full aspect-[4/5] rounded-[18px] bg-neutral-900/80 animate-pulse" />
            <div className="w-full aspect-[9/16] rounded-[18px] bg-neutral-900/80 animate-pulse" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="w-full aspect-[4/5] rounded-[18px] bg-neutral-900/80 animate-pulse" />
            <div className="w-full aspect-[9/16] rounded-[18px] bg-neutral-900/80 animate-pulse" />
            <div className="w-full aspect-[3/4.2] rounded-[18px] bg-neutral-900/80 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Living Empty State
  if (works.length === 0) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 backdrop-blur-md mb-4 text-neutral-400">
          <Sparkles size={22} className="text-white/60" />
        </div>
        <p className="text-sm font-semibold tracking-tight text-white">Поблизости пока тихо</p>
        <p className="mt-1 text-xs text-neutral-400 max-w-xs leading-relaxed">
          Попробуйте расширить радиус поиска или выбрать другую категорию ремёсел
        </p>
      </div>
    );
  }

  // Dynamic height-balanced 2-column masonry distribution
  const leftColumn: WorkItem[] = [];
  const rightColumn: WorkItem[] = [];
  let leftHeight = 0;
  let rightHeight = 0;

  const getHeightWeight = (aspectRatio: WorkItem['aspectRatio']) => {
    switch (aspectRatio) {
      case 'extra-tall': return 1.77;
      case 'tall': return 1.40;
      case 'square': return 1.0;
      case 'standard':
      default: return 1.25;
    }
  };

  works.forEach((item) => {
    const weight = getHeightWeight(item.aspectRatio);
    if (leftHeight <= rightHeight) {
      leftColumn.push(item);
      leftHeight += weight;
    } else {
      rightColumn.push(item);
      rightHeight += weight;
    }
  });

  return (
    <div
      style={{ paddingTop: 'max(6px, env(safe-area-inset-top, 6px))' }}
      className="w-full px-2 pb-24"
    >
      <div className="mx-auto max-w-2xl grid grid-cols-2 gap-2">
        {/* Column 1 */}
        <div className="flex flex-col gap-2">
          {leftColumn.map((work) => (
            <WorkCard
              key={work.id}
              work={work}
              onSelect={onSelectWork}
              onToggleLike={onToggleLike}
              isLiked={likedIds.has(work.id)}
            />
          ))}
        </div>

        {/* Column 2 */}
        <div className="flex flex-col gap-2">
          {rightColumn.map((work) => (
            <WorkCard
              key={work.id}
              work={work}
              onSelect={onSelectWork}
              onToggleLike={onToggleLike}
              isLiked={likedIds.has(work.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
