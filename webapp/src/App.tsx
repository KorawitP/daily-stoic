import { useState, useEffect } from 'react';
import type { StoicDay, BookId, CarnegieMeta } from './types/stoic.ts';
import rawStoicDaysData from './data/daily_stoic.json';
import rawCarnegieDaysData from './data/how_to_win_friends.json';
import rawCarnegieMeta from './data/carnegie_meta.json';
import { useReadingProgress, BOOK_TOTAL_UNITS } from './hooks/useReadingProgress.ts';
import { getThemeClasses } from './utils/theme.ts';

import { Header } from './components/Header.tsx';
import { ReaderView } from './components/ReaderView.tsx';
import { MenuDrawer } from './components/MenuDrawer.tsx';
import { BookShelfModal } from './components/BookShelfModal.tsx';

const stoicDaysData = rawStoicDaysData as unknown as StoicDay[];
const carnegieDaysData = rawCarnegieDaysData as unknown as StoicDay[];
const carnegieMeta = rawCarnegieMeta as unknown as CarnegieMeta;

export function App() {
  const {
    activeBookId,
    setActiveBookId,
    progress,
    stoicProgress,
    carnegieProgress,
    stoicReadCount,
    carnegieReadCount,
    isRead,
    toggleRead,
    isFavorite,
    toggleFavorite,
    saveNote,
    getNote,
    setTheme,
    setCurrentJourneyDay,
    readCount,
    totalUnits,
    exportData,
    importData,
    resetProgress,
  } = useReadingProgress();

  const [activeDayId, setActiveDayId] = useState<number>(progress.currentJourneyDay || 1);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isBookShelfOpen, setIsBookShelfOpen] = useState<boolean>(false);

  const t = getThemeClasses(progress.theme);
  const daysData = activeBookId === 'how-to-win-friends' ? carnegieDaysData : stoicDaysData;
  const unitLabel = activeBookId === 'how-to-win-friends' ? 'บท' : 'ก้าว';
  const currentDay = daysData.find(d => d.id === activeDayId) || daysData[0];

  // Global Keyboard Shortcuts (Ctrl+K or / to open Menu/Search, Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsMenuOpen(prev => !prev);
      } else if (e.key === '/' && !isMenuOpen && !isBookShelfOpen) {
        const target = e.target as HTMLElement;
        if (
          target.tagName !== 'INPUT' &&
          target.tagName !== 'TEXTAREA' &&
          !target.isContentEditable
        ) {
          e.preventDefault();
          setIsMenuOpen(true);
        }
      } else if (e.key === 'Escape') {
        if (isMenuOpen) setIsMenuOpen(false);
        if (isBookShelfOpen) setIsBookShelfOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen, isBookShelfOpen]);

  const handleSelectBook = (bookId: BookId) => {
    setActiveBookId(bookId);
    const targetJourneyDay =
      bookId === 'how-to-win-friends'
        ? carnegieProgress.currentJourneyDay || 1
        : stoicProgress.currentJourneyDay || 1;
    setActiveDayId(targetJourneyDay);
  };

  const handleSelectDay = (dayId: number) => {
    setActiveDayId(dayId);
    setCurrentJourneyDay(dayId);
    setIsMenuOpen(false);
  };

  const handlePrevDay = () => {
    if (activeDayId > 1) {
      const prev = activeDayId - 1;
      setActiveDayId(prev);
      setCurrentJourneyDay(prev);
    }
  };

  const handleNextDay = () => {
    const maxUnits = BOOK_TOTAL_UNITS[activeBookId];
    if (activeDayId < maxUnits) {
      const next = activeDayId + 1;
      setActiveDayId(next);
      setCurrentJourneyDay(next);
    }
  };

  const handleExportBackup = () => {
    const jsonStr = exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wisdom-library-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = async (file: File) => {
    try {
      const text = await file.text();
      const res = importData(text);
      if (res.success) {
        if (res.newJourneyDay) {
          setActiveDayId(res.newJourneyDay);
        }
        alert('นำเข้าข้อมูลสำเร็จเรียบร้อยแล้ว');
      } else {
        alert(res.error || 'ไฟล์ไม่ถูกต้อง');
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการอ่านไฟล์');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${t.appBg} flex flex-col`}>
      {/* 1. Minimal Header with Book Switcher */}
      <Header
        activeBookId={activeBookId}
        currentDayStep={currentDay.dayStep}
        readCount={readCount}
        totalUnits={totalUnits}
        unitLabel={unitLabel}
        streak={progress.streak}
        theme={progress.theme}
        onChangeTheme={setTheme}
        onOpenMenu={() => setIsMenuOpen(true)}
        onOpenBookShelf={() => setIsBookShelfOpen(true)}
      />

      {/* 2. Main Zen Reading Area */}
      <main className="flex-1">
        <ReaderView
          key={`${activeBookId}-${currentDay.id}`}
          day={currentDay}
          activeBookId={activeBookId}
          unitLabel={unitLabel}
          theme={progress.theme}
          isRead={isRead(currentDay.id)}
          onToggleRead={() => {
            const nowRead = toggleRead(currentDay.id);
            if (nowRead && activeDayId === progress.currentJourneyDay && activeDayId < totalUnits) {
              setCurrentJourneyDay(activeDayId + 1);
            }
          }}
          isFavorite={isFavorite(currentDay.id)}
          onToggleFavorite={() => toggleFavorite(currentDay.id)}
          savedNote={getNote(currentDay.id)}
          onSaveNote={(note: string) => saveNote(currentDay.id, note)}
          onPrevDay={handlePrevDay}
          onNextDay={handleNextDay}
          hasPrev={activeDayId > 1}
          hasNext={activeDayId < totalUnits}
          disabledKeyboardShortcuts={isMenuOpen || isBookShelfOpen}
        />
      </main>

      {/* 3. Slide-over Table of Contents & Tools Drawer */}
      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeBookId={activeBookId}
        onOpenBookShelf={() => setIsBookShelfOpen(true)}
        days={daysData}
        carnegieMeta={carnegieMeta}
        currentDayId={activeDayId}
        readDays={progress.readDays}
        streak={progress.streak}
        favorites={progress.favorites}
        theme={progress.theme}
        onSelectDay={handleSelectDay}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onResetProgress={() => {
          resetProgress();
          setActiveDayId(1);
        }}
      />

      {/* 4. Multi-Book Library Shelf Modal */}
      <BookShelfModal
        isOpen={isBookShelfOpen}
        onClose={() => setIsBookShelfOpen(false)}
        activeBookId={activeBookId}
        onSelectBook={handleSelectBook}
        stoicReadCount={stoicReadCount}
        stoicCurrentDay={stoicProgress.currentJourneyDay || 1}
        carnegieReadCount={carnegieReadCount}
        carnegieCurrentDay={carnegieProgress.currentJourneyDay || 1}
        theme={progress.theme}
      />
    </div>
  );
}

export default App;
