import { useState, useEffect } from 'react';
import type { StoicDay } from './types/stoic.ts';
import rawDaysData from './data/daily_stoic.json';
import { useReadingProgress } from './hooks/useReadingProgress.ts';
import { getThemeClasses } from './utils/theme.ts';

import { Header } from './components/Header.tsx';
import { ReaderView } from './components/ReaderView.tsx';
import { MenuDrawer } from './components/MenuDrawer.tsx';

const daysData = rawDaysData as unknown as StoicDay[];

export function App() {
  const {
    progress,
    isRead,
    toggleRead,
    isFavorite,
    toggleFavorite,
    saveNote,
    getNote,
    setTheme,
    setCurrentJourneyDay,
    readCount,
    exportData,
    importData,
    resetProgress,
  } = useReadingProgress();

  const [activeDayId, setActiveDayId] = useState<number>(progress.currentJourneyDay || 1);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const t = getThemeClasses(progress.theme);
  const currentDay = daysData.find(d => d.id === activeDayId) || daysData[0];

  // Global Keyboard Shortcuts (Ctrl+K or / to open Menu/Search, Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsMenuOpen(prev => !prev);
      } else if (e.key === '/' && !isMenuOpen) {
        const target = e.target as HTMLElement;
        if (
          target.tagName !== 'INPUT' &&
          target.tagName !== 'TEXTAREA' &&
          !target.isContentEditable
        ) {
          e.preventDefault();
          setIsMenuOpen(true);
        }
      } else if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  const handleSelectDay = (dayId: number) => {
    setActiveDayId(dayId);
    setIsMenuOpen(false);
  };

  const handlePrevDay = () => {
    if (activeDayId > 1) {
      setActiveDayId(activeDayId - 1);
    }
  };

  const handleNextDay = () => {
    if (activeDayId < 366) {
      setActiveDayId(activeDayId + 1);
    }
  };

  const handleResetToCurrentDay = () => {
    setActiveDayId(progress.currentJourneyDay || 1);
  };

  const handleExportBackup = () => {
    const jsonStr = exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-stoic-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
      {/* 1. Minimal Header */}
      <Header
        currentDayStep={currentDay.dayStep}
        readCount={readCount}
        streak={progress.streak}
        theme={progress.theme}
        onChangeTheme={setTheme}
        onOpenMenu={() => setIsMenuOpen(true)}
        onResetToCurrentDay={handleResetToCurrentDay}
      />

      {/* 2. Main Zen Reading Area */}
      <main className="flex-1">
        <ReaderView
          key={currentDay.id}
          day={currentDay}
          theme={progress.theme}
          isRead={isRead(currentDay.id)}
          onToggleRead={() => {
            const nowRead = toggleRead(currentDay.id);
            if (nowRead && activeDayId === progress.currentJourneyDay && activeDayId < 366) {
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
          hasNext={activeDayId < 366}
          disabledKeyboardShortcuts={isMenuOpen}
        />
      </main>

      {/* 3. Slide-over Table of Contents & Tools Drawer */}
      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        days={daysData}
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
    </div>
  );
}

export default App;
