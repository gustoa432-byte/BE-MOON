import React, { useState, useRef } from 'react';
import {
  MapPin,
  MessageCircle,
  CheckCircle2,
  Heart,
  Calendar,
  Clock,
  Phone,
  Send,
  Globe,
  ExternalLink,
  Navigation,
  LayoutGrid,
  Info,
  QrCode,
  Copy,
  X
} from 'lucide-react';
import { Creator, WorkItem } from '../types';
import { WorkCard } from './WorkCard';
import { BeMoonLogo } from './BeMoonLogo';
import { MasterSilhouette } from './MasterSilhouette';
import { AnimatedEmeraldAura } from './AnimatedEmeraldAura';

interface CreatorProfileModalProps {
  creator: Creator | null;
  onClose: () => void;
  creatorWorks: WorkItem[];
  onSelectWork: (work: WorkItem) => void;
  onToggleLike: (workId: string, e: React.MouseEvent) => void;
  likedIds: Set<string>;
  onStartChat: (creator: Creator) => void;
  onStartBooking?: (creator: Creator) => void;
}

export const CreatorProfileModal: React.FC<CreatorProfileModalProps> = ({
  creator,
  onClose,
  creatorWorks,
  onSelectWork,
  onToggleLike,
  likedIds,
  onStartChat,
  onStartBooking
}) => {
  const [activeTab, setActiveTab] = useState<'works' | 'info'>('works');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Scroll velocity physics for WebGL Verification Aura
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollVelocityIntensity, setScrollVelocityIntensity] = useState<number>(0);
  const lastScrollTopRef = useRef<number>(0);
  const lastScrollTimeRef = useRef<number>(performance.now());

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    const now = performance.now();
    const dt = Math.max(16, now - lastScrollTimeRef.current);
    const delta = Math.abs(currentScrollTop - lastScrollTopRef.current);

    lastScrollTopRef.current = currentScrollTop;
    lastScrollTimeRef.current = now;

    const velocity = delta / dt;
    if (velocity > 0.04) {
      const impulse = Math.min(velocity * 2.4, 3.5);
      setScrollVelocityIntensity(impulse);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  if (!creator) return null;

  const leftColumn: WorkItem[] = [];
  const rightColumn: WorkItem[] = [];

  creatorWorks.forEach((item, index) => {
    if (index % 2 === 0) leftColumn.push(item);
    else rightColumn.push(item);
  });

  const defaultSchedule = creator.workingSchedule || [
    { day: 'Пн', dayFull: 'Понедельник', hours: '10:00 — 19:00', isDayOff: false },
    { day: 'Вт', dayFull: 'Вторник', hours: '10:00 — 19:00', isDayOff: false },
    { day: 'Ср', dayFull: 'Среда', hours: '10:00 — 19:00', isDayOff: false },
    { day: 'Чт', dayFull: 'Четверг', hours: '10:00 — 19:00', isDayOff: false },
    { day: 'Пт', dayFull: 'Пятница', hours: '10:00 — 19:00', isDayOff: false },
    { day: 'Сб', dayFull: 'Суббота', hours: '11:00 — 17:00', isDayOff: false },
    { day: 'Вс', dayFull: 'Воскресенье', hours: 'Выходной', isDayOff: true },
  ];

  const currentDayIdx = (new Date().getDay() + 6) % 7;

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      className="fixed inset-0 z-50 h-[100dvh] w-full bg-[#0d0e12] text-white overflow-y-auto overflow-x-hidden animate-in fade-in duration-200 no-scrollbar"
    >
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 rounded-2xl bg-neutral-900/95 px-4 py-2.5 text-xs font-medium text-white shadow-2xl border border-white/15 backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Floating Bar with Logo-Anchor */}
      <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none overflow-visible">
        {/* Dense background at top fading to transparent at bottom */}
        <div
          className="absolute inset-x-0 top-0 h-28 sm:h-32 bg-gradient-to-b from-[#0d0e12] via-[#0d0e12]/80 via-60% to-transparent pointer-events-none -z-10"
          aria-hidden="true"
        />

        <div
          style={{ paddingTop: 'max(10px, env(safe-area-inset-top, 10px))' }}
          className="relative mx-auto max-w-2xl px-3 pb-2 flex items-center justify-between gap-2 bg-transparent overflow-visible"
        >
          {/* Logo Anchor: Back to Feed */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Вернуться в ленту"
            className="group pointer-events-auto flex items-center gap-2 p-1 rounded-xl bg-transparent hover:bg-white/10 transition-colors active:scale-95 cursor-pointer focus:outline-none"
          >
            <BeMoonLogo size={32} isBackAnchor />
            <span className="text-sm font-semibold tracking-tight text-white/90 group-hover:text-white transition-colors">
              Лента
            </span>
          </button>

          {/* Right Action: Direct Chat */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => onStartChat(creator)}
              aria-label="Написать мастеру"
              className="flex items-center gap-2 h-10 px-4 rounded-full bg-transparent hover:bg-white/10 active:bg-white/15 text-white/90 transition-all hover:scale-105 active:scale-95 focus:outline-none text-xs font-semibold"
            >
              <MessageCircle size={15} />
              <span>Написать</span>
            </button>
          </div>
        </div>
      </header>

      {/* Editorial Masthead 3D Hero (TIME Magazine 3D Overlap Layout) */}
      <div className="relative w-full overflow-visible bg-transparent flex flex-col items-center justify-start flex-shrink-0 pt-0">
        {/* Layer 0 (z-0): Изумрудная Аура с анимацией дыхания */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-emerald-500/30 blur-[90px] pointer-events-none z-0 animate-aura-breathe"
          aria-hidden="true"
        />

        {/* Layer: Имя мастера с динамическим порядком слоев (z-10 за силуэтом / z-25 поверх силуэта) */}
        <div
          className="absolute top-20 sm:top-24 left-0 right-0 flex flex-col items-center justify-center pointer-events-none px-4 select-none transition-all duration-150"
          style={{ zIndex: creator.nameAboveAvatar ? 25 : 10 }}
        >
          <h1
            style={{
              color: creator.nameColor || '#FFFFFF',
              opacity: typeof creator.nameOpacity === 'number' ? creator.nameOpacity : 0.95,
              textShadow: '0 4px 30px rgba(0,0,0,0.95)'
            }}
            className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-center leading-[0.88] font-['Syne',sans-serif] transition-all duration-150"
          >
            {creator.name.includes(' ') ? (
              <>
                <span className="block">{creator.name.split(' ')[0]}</span>
                <span className="block opacity-90">{creator.name.split(' ').slice(1).join(' ')}</span>
              </>
            ) : (
              creator.name
            )}
          </h1>
        </div>

        {/* Layer 20 (z-20): Аватар мастера (Поднят до самого верха экрана, ширина во весь экран) */}
        <div className="relative z-20 mt-0 flex items-end justify-center overflow-visible w-full max-w-full">
          <MasterSilhouette
            avatarUrl={creator.avatar}
            name={creator.name}
            scale={creator.avatarScale}
            offsetX={creator.avatarOffsetX}
            offsetY={creator.avatarOffsetY}
            className="w-full"
          />
        </div>
      </div>

      {/* Layer 30 (z-30): Нижний контент подтянут плотно под силуэт */}
      <div className="relative z-30 mx-auto max-w-2xl px-4 -mt-20 sm:-mt-24 pb-28 flex-1 flex flex-col w-full">
        {/* Creator Identity Hero */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-300 font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
            <span>{creator.role}</span>
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              aria-label="Поделиться профилем (QR)"
              className="text-neutral-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/10 active:scale-95 focus:outline-none"
              title="Поделиться QR-кодом"
            >
              <QrCode size={15} />
            </button>
          </div>

          <div className="mt-2.5 flex items-center gap-3 text-xs text-neutral-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-1 font-semibold text-emerald-400">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>{creator.completedBookingsCount || 42} успешных записей</span>
            </div>
            <span className="text-neutral-600">•</span>
            <div className="flex items-center gap-1 text-neutral-400 font-medium">
              <Heart size={12} className="text-rose-400 fill-rose-400/20" />
              <span>{creator.savedCount || 184} сохранений</span>
            </div>
            <span className="text-neutral-600">•</span>
            <div className="flex items-center gap-1 text-neutral-400">
              <MapPin size={13} />
              <span>{creator.distanceText} ({creator.locationText})</span>
            </div>
          </div>

          {/* Bio statement */}
          <p className="mt-4 max-w-md text-sm leading-relaxed text-neutral-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            {creator.bio}
          </p>

          {/* Skills Chips */}
          <div className="mt-4 flex flex-wrap justify-center gap-1.5 max-w-md">
            {creator.skills.map((skill, index) => (
              <span
                key={index}
                className="rounded-full bg-neutral-900/90 px-3 py-1 text-[11px] font-medium text-neutral-300 border border-white/5"
              >
                {skill}
              </span>
            ))}
          </div>

          {/* Section 2: Call-to-Action "Записаться" Button for Guest/Client */}
          <div className="mt-4 w-full max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => {
                if (creator.bookingUrl && creator.bookingUrl.trim()) {
                  window.open(creator.bookingUrl, '_blank');
                } else if (onStartBooking) {
                  onStartBooking(creator);
                }
              }}
              className="w-full h-11 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,255,255,0.15)] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Calendar size={15} />
              <span>Записаться к мастеру</span>
            </button>
          </div>
        </div>

        {/* Section 1 & Navigation Tabs: Works vs Info */}
        <div className="mt-8 mb-4 grid grid-cols-2 border-b border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('works')}
            className={`flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-colors relative cursor-pointer ${
              activeTab === 'works' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <LayoutGrid size={16} />
            <span>Работы ({creatorWorks.length})</span>
            {activeTab === 'works' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-8 bg-white rounded-t-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-colors relative cursor-pointer ${
              activeTab === 'info' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Info size={16} />
            <span>Инфо & Контакты</span>
            {activeTab === 'info' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-8 bg-white rounded-t-full" />
            )}
          </button>
        </div>

        {/* Tab 1: Works Gallery */}
        {activeTab === 'works' && (
          creatorWorks.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              У мастера пока нет опубликованных работ
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
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
          )
        )}

        {/* Tab 2: Info, Dark Mini-Map & Working Schedule */}
        {activeTab === 'info' && (
          <div className="space-y-4 pt-1">
            {/* Dark Mini-Map & Location */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-white" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-['Syne',sans-serif]">
                  Локация и мастерская
                </h3>
              </div>

              <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-[#111318] border border-white/10 group">
                <svg className="absolute inset-0 h-full w-full opacity-60" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="creatorMapGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="#101217" />
                  <rect width="100%" height="100%" fill="url(#creatorMapGrid)" />
                  <path d="M-20 60 Q 80 80, 200 60 T 400 90 T 700 70" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="3" />
                  <path d="M120 -20 Q 150 100, 180 200" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="4" />
                  <path d="M260 -20 Q 230 110, 240 200" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="2.5" />
                  <path d="M-10 130 Q 150 140, 350 120 T 700 140" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
                </svg>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                  <span className="absolute h-14 w-14 rounded-full bg-emerald-500/20 animate-ping" />
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-950 shadow-xl ring-4 ring-neutral-900">
                    <MapPin size={16} className="fill-neutral-950" />
                  </div>
                </div>

                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-lg bg-black/75 px-2.5 py-1 backdrop-blur-md border border-white/10 text-[10px] font-mono text-neutral-300">
                  <Navigation size={11} className="text-emerald-400" />
                  <span>{creator.city} • {creator.district}</span>
                </div>

                <div className="absolute bottom-2.5 right-2.5">
                  <a
                    href={`https://yandex.ru/maps/?text=${encodeURIComponent(`${creator.city} ${creator.locationText}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white border border-white/15 transition-colors cursor-pointer"
                  >
                    <ExternalLink size={12} />
                    <span>В Картах</span>
                  </a>
                </div>
              </div>

              <div className="rounded-2xl bg-neutral-900/60 p-3.5 border border-white/5 space-y-1">
                <div className="text-xs font-bold text-white">
                  {creator.placeName || 'Мастерская'}
                </div>
                <div className="text-xs text-neutral-300">
                  {creator.city}, {creator.postalCode || '295000'}, {creator.locationText}
                </div>
              </div>
            </div>

            {/* Working Schedule */}
            <div className="rounded-2xl bg-neutral-900/60 p-4 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-white" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white font-['Syne',sans-serif]">
                    График работы
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Открыто сегодня
                </span>
              </div>

              <div className="space-y-1 pt-1 text-xs">
                {defaultSchedule.map((schedule, idx) => {
                  const isToday = idx === currentDayIdx;
                  return (
                    <div
                      key={schedule.day}
                      className={`flex items-center justify-between transition-colors ${
                        isToday
                          ? 'rounded-xl bg-white/10 px-3 py-2 text-white font-bold ring-1 ring-white/15'
                          : 'px-3 py-1.5 text-neutral-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 font-semibold">{schedule.day}</span>
                        <span className="text-[11px] opacity-80">{schedule.dayFull}</span>
                        {isToday && (
                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-300">
                            Сегодня
                          </span>
                        )}
                      </div>
                      <span className={schedule.isDayOff ? 'text-neutral-500' : (isToday ? 'text-white' : 'text-neutral-300')}>
                        {schedule.hours}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contacts & Socials */}
            <div className="rounded-2xl bg-neutral-900/60 p-4 border border-white/5 space-y-3">
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-white" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-['Syne',sans-serif]">
                  Контакты мастера
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`tel:${(creator.phone || '+79781234567').replace(/\s+/g, '')}`}
                  className="flex items-center gap-2.5 rounded-xl bg-white/5 hover:bg-white/10 p-2.5 text-xs text-white border border-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                    <Phone size={14} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-neutral-400">Позвонить</span>
                    <span className="font-semibold truncate">{creator.phone || '+7 (978) 123-45-67'}</span>
                  </div>
                </a>

                <a
                  href={`https://t.me/${(creator.telegram || creator.handle).replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl bg-white/5 hover:bg-white/10 p-2.5 text-xs text-white border border-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 flex-shrink-0">
                    <Send size={14} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-neutral-400">Telegram</span>
                    <span className="font-semibold truncate">{creator.telegram || creator.handle}</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR Code & Share Bottom Sheet */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsQrModalOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-neutral-900 border border-white/10 p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom-5 duration-200 z-10">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode size={18} className="text-white" />
                <h3 className="text-sm font-bold text-white tracking-tight">Поделиться профилем</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                aria-label="Закрыть"
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* QR Card Graphic */}
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/5 border border-white/5">
              <div className="p-3 rounded-2xl bg-white shadow-xl flex items-center justify-center">
                <svg
                  width="180"
                  height="180"
                  viewBox="0 0 200 200"
                  className="w-40 h-40 sm:w-44 sm:h-44"
                >
                  <rect width="200" height="200" fill="white" />
                  
                  {/* Top Left */}
                  <rect x="15" y="15" width="46" height="46" rx="6" fill="#0d0e12" />
                  <rect x="23" y="23" width="30" height="30" rx="3" fill="white" />
                  <rect x="30" y="30" width="16" height="16" rx="2" fill="#0d0e12" />
                  
                  {/* Top Right */}
                  <rect x="139" y="15" width="46" height="46" rx="6" fill="#0d0e12" />
                  <rect x="147" y="23" width="30" height="30" rx="3" fill="white" />
                  <rect x="154" y="30" width="16" height="16" rx="2" fill="#0d0e12" />
                  
                  {/* Bottom Left */}
                  <rect x="15" y="139" width="46" height="46" rx="6" fill="#0d0e12" />
                  <rect x="23" y="147" width="30" height="30" rx="3" fill="white" />
                  <rect x="30" y="154" width="16" height="16" rx="2" fill="#0d0e12" />

                  {/* Stylized QR Matrix Dots */}
                  <rect x="70" y="20" width="8" height="8" rx="1.5" fill="#0d0e12" />
                  <rect x="85" y="20" width="16" height="8" rx="1.5" fill="#0d0e12" />
                  <rect x="110" y="20" width="8" height="8" rx="1.5" fill="#0d0e12" />
                  <rect x="75" y="35" width="8" height="16" rx="1.5" fill="#0d0e12" />
                  <rect x="95" y="35" width="12" height="8" rx="1.5" fill="#0d0e12" />
                  <rect x="115" y="35" width="8" height="20" rx="1.5" fill="#0d0e12" />
                  <rect x="20" y="75" width="18" height="8" rx="1.5" fill="#0d0e12" />
                  <rect x="45" y="75" width="8" height="14" rx="1.5" fill="#0d0e12" />
                  <rect x="20" y="95" width="8" height="18" rx="1.5" fill="#0d0e12" />
                  <rect x="35" y="105" width="14" height="8" rx="1.5" fill="#0d0e12" />
                  <rect x="140" y="75" width="20" height="8" rx="1.5" fill="#0d0e12" />
                  <rect x="170" y="80" width="8" height="14" rx="1.5" fill="#0d0e12" />
                  <rect x="145" y="95" width="12" height="18" rx="1.5" fill="#0d0e12" />
                  <rect x="165" y="105" width="16" height="8" rx="1.5" fill="#0d0e12" />
                  <rect x="75" y="140" width="18" height="8" rx="1.5" fill="#0d0e12" />
                  <rect x="105" y="140" width="8" height="18" rx="1.5" fill="#0d0e12" />
                  <rect x="120" y="145" width="14" height="8" rx="1.5" fill="#0d0e12" />
                  <rect x="75" y="165" width="8" height="18" rx="1.5" fill="#0d0e12" />
                  <rect x="95" y="165" width="20" height="8" rx="1.5" fill="#0d0e12" />
                  <rect x="125" y="165" width="8" height="18" rx="1.5" fill="#0d0e12" />
                  <rect x="145" y="145" width="12" height="12" rx="1.5" fill="#0d0e12" />
                  <rect x="165" y="150" width="16" height="8" rx="1.5" fill="#0d0e12" />
                  <rect x="145" y="170" width="36" height="8" rx="1.5" fill="#0d0e12" />

                  {/* Center BE'MOON Logo badge */}
                  <circle cx="100" cy="100" r="18" fill="#0d0e12" />
                  <path d="M 97 90 A 10 10 0 1 0 105 108 A 12 12 0 1 1 97 90 Z" fill="white" />
                </svg>
              </div>
              <div className="mt-3 text-center">
                <div className="text-xs font-semibold text-white">{creator.name}</div>
                <div className="text-[11px] text-neutral-400 font-mono mt-0.5">bemoon.app/{creator.handle.replace('@', '')}</div>
              </div>
            </div>

            {/* Share buttons row */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10">
              {/* Telegram */}
              <button
                type="button"
                onClick={() => {
                  const url = `https://bemoon.app/${creator.handle.replace('@', '')}`;
                  window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`Профиль мастера ${creator.name} на BE'MOON`)}`, '_blank');
                }}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 group-hover:scale-105 transition-transform">
                  <Send size={18} />
                </div>
                <span className="text-[10px] text-neutral-400 group-hover:text-white">Telegram</span>
              </button>

              {/* WhatsApp */}
              <button
                type="button"
                onClick={() => {
                  const url = `https://bemoon.app/${creator.handle.replace('@', '')}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Профиль мастера ${creator.name} на BE'MOON: ${url}`)}`, '_blank');
                }}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
                  <MessageCircle size={18} />
                </div>
                <span className="text-[10px] text-neutral-400 group-hover:text-white">WhatsApp</span>
              </button>

              {/* VK */}
              <button
                type="button"
                onClick={() => {
                  const url = `https://bemoon.app/${creator.handle.replace('@', '')}`;
                  window.open(`https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(`Профиль мастера ${creator.name} на BE'MOON`)}`, '_blank');
                }}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600/20 text-sky-300 group-hover:scale-105 transition-transform">
                  <Globe size={18} />
                </div>
                <span className="text-[10px] text-neutral-400 group-hover:text-white">ВКонтакте</span>
              </button>

              {/* Copy link */}
              <button
                type="button"
                onClick={() => {
                  const url = `https://bemoon.app/${creator.handle.replace('@', '')}`;
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(url);
                  }
                  showToast('Ссылка на профиль скопирована');
                  setIsQrModalOpen(false);
                }}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white group-hover:scale-105 transition-transform">
                  <Copy size={18} />
                </div>
                <span className="text-[10px] text-neutral-400 group-hover:text-white">Ссылка</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
