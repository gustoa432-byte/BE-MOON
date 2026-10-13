import React from 'react';
import { Search, RotateCcw, X } from 'lucide-react';
import { CategoryFilter } from '../types';
import { BeMoonLogo } from './BeMoonLogo';

interface SearchFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: CategoryFilter;
  onSelectCategory: (cat: CategoryFilter) => void;
  priceFilter: 'all' | 'under3k' | 'mid' | 'premium';
  onSelectPriceFilter: (p: 'all' | 'under3k' | 'mid' | 'premium') => void;
  onlyToday: boolean;
  onToggleOnlyToday: (val: boolean) => void;
  onResetFilters: () => void;
  matchingCount: number;
}

const CATEGORIES: CategoryFilter[] = [
  'Все',
  'Стиль & Волосы',
  'Тату & Пирсинг',
  'Керамика & Декор',
  'Авто & Детейлинг',
  'Гастрономия',
  'Мебель & Дерево',
  'Ремонт & Интерьер',
  'Фото & Видео',
  'Кожа & Ремесло',
  'Инженерия',
  'Маникюр & Уход',
  'Флористика'
];

export const SearchFilterSheet: React.FC<SearchFilterSheetProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  priceFilter,
  onSelectPriceFilter,
  onlyToday,
  onToggleOnlyToday,
  onResetFilters,
  matchingCount
}) => {
  if (!isOpen) return null;

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

          {/* Reset Filters button */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onResetFilters}
              aria-label="Сбросить фильтры"
              className="flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-neutral-950/85 backdrop-blur-md text-neutral-300 ring-1 ring-white/15 transition-all hover:bg-neutral-900 hover:text-white active:scale-95 focus:outline-none text-xs font-semibold"
            >
              <RotateCcw size={13} />
              <span>Сброс</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Filter Content */}
      <div className="mx-auto max-w-2xl px-4 pt-18 pb-32 space-y-6">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 font-['Syne',sans-serif]">
            Поиск и фильтры
          </span>
          <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">Что ищу</h1>
        </div>

        {/* Search Query Input */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Стрижка, торт, тату, керамика, мебель..."
            className="w-full rounded-2xl bg-neutral-900/90 py-3.5 pl-11 pr-11 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white border border-white/10 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Availability Switch */}
        <div className="flex items-center justify-between rounded-2xl bg-neutral-900/70 p-4 border border-white/5 backdrop-blur-sm">
          <div>
            <div className="text-xs font-bold text-white">Доступно сегодня / в наличии</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Показать только тех, кто свободен прямо сейчас</div>
          </div>

          <button
            type="button"
            onClick={() => onToggleOnlyToday(!onlyToday)}
            className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors ${
              onlyToday ? 'bg-white' : 'bg-neutral-800'
            }`}
          >
            <div
              className={`h-5 w-5 rounded-full shadow-md transition-transform ${
                onlyToday ? 'translate-x-5 bg-neutral-950' : 'translate-x-0 bg-neutral-400'
              }`}
            />
          </button>
        </div>

        {/* Categories Grid */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2.5 font-['Syne',sans-serif]">
            Категория ремесла
          </span>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`rounded-xl px-3.5 py-2.5 text-xs transition-all ${
                  selectedCategory === cat
                    ? 'bg-white text-neutral-950 font-bold shadow-md'
                    : 'bg-neutral-900/80 text-neutral-400 hover:text-white border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Price Budget */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2.5 font-['Syne',sans-serif]">
            Бюджет
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'all', label: 'Любая цена' },
              { id: 'under3k', label: 'до 3 000 ₽' },
              { id: 'mid', label: '3 000 – 15 000 ₽' },
              { id: 'premium', label: 'от 15 000 ₽' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPriceFilter(p.id as any)}
                className={`rounded-xl py-3 px-2 text-center text-xs transition-all ${
                  priceFilter === p.id
                    ? 'bg-white text-neutral-950 font-bold shadow-md'
                    : 'bg-neutral-900/80 text-neutral-400 hover:text-white border border-white/5'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
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
            className="w-full h-13 rounded-2xl bg-white text-center text-xs font-bold uppercase tracking-wider text-neutral-950 shadow-[0_8px_24px_rgba(255,255,255,0.15)] transition-all hover:bg-neutral-200 active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <span>Показать результаты</span>
            <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] text-white">
              {matchingCount}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
