import React, { useState, useMemo, useCallback } from 'react';
import { INITIAL_WORKS, CURRENT_USER } from './data/mockWorks';
import { WorkItem, Creator, Booking, CategoryFilter } from './types';
import { Header } from './components/Header';
import { MasonryFeed } from './components/MasonryFeed';
import { WorkDetailModal } from './components/WorkDetailModal';
import { CreatorProfileModal } from './components/CreatorProfileModal';
import { LocationSheet } from './components/LocationSheet';
import { SearchFilterSheet } from './components/SearchFilterSheet';
import { ProfileScreen } from './components/ProfileScreen';
import { BookingModal } from './components/BookingModal';
import { ChatDrawer } from './components/ChatDrawer';
import { AddWorkModal } from './components/AddWorkModal';
import { BottomProfileButton } from './components/BottomProfileButton';

export default function App() {
  // --- Global Dataset State with LocalStorage persistence ---
  const [works, setWorks] = useState<WorkItem[]>(INITIAL_WORKS);
  const [currentUser, setCurrentUser] = useState<Creator>(() => {
    try {
      const savedUser = localStorage.getItem('bemoon_current_user');
      const savedAvatar = localStorage.getItem('bemoon_custom_avatar');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (savedAvatar && !savedAvatar.startsWith('http')) {
          parsed.avatar = savedAvatar;
        } else {
          parsed.avatar = '/master_cutout.png';
        }
        return { ...CURRENT_USER, ...parsed };
      }
      if (savedAvatar && !savedAvatar.startsWith('http')) {
        return { ...CURRENT_USER, avatar: savedAvatar };
      }
    } catch {}
    return CURRENT_USER;
  });

  const handleUpdateCurrentUser = useCallback((updated: Partial<Creator>) => {
    setCurrentUser((prev) => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem('bemoon_current_user', JSON.stringify(next));
        if (next.avatar) {
          localStorage.setItem('bemoon_custom_avatar', next.avatar);
        }
      } catch {}
      return next;
    });
  }, []);

  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('bemoon_liked_ids');
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set(['work-2', 'work-5', 'work-9', 'work-14']);
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('bemoon_liked_ids', JSON.stringify(Array.from(likedIds)));
    } catch {}
  }, [likedIds]);
  const [userWorks, setUserWorks] = useState<WorkItem[]>([
    INITIAL_WORKS[5] // The handcrafted solid oak dining table created by Dmitry / Alex
  ]);
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 'book-init-1',
      workId: 'work-1',
      workTitle: 'Текстурный кроп с переходом skin-fade',
      workImage: INITIAL_WORKS[0].image,
      creatorName: INITIAL_WORKS[0].creator.name,
      creatorAvatar: INITIAL_WORKS[0].creator.avatar,
      date: 'Сегодня, 2 октября',
      time: '18:00',
      priceFormatted: '1 800 ₽',
      status: 'confirmed',
      address: INITIAL_WORKS[0].creator.locationText
    }
  ]);

  // --- Location State ---
  const [city, setCity] = useState('Симферополь');
  const [street, setStreet] = useState('ул. Пушкина');
  const [district, setDistrict] = useState('Все районы');
  const [isPreciseLocation, setIsPreciseLocation] = useState(false);
  const [radiusKm, setRadiusKm] = useState(999); // default: whole city

  // --- Search & Filters State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('Все');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under3k' | 'mid' | 'premium'>('all');
  const [onlyToday, setOnlyToday] = useState(false);

  // --- Modal & Overlay States ---
  const [selectedWork, setSelectedWork] = useState<WorkItem | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [bookingTargetWork, setBookingTargetWork] = useState<WorkItem | null>(null);
  const [bookingTargetCreator, setBookingTargetCreator] = useState<Creator | null>(null);
  const [chatTarget, setChatTarget] = useState<{ creator: Creator; work?: WorkItem } | null>(null);
  const [isAddWorkOpen, setIsAddWorkOpen] = useState(false);

  // --- Like Toggle Handler ---
  const handleToggleLike = useCallback((workId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(workId)) {
        next.delete(workId);
      } else {
        next.add(workId);
      }
      return next;
    });
  }, []);

  // --- Filtered Works Calculation ---
  const filteredWorks = useMemo(() => {
    return works.filter((work) => {
      // 1. City Filter
      if (work.creator.city !== city) {
        return false;
      }

      // 2. District Filter
      if (district !== 'Все районы' && work.creator.district !== district) {
        return false;
      }

      // 3. Radius Filter
      if (radiusKm < 999 && work.creator.distanceKm > radiusKm) {
        return false;
      }

      // 4. Category Filter
      if (selectedCategory !== 'Все' && work.category !== selectedCategory) {
        return false;
      }

      // 5. Availability Filter
      if (onlyToday && !work.availableToday) {
        return false;
      }

      // 6. Price Filter
      if (priceFilter === 'under3k' && work.price > 3000) return false;
      if (priceFilter === 'mid' && (work.price <= 3000 || work.price > 15000)) return false;
      if (priceFilter === 'premium' && work.price <= 15000) return false;

      // 7. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = work.title.toLowerCase().includes(q);
        const matchesCategory = work.category.toLowerCase().includes(q);
        const matchesCreator = work.creator.name.toLowerCase().includes(q);
        const matchesDescription = work.description.toLowerCase().includes(q);
        const matchesSkills = work.creator.skills.some((s) => s.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCategory && !matchesCreator && !matchesDescription && !matchesSkills) {
          return false;
        }
      }

      return true;
    });
  }, [works, city, district, radiusKm, selectedCategory, onlyToday, priceFilter, searchQuery]);

  // Liked Works List
  const likedWorksList = useMemo(() => {
    return works.filter((w) => likedIds.has(w.id));
  }, [works, likedIds]);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim() !== '' ||
      selectedCategory !== 'Все' ||
      priceFilter !== 'all' ||
      onlyToday
    );
  }, [searchQuery, selectedCategory, priceFilter, onlyToday]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('Все');
    setPriceFilter('all');
    setOnlyToday(false);
  }, []);

  // Home Button (Clicking BE'MOON Logo)
  const handleHomeClick = useCallback(() => {
    setSelectedWork(null);
    setSelectedCreator(null);
    setIsProfileOpen(false);
    setIsAddWorkOpen(false);
    setIsLocationOpen(false);
    setIsSearchOpen(false);
    setBookingTargetWork(null);
    setChatTarget(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (hasActiveFilters) {
      handleResetFilters();
    }
  }, [hasActiveFilters, handleResetFilters]);

  // Booking handlers
  const handleStartBooking = useCallback((work?: WorkItem | null, creator?: Creator | null) => {
    setBookingTargetWork(work || null);
    setBookingTargetCreator(creator || work?.creator || null);
  }, []);

  const handleConfirmBooking = useCallback((newBooking: Booking) => {
    setBookings((prev) => [newBooking, ...prev]);
  }, []);

  // Chat handlers
  const handleStartChat = useCallback((creator: Creator, work?: WorkItem) => {
    setChatTarget({ creator, work });
  }, []);

  // Add Work handler
  const handleAddWork = useCallback((newWork: WorkItem) => {
    setWorks((prev) => [newWork, ...prev]);
    setUserWorks((prev) => [newWork, ...prev]);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0d0e12] text-[#f3f4f6]">
      {/* Floating Minimal Header */}
      <Header
        city={city}
        street={street}
        isPreciseLocation={isPreciseLocation}
        onHomeClick={handleHomeClick}
        onOpenLocation={() => setIsLocationOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Main Content: Pinterest-style 2-Column Masonry Feed (CONTENT FIRST) */}
      <main className="relative">
        <MasonryFeed
          works={filteredWorks}
          onSelectWork={(work) => setSelectedWork(work)}
          onToggleLike={handleToggleLike}
          likedIds={likedIds}
        />
      </main>

      {/* Floating Bottom Profile Button */}
      <BottomProfileButton
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* 5-10% Bottom Gradient Fade */}
      <div className="fixed inset-x-0 bottom-0 bottom-feed-vignette min-h-16 pointer-events-none z-30" />

      {/* 1. Work Detail Modal */}
      <WorkDetailModal
        work={selectedWork}
        onClose={() => setSelectedWork(null)}
        onToggleLike={handleToggleLike}
        isLiked={selectedWork ? likedIds.has(selectedWork.id) : false}
        onSelectWork={(work) => setSelectedWork(work)}
        allWorks={works}
        onOpenCreatorProfile={(creator) => {
          setSelectedCreator(creator);
        }}
        onStartBooking={handleStartBooking}
        onStartChat={handleStartChat}
      />

      {/* 2. Creator Full Profile Modal */}
      <CreatorProfileModal
        creator={selectedCreator}
        onClose={() => setSelectedCreator(null)}
        creatorWorks={works.filter((w) => w.creator.id === selectedCreator?.id)}
        onSelectWork={(work) => {
          setSelectedCreator(null);
          setSelectedWork(work);
        }}
        onToggleLike={handleToggleLike}
        likedIds={likedIds}
        onStartChat={(creator) => handleStartChat(creator)}
        onStartBooking={(creator) => {
          setSelectedCreator(null);
          handleStartBooking(null, creator);
        }}
      />

      {/* 3. Location Sheet ("ГДЕ Я") */}
      <LocationSheet
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
        selectedCity={city}
        onSelectCity={(newCity) => {
          setCity(newCity);
          if (newCity !== 'Симферополь') setDistrict('Все районы');
        }}
        selectedDistrict={district}
        onSelectDistrict={setDistrict}
        isPreciseLocation={isPreciseLocation}
        onTogglePreciseLocation={(enable) => {
          setIsPreciseLocation(enable);
          if (enable) {
            setStreet('ул. Пушкина');
          }
        }}
        streetName={street}
        radiusKm={radiusKm}
        onSelectRadius={setRadiusKm}
        works={works}
        onSelectWork={(w) => setSelectedWork(w)}
      />

      {/* 4. Search & Filters Sheet ("ЧТО ИЩУ") */}
      <SearchFilterSheet
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        priceFilter={priceFilter}
        onSelectPriceFilter={setPriceFilter}
        onlyToday={onlyToday}
        onToggleOnlyToday={setOnlyToday}
        onResetFilters={handleResetFilters}
        matchingCount={filteredWorks.length}
      />

      {/* 5. Unified Profile Screen ("КТО Я" / Control Center) */}
      <ProfileScreen
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        userWorks={userWorks}
        likedWorks={likedWorksList}
        bookings={bookings}
        onSelectWork={(work) => {
          setIsProfileOpen(false);
          setSelectedWork(work);
        }}
        onToggleLike={handleToggleLike}
        likedIds={likedIds}
        onOpenAddWork={() => setIsAddWorkOpen(true)}
        onOpenChatWithCreator={(creator, work) => handleStartChat(creator, work)}
        onUpdateCurrentUser={handleUpdateCurrentUser}
      />

      {/* 6. Booking Modal */}
      <BookingModal
        work={bookingTargetWork}
        creator={bookingTargetCreator}
        onClose={() => {
          setBookingTargetWork(null);
          setBookingTargetCreator(null);
        }}
        onConfirmBooking={handleConfirmBooking}
      />

      {/* 7. Chat Drawer */}
      <ChatDrawer
        isOpen={Boolean(chatTarget)}
        onClose={() => setChatTarget(null)}
        creator={chatTarget?.creator || null}
        work={chatTarget?.work}
      />

      {/* 8. Add Work Modal */}
      <AddWorkModal
        isOpen={isAddWorkOpen}
        onClose={() => setIsAddWorkOpen(false)}
        currentUser={currentUser}
        onAddWork={handleAddWork}
      />
    </div>
  );
}
