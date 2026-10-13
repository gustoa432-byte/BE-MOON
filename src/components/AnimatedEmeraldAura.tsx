import React from 'react';

interface AnimatedEmeraldAuraProps {
  scrollIntensity?: number;
  className?: string;
}

export const AnimatedEmeraldAura: React.FC<AnimatedEmeraldAuraProps> = ({
  scrollIntensity = 0,
  className = ''
}) => {
  const dynamicScale = 1 + Math.min(scrollIntensity * 0.18, 0.45);

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-visible bg-transparent ${className}`}
      aria-hidden="true"
    >
      <div
        className="relative w-80 sm:w-96 h-80 sm:h-96 flex items-center justify-center transition-transform duration-300 ease-out bg-transparent"
        style={{ transform: `scale(${dynamicScale})` }}
      >
        {/* Layer A: Ambient Deep Emerald Back-Glow */}
        <div
          className="absolute w-[440px] sm:w-[500px] h-[440px] sm:h-[500px] rounded-full bg-emerald-700/25 blur-[120px] pointer-events-none"
          style={{ animation: 'aura-breathe 8s ease-in-out infinite' }}
        />

        {/* Layer B: Rotating Outer Emerald Smoke (Wide billow around shoulders) */}
        <div
          className="absolute w-88 sm:w-[420px] h-88 sm:h-[420px] rounded-full bg-emerald-500/40 blur-[90px] pointer-events-none"
          style={{ animation: 'aura-orbit-1 16s linear infinite' }}
        />

        {/* Layer C: Counter-Rotating Fluid Emerald Plume */}
        <div
          className="absolute w-72 sm:w-80 h-72 sm:h-80 rounded-full bg-emerald-400/50 blur-[70px] pointer-events-none"
          style={{ animation: 'aura-orbit-2 11s ease-in-out infinite' }}
        />

        {/* Layer D: Intense Luminescent Mint Core radiating from behind master's head and neck */}
        <div
          className="absolute w-52 sm:w-60 h-52 sm:h-60 rounded-full bg-emerald-300/60 blur-[45px] pointer-events-none"
          style={{ animation: 'aura-pulse-core 5s ease-in-out infinite' }}
        />
      </div>
    </div>
  );
};
