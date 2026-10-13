import React, { useState, useRef, useEffect } from 'react';
import { Heart, MapPin, Calendar, MessageCircle, Share2, Check, ArrowRight, Volume2, VolumeX, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { WorkItem, Creator } from '../types';
import { BeMoonLogo } from './BeMoonLogo';

interface WorkDetailModalProps {
  work: WorkItem | null;
  onClose: () => void;
  onToggleLike: (workId: string, e: React.MouseEvent) => void;
  isLiked?: boolean;
  onSelectWork: (work: WorkItem) => void;
  allWorks: WorkItem[];
  onOpenCreatorProfile: (creator: Creator) => void;
  onStartBooking: (work: WorkItem) => void;
  onStartChat: (creator: Creator, work: WorkItem) => void;
}

export const WorkDetailModal: React.FC<WorkDetailModalProps> = ({
  work,
  onClose,
  onToggleLike,
  isLiked = false,
  onSelectWork,
  allWorks,
  onOpenCreatorProfile,
  onStartBooking,
  onStartChat
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isVideo = Boolean(work && work.mediaType === 'video' && work.videoUrl);

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.defaultMuted = isMuted;
      videoRef.current.playsInline = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
  }, [isVideo, isMuted, work?.id]);

  if (!work) return null;

  const images = [work.image, ...(work.additionalImages || [])];
  const creatorOtherWorks = allWorks.filter(
    (w) => w.creator.id === work.creator.id && w.id !== work.id
  );

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const toggleSound = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  return (
    <div className="fixed inset-0 z-50 h-[100dvh] w-full bg-[#0d0e12] text-white overflow-y-auto overflow-x-hidden animate-in fade-in duration-200">
      {/* Top Floating Glass Bar with Logo-Anchor and Actions */}
      <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
        <div className="absolute inset-x-0 top-0 top-feed-vignette min-h-24 w-full" />
        <div
          style={{ paddingTop: 'max(10px, env(safe-area-inset-top, 10px))' }}
          className="relative mx-auto max-w-2xl px-3 pb-2 flex items-center justify-between gap-2"
        >
          {/* Logo Anchor: Returning to Feed */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Вернуться в ленту"
            className="group pointer-events-auto flex items-center transition-transform active:scale-95 cursor-pointer focus:outline-none"
          >
            <BeMoonLogo size={32} isBackAnchor />
          </button>

          {/* Right Floating Actions: Share & Like */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              aria-label="Поделиться"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950/85 backdrop-blur-md text-white/90 ring-1 ring-white/15 transition-all hover:scale-105 hover:bg-neutral-900 active:scale-95 focus:outline-none"
            >
              {copiedLink ? <Check size={17} className="text-emerald-400" /> : <Share2 size={17} />}
            </button>
            <button
              type="button"
              onClick={(e) => onToggleLike(work.id, e)}
              aria-label="В избранное"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950/85 backdrop-blur-md text-white ring-1 ring-white/15 transition-all hover:scale-105 hover:bg-neutral-900 active:scale-95 focus:outline-none"
            >
              <Heart
                size={17}
                className={isLiked ? 'fill-rose-500 text-rose-500 stroke-rose-500' : 'text-white/90'}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container (Full Width Monolith) */}
      <div className="mx-auto max-w-2xl pb-32">
        {/* Edge-to-Edge Hero Media Section (Photo or Full Video) */}
        <div className="relative w-full aspect-[4/5] sm:aspect-square bg-black overflow-hidden">
          {isVideo ? (
            <>
              <video
                ref={videoRef}
                src={work.videoUrl}
                poster={work.image}
                muted={isMuted}
                loop
                playsInline
                autoPlay
                className="h-full w-full object-cover"
              />
              {/* Sound Toggle Button */}
              <button
                type="button"
                onClick={toggleSound}
                aria-label={isMuted ? 'Включить звук' : 'Выключить звук'}
                className="absolute bottom-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white transition-all hover:bg-black/80 active:scale-90 ring-1 ring-white/20"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </>
          ) : (
            <img
              src={images[selectedImageIndex] || work.image}
              alt={work.title}
              className="h-full w-full object-cover transition-opacity duration-300"
            />
          )}

          {/* Multiple photos thumbnail strip */}
          {images.length > 1 && !isVideo && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1.5 backdrop-blur-md ring-1 ring-white/10">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`h-2.5 rounded-full transition-all ${
                    selectedImageIndex === idx ? 'w-6 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Bottom subtle gradient on media for seamless flow into page content */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0d0e12] to-transparent pointer-events-none" />
        </div>

        {/* Work Details Body (Seamless flow on #0d0e12) */}
        <div className="px-4 pt-4 sm:px-6 space-y-6">
          {/* Header Title & Price */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 font-['Syne',sans-serif]">
                {work.category}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
                {work.title}
              </h1>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xl sm:text-2xl font-black tracking-tight text-white font-['Syne',sans-serif]">
                {work.priceFormatted}
              </div>
              <div className="text-[11px] text-neutral-400 font-medium">
                {work.turnaroundTime}
              </div>
            </div>
          </div>

          {/* Available today banner */}
          {work.availableToday && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 text-xs font-medium text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Свободное окно сегодня • Доступно к быстрой записи</span>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-['Syne',sans-serif]">
              О работе
            </h3>
            <p className="text-sm leading-relaxed text-neutral-300">
              {work.description}
            </p>
          </div>

          {/* Author Card (Tap to open Master Profile) */}
          <div className="rounded-2xl bg-neutral-900/60 p-4 border border-white/5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div
                onClick={() => onOpenCreatorProfile(work.creator)}
                className="flex items-center gap-3 cursor-pointer group flex-1"
              >
                <div className="relative h-12 w-12 flex-shrink-0">
                  <img
                    src={work.creator.avatar}
                    alt={work.creator.name}
                    className="h-full w-full rounded-full object-cover ring-2 ring-white/10 group-hover:ring-white/30 transition-all"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white group-hover:text-neutral-200 transition-colors truncate">
                      {work.creator.name}
                    </span>
                    <ShieldCheck size={14} className="text-sky-400 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-neutral-400 truncate">{work.creator.role}</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 size={11} />
                      <span>{work.creator.completedBookingsCount || 42} записи</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <MapPin size={11} />
                      {work.creator.distanceText}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenCreatorProfile(work.creator)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/80 hover:bg-white/10 transition-colors"
                aria-label="Профиль мастера"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Master's other works */}
          {creatorOtherWorks.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-['Syne',sans-serif]">
                Другие работы мастера
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {creatorOtherWorks.slice(0, 3).map((other) => (
                  <button
                    key={other.id}
                    type="button"
                    onClick={() => {
                      onSelectWork(other);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group relative aspect-square overflow-hidden rounded-xl bg-neutral-900 focus:outline-none"
                  >
                    <img
                      src={other.image}
                      alt={other.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                      <span className="text-[10px] font-semibold text-white truncate">{other.priceFormatted}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Bar (Bottom of Screen) */}
      <div
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
        className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-[#0d0e12] via-[#0d0e12]/95 to-transparent pt-6 px-4"
      >
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          {/* Direct Chat button */}
          <button
            type="button"
            onClick={() => onStartChat(work.creator, work)}
            className="flex h-13 items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/15 active:scale-95 focus:outline-none ring-1 ring-white/10"
          >
            <MessageCircle size={18} />
            <span>Чат</span>
          </button>

          {/* Direct Booking / Order CTA button */}
          <button
            type="button"
            onClick={() => onStartBooking(work)}
            className="flex h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-bold text-neutral-950 shadow-[0_8px_24px_rgba(255,255,255,0.15)] transition-all hover:bg-neutral-100 active:scale-[0.98] focus:outline-none"
          >
            <Calendar size={18} />
            <span>Записаться / Заказать</span>
          </button>
        </div>
      </div>
    </div>
  );
};
