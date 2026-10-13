import React, { useState } from 'react';
import { User } from 'lucide-react';
import { Creator } from '../types';
import { isVideoMedia } from './MasterSilhouette';

interface BottomProfileButtonProps {
  currentUser: Creator;
  onOpenProfile: () => void;
}

export const BottomProfileButton: React.FC<BottomProfileButtonProps> = ({
  currentUser,
  onOpenProfile
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        bottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
        right: 'max(24px, env(safe-area-inset-right, 24px))'
      }}
      className="fixed z-40 pointer-events-auto"
    >
      <div className="relative flex flex-col items-end">
        {/* Tooltip on hover */}
        {isHovered && (
          <span className="absolute -top-7 right-0 whitespace-nowrap rounded-md bg-black/85 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-md shadow-lg pointer-events-none animate-in fade-in duration-150">
            Профиль
          </span>
        )}

        {/* Circular Floating Mini Avatar Button */}
        <button
          type="button"
          onClick={onOpenProfile}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label="Открыть профиль"
          className="group relative flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900/90 p-0.5 shadow-[0_6px_24px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none ring-2 ring-white/20 hover:ring-white/40"
        >
          {/* Mini Avatar */}
          <div className="relative h-full w-full overflow-hidden rounded-full">
            {currentUser?.avatar ? (
              isVideoMedia(currentUser.avatar) ? (
                <video
                  src={currentUser.avatar}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-full w-full object-cover"
                />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-neutral-800 text-white">
                <User size={16} />
              </div>
            )}
          </div>

          {/* Active online dot indicator */}
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-neutral-950" />
        </button>
      </div>
    </div>
  );
};
