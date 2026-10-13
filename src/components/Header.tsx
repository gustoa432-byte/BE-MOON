import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { BeMoonLogo } from './BeMoonLogo';

interface HeaderProps {
  city: string;
  street?: string;
  isPreciseLocation: boolean;
  onHomeClick: () => void;
  onOpenLocation: () => void;
  onOpenSearch: () => void;
  hasActiveFilters?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  city,
  street,
  isPreciseLocation,
  onHomeClick,
  onOpenLocation,
  onOpenSearch,
  hasActiveFilters = false
}) => {
  const [hoveredButton, setHoveredButton] = useState<'search' | null>(null);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
      {/* Top subtle gradient vignette for graceful photo fade */}
      <div className="absolute inset-x-0 top-0 top-feed-vignette min-h-20 w-full" />

      {/* Main floating control container */}
      <div
        style={{ paddingTop: 'max(10px, env(safe-area-inset-top, 10px))' }}
        className="relative mx-auto max-w-2xl px-3 pb-1.5 flex items-center justify-between gap-2"
      >
        {/* Left: BE'MOON Logo + City Trigger Button */}
        <div className="flex items-center gap-3 min-w-0 pointer-events-auto">
          {/* Logo as Home Button */}
          <button
            type="button"
            onClick={onHomeClick}
            aria-label="На главную"
            className="flex items-center transition-transform active:scale-95 cursor-pointer focus:outline-none flex-shrink-0"
          >
            <BeMoonLogo size={32} showWordmark={false} />
          </button>

          {/* City / Location Trigger Button */}
          <button
            type="button"
            onClick={onOpenLocation}
            className="group flex flex-col items-start text-left cursor-pointer transition-all active:scale-[0.98] focus:outline-none"
            aria-label="Выбрать город и локацию"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-bold tracking-tight text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] group-hover:text-neutral-200 transition-colors">
                {city}
              </span>
              <ChevronDown size={13} className="text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] transition-transform group-hover:translate-y-0.5 flex-shrink-0" />
              {isPreciseLocation && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                </span>
              )}
            </div>
            {isPreciseLocation && street && (
              <span className="text-[11px] font-normal text-white/90 leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                {street}
              </span>
            )}
          </button>
        </div>

        {/* Right: Black Search button with Light Gray magnifying glass */}
        <div className="flex items-center flex-shrink-0 pointer-events-auto">
          <div className="relative flex flex-col items-center">
            <button
              type="button"
              onClick={onOpenSearch}
              onMouseEnter={() => setHoveredButton('search')}
              onMouseLeave={() => setHoveredButton(null)}
              aria-label="Что ищу"
              className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950/90 shadow-[0_4px_16px_rgba(0,0,0,0.5)] backdrop-blur-md ring-1 ring-white/20 transition-all duration-200 hover:scale-105 hover:bg-neutral-900 hover:ring-white/40 active:scale-95 focus:outline-none"
            >
              {/* Light Gray Search Icon */}
              <Search size={18} strokeWidth={2.2} className="text-neutral-300 group-hover:text-white transition-colors" />
              {hasActiveFilters && (
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-white border-2 border-neutral-950" />
              )}
            </button>
            {hoveredButton === 'search' && (
              <span className="absolute -bottom-6 whitespace-nowrap rounded-md bg-black/85 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md shadow-lg pointer-events-none animate-in fade-in duration-150">
                Что ищу
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
