import React, { useState } from 'react';
import { Upload, Sparkles, Check } from 'lucide-react';
import { WorkItem, Creator } from '../types';
import { BeMoonLogo } from './BeMoonLogo';

interface AddWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Creator;
  onAddWork: (work: WorkItem) => void;
}

const SAMPLE_PHOTO_PRESETS = [
  {
    title: 'Кофейный столик из карагача',
    url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=900&q=85',
    category: 'Мебель & Дерево',
    mediaType: 'image' as const
  },
  {
    title: 'Керамика на гончарном круге (Видео)',
    url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=85',
    videoUrl: '/videos/preview/ceramics.mp4',
    category: 'Керамика & Декор',
    mediaType: 'video' as const
  },
  {
    title: 'Кожаный картхолдер ручного шва',
    url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=85',
    category: 'Кожа & Ремесло',
    mediaType: 'image' as const
  },
  {
    title: 'Стрижка и сведение в движении (Видео)',
    url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=900&q=85',
    videoUrl: '/videos/preview/barber.mp4',
    category: 'Стиль & Волосы',
    mediaType: 'video' as const
  }
];

export const AddWorkModal: React.FC<AddWorkModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAddWork
}) => {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState(SAMPLE_PHOTO_PRESETS[0].url);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [category, setCategory] = useState('Мебель & Дерево');
  const [price, setPrice] = useState('12 000');
  const [turnaroundTime, setTurnaroundTime] = useState('3 дня');
  const [description, setDescription] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const numericPrice = parseInt(price.replace(/\D/g, ''), 10) || 0;
    const newWork: WorkItem = {
      id: `work-user-${Date.now()}`,
      title,
      image: imageUrl,
      mediaType,
      videoUrl: mediaType === 'video' ? (videoUrl || imageUrl) : undefined,
      previewVideoUrl: mediaType === 'video' ? (videoUrl || imageUrl) : undefined,
      poster: imageUrl,
      aspectRatio: 'tall',
      category,
      creator: currentUser,
      price: numericPrice,
      priceFormatted: `${numericPrice.toLocaleString('ru-RU')} ₽`,
      turnaroundTime: turnaroundTime || 'По договоренности',
      likesCount: 1,
      isLiked: false,
      availableToday: true,
      description: description || 'Авторская работа мастера ручной работы.'
    };

    onAddWork(newWork);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 900);
  };

  const handleSelectPreset = (preset: typeof SAMPLE_PHOTO_PRESETS[0]) => {
    setTitle(preset.title);
    setImageUrl(preset.url);
    setCategory(preset.category);
    setMediaType(preset.mediaType);
    setVideoUrl(preset.videoUrl);
  };

  return (
    <div className="fixed inset-0 z-50 h-[100dvh] w-full bg-[#0d0e12] text-white overflow-y-auto overflow-x-hidden animate-in fade-in duration-200">
      {/* Top Floating Glass Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
        <div className="absolute inset-x-0 top-0 top-feed-vignette min-h-24 w-full" />
        <div
          style={{ paddingTop: 'max(10px, env(safe-area-inset-top, 10px))' }}
          className="relative mx-auto max-w-2xl px-3 pb-2 flex items-center justify-between gap-2"
        >
          {/* Logo Anchor: Back to Profile */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Вернуться назад"
            className="group pointer-events-auto flex items-center transition-transform active:scale-95 cursor-pointer focus:outline-none"
          >
            <BeMoonLogo size={32} isBackAnchor />
          </button>
        </div>
      </header>

      {/* Main Content Form */}
      <div className="mx-auto max-w-2xl px-4 pt-18 pb-28">
        <div className="mb-6">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 font-['Syne',sans-serif]">
            Кабинет мастера
          </span>
          <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">Опубликовать новую работу</h1>
        </div>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95 duration-200">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-4 ring-1 ring-emerald-500/30">
              <Check size={32} />
            </div>
            <h3 className="text-lg font-bold text-white">Работа успешно добавлена!</h3>
            <p className="mt-1 text-xs text-neutral-400">Она мгновенно появилась в ленте мастеров</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Quick Sample Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" />
                <span>Быстрый выбор готового демо-образца:</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SAMPLE_PHOTO_PRESETS.map((preset, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() => handleSelectPreset(preset)}
                    className={`relative flex flex-col overflow-hidden rounded-xl border p-1 text-left transition-all ${
                      imageUrl === preset.url
                        ? 'border-white bg-white/10 ring-1 ring-white'
                        : 'border-white/5 bg-neutral-900/60 hover:border-white/20'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.title}
                      className="h-20 w-full rounded-lg object-cover"
                    />
                    <span className="mt-1.5 line-clamp-1 text-[11px] font-medium text-white px-1">
                      {preset.title}
                    </span>
                    <span className="text-[9px] text-neutral-400 px-1 mb-0.5">{preset.category}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">Название работы / услуги *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="например: Кофейный столик из карагача"
                className="w-full rounded-xl bg-neutral-900/80 px-3.5 py-3 text-sm text-white placeholder:text-neutral-500 border border-white/10 focus:border-white focus:outline-none transition-colors"
              />
            </div>

            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">Категория ремесла</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl bg-neutral-900/80 px-3.5 py-3 text-sm text-white border border-white/10 focus:border-white focus:outline-none transition-colors"
              >
                <option value="Мебель & Дерево">Мебель & Дерево</option>
                <option value="Стиль & Волосы">Стиль & Волосы</option>
                <option value="Керамика & Декор">Керамика & Декор</option>
                <option value="Тату & Пирсинг">Тату & Пирсинг</option>
                <option value="Кожа & Ремесло">Кожа & Ремесло</option>
                <option value="Авто & Детейлинг">Авто & Детейлинг</option>
                <option value="Гастрономия">Гастрономия</option>
                <option value="Фото & Видео">Фото & Видео</option>
              </select>
            </div>

            {/* Price and turnaround row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Стоимость (₽)</label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="12 000"
                  className="w-full rounded-xl bg-neutral-900/80 px-3.5 py-3 text-sm text-white placeholder:text-neutral-500 border border-white/10 focus:border-white focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Срок готовности</label>
                <input
                  type="text"
                  value={turnaroundTime}
                  onChange={(e) => setTurnaroundTime(e.target.value)}
                  placeholder="3 дня / 1 час"
                  className="w-full rounded-xl bg-neutral-900/80 px-3.5 py-3 text-sm text-white placeholder:text-neutral-500 border border-white/10 focus:border-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">Описание и детали</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Расскажите о материалах, технике или особенностях процесса..."
                className="w-full rounded-xl bg-neutral-900/80 px-3.5 py-3 text-sm text-white placeholder:text-neutral-500 border border-white/10 focus:border-white focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                className="flex w-full h-13 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-bold text-neutral-950 shadow-[0_8px_24px_rgba(255,255,255,0.15)] transition-all hover:bg-neutral-200 active:scale-[0.99] focus:outline-none"
              >
                <Upload size={17} />
                <span>Опубликовать в ленту</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
