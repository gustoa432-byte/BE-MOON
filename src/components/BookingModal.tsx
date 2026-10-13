import React, { useState } from 'react';
import { Calendar, Check, Camera, Image, X } from 'lucide-react';
import { WorkItem, Creator, Booking } from '../types';
import { BeMoonLogo } from './BeMoonLogo';

interface BookingModalProps {
  work: WorkItem | null;
  creator?: Creator | null;
  onClose: () => void;
  onConfirmBooking: (booking: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  work,
  creator: explicitCreator,
  onClose,
  onConfirmBooking
}) => {
  const [selectedDate, setSelectedDate] = useState('Сегодня, 2 октября');
  const [selectedTime, setSelectedTime] = useState('14:30');
  const [clientName, setClientName] = useState('Александр');
  const [clientPhone, setClientPhone] = useState('+7 (978) 450-22-19');
  const [orderNotes, setOrderNotes] = useState('');
  const [referencePhoto, setReferencePhoto] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const activeCreator = work?.creator || explicitCreator;
  if (!work && !explicitCreator) return null;

  const targetTitle = work ? work.title : 'Индивидуальный заказ / Запись к мастеру';
  const targetImage = work ? work.image : (activeCreator?.avatar || '');
  const targetPrice = work ? work.priceFormatted : 'По договоренности';
  const targetAddress = activeCreator?.locationText || 'Симферополь';

  const dates = [
    'Сегодня, 2 октября',
    'Завтра, 3 октября',
    'Суббота, 4 октября',
    'Понедельник, 6 октября'
  ];

  const timeSlots = ['11:00', '13:00', '14:30', '16:00', '18:30'];

  const sampleReferences = [
    { title: 'Лофт-стиль', url: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=400&q=80' },
    { title: 'Минимализм', url: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=400&q=80' },
    { title: 'Слэб дуба', url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      workId: work ? work.id : 'custom-order',
      workTitle: targetTitle,
      workImage: referencePhoto || targetImage,
      creatorName: activeCreator?.name || 'Мастер',
      creatorAvatar: activeCreator?.avatar || '',
      date: selectedDate,
      time: selectedTime,
      priceFormatted: targetPrice,
      status: 'confirmed',
      address: targetAddress
    };

    setIsSuccess(true);
    setTimeout(() => {
      onConfirmBooking(newBooking);
      setIsSuccess(false);
      onClose();
    }, 1200);
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
          {/* Logo Anchor: Back to Work Detail */}
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
            Бронирование
          </span>
          <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">Запись к мастеру</h1>
        </div>

        {isSuccess ? (
          <div className="py-20 text-center animate-in fade-in zoom-in duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
              <Check size={32} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">Вы успешно записаны!</h3>
            <p className="mt-1 text-xs text-neutral-400">
              {activeCreator?.name} ждёт вас: {selectedDate}, {selectedTime}
            </p>
            <p className="mt-2 text-[11px] text-neutral-500">
              Запись добавлена в раздел «Заказы» вашего кабинета
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Target work / Creator preview card */}
            <div className="flex items-center gap-3.5 rounded-2xl bg-neutral-900/80 p-3.5 border border-white/5 backdrop-blur-sm">
              <img src={referencePhoto || targetImage} alt={targetTitle} className="h-14 w-14 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{targetTitle}</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">{activeCreator?.name} · {targetPrice}</div>
                <div className="text-[10px] text-neutral-500 mt-1 truncate">{targetAddress}</div>
              </div>
            </div>

            {/* Photo Reference (Attachment) */}
            <div className="rounded-2xl bg-neutral-900/50 p-3.5 border border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-['Syne',sans-serif] flex items-center gap-1.5">
                  <Camera size={13} className="text-white/80" />
                  <span>Фото-референс заказа</span>
                </label>
                {referencePhoto && (
                  <button
                    type="button"
                    onClick={() => setReferencePhoto(null)}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <X size={12} />
                    <span>Удалить</span>
                  </button>
                )}
              </div>

              {referencePhoto ? (
                <div className="relative h-28 w-full rounded-xl overflow-hidden ring-1 ring-white/10">
                  <img src={referencePhoto} alt="Референс" className="h-full w-full object-cover" />
                  <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/70 px-2 py-0.5 text-[10px] text-emerald-400 font-medium">
                    Референс прикреплен
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-neutral-400">
                    Выберите пример стиля или прикрепите фото желаемого результата:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {sampleReferences.map((ref) => (
                      <button
                        key={ref.title}
                        type="button"
                        onClick={() => setReferencePhoto(ref.url)}
                        className="group relative h-16 rounded-xl overflow-hidden border border-white/10 text-left focus:outline-none cursor-pointer"
                      >
                        <img src={ref.url} alt={ref.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors flex items-end p-1.5">
                          <span className="text-[10px] font-semibold text-white truncate">{ref.title}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Date selection */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2 font-['Syne',sans-serif]">
                Выберите дату
              </span>
              <div className="grid grid-cols-2 gap-2">
                {dates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`rounded-xl p-3 text-left text-xs transition-all ${
                      selectedDate === d
                        ? 'bg-white text-neutral-950 font-bold shadow-md'
                        : 'bg-neutral-900/80 text-neutral-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Time slots */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2 font-['Syne',sans-serif]">
                Свободное время
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {timeSlots.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTime(t)}
                    className={`rounded-xl py-3 text-center text-xs font-medium transition-all ${
                      selectedTime === t
                        ? 'bg-white text-neutral-950 font-bold shadow-md'
                        : 'bg-neutral-900/80 text-neutral-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Client Inputs */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Ваше имя</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full rounded-xl bg-neutral-900/80 px-3.5 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white border border-white/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Номер телефона для связи</label>
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Номер телефона для связи"
                  className="w-full rounded-xl bg-neutral-900/80 px-3.5 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white border border-white/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Пожелания к заказу / Размеры / Материал</label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Опишите ваши пожелания, цвет, породу дерева, габариты..."
                  className="w-full rounded-xl bg-neutral-900/80 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-white border border-white/10 resize-none"
                />
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-3">
              <button
                type="submit"
                className="w-full h-13 rounded-2xl bg-white text-center text-xs font-bold uppercase tracking-wider text-neutral-950 shadow-[0_8px_24px_rgba(255,255,255,0.15)] transition-all hover:bg-neutral-200 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar size={16} />
                <span>Подтвердить запись ({targetPrice})</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
