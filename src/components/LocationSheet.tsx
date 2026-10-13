import React, { useState } from 'react';
import { Navigation, MapPin, Compass, Check, Map as MapIcon, Sliders } from 'lucide-react';
import { CITIES, SIMFEROPOL_DISTRICTS } from '../data/mockWorks';
import { WorkItem } from '../types';
import { BeMoonLogo } from './BeMoonLogo';

interface LocationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: string;
  onSelectCity: (city: string) => void;
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  isPreciseLocation: boolean;
  onTogglePreciseLocation: (enable: boolean) => void;
  streetName: string;
  radiusKm: number;
  onSelectRadius: (radius: number) => void;
  works: WorkItem[];
  onSelectWork: (work: WorkItem) => void;
}

export const LocationSheet: React.FC<LocationSheetProps> = ({
  isOpen,
  onClose,
  selectedCity,
  onSelectCity,
  selectedDistrict,
  onSelectDistrict,
  isPreciseLocation,
  onTogglePreciseLocation,
  streetName,
  radiusKm,
  onSelectRadius,
  works,
  onSelectWork
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'map'>('settings');
  const [selectedMapWork, setSelectedMapWork] = useState<WorkItem | null>(null);

  if (!isOpen) return null;

  const radiusOptions = [
    { label: '500 м', value: 0.5 },
    { label: '1.5 км', value: 1.5 },
    { label: '3 км', value: 3 },
    { label: '10 км', value: 10 },
    { label: 'Весь город', value: 999 }
  ];

  return (
    <div className="fixed inset-0 z-50 h-[100dvh] w-full bg-[#0d0e12] text-white overflow-y-auto overflow-x-hidden animate-in fade-in duration-200">
      {/* Top Floating Glass Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
        <div className="absolute inset-x-0 top-0 top-feed-vignette min-h-24 w-full" />
        <div
          style={{ paddingTop: 'max(10px, env(safe-area-inset-top, 10px))' }}
          className="relative mx-auto max-w-2xl px-3 pb-2 flex items-center justify-between gap-2"
        >
          {/* Logo Anchor: Return to Feed */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Вернуться в ленту"
            className="group pointer-events-auto flex items-center transition-transform active:scale-95 cursor-pointer focus:outline-none"
          >
            <BeMoonLogo size={32} isBackAnchor />
          </button>

          {/* Location / Map Switcher */}
          <div className="pointer-events-auto flex items-center rounded-full bg-neutral-950/85 p-0.5 border border-white/15 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-white text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sliders size={12} />
              <span>Локация</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === 'map'
                  ? 'bg-white text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <MapIcon size={12} />
              <span>Карта</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-2xl px-4 pt-18 pb-32">
        {activeTab === 'settings' ? (
          <div className="space-y-6">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 font-['Syne',sans-serif]">
                Геолокация
              </span>
              <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">Где я</h1>
            </div>

            {/* Precise GPS Card */}
            <div className="rounded-2xl bg-neutral-900/80 p-4 border border-white/5 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                    isPreciseLocation ? 'bg-sky-500/20 text-sky-400' : 'bg-white/5 text-neutral-400'
                  }`}>
                    <Navigation size={18} className={isPreciseLocation ? 'rotate-45' : ''} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      Точный адрес (ул. Пушкина)
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-400">
                      {isPreciseLocation ? `${selectedCity}, ${streetName}` : 'Показывать работы мастеров рядом с вашей улицей'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onTogglePreciseLocation(!isPreciseLocation)}
                  className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors ${
                    isPreciseLocation ? 'bg-white' : 'bg-neutral-800'
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full shadow-md transition-transform ${
                      isPreciseLocation ? 'translate-x-5 bg-neutral-950' : 'translate-x-0 bg-neutral-400'
                    }`}
                  />
                </button>
              </div>

              {isPreciseLocation && (
                <div className="mt-3.5 pt-3.5 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Текущий адрес:</span>
                  <span className="font-medium text-sky-400">{streetName}</span>
                </div>
              )}
            </div>

            {/* Radius Selector */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-['Syne',sans-serif]">
                  Радиус поиска
                </span>
                <span className="text-xs text-neutral-300 font-medium">
                  {radiusKm >= 999 ? 'Весь город' : `до ${radiusKm} км`}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {radiusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onSelectRadius(opt.value)}
                    className={`rounded-xl py-2.5 text-center text-xs font-medium transition-all ${
                      radiusKm === opt.value
                        ? 'bg-white text-neutral-950 font-bold shadow-md'
                        : 'bg-neutral-900/80 text-neutral-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* City Selection */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2.5 font-['Syne',sans-serif]">
                Город
              </span>
              <div className="grid grid-cols-3 gap-2">
                {CITIES.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => onSelectCity(city)}
                    className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-xs font-medium transition-all ${
                      selectedCity === city
                        ? 'bg-white text-neutral-950 font-bold shadow-md'
                        : 'bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800 border border-white/5'
                    }`}
                  >
                    <span>{city}</span>
                    {selectedCity === city && <Check size={14} className="text-neutral-950" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Districts (if Simferopol) */}
            {selectedCity === 'Симферополь' && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2.5 font-['Syne',sans-serif]">
                  Район Симферополя
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SIMFEROPOL_DISTRICTS.map((district) => (
                    <button
                      key={district}
                      type="button"
                      onClick={() => onSelectDistrict(district)}
                      className={`rounded-xl px-3.5 py-2 text-xs transition-all ${
                        selectedDistrict === district
                          ? 'bg-white text-neutral-950 font-bold shadow-md'
                          : 'bg-neutral-900/80 text-neutral-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {district}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Visual Dark Map */
          <div className="relative h-[65vh] rounded-3xl bg-[#0a0b0e] overflow-hidden border border-white/10 flex flex-col">
            <div className="relative flex-1 overflow-hidden select-none">
              <svg className="absolute inset-0 h-full w-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="gridMap" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#gridMap)" />
                <path d="M -50 200 Q 150 160 300 240 T 500 300" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" fill="none" />
                <path d="M 120 -50 Q 160 180 200 450" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />
                <path d="M 30 350 Q 200 300 450 150" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" />
                <path d="M 40 10 Q 140 120 220 230 T 360 480" stroke="#38bdf8" strokeWidth="3" strokeOpacity="0.4" fill="none" />
              </svg>

              <div className="absolute top-[48%] left-[48%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                <span className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-sky-400 opacity-30"></span>
                <div className="h-5 w-5 rounded-full bg-sky-500 ring-4 ring-sky-500/30 shadow-lg flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
              </div>

              {works.slice(0, 10).map((work, idx) => {
                const positions = [
                  { top: '35%', left: '32%' },
                  { top: '56%', left: '60%' },
                  { top: '28%', left: '62%' },
                  { top: '65%', left: '35%' },
                  { top: '42%', left: '72%' },
                  { top: '68%', left: '75%' },
                  { top: '22%', left: '44%' },
                  { top: '78%', left: '50%' },
                  { top: '40%', left: '22%' },
                  { top: '55%', left: '18%' }
                ];
                const pos = positions[idx % positions.length];
                const isSelected = selectedMapWork?.id === work.id;

                return (
                  <button
                    key={work.id}
                    type="button"
                    onClick={() => setSelectedMapWork(work)}
                    style={{ top: pos.top, left: pos.left }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all duration-200 z-10 ${
                      isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                    }`}
                  >
                    <div className="relative flex flex-col items-center">
                      <div className={`h-10 w-10 overflow-hidden rounded-full ring-2 shadow-xl ${
                        isSelected ? 'ring-white' : 'ring-white/40'
                      }`}>
                        <img src={work.image} alt={work.title} className="h-full w-full object-cover" />
                      </div>
                      <span className="mt-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-md whitespace-nowrap">
                        {work.creator.distanceText}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedMapWork && (
              <div className="p-3.5 bg-neutral-900/95 border-t border-white/10 backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={selectedMapWork.image}
                    alt={selectedMapWork.title}
                    className="h-11 w-11 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-white truncate">
                      {selectedMapWork.title}
                    </div>
                    <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                      <span>{selectedMapWork.creator.name}</span>
                      <span>·</span>
                      <span className="text-sky-400">{selectedMapWork.creator.distanceText}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectWork(selectedMapWork);
                    onClose();
                  }}
                  className="flex-shrink-0 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-neutral-950 transition-colors hover:bg-neutral-200"
                >
                  Смотреть
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Bottom Apply Button */}
      <div
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
        className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-[#0d0e12] via-[#0d0e12]/95 to-transparent pt-6 px-4"
      >
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-13 rounded-2xl bg-white text-center text-xs font-bold uppercase tracking-wider text-neutral-950 shadow-[0_8px_24px_rgba(255,255,255,0.15)] transition-all hover:bg-neutral-200 active:scale-[0.99]"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
};
