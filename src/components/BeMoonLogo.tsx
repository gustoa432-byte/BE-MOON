import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BeMoonLogoProps {
  className?: string;
  size?: number;
  textColor?: string;
  showWordmark?: boolean;
  isBackAnchor?: boolean;
}

export const BeMoonLogo: React.FC<BeMoonLogoProps> = ({
  className = '',
  size = 32,
  textColor = 'text-white',
  showWordmark = false,
  isBackAnchor = false
}) => {
  return (
    <div className={`flex items-center select-none ${className}`}>
      <div className="relative flex items-center gap-1.5">
        {/* Back Arrow (shown without text when in sub-screens) */}
        {isBackAnchor && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950/80 backdrop-blur-md text-white/90 ring-1 ring-white/15 transition-all group-hover:bg-neutral-900 group-hover:text-white group-hover:scale-105 group-active:scale-90 flex-shrink-0">
            <ArrowLeft size={16} strokeWidth={2.4} className="transition-transform group-hover:-translate-x-0.5" />
          </div>
        )}

        {/* Exact recreated emblem: stylized calligraphic "b" and the celestial moon disk */}
        <div className="relative flex items-center">
          <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-105 group-active:scale-95 ${
              isBackAnchor ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : ''
            }`}
          >
            <defs>
              <radialGradient id="moonGrad" cx="38%" cy="38%" r="62%">
                <stop offset="0%" stopColor="#45474e" />
                <stop offset="70%" stopColor="#1c1d22" />
                <stop offset="100%" stopColor="#0a0a0d" />
              </radialGradient>
            </defs>

            {/* Calligraphic fluid 'b' glyph with ascending flame-horn */}
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M 50 15 
                 C 47 23 40 32 32 41 
                 C 22 52 14 64 16 77 
                 C 18 89 31 96 45 94 
                 C 58 92 68 81 67 67 
                 C 66 55 57 46 46 45 
                 C 52 35 52 24 50 15 Z 
                 M 44 54 
                 C 52 55 58 62 57 71 
                 C 56 80 48 85 40 84 
                 C 32 83 26 76 27 67 
                 C 28 59 35 53 44 54 Z"
              fill="currentColor"
              className="text-white"
            />

            {/* Dark celestial moon sphere positioned to the right */}
            <circle
              cx="76"
              cy="65"
              r="16.5"
              fill="url(#moonGrad)"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="0.8"
            />
            {/* Subtle lunar rim texture highlight */}
            <path
              d="M 88 56 C 92 63 92 71 87 78"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>

        {/* Wordmark (only if explicitly enabled without back anchor) */}
        {!isBackAnchor && showWordmark && (
          <div className="ml-1.5 flex flex-col leading-none">
            <span className={`text-[17px] font-black tracking-[-0.04em] uppercase font-['Syne',sans-serif] ${textColor} drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]`}>
              BE’MOON
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
