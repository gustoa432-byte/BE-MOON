import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Heart,
  Calendar,
  Clock,
  Bell,
  MessageCircle,
  Settings,
  Sliders,
  Sparkles,
  ChevronRight,
  Send,
  X,
  LayoutGrid,
  Info,
  Briefcase,
  CheckCircle2,
  MapPin,
  Phone,
  ExternalLink,
  Copy,
  Navigation,
  Globe,
  Trash2,
  Lock,
  AlertCircle,
  QrCode,
  UserCheck,
  Upload,
  Move
} from 'lucide-react';
import { Creator, WorkItem, Booking, WorkingDay, PriceItem } from '../types';
import { WorkCard } from './WorkCard';
import { BeMoonLogo } from './BeMoonLogo';
import { MasterSilhouette, isVideoMedia } from './MasterSilhouette';
import { AnimatedEmeraldAura } from './AnimatedEmeraldAura';
import { AvatarAdjusterModal } from './AvatarAdjusterModal';
import { ChromaKeyStudioModal } from './ChromaKeyStudioModal';

// Minimalist iOS Switcher Component
const IosSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? 'bg-emerald-500' : 'bg-neutral-800'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

interface ProfileScreenProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Creator;
  userWorks: WorkItem[];
  likedWorks: WorkItem[];
  bookings: Booking[];
  onSelectWork: (work: WorkItem) => void;
  onToggleLike: (workId: string, e: React.MouseEvent) => void;
  likedIds: Set<string>;
  onOpenAddWork: () => void;
  onOpenChatWithCreator?: (creator: Creator, work?: WorkItem) => void;
  onUpdateCurrentUser?: (updated: Creator) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  isOpen,
  onClose,
  currentUser,
  userWorks,
  likedWorks,
  bookings,
  onSelectWork,
  onToggleLike,
  likedIds,
  onOpenAddWork,
  onOpenChatWithCreator,
  onUpdateCurrentUser
}) => {
  const [activeTab, setActiveTab] = useState<'works' | 'liked' | 'bookings' | 'history'>('works');

  // Multi-action FAB Popover state
  const [isFabOpen, setIsFabOpen] = useState(false);

  // Control Center Drawer States
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'notifications' | 'direct' | 'settings'>('none');
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(2);

  // QR Share Sheet state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Editable Profile States (Control Panel)
  const [name, setName] = useState(currentUser.name);
  const [handle, setHandle] = useState(currentUser.handle);
  const [role, setRole] = useState(currentUser.role);
  const [bio, setBio] = useState(currentUser.bio);
  const [avatar, setAvatar] = useState(() => {
    try {
      const savedAvatar = localStorage.getItem('bemoon_custom_avatar');
      if (savedAvatar) return savedAvatar;
    } catch {}
    return currentUser.avatar || '/master_cutout.png';
  });
  const [avatarScale, setAvatarScale] = useState<number>(() => {
    try {
      const savedUser = localStorage.getItem('bemoon_current_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (typeof parsed.avatarScale === 'number') return parsed.avatarScale;
      }
    } catch {}
    return currentUser.avatarScale || 1;
  });
  const [avatarOffsetX, setAvatarOffsetX] = useState<number>(() => {
    try {
      const savedUser = localStorage.getItem('bemoon_current_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (typeof parsed.avatarOffsetX === 'number') return parsed.avatarOffsetX;
      }
    } catch {}
    return currentUser.avatarOffsetX || 0;
  });
  const [avatarOffsetY, setAvatarOffsetY] = useState<number>(() => {
    try {
      const savedUser = localStorage.getItem('bemoon_current_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (typeof parsed.avatarOffsetY === 'number') return parsed.avatarOffsetY;
      }
    } catch {}
    return currentUser.avatarOffsetY || 0;
  });
  const [nameColor, setNameColor] = useState<string>(() => {
    try {
      const savedUser = localStorage.getItem('bemoon_current_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.nameColor) return parsed.nameColor;
      }
    } catch {}
    return currentUser.nameColor || '#FFFFFF';
  });
  const [nameOpacity, setNameOpacity] = useState<number>(() => {
    try {
      const savedUser = localStorage.getItem('bemoon_current_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (typeof parsed.nameOpacity === 'number') return parsed.nameOpacity;
      }
    } catch {}
    return typeof currentUser.nameOpacity === 'number' ? currentUser.nameOpacity : 0.95;
  });
  const [nameAboveAvatar, setNameAboveAvatar] = useState<boolean>(() => {
    try {
      const savedUser = localStorage.getItem('bemoon_current_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (typeof parsed.nameAboveAvatar === 'boolean') return parsed.nameAboveAvatar;
      }
    } catch {}
    return currentUser.nameAboveAvatar || false;
  });
  const [isAdjusterModalOpen, setIsAdjusterModalOpen] = useState(false);
  const [isChromaModalOpen, setIsChromaModalOpen] = useState(false);
  const [chromaInitialUrl, setChromaInitialUrl] = useState<string>('');
  const [coverImage, setCoverImage] = useState(
    currentUser.coverImage || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80'
  );

  const handleApplyChromaResult = (resultUrl: string, isVideoMediaResult: boolean) => {
    setAvatar(resultUrl);
    currentUser.avatar = resultUrl;
    try {
      localStorage.setItem('bemoon_custom_avatar', resultUrl);
      const savedUser = localStorage.getItem('bemoon_current_user');
      const parsed = savedUser ? JSON.parse(savedUser) : { ...currentUser };
      parsed.avatar = resultUrl;
      localStorage.setItem('bemoon_current_user', JSON.stringify(parsed));
    } catch {}

    if (onUpdateCurrentUser) {
      onUpdateCurrentUser({ ...currentUser, avatar: resultUrl });
    }
    showToast(
      isVideoMediaResult
        ? 'Видео-силуэт с удаленным хромакеем успешно установлен!'
        : 'Прозрачный силуэт мастера успешно установлен!'
    );
    setIsAdjusterModalOpen(true);
  };

  useEffect(() => {
    if (currentUser.avatar) {
      setAvatar(currentUser.avatar);
    }
    if (typeof currentUser.avatarScale === 'number') {
      setAvatarScale(currentUser.avatarScale);
    }
    if (typeof currentUser.avatarOffsetX === 'number') {
      setAvatarOffsetX(currentUser.avatarOffsetX);
    }
    if (typeof currentUser.avatarOffsetY === 'number') {
      setAvatarOffsetY(currentUser.avatarOffsetY);
    }
    if (currentUser.nameColor) {
      setNameColor(currentUser.nameColor);
    }
    if (typeof currentUser.nameOpacity === 'number') {
      setNameOpacity(currentUser.nameOpacity);
    }
    if (typeof currentUser.nameAboveAvatar === 'boolean') {
      setNameAboveAvatar(currentUser.nameAboveAvatar);
    }
  }, [
    currentUser.avatar,
    currentUser.avatarScale,
    currentUser.avatarOffsetX,
    currentUser.avatarOffsetY,
    currentUser.nameColor,
    currentUser.nameOpacity,
    currentUser.nameAboveAvatar
  ]);

  const handleSaveAvatarTransform = ({
    scale,
    offsetX,
    offsetY,
    nameColor: nextNameColor,
    nameOpacity: nextNameOpacity,
    nameAboveAvatar: nextNameAboveAvatar
  }: {
    scale: number;
    offsetX: number;
    offsetY: number;
    nameColor: string;
    nameOpacity: number;
    nameAboveAvatar: boolean;
  }) => {
    setAvatarScale(scale);
    setAvatarOffsetX(offsetX);
    setAvatarOffsetY(offsetY);
    setNameColor(nextNameColor);
    setNameOpacity(nextNameOpacity);
    setNameAboveAvatar(nextNameAboveAvatar);
    currentUser.avatarScale = scale;
    currentUser.avatarOffsetX = offsetX;
    currentUser.avatarOffsetY = offsetY;
    currentUser.nameColor = nextNameColor;
    currentUser.nameOpacity = nextNameOpacity;
    currentUser.nameAboveAvatar = nextNameAboveAvatar;

    try {
      const savedUser = localStorage.getItem('bemoon_current_user');
      const parsed = savedUser ? JSON.parse(savedUser) : { ...currentUser };
      parsed.avatarScale = scale;
      parsed.avatarOffsetX = offsetX;
      parsed.avatarOffsetY = offsetY;
      parsed.nameColor = nextNameColor;
      parsed.nameOpacity = nextNameOpacity;
      parsed.nameAboveAvatar = nextNameAboveAvatar;
      localStorage.setItem('bemoon_current_user', JSON.stringify(parsed));
    } catch {}

    if (onUpdateCurrentUser) {
      onUpdateCurrentUser({
        ...currentUser,
        avatarScale: scale,
        avatarOffsetX: offsetX,
        avatarOffsetY: offsetY,
        nameColor: nextNameColor,
        nameOpacity: nextNameOpacity,
        nameAboveAvatar: nextNameAboveAvatar
      });
    }
    showToast('Стиль имени и настройки силуэта сохранены!');
  };

  // Transparent avatar file input & upload handling
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo =
      file.type.startsWith('video/') ||
      file.name.match(/\.(webm|mp4|mov|m4v)$/i);
    const isImage =
      file.type.startsWith('image/') ||
      file.name.match(/\.(png|webp|gif)$/i);

    if (!isVideo && !isImage) {
      showToast('Поддерживаются форматы: WebM, MP4, MOV, PNG и WebP');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      if (isVideo) {
        setAvatar(dataUrl);
        currentUser.avatar = dataUrl;
        setChromaInitialUrl(dataUrl);
        showToast('Видео загружено в студию локального удаления хромакея!');

        try {
          localStorage.setItem('bemoon_custom_avatar', dataUrl);
          const savedUser = localStorage.getItem('bemoon_current_user');
          const parsed = savedUser ? JSON.parse(savedUser) : { ...currentUser };
          parsed.avatar = dataUrl;
          localStorage.setItem('bemoon_current_user', JSON.stringify(parsed));
        } catch {
          // Quota exceeded handled silently
        }

        if (onUpdateCurrentUser) {
          onUpdateCurrentUser({ ...currentUser, avatar: dataUrl });
        }
        setIsChromaModalOpen(true);
        return;
      }

      const img = new Image();
      img.onload = () => {
        let hasTransparency = false;
        try {
          const testCanvas = document.createElement('canvas');
          testCanvas.width = 32;
          testCanvas.height = 32;
          const ctx = testCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, 32, 32);
            const imgData = ctx.getImageData(0, 0, 32, 32).data;
            for (let i = 3; i < imgData.length; i += 4) {
              if (imgData[i] < 240) {
                hasTransparency = true;
                break;
              }
            }
          }
        } catch {}

        setAvatar(dataUrl);
        currentUser.avatar = dataUrl;
        try {
          localStorage.setItem('bemoon_custom_avatar', dataUrl);
          const savedUser = localStorage.getItem('bemoon_current_user');
          const parsed = savedUser ? JSON.parse(savedUser) : { ...currentUser };
          parsed.avatar = dataUrl;
          localStorage.setItem('bemoon_current_user', JSON.stringify(parsed));
        } catch {}
        if (onUpdateCurrentUser) {
          onUpdateCurrentUser({ ...currentUser, avatar: dataUrl });
        }

        if (hasTransparency) {
          showToast('Прозрачный силуэт мастера успешно установлен!');
          setIsAdjusterModalOpen(true);
        } else {
          setChromaInitialUrl(dataUrl);
          setIsChromaModalOpen(true);
          showToast('Открыта студия хромакея: удалите зелёный фон прямо на устройстве!');
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Location
  const [city, setCity] = useState(currentUser.city || 'Симферополь');
  const [postalCode, setPostalCode] = useState(currentUser.postalCode || '295000');
  const [locationText, setLocationText] = useState(currentUser.locationText || 'ул. Пушкина, 14');
  const [placeName, setPlaceName] = useState(currentUser.placeName || 'Мастерская «Романовъ & Ко»');

  // Relocation tracking
  const [initialLocation, setInitialLocation] = useState(currentUser.locationText || 'ул. Пушкина, 14');
  const [initialCity, setInitialCity] = useState(currentUser.city || 'Симферополь');
  const [showRelocationModal, setShowRelocationModal] = useState(false);

  // Business & Booking
  const [bookingType, setBookingType] = useState<'internal' | 'external'>(
    currentUser.bookingUrl ? 'external' : 'internal'
  );
  const [bookingUrl, setBookingUrl] = useState(currentUser.bookingUrl || '');
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(currentUser.isAcceptingOrders !== false);

  // Working Schedule
  const [workingSchedule, setWorkingSchedule] = useState<WorkingDay[]>(
    currentUser.workingSchedule || [
      { day: 'Пн', dayFull: 'Понедельник', hours: '10:00 — 19:00', isDayOff: false },
      { day: 'Вт', dayFull: 'Вторник', hours: '10:00 — 19:00', isDayOff: false },
      { day: 'Ср', dayFull: 'Среда', hours: '10:00 — 19:00', isDayOff: false },
      { day: 'Чт', dayFull: 'Четверг', hours: '10:00 — 19:00', isDayOff: false },
      { day: 'Пт', dayFull: 'Пятница', hours: '10:00 — 19:00', isDayOff: false },
      { day: 'Сб', dayFull: 'Суббота', hours: '11:00 — 17:00', isDayOff: false },
      { day: 'Вс', dayFull: 'Воскресенье', hours: 'Выходной', isDayOff: true },
    ]
  );

  // Price List
  const [priceList, setPriceList] = useState<PriceItem[]>(
    currentUser.priceList || [
      { id: 'p1', service: 'Индивидуальный 3D-чертёж и подбор слэба', price: 'от 5 000 ₽', duration: '2 дня' },
      { id: 'p2', service: 'Обеденный стол из массива дуба (live edge)', price: 'от 48 000 ₽', duration: '7–10 дней' },
      { id: 'p3', service: 'Журнальный стол с заливкой полимером', price: 'от 22 000 ₽', duration: '4 дня' },
      { id: 'p4', service: 'Реставрация и эко-масло Borma Wachs', price: 'от 8 000 ₽', duration: '3 дня' },
      { id: 'p5', service: 'Консультация и выезд на замер объекта', price: 'Бесплатно', duration: '1 час' },
    ]
  );
  const [isAddingPrice, setIsAddingPrice] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');

  // Contacts
  const [phone, setPhone] = useState(currentUser.phone || '+7 (978) 450-22-19');
  const [telegram, setTelegram] = useState(currentUser.telegram || '@alex_craft');
  const [whatsapp, setWhatsapp] = useState(currentUser.whatsapp || '+79784502219');
  const [instagram, setInstagram] = useState(currentUser.instagram || '@alex_craft_wood');
  const [vk, setVk] = useState(currentUser.vk || 'vk.com/alex_craft_wood');

  // Notifications toggles
  const [pushEnabled, setPushEnabled] = useState(true);
  const [tgBotEnabled, setTgBotEnabled] = useState(true);

  // Followers / Following mock state
  const [followersCount] = useState(currentUser.followersCount || 1420);
  const [followingCount] = useState(currentUser.followingCount || 38);

  // Scroll velocity physics for WebGL Verification Aura
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollVelocityIntensity, setScrollVelocityIntensity] = useState<number>(0);
  const lastScrollTopRef = useRef<number>(0);
  const lastScrollTimeRef = useRef<number>(performance.now());

  const handleProfileScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    const now = performance.now();
    const dt = Math.max(16, now - lastScrollTimeRef.current);
    const delta = Math.abs(currentScrollTop - lastScrollTopRef.current);

    lastScrollTopRef.current = currentScrollTop;
    lastScrollTimeRef.current = now;

    // Velocity in pixels/ms
    const velocity = delta / dt;
    // Map velocity to dynamic intensity impulse
    if (velocity > 0.04) {
      const impulse = Math.min(velocity * 2.4, 3.5);
      setScrollVelocityIntensity(impulse);
    }
  };

  // System notifications list
  const [notificationItems, setNotificationItems] = useState([
    {
      id: 'notif-1',
      text: 'Анна Смирнова добавила вашу работу «Обеденный стол из дуба» в избранное.',
      time: '5 минут назад',
      type: 'like'
    },
    {
      id: 'notif-2',
      text: 'Михаил Ковалев подписался на обновления вашего профиля.',
      time: '1 час назад',
      type: 'follow'
    },
    {
      id: 'notif-3',
      text: 'Новый подтвержденный заказ на сумму 48 000 ₽.',
      time: 'Вчера в 18:40',
      type: 'order'
    }
  ]);

  if (!isOpen) return null;

  // Split works into 2 columns for masonry - strictly 2 columns always
  const renderMasonry = (items: WorkItem[], isOwnerWorks = false) => {
    if (items.length === 0) {
      return (
        <div className="py-16 text-center text-xs text-neutral-500">
          Пока ничего нет в этом разделе
        </div>
      );
    }

    const col1: WorkItem[] = [];
    const col2: WorkItem[] = [];
    items.forEach((item, idx) => {
      if (idx % 2 === 0) col1.push(item);
      else col2.push(item);
    });

    return (
      <div className="grid grid-cols-2 gap-2 mt-1.5">
        <div className="flex flex-col gap-2">
          {col1.map((w) => (
            <WorkCard
              key={w.id}
              work={w}
              onSelect={onSelectWork}
              onToggleLike={onToggleLike}
              isLiked={likedIds.has(w.id)}
              hideDistance={isOwnerWorks}
            />
          ))}
        </div>
        <div className="flex flex-col gap-2 min-h-[50px]">
          {col2.map((w) => (
            <WorkCard
              key={w.id}
              work={w}
              onSelect={onSelectWork}
              onToggleLike={onToggleLike}
              isLiked={likedIds.has(w.id)}
              hideDistance={isOwnerWorks}
            />
          ))}
        </div>
      </div>
    );
  };

  // Save Settings logic
  const handleSaveSettings = () => {
    const isLocationChanged =
      locationText.trim().toLowerCase() !== initialLocation.trim().toLowerCase() ||
      city.trim().toLowerCase() !== initialCity.trim().toLowerCase();

    if (isLocationChanged) {
      setShowRelocationModal(true);
      return;
    }

    applySettings(false);
  };

  const applySettings = (sendRelocationPush = false) => {
    const updated: Creator = {
      ...currentUser,
      name,
      handle,
      role,
      bio,
      avatar,
      avatarScale,
      avatarOffsetX,
      avatarOffsetY,
      coverImage,
      city,
      postalCode,
      locationText,
      placeName,
      phone,
      telegram,
      whatsapp,
      instagram,
      vk,
      bookingUrl: bookingType === 'external' ? bookingUrl : '',
      isAcceptingOrders,
      workingSchedule,
      priceList
    };

    if (onUpdateCurrentUser) {
      onUpdateCurrentUser(updated);
    }

    try {
      localStorage.setItem('bemoon_current_user', JSON.stringify(updated));
      if (avatar) {
        localStorage.setItem('bemoon_custom_avatar', avatar);
      }
    } catch {}

    setInitialLocation(locationText);
    setInitialCity(city);
    setActiveDrawer('none');
    setShowRelocationModal(false);

    if (sendRelocationPush) {
      showToast(`Push-уведомление о переезде успешно отправлено ${followersCount.toLocaleString('ru-RU')} клиентам!`);
      setNotificationItems((prev) => [
        {
          id: `notif-${Date.now()}`,
          text: `Оповещение о переезде: новый адрес «${city}, ${locationText}» доставлен ${followersCount.toLocaleString('ru-RU')} клиентам`,
          time: 'Только что',
          type: 'location'
        },
        ...prev
      ]);
    } else {
      showToast('Настройки профиля сохранены');
    }
  };

  // Schedule toggle helper
  const handleToggleScheduleDay = (index: number) => {
    setWorkingSchedule((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        isDayOff: !next[index].isDayOff,
        hours: !next[index].isDayOff ? 'Выходной' : '10:00 — 19:00'
      };
      return next;
    });
  };

  // Add price item helper
  const handleAddPriceItem = () => {
    if (!newServiceName.trim() || !newServicePrice.trim()) return;
    setPriceList((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}`,
        service: newServiceName.trim(),
        price: newServicePrice.trim(),
        duration: 'По согласованию'
      }
    ]);
    setNewServiceName('');
    setNewServicePrice('');
    setIsAddingPrice(false);
  };

  const handleDeletePriceItem = (id: string) => {
    setPriceList((prev) => prev.filter((p) => p.id !== id));
  };

  const currentDayIdx = (new Date().getDay() + 6) % 7;

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleProfileScroll}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      className="fixed inset-0 z-50 h-[100dvh] w-full bg-[#0d0e12] text-white overflow-y-auto overflow-x-hidden select-none animate-in fade-in duration-200 no-scrollbar"
    >
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 rounded-2xl bg-neutral-900/95 px-4 py-2.5 text-xs font-medium text-white shadow-2xl border border-white/15 backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header / Control Center (Fixed Top Bar with dense-to-transparent mask) */}
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
          {/* Left: BE'MOON Logo as Home / Return to Feed */}
          <button
            type="button"
            onClick={onClose}
            aria-label="На главную в ленту"
            className="group pointer-events-auto flex items-center gap-2 p-1 rounded-xl bg-transparent hover:bg-white/10 transition-colors active:scale-95 cursor-pointer focus:outline-none"
          >
            <BeMoonLogo size={32} showWordmark={false} />
            <span className="text-sm font-semibold tracking-tight text-white/90 group-hover:text-white transition-colors">
              Лента
            </span>
          </button>

          {/* Right: Control Center 3 Minimal Transparent Icons (Bell, Direct, Settings) */}
          <div className="pointer-events-auto flex items-center gap-1 overflow-visible pt-1">
            {/* 1. Bell (Notifications) */}
            <button
              type="button"
              onClick={() => {
                setActiveDrawer('notifications');
                setHasUnreadNotifications(false);
              }}
              aria-label="Уведомления"
              className="relative overflow-visible flex h-10 w-10 items-center justify-center rounded-full bg-transparent hover:bg-white/10 active:bg-white/15 text-white/90 transition-all hover:scale-105 active:scale-95 focus:outline-none cursor-pointer"
            >
              <Bell size={19} strokeWidth={2} />
              {hasUnreadNotifications && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-neutral-950 pointer-events-none" />
              )}
            </button>

            {/* 2. Direct Chat (Директ) */}
            <button
              type="button"
              onClick={() => {
                setActiveDrawer('direct');
                setUnreadMessagesCount(0);
              }}
              aria-label="Директ / Чаты"
              className="relative overflow-visible flex h-10 w-10 items-center justify-center rounded-full bg-transparent hover:bg-white/10 active:bg-white/15 text-white/90 transition-all hover:scale-105 active:scale-95 focus:outline-none cursor-pointer"
            >
              <MessageCircle size={19} strokeWidth={2} />
              {unreadMessagesCount > 0 && (
                <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-white text-neutral-950 font-bold text-[10px] ring-2 ring-neutral-950 pointer-events-none">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            {/* 3. Settings (Настройки) */}
            <button
              type="button"
              onClick={() => setActiveDrawer('settings')}
              aria-label="Настройки профиля"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-transparent hover:bg-white/10 active:bg-white/15 text-white/90 transition-all hover:scale-105 active:scale-95 focus:outline-none cursor-pointer"
            >
              <Settings size={19} strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Editorial Masthead 3D Hero (TIME Magazine 3D Overlap Layout) */}
      <div className="relative w-full overflow-visible bg-transparent flex flex-col items-center justify-start flex-shrink-0 pt-0">
        {/* Layer 0 (z-0): Изумрудная Аура с анимацией дыхания */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-emerald-500/30 blur-[90px] pointer-events-none z-0 animate-aura-breathe"
          aria-hidden="true"
        />

        {/* Layer: Имя мастера с динамическим порядком слоев (z-10 за силуэтом / z-25 поверх силуэта) */}
        <div
          className="absolute top-20 sm:top-24 left-0 right-0 flex flex-col items-center justify-center pointer-events-none px-4 select-none transition-all duration-150"
          style={{ zIndex: nameAboveAvatar ? 25 : 10 }}
        >
          <h1
            style={{
              color: nameColor,
              opacity: nameOpacity,
              textShadow: '0 4px 30px rgba(0,0,0,0.95)'
            }}
            className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-center leading-[0.88] font-['Syne',sans-serif] transition-all duration-150"
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

        {/* Layer 20 (z-20): Аватар мастера (Поднят до самого верха экрана, ширина во весь экран) */}
        <div className="relative z-20 mt-0 flex items-end justify-center overflow-visible w-full max-w-full">
          <MasterSilhouette
            avatarUrl={avatar}
            name={name}
            scale={avatarScale}
            offsetX={avatarOffsetX}
            offsetY={avatarOffsetY}
            className="w-full"
          />
        </div>
      </div>

      {/* Layer 30 (z-30): Нижний контент (@alex_craft + QR, Био, Статистика, Табы, Сетка) подтянут выше вслед за аватаром */}
      <div className="relative z-30 mx-auto max-w-2xl px-4 -mt-20 sm:-mt-24 pb-20 flex-1 flex flex-col w-full">
        <div className="flex flex-col items-center text-center">
          {/* Handle & QR Code & Role */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-300 font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
            <span className="text-emerald-400 font-semibold">{handle}</span>
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              aria-label="Поделиться профилем (QR)"
              className="text-neutral-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/10 active:scale-95 focus:outline-none"
              title="Поделиться QR-кодом"
            >
              <QrCode size={15} />
            </button>
            <span className="text-neutral-500 font-bold mx-1">•</span>
            <span>{role}</span>
          </div>

          {/* Bio text */}
          <div className="mt-2 w-11/12 max-w-[90%] sm:max-w-md mx-auto">
            <p className="text-center sm:text-left text-xs sm:text-sm leading-relaxed text-neutral-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              {bio}
            </p>
          </div>

          {/* Social Capital: ПОДПИСЧИКОВ & ПОДПИСОК */}
          <div className="mt-3 grid grid-cols-2 gap-0 w-full max-w-sm rounded-2xl bg-neutral-900/80 py-2.5 px-4 border border-white/5 backdrop-blur-md shadow-xl">
            <div className="flex flex-col items-center justify-center text-center pr-3 border-r border-white/10">
              <span className="text-xl sm:text-2xl font-bold text-white tracking-normal font-sans">
                {followersCount.toLocaleString('ru-RU')}
              </span>
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mt-0.5 font-sans">
                Подписчиков
              </span>
            </div>

            <div className="flex flex-col items-center justify-center text-center pl-3">
              <span className="text-xl sm:text-2xl font-bold text-white tracking-normal font-sans">
                {followingCount}
              </span>
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mt-0.5 font-sans">
                {followingCount === 1
                  ? 'Подписка'
                  : followingCount % 10 >= 2 && followingCount % 10 <= 4 && (followingCount % 100 < 10 || followingCount % 100 >= 20)
                  ? 'Подписки'
                  : 'Подписок'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Navigation Tabs: Fixed 20px icon containers for perfect baseline */}
        <div className="mt-3.5 grid grid-cols-4 border-b border-white/10 flex-shrink-0">
          {/* Tab 1: Works */}
          <button
            type="button"
            onClick={() => setActiveTab('works')}
            aria-label="Мои работы"
            className={`group relative flex h-12 flex-col items-center justify-start pt-2 transition-colors focus:outline-none cursor-pointer ${
              activeTab === 'works' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <div className="flex h-5 items-center justify-center">
              <LayoutGrid size={21} strokeWidth={activeTab === 'works' ? 2 : 1.75} />
            </div>
            <span
              className={`text-[10px] font-medium leading-none mt-1 h-3 flex items-center justify-center transition-colors ${
                activeTab === 'works' ? 'text-white font-semibold' : 'text-neutral-400 group-hover:text-neutral-300'
              }`}
            >
              {userWorks.length}
            </span>
            {activeTab === 'works' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-6 bg-white rounded-t-full animate-in fade-in duration-150" />
            )}
          </button>

          {/* Tab 2: Liked */}
          <button
            type="button"
            onClick={() => setActiveTab('liked')}
            aria-label="Понравилось"
            className={`group relative flex h-12 flex-col items-center justify-start pt-2 transition-colors focus:outline-none cursor-pointer ${
              activeTab === 'liked' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <div className="flex h-5 items-center justify-center">
              <Heart size={21} strokeWidth={activeTab === 'liked' ? 2 : 1.75} />
            </div>
            <span
              className={`text-[10px] font-medium leading-none mt-1 h-3 flex items-center justify-center transition-colors ${
                activeTab === 'liked' ? 'text-white font-semibold' : 'text-neutral-400 group-hover:text-neutral-300'
              }`}
            >
              {likedWorks.length}
            </span>
            {activeTab === 'liked' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-6 bg-white rounded-t-full animate-in fade-in duration-150" />
            )}
          </button>

          {/* Tab 3: Bookings */}
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            aria-label="Заказы"
            className={`group relative flex h-12 flex-col items-center justify-start pt-2 transition-colors focus:outline-none cursor-pointer ${
              activeTab === 'bookings' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <div className="flex h-5 items-center justify-center">
              <Calendar size={21} strokeWidth={activeTab === 'bookings' ? 2 : 1.75} />
            </div>
            <span
              className={`text-[10px] font-medium leading-none mt-1 h-3 flex items-center justify-center transition-colors ${
                activeTab === 'bookings' ? 'text-white font-semibold' : 'text-neutral-400 group-hover:text-neutral-300'
              }`}
            >
              {bookings.length}
            </span>
            {activeTab === 'bookings' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-6 bg-white rounded-t-full animate-in fade-in duration-150" />
            )}
          </button>

          {/* Tab 4: Info */}
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            aria-label="Инфо о мастере"
            className={`group relative flex h-12 flex-col items-center justify-start pt-2 transition-colors focus:outline-none cursor-pointer ${
              activeTab === 'history' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <div className="flex h-5 items-center justify-center">
              <Info size={21} strokeWidth={activeTab === 'history' ? 2 : 1.75} />
            </div>
            <span className="text-[10px] leading-none mt-1 h-3 flex items-center justify-center select-none invisible">
              &nbsp;
            </span>
            {activeTab === 'history' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-6 bg-white rounded-t-full animate-in fade-in duration-150" />
            )}
          </button>
        </div>

        {/* Tab Content Display (flex-1 stretch into viewport) */}
        <div className="flex-1 flex flex-col mt-2 min-h-0 w-full">
          {activeTab === 'works' && renderMasonry(userWorks, true)}
          {activeTab === 'liked' && renderMasonry(likedWorks, false)}
        {activeTab === 'bookings' && (
          <div className="mt-4 space-y-3">
            {bookings.length === 0 ? (
              <div className="py-20 text-center text-xs text-neutral-500">
                У вас пока нет активных записей или заказов
              </div>
            ) : (
              bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-3.5 rounded-2xl bg-neutral-900/70 p-3.5 border border-white/5 backdrop-blur-sm"
                >
                  <img
                    src={booking.workImage}
                    alt={booking.workTitle}
                    className="h-16 w-16 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{booking.workTitle}</h4>
                      <span className="text-xs font-bold text-white font-['Syne',sans-serif] flex-shrink-0">
                        {booking.priceFormatted}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5 truncate">{booking.creatorName}</p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
                      <Clock size={12} />
                      <span>{booking.date} в {booking.time}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: «(i) Инфо» */}
        {activeTab === 'history' && (
          <div className="mt-5 space-y-4">
            {/* 1. Dark Mini-Map & Location */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-white" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-['Syne',sans-serif]">
                  Локация и мастерская
                </h3>
              </div>

              <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-[#111318] border border-white/10 group">
                <svg className="absolute inset-0 h-full w-full opacity-60" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="profileMapGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="#101217" />
                  <rect width="100%" height="100%" fill="url(#profileMapGrid)" />
                  <path d="M-20 60 Q 80 80, 200 60 T 400 90 T 700 70" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="3" />
                  <path d="M120 -20 Q 150 100, 180 200" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="4" />
                  <path d="M260 -20 Q 230 110, 240 200" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="2.5" />
                  <path d="M-10 130 Q 150 140, 350 120 T 700 140" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
                  <path d="M-20 170 Q 120 150, 280 180 T 600 160" fill="none" stroke="rgba(56,189,248,0.15)" strokeWidth="6" />
                </svg>

                {/* Radar Ripple & Center Pin */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                  <span className="absolute h-16 w-16 rounded-full bg-emerald-500/20 animate-ping" />
                  <span className="absolute h-8 w-8 rounded-full bg-emerald-500/30 ring-1 ring-emerald-500/50" />
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-950 shadow-xl ring-4 ring-neutral-900">
                    <MapPin size={16} className="fill-neutral-950" />
                  </div>
                </div>

                {/* Coordinates Badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-lg bg-black/75 px-2.5 py-1 backdrop-blur-md border border-white/10 text-[10px] font-mono text-neutral-300">
                  <Navigation size={11} className="text-emerald-400" />
                  <span>44.9521° N, 34.1024° E</span>
                </div>

                {/* Route Actions */}
                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(`${city}, ${postalCode}, ${locationText}, ${placeName}`);
                        showToast('Адрес скопирован в буфер');
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white border border-white/15 transition-colors cursor-pointer"
                  >
                    <Copy size={12} />
                    <span>Скопировать</span>
                  </button>
                  <a
                    href={`https://yandex.ru/maps/?text=${encodeURIComponent(`${city} ${locationText}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white border border-white/20 transition-colors cursor-pointer"
                  >
                    <ExternalLink size={12} />
                    <span>В Картах</span>
                  </a>
                </div>
              </div>

              {/* Exact Address Readout */}
              <div className="rounded-2xl bg-neutral-900/60 p-3.5 border border-white/5 space-y-1">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>{placeName}</span>
                  <span className="text-[11px] text-neutral-400 font-normal">Симферополь</span>
                </div>
                <div className="text-xs text-neutral-300">
                  г. {city}, {postalCode}, {locationText}
                </div>
              </div>
            </div>

            {/* 2. Working Schedule */}
            <div className="rounded-2xl bg-neutral-900/60 p-4 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-white" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white font-['Syne',sans-serif]">
                    График работы
                  </h3>
                </div>
                {/* Live Status Badge */}
                {isAcceptingOrders ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Открыто сейчас
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-800 text-neutral-400 border border-white/10">
                    Прием по записи
                  </span>
                )}
              </div>

              <div className="space-y-1 pt-1 text-xs">
                {workingSchedule.map((schedule, idx) => {
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

            {/* 3. Contacts & Socials */}
            <div className="rounded-2xl bg-neutral-900/60 p-4 border border-white/5 space-y-3">
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-white" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-['Syne',sans-serif]">
                  Контакты и соцсети
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`tel:${phone.replace(/\s+/g, '')}`}
                  className="flex items-center gap-2.5 rounded-xl bg-white/5 hover:bg-white/10 p-2.5 text-xs text-white border border-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                    <Phone size={14} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-neutral-400">Позвонить</span>
                    <span className="font-semibold truncate">{phone}</span>
                  </div>
                </a>

                <a
                  href={`https://t.me/${telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl bg-white/5 hover:bg-white/10 p-2.5 text-xs text-white border border-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 flex-shrink-0">
                    <Send size={14} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-neutral-400">Telegram</span>
                    <span className="font-semibold truncate">{telegram}</span>
                  </div>
                </a>

                <a
                  href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl bg-white/5 hover:bg-white/10 p-2.5 text-xs text-white border border-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                    <MessageCircle size={14} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-neutral-400">WhatsApp</span>
                    <span className="font-semibold truncate">Чат в WA</span>
                  </div>
                </a>

                <a
                  href={`https://instagram.com/${instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl bg-white/5 hover:bg-white/10 p-2.5 text-xs text-white border border-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 flex-shrink-0">
                    <Globe size={14} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-neutral-400">Instagram</span>
                    <span className="font-semibold truncate">{instagram}</span>
                  </div>
                </a>
              </div>
            </div>

            {/* 4. Price List Preview */}
            <div className="rounded-2xl bg-neutral-900/60 p-4 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase size={16} className="text-white" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white font-['Syne',sans-serif]">
                    Прайс-лист услуг ({priceList.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDrawer('settings')}
                  className="text-[11px] text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  Изменить
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {priceList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white/5 p-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white truncate">{item.service}</div>
                      {item.duration && (
                        <div className="text-[10px] text-neutral-400 mt-0.5">{item.duration}</div>
                      )}
                    </div>
                    <span className="font-bold text-white font-['Syne',sans-serif] flex-shrink-0">
                      {item.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Manifesto & Safe Metrics */}
            <div className="space-y-4 rounded-2xl bg-neutral-900/60 p-4 border border-white/5 text-sm text-neutral-300 leading-relaxed">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-['Syne',sans-serif]">
                История и манифест мастера
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300">
                Создаю авторские изделия из массива натурального карагача и дуба с 2018 года. Каждое изделие проходит ручную шлифовку и покрытие натуральными экологичными маслами с воском.
              </p>

              {/* Safe Demand Metrics */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                <div className="rounded-xl bg-white/5 p-3 flex flex-col">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-base font-['Syne',sans-serif]">
                    <CheckCircle2 size={16} />
                    <span>42</span>
                  </div>
                  <span className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                    успешные записи через BE'MOON
                  </span>
                </div>
                <div className="rounded-xl bg-white/5 p-3 flex flex-col">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold text-base font-['Syne',sans-serif]">
                    <Heart size={16} className="fill-rose-400/20" />
                    <span>184</span>
                  </div>
                  <span className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                    сохранения в избранное
                  </span>
                </div>
              </div>

              <div className="pt-1 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-neutral-300">Опыт 7 лет</span>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-neutral-300">Гарантия 3 года</span>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-neutral-300">Мастерская в Симферополе</span>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* 4. Multi-action Floating Action Button (FAB) in Thumb Zone */}
      {isFabOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
          onClick={() => setIsFabOpen(false)}
        />
      )}

      <div
        style={{
          bottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
          right: 'max(24px, env(safe-area-inset-right, 24px))'
        }}
        className="fixed z-50 pointer-events-auto flex flex-col items-end"
      >
        {isFabOpen && (
          <div className="absolute bottom-16 right-0 w-48 rounded-3xl bg-neutral-900/90 backdrop-blur-xl border border-white/10 p-3 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
            <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-2 select-none">
              ЧТО СОЗДАЕМ?
            </div>

            <button
              type="button"
              onClick={() => {
                setIsFabOpen(false);
                onOpenAddWork();
              }}
              className="flex items-center gap-2 w-full p-2 rounded-xl hover:bg-white/10 text-white text-xs transition-colors cursor-pointer text-left focus:outline-none"
            >
              <Sparkles size={16} className="text-amber-300 flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-white truncate">Вдохновение</span>
                <span className="text-[10px] text-neutral-400 truncate">без привязки цены</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsFabOpen(false);
                onOpenAddWork();
              }}
              className="flex items-center gap-2 w-full p-2 mt-1 rounded-xl hover:bg-white/10 text-white text-xs transition-colors cursor-pointer text-left focus:outline-none"
            >
              <Briefcase size={16} className="text-white flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-white truncate">Реальная работа</span>
                <span className="text-[10px] text-neutral-400 truncate">с прайсом и записью</span>
              </div>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsFabOpen((prev) => !prev)}
          aria-label={isFabOpen ? 'Закрыть меню создания' : 'Добавить'}
          className={`group relative flex h-11 w-11 items-center justify-center rounded-full shadow-[0_6px_24px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none cursor-pointer ${
            isFabOpen ? 'bg-neutral-800 text-white ring-1 ring-white/20' : 'bg-white text-neutral-950'
          }`}
        >
          <Plus
            size={20}
            strokeWidth={2.4}
            className={`transition-transform duration-300 ease-in-out ${
              isFabOpen ? 'rotate-45' : 'rotate-0'
            }`}
          />
        </button>
      </div>

      {/* 5. Integrated Sub-Drawers for Control Center */}

      {/* Drawer: Notifications (Уведомления) */}
      {activeDrawer === 'notifications' && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0d0e12] text-white animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-white" />
              <h2 className="text-sm font-bold uppercase tracking-wider font-['Syne',sans-serif]">
                Уведомления
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveDrawer('none')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-2xl mx-auto w-full">
            {notificationItems.map((notif) => (
              <div
                key={notif.id}
                className="flex items-start gap-3 rounded-2xl bg-neutral-900/80 p-3.5 border border-white/5"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 mt-0.5 ${
                    notif.type === 'location'
                      ? 'bg-sky-500/20 text-sky-400'
                      : notif.type === 'like'
                      ? 'bg-rose-500/20 text-rose-400'
                      : notif.type === 'order'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  {notif.type === 'location' ? (
                    <MapPin size={16} />
                  ) : notif.type === 'like' ? (
                    <Heart size={16} className="fill-rose-500" />
                  ) : notif.type === 'order' ? (
                    <Calendar size={16} />
                  ) : (
                    <UserCheck size={16} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white leading-relaxed">{notif.text}</p>
                  <span className="text-[10px] text-neutral-500 mt-1 block">{notif.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drawer: Direct Messages (Директ) */}
      {activeDrawer === 'direct' && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0d0e12] text-white animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} className="text-white" />
              <h2 className="text-sm font-bold uppercase tracking-wider font-['Syne',sans-serif]">
                Директ / Сообщения
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveDrawer('none')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 max-w-2xl mx-auto w-full">
            <div
              onClick={() => {
                setActiveDrawer('none');
                if (onOpenChatWithCreator) {
                  onOpenChatWithCreator(currentUser);
                }
              }}
              className="flex items-center gap-3 rounded-2xl bg-neutral-900/80 p-3.5 border border-white/5 cursor-pointer hover:bg-neutral-800 transition-colors"
            >
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"
                alt="Елена"
                className="h-11 w-11 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">Елена Васильева</h4>
                  <span className="text-[10px] text-neutral-500">12:35</span>
                </div>
                <p className="text-xs text-neutral-300 truncate mt-0.5">
                  Здравствуйте! Можно заказать стол с эпоксидной смолой синего цвета?
                </p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500 flex-shrink-0" />
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-neutral-900/80 p-3.5 border border-white/5 cursor-pointer hover:bg-neutral-800 transition-colors">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                alt="Дмитрий"
                className="h-11 w-11 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">Дмитрий Романов</h4>
                  <span className="text-[10px] text-neutral-500">Вчера</span>
                </div>
                <p className="text-xs text-neutral-400 truncate mt-0.5">
                  Спасибо за работу! Изделие получилось потрясающее.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Redesigned Settings Screen (iOS / Instagram Style Premium UI) */}
      {activeDrawer === 'settings' && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0d0e12] text-white animate-in fade-in duration-200">
          {/* Header (Лаконичное «Настройки» + только одна кнопка «Сохранить» справа) */}
          <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3.5 backdrop-blur-xl bg-[#0d0e12]/80 sticky top-0 z-20">
            <button
              type="button"
              onClick={() => setActiveDrawer('none')}
              className="text-sm text-neutral-400 hover:text-white transition-colors cursor-pointer p-1 -ml-1 focus:outline-none"
            >
              <X size={20} />
            </button>

            <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
              Настройки
            </h2>

            <button
              type="button"
              onClick={handleSaveSettings}
              className="text-sm font-semibold text-white hover:text-white/80 active:scale-95 transition-all cursor-pointer p-1 -mr-1 focus:outline-none"
            >
              Сохранить
            </button>
          </div>

          {/* Content: Сплошной вертикальный список iOS (без карточек, без рамок) */}
          <div className="flex-1 overflow-y-auto px-4 pb-20 max-w-2xl mx-auto w-full">
            {/* Center Avatar Edit & Transparent Silhouette Upload Flow */}
            <div className="py-5 flex flex-col items-center justify-center border-b border-white/[0.08]">
              <input
                type="file"
                ref={avatarFileInputRef}
                accept="image/png,image/webp,image/gif,video/webm,video/mp4,video/quicktime,video/*"
                onChange={handleAvatarFileUpload}
                className="hidden"
              />

              {/* Avatar Preview Card with transparency grid and emerald back-glow */}
              <div className="relative group cursor-pointer" onClick={() => avatarFileInputRef.current?.click()}>
                <div className="absolute -inset-1 rounded-2xl bg-emerald-500/20 blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
                <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-[#0d0e12] border border-white/15 shadow-xl flex items-center justify-center p-1">
                  <div
                    className="absolute inset-0 opacity-15"
                    style={{
                      backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                      backgroundSize: '8px 8px'
                    }}
                  />
                  {isVideoMedia(avatar) ? (
                    <video
                      src={avatar}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="relative z-10 h-full w-full object-contain object-bottom drop-shadow-md"
                    />
                  ) : (
                    <img
                      src={avatar}
                      alt={name}
                      className="relative z-10 h-full w-full object-contain object-bottom drop-shadow-md"
                    />
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-all cursor-pointer focus:outline-none active:scale-95 shadow-sm"
                >
                  <Upload size={13} />
                  <span>Загрузить Фото / Видео</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAdjusterModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-all cursor-pointer focus:outline-none active:scale-95 shadow-sm"
                  title="Настроить размер и положение силуэта"
                >
                  <Move size={13} className="text-emerald-400" />
                  <span>Размер и положение</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setChromaInitialUrl(avatar);
                    setIsChromaModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-all cursor-pointer focus:outline-none active:scale-95 shadow-sm"
                  title="Удалить хромакей (зелёный фон) прямо на телефоне"
                >
                  <Sparkles size={13} />
                  <span>Удалить хромакей</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAvatar('/master_cutout.png');
                    setAvatarScale(1);
                    setAvatarOffsetX(0);
                    setAvatarOffsetY(0);
                    currentUser.avatar = '/master_cutout.png';
                    currentUser.avatarScale = 1;
                    currentUser.avatarOffsetX = 0;
                    currentUser.avatarOffsetY = 0;
                    try {
                      localStorage.setItem('bemoon_custom_avatar', '/master_cutout.png');
                    } catch {}
                    showToast('Тестовый вырезанный силуэт установлен!');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-[11px] font-medium border border-white/10 transition-colors cursor-pointer focus:outline-none"
                  title="Сбросить на тестовый вырезанный силуэт"
                >
                  Тестовый силуэт
                </button>
              </div>

              <span className="text-[11px] text-neutral-400 text-center mt-2 leading-tight">
                Поддерживаются прозрачные PNG, WebP и видео (WebM / MP4 / QuickTime с альфа-каналом)
              </span>
            </div>

            {/* Секция: Профиль (Личные данные) */}
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mt-6 mb-1 select-none">
              Профиль
            </div>

            <div className="divide-y divide-white/[0.08] border-b border-white/[0.08]">
              {/* Имя */}
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-neutral-400 font-normal w-28 flex-shrink-0">Имя</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full text-right text-sm text-white bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder-neutral-600"
                />
              </div>

              {/* Никнейм */}
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-neutral-400 font-normal w-28 flex-shrink-0">Никнейм</span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="@handle"
                  className="w-full text-right text-sm text-white bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder-neutral-600 font-mono"
                />
              </div>

              {/* Профессия / Роль */}
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-neutral-400 font-normal w-28 flex-shrink-0">Профессия</span>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Роль мастера"
                  className="w-full text-right text-sm text-white bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder-neutral-600"
                />
              </div>

              {/* О себе (Inline Textarea без рамок) */}
              <div className="py-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400 font-normal">О себе</span>
                  <span className={`text-[11px] ${bio.length > 270 ? 'text-amber-400' : 'text-neutral-500'}`}>
                    {bio.length}/280
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={280}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Манифест и описание ваших работ..."
                  className="w-full text-sm text-white bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder-neutral-600 resize-none pt-0.5 leading-relaxed"
                />
              </div>
            </div>

            {/* Секция: Запись и локация */}
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mt-7 mb-1 select-none">
              Запись и локация
            </div>

            <div className="divide-y divide-white/[0.08] border-b border-white/[0.08]">
              {/* Способ записи: iOS Segmented Control */}
              <div className="flex items-center justify-between py-3 gap-2">
                <span className="text-sm text-neutral-400 font-normal flex-shrink-0">Способ записи</span>
                <div className="flex rounded-xl bg-neutral-900/90 p-0.5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setBookingType('internal')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      bookingType === 'internal'
                        ? 'bg-neutral-800 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Через BE'MOON
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingType('external')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      bookingType === 'external'
                        ? 'bg-neutral-800 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Сторонняя ссылка
                  </button>
                </div>
              </div>

              {/* Ссылка для записи (если выбрана сторонняя) */}
              {bookingType === 'external' && (
                <div className="flex items-center justify-between py-3 animate-in fade-in duration-150">
                  <span className="text-sm text-neutral-400 font-normal w-32 flex-shrink-0">Ссылка CRM</span>
                  <input
                    type="url"
                    value={bookingUrl}
                    onChange={(e) => setBookingUrl(e.target.value)}
                    placeholder="https://dikidi.net/..."
                    className="w-full text-right text-sm text-white bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder-neutral-600"
                  />
                </div>
              )}

              {/* Город */}
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-neutral-400 font-normal w-28 flex-shrink-0">Город</span>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Симферополь"
                  className="w-full text-right text-sm text-white bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder-neutral-600"
                />
              </div>

              {/* Индекс */}
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-neutral-400 font-normal w-28 flex-shrink-0">Индекс</span>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="295000"
                  className="w-full text-right text-sm text-white bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder-neutral-600"
                />
              </div>

              {/* Точный адрес */}
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-neutral-400 font-normal w-28 flex-shrink-0">Точный адрес</span>
                <input
                  type="text"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="ул. Пушкина, 14"
                  className="w-full text-right text-sm text-white bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder-neutral-600"
                />
              </div>

              {/* Студия / коворкинг */}
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-neutral-400 font-normal w-28 flex-shrink-0">Студия</span>
                <input
                  type="text"
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="Мастерская «Романовъ & Ко»"
                  className="w-full text-right text-sm text-white bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder-neutral-600"
                />
              </div>
            </div>

            {/* Секция: График работы */}
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mt-7 mb-1 select-none">
              График работы
            </div>

            <div className="divide-y divide-white/[0.08] border-b border-white/[0.08]">
              {workingSchedule.map((item, idx) => (
                <div key={item.day} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2.5 w-32 flex-shrink-0">
                    <span className="text-sm font-semibold text-white w-6">{item.day}</span>
                    <span className="text-xs text-neutral-400">{item.dayFull}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {item.isDayOff ? (
                      <span className="text-xs text-neutral-500 italic">Выходной</span>
                    ) : (
                      <input
                        type="text"
                        value={item.hours}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWorkingSchedule((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], hours: val };
                            return next;
                          });
                        }}
                        className="text-right text-xs text-white bg-transparent border-none outline-none focus:outline-none focus:ring-0 w-28"
                      />
                    )}

                    <IosSwitch
                      checked={!item.isDayOff}
                      onChange={() => handleToggleScheduleDay(idx)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Секция: Прайс-лист */}
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mt-7 mb-1 flex items-center justify-between select-none">
              <span>Прайс-лист услуг</span>
              <button
                type="button"
                onClick={() => setIsAddingPrice((prev) => !prev)}
                className="text-xs font-medium text-sky-400 hover:text-sky-300 lowercase transition-colors cursor-pointer"
              >
                {isAddingPrice ? 'отмена' : '+ добавить'}
              </button>
            </div>

            <div className="divide-y divide-white/[0.08] border-b border-white/[0.08]">
              {priceList.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 gap-3">
                  <span className="text-sm text-white font-normal truncate flex-1">{p.service}</span>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className="text-sm text-neutral-300 font-medium font-mono">{p.price}</span>
                    <button
                      type="button"
                      onClick={() => handleDeletePriceItem(p.id)}
                      className="text-neutral-600 hover:text-rose-400 transition-colors p-1 cursor-pointer focus:outline-none"
                      title="Удалить услугу"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Inline форма добавления новой услуги */}
              {isAddingPrice && (
                <div className="py-3 flex items-center justify-between gap-2 animate-in fade-in duration-150">
                  <input
                    type="text"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="Название услуги..."
                    className="flex-1 text-sm text-white bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder-neutral-600"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    placeholder="от 5 000 ₽"
                    className="w-24 text-right text-sm text-white bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder-neutral-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddPriceItem}
                    className="text-xs font-semibold text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    ОК
                  </button>
                </div>
              )}
            </div>

            {/* Секция: Контакты и соцсети */}
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mt-7 mb-1 select-none">
              Контакты и соцсети
            </div>

            <div className="divide-y divide-white/[0.08] border-b border-white/[0.08]">
              {/* Телефон */}
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-neutral-400 font-normal w-28 flex-shrink-0">Телефон</span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (978) 000-00-00"
                  className="w-full text-right text-sm text-white bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder-neutral-600 font-mono"
                />
              </div>

              {/* Telegram */}
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-neutral-400 font-normal w-28 flex-shrink-0">Telegram</span>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="@handle"
                  className="w-full text-right text-sm text-white bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder-neutral-600 font-mono"
                />
              </div>

              {/* WhatsApp */}
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-neutral-400 font-normal w-28 flex-shrink-0">WhatsApp</span>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+79780000000"
                  className="w-full text-right text-sm text-white bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder-neutral-600 font-mono"
                />
              </div>

              {/* Instagram */}
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-neutral-400 font-normal w-28 flex-shrink-0">Instagram</span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@profile"
                  className="w-full text-right text-sm text-white bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder-neutral-600 font-mono"
                />
              </div>
            </div>

            {/* Секция: Система */}
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mt-7 mb-1 select-none">
              Система
            </div>

            <div className="divide-y divide-white/[0.08] border-b border-white/[0.08]">
              {/* Прием заказов */}
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-white font-normal">Прием заказов</span>
                <IosSwitch
                  checked={isAcceptingOrders}
                  onChange={() => setIsAcceptingOrders(!isAcceptingOrders)}
                />
              </div>

              {/* Push-уведомления */}
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-white font-normal">Push-уведомления</span>
                <IosSwitch
                  checked={pushEnabled}
                  onChange={() => setPushEnabled(!pushEnabled)}
                />
              </div>

              {/* Telegram-бот */}
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-white font-normal">Telegram-бот</span>
                <IosSwitch
                  checked={tgBotEnabled}
                  onChange={() => setTgBotEnabled(!tgBotEnabled)}
                />
              </div>

              {/* Смена пароля */}
              <button
                type="button"
                onClick={() => showToast('Ссылка для смены пароля отправлена')}
                className="w-full flex items-center justify-between py-3 text-sm text-white hover:text-neutral-300 transition-colors cursor-pointer text-left focus:outline-none"
              >
                <span>Сменить пароль</span>
                <ChevronRight size={16} className="text-neutral-600" />
              </button>

              {/* Удалить аккаунт */}
              <button
                type="button"
                onClick={() => {
                  if (confirm('Вы уверены, что хотите удалить аккаунт?')) {
                    showToast('Запрос на удаление отправлен');
                  }
                }}
                className="w-full flex items-center justify-between py-3 text-sm text-rose-500/80 hover:text-rose-400 transition-colors cursor-pointer text-left focus:outline-none"
              >
                <span>Удалить аккаунт</span>
                <ChevronRight size={16} className="text-neutral-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section 1: QR-код Bottom Sheet (Шеринг профиля) */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 p-0 sm:p-4">
          <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#12141a] border border-white/10 p-6 shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <QrCode size={18} className="text-white" />
                <h3 className="text-sm font-bold text-white">Поделиться профилем</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-full cursor-pointer focus:outline-none"
              >
                <X size={18} />
              </button>
            </div>

            {/* QR code card */}
            <div className="my-5 flex flex-col items-center">
              <div className="relative p-4 rounded-2xl bg-white shadow-2xl flex items-center justify-center">
                <svg className="w-44 h-44" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Background */}
                  <rect width="200" height="200" fill="white" />
                  
                  {/* 3 Corner Finder Patterns */}
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
                <div className="text-xs font-semibold text-white">{name}</div>
                <div className="text-[11px] text-neutral-400 font-mono mt-0.5">bemoon.app/{handle.replace('@', '')}</div>
              </div>
            </div>

            {/* Share buttons row */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10">
              {/* Telegram */}
              <button
                type="button"
                onClick={() => {
                  const url = `https://bemoon.app/${handle.replace('@', '')}`;
                  window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`Профиль мастера ${name} на BE'MOON`)}`, '_blank');
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
                  const url = `https://bemoon.app/${handle.replace('@', '')}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Профиль мастера ${name} на BE'MOON: ${url}`)}`, '_blank');
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
                  const url = `https://bemoon.app/${handle.replace('@', '')}`;
                  window.open(`https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(`Профиль мастера ${name} на BE'MOON`)}`, '_blank');
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
                  const url = `https://bemoon.app/${handle.replace('@', '')}`;
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

      {/* Section 4: Механика удержания «Переезд» (Push-уведомление) */}
      {showRelocationModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-white/10 p-5 shadow-2xl space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30">
              <MapPin size={22} />
            </div>

            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Смена локации мастерской</h3>
              <p className="mt-1.5 text-xs text-neutral-300 leading-relaxed">
                Вы изменили адрес приема на: <span className="font-bold text-white">«{city}, {locationText}»</span>.
              </p>
              <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                Отправить Push-уведомление вашим <span className="text-white font-semibold">{followersCount.toLocaleString('ru-RU')}</span> подписчикам и постоянным клиентам о новом месте работы?
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => applySettings(true)}
                className="w-full h-11 rounded-xl bg-white text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 hover:bg-neutral-100 transition-colors shadow-lg cursor-pointer"
              >
                <Send size={14} />
                <span>Отправить Push-уведомление клиентам</span>
              </button>

              <button
                type="button"
                onClick={() => applySettings(false)}
                className="w-full h-10 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Сохранить без рассылки
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Interactive Silhouette Adjuster Modal (Zoom / Pan / Position / Color / Opacity / Layer) */}
      <AvatarAdjusterModal
        isOpen={isAdjusterModalOpen}
        onClose={() => setIsAdjusterModalOpen(false)}
        avatarUrl={avatar}
        name={name}
        initialScale={avatarScale}
        initialOffsetX={avatarOffsetX}
        initialOffsetY={avatarOffsetY}
        initialNameColor={nameColor}
        initialNameOpacity={nameOpacity}
        initialNameAboveAvatar={nameAboveAvatar}
        onSave={handleSaveAvatarTransform}
        onUploadNewFile={() => avatarFileInputRef.current?.click()}
        onOpenChromaKey={() => {
          setIsAdjusterModalOpen(false);
          setChromaInitialUrl(avatar);
          setIsChromaModalOpen(true);
        }}
      />

      {/* 6. Local Chroma Key Studio Modal (100% On-Device Green Screen Removal for Photos & Videos) */}
      <ChromaKeyStudioModal
        isOpen={isChromaModalOpen}
        onClose={() => setIsChromaModalOpen(false)}
        initialMediaUrl={chromaInitialUrl || avatar}
        onApplyResult={handleApplyChromaResult}
        masterName={name}
      />
    </div>
  );
};
