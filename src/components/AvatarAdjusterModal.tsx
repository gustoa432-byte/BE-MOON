import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Check, RotateCcw, ZoomIn, ZoomOut, Upload, Move, Palette, Droplets, Layers, Sparkles } from 'lucide-react';
import { MasterSilhouette, isVideoMedia } from './MasterSilhouette';

export const PRESET_NAME_COLORS = [
  { label: 'Белый', value: '#FFFFFF' },
  { label: 'Серебро', value: '#E2E8F0' },
  { label: 'Изумруд', value: '#10B981' },
  { label: 'Неон мята', value: '#06B6D4' },
  { label: 'Электрик', value: '#38BDF8' },
  { label: 'Лаванда', value: '#A855F7' },
  { label: 'Фуксия', value: '#EC4899' },
  { label: 'Коралл', value: '#F97316' },
  { label: 'Золото', value: '#FBBF24' },
  { label: 'Лайм', value: '#84CC16' },
  { label: 'Кармин', value: '#EF4444' },
  { label: 'Графит', value: '#64748B' }
];

interface AvatarAdjusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatarUrl: string;
  name: string;
  initialScale?: number;
  initialOffsetX?: number;
  initialOffsetY?: number;
  initialNameColor?: string;
  initialNameOpacity?: number;
  initialNameAboveAvatar?: boolean;
  onSave: (config: {
    scale: number;
    offsetX: number;
    offsetY: number;
    nameColor: string;
    nameOpacity: number;
    nameAboveAvatar: boolean;
  }) => void;
  onUploadNewFile?: () => void;
  onOpenChromaKey?: () => void;
}

