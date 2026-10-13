import React, { useRef, useEffect } from 'react';

export interface MasterSilhouetteProps {
  avatarUrl: string;
  name: string;
  className?: string;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
}

export function isVideoMedia(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return (
    clean.startsWith('data:video/') ||
    clean.startsWith('blob:') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mp4') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.m4v') ||
    clean.includes('video/webm') ||
    clean.includes('video/mp4') ||
    clean.includes('video/quicktime')
  );
}

export const MasterSilhouette: React.FC<MasterSilhouetteProps> = ({
  avatarUrl,
  name,
  className = '',
  scale = 1,
  offsetX = 0,
  offsetY = 0
}) => {
  const isVideo = isVideoMedia(avatarUrl);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay policy handled silently
      });
    }
  }, [isVideo, avatarUrl]);

  return (
    <div
      className={`relative z-20 h-[50vh] sm:h-[55vh] max-h-[62vh] min-h-[350px] w-full max-w-full flex items-end justify-center bg-transparent ${className}`}
      style={{
        WebkitMaskImage:
          'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0.25) 90%, rgba(0,0,0,0) 100%)',
        maskImage:
          'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0.25) 90%, rgba(0,0,0,0) 100%)'
      }}
    >
      <div
        className="w-full h-full flex items-end justify-center transition-transform duration-75 will-change-transform"
        style={{
          transform: `translate(${offsetX || 0}px, ${offsetY || 0}px) scale(${scale || 1})`,
          transformOrigin: 'bottom center',
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0.2) 90%, rgba(0,0,0,0) 100%)',
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 50%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0.2) 90%, rgba(0,0,0,0) 100%)'
        }}
      >
        {isVideo ? (
          <video
            ref={videoRef}
            src={avatarUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain object-bottom bg-transparent select-none pointer-events-none"
          />
        ) : (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-contain object-bottom bg-transparent select-none pointer-events-none"
          />
        )}
      </div>

      {/* Cinematic bottom soft fade overlay to guarantee smooth blend into dark background */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 sm:h-36 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent z-10"
        aria-hidden="true"
      />
    </div>
  );
};
