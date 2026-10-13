export interface WorkingDay {
  day: string; // 'Пн', 'Вт', etc.
  dayFull: string; // 'Понедельник'
  hours: string; // '10:00 — 19:00'
  isDayOff: boolean;
}

export interface PriceItem {
  id: string;
  service: string;
  price: string;
  duration?: string;
}

export interface Creator {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  coverImage?: string;
  role: string;
  distanceKm: number;
  distanceText: string;
  locationText: string;
  city: string;
  district: string;
  postalCode?: string;
  placeName?: string;
  rating?: number;
  reviewsCount?: number;
  completedBookingsCount?: number;
  savedCount?: number;
  verified: boolean;
  bio: string;
  experienceYears: number;
  skills: string[];
  phone?: string;
  telegram?: string;
  whatsapp?: string;
  instagram?: string;
  vk?: string;
  bookingUrl?: string; // DIKIDI, YClients, etc. Empty = internal BE'MOON flow
  isAcceptingOrders?: boolean;
  followersCount?: number;
  followingCount?: number;
  avatarScale?: number;
  avatarOffsetX?: number;
  avatarOffsetY?: number;
  nameColor?: string;
  nameOpacity?: number;
  nameAboveAvatar?: boolean;
  workingSchedule?: WorkingDay[];
  priceList?: PriceItem[];
}

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  resultPhoto?: string;
}

export type MediaType = 'image' | 'video';

export interface WorkItem {
  id: string;
  title: string;
  image: string;
  mediaType?: MediaType;
  videoUrl?: string;
  previewVideoUrl?: string;
  poster?: string;
  additionalImages?: string[];
  aspectRatio: 'tall' | 'extra-tall' | 'standard' | 'square';
  category: string;
  creator: Creator;
  price: number;
  priceFormatted: string;
  turnaroundTime: string;
  likesCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  availableToday: boolean;
  description: string;
  reviews?: Review[];
  coordinates?: { lat: number; lng: number };
}

export interface Booking {
  id: string;
  workId: string;
  workTitle: string;
  workImage: string;
  creatorName: string;
  creatorAvatar: string;
  date: string;
  time: string;
  priceFormatted: string;
  status: 'confirmed' | 'pending' | 'completed';
  address: string;
}

export type CategoryFilter = 
  | 'Все'
  | 'Стиль & Волосы'
  | 'Тату & Пирсинг'
  | 'Керамика & Декор'
  | 'Авто & Детейлинг'
  | 'Гастрономия'
  | 'Мебель & Дерево'
  | 'Ремонт & Интерьер'
  | 'Фото & Видео'
  | 'Кожа & Ремесло'
  | 'Инженерия'
  | 'Маникюр & Уход'
  | 'Флористика';