export const AvatarAdjusterModal: React.FC<AvatarAdjusterModalProps> = ({
  isOpen,
  onClose,
  avatarUrl,
  name,
  initialScale = 1,
  initialOffsetX = 0,
  initialOffsetY = 0,
  initialNameColor = '#FFFFFF',
  initialNameOpacity = 0.95,
  initialNameAboveAvatar = false,
  onSave,
  onUploadNewFile,
  onOpenChromaKey
}) => {
  const [scale, setScale] = useState<number>(initialScale);
  const [offsetX, setOffsetX] = useState<number>(initialOffsetX);
  const [offsetY, setOffsetY] = useState<number>(initialOffsetY);
  const [nameColor, setNameColor] = useState<string>(initialNameColor || '#FFFFFF');
  const [nameOpacity, setNameOpacity] = useState<number>(
    typeof initialNameOpacity === 'number' ? initialNameOpacity : 0.95
  );
  const [nameAboveAvatar, setNameAboveAvatar] = useState<boolean>(initialNameAboveAvatar || false);

  const isVideo = isVideoMedia(avatarUrl);
  const colorPickerInputRef = useRef<HTMLInputElement>(null);

  // Sync with props when opened
  useEffect(() => {
    if (isOpen) {
      setScale(initialScale || 1);
      setOffsetX(initialOffsetX || 0);
      setOffsetY(initialOffsetY || 0);
      setNameColor(initialNameColor || '#FFFFFF');
      setNameOpacity(typeof initialNameOpacity === 'number' ? initialNameOpacity : 0.95);
      setNameAboveAvatar(initialNameAboveAvatar || false);
    }
  }, [
    isOpen,
    initialScale,
    initialOffsetX,
    initialOffsetY,
    initialNameColor,
    initialNameOpacity,
    initialNameAboveAvatar
  ]);

  // Drag-to-pan & Pinch-to-zoom state
  const isDraggingRef = useRef(false);
  const touchDistanceRef = useRef<number | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; startOffsetX: number; startOffsetY: number; startScale: number }>({
    x: 0,
    y: 0,
    startOffsetX: 0,
    startOffsetY: 0,
    startScale: 1
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startOffsetX: offsetX,
      startOffsetY: offsetY,
      startScale: scale
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffsetX(Math.round(Math.max(-250, Math.min(250, dragStartRef.current.startOffsetX + dx))));
    setOffsetY(Math.round(Math.max(-200, Math.min(200, dragStartRef.current.startOffsetY + dy))));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    touchDistanceRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
  };

  // Touch pinch-to-zoom handler
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
      dragStartRef.current.startScale = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchDistanceRef.current;
      const nextScale = Math.max(0.5, Math.min(2.5, Number((dragStartRef.current.startScale * ratio).toFixed(2))));
      setScale(nextScale);
    }
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setScale((prev) => Math.max(0.5, Math.min(2.5, Number((prev + delta).toFixed(2)))));
  };

  const handleReset = useCallback(() => {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
    setNameColor('#FFFFFF');
    setNameOpacity(0.95);
    setNameAboveAvatar(false);
  }, []);

  const handleApply = () => {
    onSave({ scale, offsetX, offsetY, nameColor, nameOpacity, nameAboveAvatar });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] h-[100dvh] w-full bg-[#0d0e12] flex flex-col overflow-hidden select-none animate-in fade-in duration-150">
      {/* 1. Header (Monolithic full-screen top bar with safe-area support) */}
      <header
        style={{ paddingTop: 'max(8px, env(safe-area-inset-top, 8px))' }}
        className="flex-shrink-0 w-full border-b border-white/10 bg-neutral-950/80 backdrop-blur-md px-4 pb-2 flex items-center justify-between gap-3 z-30"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex-shrink-0">
            <Move size={15} />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
              Размер, положение и стиль имени
            </h3>
            <p className="text-[10px] text-neutral-400 truncate">
              {isVideo ? 'Живой видео-аватар' : 'Изображение силуэта'} • Перетаскивайте для сдвига
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none cursor-pointer flex-shrink-0"
        >
          <X size={16} />
        </button>
      </header>

      {/* 2. Interactive 3D Preview Stage (flex-1 dynamically fills available height with zero overflow) */}
      <div
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="relative flex-1 min-h-0 w-full bg-[#090a0d] overflow-hidden flex flex-col items-center justify-start pt-0 select-none cursor-grab active:cursor-grabbing touch-none z-10"
      >
        {/* Spatial background grid */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />

        {/* Layer 0 (z-0): Изумрудная Аура с анимацией дыхания */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-emerald-500/30 blur-[90px] pointer-events-none z-0 animate-aura-breathe"
          aria-hidden="true"
        />

        {/* Layer: Имя (z-10 если сзади, z-25 если спереди силуэта) */}
        <div
          className="absolute top-14 sm:top-18 left-0 right-0 flex flex-col items-center justify-center pointer-events-none px-4 select-none transition-all duration-150"
          style={{ zIndex: nameAboveAvatar ? 25 : 10 }}
        >
          <h1
            style={{
              color: nameColor,
              opacity: nameOpacity,
              textShadow: '0 4px 30px rgba(0,0,0,0.95)'
            }}
            className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-center leading-[0.88] font-['Syne',sans-serif] transition-all duration-150"
          >
            {name.includes(' ') ? (
              <>
                <span className="block">{name.split(' ')[0]}</span>
                <span className="block opacity-90">{name.split(' ').slice(1).join(' ')}</span>
              </>
            ) : (
              name
            )}
          </h1>
        </div>

        {/* Layer 20: Интерактивный силуэт мастера */}
        <div
          className="relative mt-0 flex items-end justify-center overflow-visible w-full max-w-full h-full pointer-events-none"
          style={{ zIndex: 20 }}
        >
          <MasterSilhouette
            avatarUrl={avatarUrl}
            name={name}
            scale={scale}
            offsetX={offsetX}
            offsetY={offsetY}
            className="w-full h-full"
          />
        </div>

        {/* Live interaction status badge */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] text-neutral-300 font-medium pointer-events-none flex items-center gap-1.5 shadow-xl whitespace-nowrap z-30">
          <span>✋ Тяните для сдвига</span>
          <span className="text-neutral-500">•</span>
          <span>{Math.round(scale * 100)}%</span>
        </div>
      </div>

      {/* 3. Monolithic Bottom Controls (Compact, zero scroll, all buttons, toggles & hotbars visible) */}
      <div
        style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))' }}
        className="flex-shrink-0 w-full bg-neutral-950 border-t border-white/10 px-3.5 pt-2.5 sm:px-6 sm:pt-3 space-y-2 z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
      >
        {/* ROW 1: ХОТБАР ЦВЕТОВ ИМЕНИ + ТУМБЛЕР СЛОЯ + ПРОЗРАЧНОСТЬ */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-300">
            <span className="flex items-center gap-1">
              <Palette size={13} className="text-emerald-400" />
              <span>Стиль имени</span>
            </span>

            <div className="flex items-center gap-2">
              {/* ТУМБЛЕР ПОРЯДКА СЛОЯ: СЗАДИ (3D) / СПЕРЕДИ */}
              <button
                type="button"
                onClick={() => setNameAboveAvatar(!nameAboveAvatar)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold transition-all active:scale-95 cursor-pointer ${
                  nameAboveAvatar
                    ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                }`}
                title="Переключить: имя поверх силуэта или за силуэтом"
              >
                <Layers size={11} className={nameAboveAvatar ? 'text-emerald-400' : 'text-neutral-400'} />
                <span>{nameAboveAvatar ? 'Имя спереди' : 'Имя сзади (3D)'}</span>
              </button>

              <span className="flex items-center gap-1 text-[10px] text-neutral-400 font-mono">
                <Droplets size={11} className="text-emerald-400" />
                <span>{Math.round(nameOpacity * 100)}%</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Color Hotbar (Horizontal Scrollable Palette) */}
            <div className="flex-1 flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none no-scrollbar">
              {PRESET_NAME_COLORS.map((c) => {
                const isSelected = nameColor.toLowerCase() === c.value.toLowerCase();
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setNameColor(c.value)}
                    title={c.label}
                    className={`relative flex-shrink-0 h-6 w-6 rounded-full transition-transform active:scale-90 cursor-pointer focus:outline-none flex items-center justify-center ${
                      isSelected
                        ? 'scale-110 ring-2 ring-emerald-400 ring-offset-2 ring-offset-neutral-950 shadow-md'
                        : 'hover:scale-105 opacity-80 hover:opacity-100 ring-1 ring-white/15'
                    }`}
                    style={{ backgroundColor: c.value }}
                  >
                    {isSelected && (
                      <Check
                        size={11}
                        strokeWidth={3}
                        className={
                          ['#ffffff', '#e2e8f0', '#fbbf24', '#84cc16'].includes(c.value.toLowerCase())
                            ? 'text-neutral-950'
                            : 'text-white'
                        }
                      />
                    )}
                  </button>
                );
              })}

              {/* Custom Color Picker Button */}
              <button
                type="button"
                onClick={() => colorPickerInputRef.current?.click()}
                title="Выбрать свой цвет"
                className="relative flex-shrink-0 h-6 w-6 rounded-full bg-gradient-to-tr from-rose-500 via-emerald-400 to-sky-400 ring-1 ring-white/20 hover:scale-105 transition-transform flex items-center justify-center cursor-pointer focus:outline-none active:scale-95 ml-0.5"
              >
                <span className="text-[10px] font-black text-neutral-950 leading-none">+</span>
                <input
                  ref={colorPickerInputRef}
                  type="color"
                  value={nameColor}
                  onChange={(e) => setNameColor(e.target.value)}
                  className="sr-only"
                />
              </button>
            </div>

            {/* Opacity Slider */}
            <div className="w-28 sm:w-36 flex items-center gap-1.5 flex-shrink-0 pl-1.5 border-l border-white/10">
              <input
                type="range"
                min="0.15"
                max="1"
                step="0.05"
                value={nameOpacity}
                onChange={(e) => setNameOpacity(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                title={`Прозрачность: ${Math.round(nameOpacity * 100)}%`}
              />
            </div>
          </div>
        </div>

        {/* ROW 2: МАСШТАБ (ZOOM) + ПОЗИЦИЯ X/Y */}
        <div className="grid grid-cols-2 gap-2.5 pt-1.5 border-t border-white/5">
          {/* Zoom Slider */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-300">
              <span className="flex items-center gap-1">
                <ZoomIn size={12} className="text-emerald-400" />
                <span>Масштаб</span>
              </span>
              <div className="flex items-center gap-1">
                <span className="text-emerald-400 font-mono text-[10px] font-bold">{scale.toFixed(2)}x</span>
                {scale !== 1 && (
                  <button
                    type="button"
                    onClick={() => setScale(1)}
                    className="text-[9px] text-neutral-400 hover:text-white underline cursor-pointer"
                  >
                    1x
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setScale((prev) => Math.max(0.5, Number((prev - 0.1).toFixed(2))))}
                className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors cursor-pointer flex-shrink-0 active:scale-95"
              >
                <ZoomOut size={11} />
              </button>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.02"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
              />
              <button
                type="button"
                onClick={() => setScale((prev) => Math.min(2.5, Number((prev + 0.1).toFixed(2))))}
                className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors cursor-pointer flex-shrink-0 active:scale-95"
              >
                <ZoomIn size={11} />
              </button>
            </div>
          </div>

          {/* Combined Quick Position (X & Y) */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-300">
              <span>Сдвиг (↕ Y / ↔ X)</span>
              <span className="text-neutral-400 font-mono text-[10px]">
                {offsetY > 0 ? `+${offsetY}` : offsetY} / {offsetX > 0 ? `+${offsetX}` : offsetX}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="range"
                min="-200"
                max="200"
                step="1"
                value={offsetY}
                onChange={(e) => setOffsetY(parseInt(e.target.value, 10))}
                className="w-1/2 accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                title={`По вертикали (Y): ${offsetY}px`}
              />
              <input
                type="range"
                min="-250"
                max="250"
                step="1"
                value={offsetX}
                onChange={(e) => setOffsetX(parseInt(e.target.value, 10))}
                className="w-1/2 accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                title={`По горизонтали (X): ${offsetX}px`}
              />
            </div>
          </div>
        </div>

        {/* ROW 3: КНОПКИ ДЕЙСТВИЙ (СБРОС + ЗАМЕНИТЬ + ПРИМЕНИТЬ) */}
        <div className="pt-1.5 border-t border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-semibold transition-colors cursor-pointer focus:outline-none active:scale-95"
              title="Сбросить все параметры"
            >
              <RotateCcw size={12} />
              <span>Сброс</span>
            </button>

            {onUploadNewFile && (
              <button
                type="button"
                onClick={() => {
                  onUploadNewFile();
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 text-[11px] font-medium border border-white/10 transition-colors cursor-pointer focus:outline-none active:scale-95"
              >
                <Upload size={12} />
                <span>Заменить</span>
              </button>
            )}

            {onOpenChromaKey && (
              <button
                type="button"
                onClick={onOpenChromaKey}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 transition-colors cursor-pointer focus:outline-none active:scale-95"
                title="Удалить хромакей (зелёный фон) прямо на устройстве"
              >
                <Sparkles size={12} />
                <span>Хромакей</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 max-w-[200px] flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-all active:scale-95 shadow-lg shadow-emerald-500/25 cursor-pointer focus:outline-none"
          >
            <Check size={15} strokeWidth={2.5} />
            <span>Применить</span>
          </button>
        </div>
      </div>
    </div>
  );
};
