import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  UserProgress,
  AppTheme,
  FontSize,
  ReadingMode,
  BackupData,
  BookId,
  BookProgressState,
} from '../types/stoic.ts';

const STORAGE_KEY = 'stoic_reader_progress_v1';
const CARNEGIE_STORAGE_KEY = 'carnegie_reader_progress_v1';
const ACTIVE_BOOK_KEY = 'wisdom_library_active_book_v1';

export const BOOK_TOTAL_UNITS: Record<BookId, number> = {
  'daily-stoic': 366,
  'how-to-win-friends': 30,
};

export function toLocalDateString(input?: string | number | Date): string {
  if (!input) return '';
  const d = new Date(input);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayString(): string {
  return toLocalDateString(new Date());
}

export function getYesterdayString(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return toLocalDateString(now);
}

export function computeActiveStreak(streak: number, lastCheckInDate: string): number {
  if (!lastCheckInDate || streak <= 0) return 0;
  const today = getTodayString();
  const yesterday = getYesterdayString();
  if (lastCheckInDate === today || lastCheckInDate === yesterday) {
    return streak;
  }
  return 0; // Streak broken because last check-in was 2 or more days ago
}

const DEFAULT_PROGRESS: UserProgress = {
  readDays: {},
  currentJourneyDay: 1,
  streak: 0,
  lastCheckInDate: '',
  favorites: [],
  notes: {},
  theme: 'dark',
  fontSize: 'md',
  readingMode: 'journey',
};

const DEFAULT_BOOK_PROGRESS: BookProgressState = {
  readDays: {},
  currentJourneyDay: 1,
  favorites: [],
  notes: {},
};

export function useReadingProgress() {
  const [activeBookId, setActiveBookIdState] = useState<BookId>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_BOOK_KEY);
      if (saved === 'how-to-win-friends' || saved === 'daily-stoic') {
        return saved;
      }
    } catch (e) {
      console.error('Failed to load active book from localStorage', e);
    }
    return 'daily-stoic';
  });

  // Stoic Progress + Global Settings (streak, theme, etc.)
  const [stoicProgress, setStoicProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PROGRESS,
          ...parsed,
          theme: parsed.theme === 'light' ? 'light' : 'dark',
        };
      }
    } catch (e) {
      console.error('Failed to load stoic reading progress from localStorage', e);
    }
    return DEFAULT_PROGRESS;
  });

  // Carnegie Progress
  const [carnegieProgress, setCarnegieProgress] = useState<BookProgressState>(() => {
    try {
      const saved = localStorage.getItem(CARNEGIE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_BOOK_PROGRESS, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load carnegie reading progress from localStorage', e);
    }
    return DEFAULT_BOOK_PROGRESS;
  });

  // Save activeBookId to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_BOOK_KEY, activeBookId);
    } catch (e) {
      console.error('Failed to save active book', e);
    }
  }, [activeBookId]);

  // Save Stoic progress to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stoicProgress));
    } catch (e) {
      console.error('Failed to save stoic reading progress', e);
    }
  }, [stoicProgress]);

  // Save Carnegie progress to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CARNEGIE_STORAGE_KEY, JSON.stringify(carnegieProgress));
    } catch (e) {
      console.error('Failed to save carnegie reading progress', e);
    }
  }, [carnegieProgress]);

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(stoicProgress.theme);
  }, [stoicProgress.theme]);

  // Current active book's view of UserProgress
  const progress: UserProgress = useMemo(() => {
    if (activeBookId === 'how-to-win-friends') {
      return {
        ...stoicProgress,
        readDays: carnegieProgress.readDays,
        currentJourneyDay: carnegieProgress.currentJourneyDay,
        favorites: carnegieProgress.favorites,
        notes: carnegieProgress.notes,
      };
    }
    return stoicProgress;
  }, [activeBookId, stoicProgress, carnegieProgress]);

  const setActiveBookId = useCallback((bookId: BookId) => {
    setActiveBookIdState(bookId);
  }, []);

  const isRead = useCallback((dayId: number): boolean => {
    return Boolean(progress.readDays[dayId]);
  }, [progress.readDays]);

  const toggleRead = useCallback((dayId: number): boolean => {
    const maxUnits = BOOK_TOTAL_UNITS[activeBookId];
    const today = getTodayString();
    const yesterday = getYesterdayString();

    if (activeBookId === 'how-to-win-friends') {
      const currentlyRead = Boolean(carnegieProgress.readDays[dayId]);
      const nowRead = !currentlyRead;

      setCarnegieProgress(prev => {
        const newReadDays = { ...prev.readDays };
        if (currentlyRead) {
          delete newReadDays[dayId];
        } else {
          newReadDays[dayId] = { completedAt: new Date().toISOString() };
        }

        let nextJourneyDay = prev.currentJourneyDay;
        if (nowRead && dayId === prev.currentJourneyDay) {
          for (let i = 1; i <= maxUnits; i++) {
            if (!newReadDays[i]) {
              nextJourneyDay = i;
              break;
            }
          }
        }

        return {
          ...prev,
          readDays: newReadDays,
          currentJourneyDay: nextJourneyDay,
        };
      });

      // Also update global streak if marking read
      if (nowRead) {
        setStoicProgress(prev => {
          let newStreak = prev.streak;
          if (prev.lastCheckInDate === today) {
            newStreak = prev.streak === 0 ? 1 : prev.streak;
          } else if (prev.lastCheckInDate === yesterday) {
            newStreak = prev.streak + 1;
          } else {
            newStreak = 1;
          }
          return {
            ...prev,
            streak: newStreak,
            lastCheckInDate: today,
          };
        });
      }

      return nowRead;
    }

    // Default: 'daily-stoic'
    let nowRead = false;
    setStoicProgress(prev => {
      const newReadDays = { ...prev.readDays };
      let newStreak = prev.streak;
      let newLastCheckInDate = prev.lastCheckInDate;

      if (newReadDays[dayId]) {
        delete newReadDays[dayId];
        nowRead = false;

        const otherTodayReads = Object.values(newReadDays).some(item => {
          return item.completedAt && toLocalDateString(item.completedAt) === today;
        });

        if (!otherTodayReads && prev.lastCheckInDate === today) {
          newStreak = Math.max(0, prev.streak - 1);
          newLastCheckInDate = newStreak > 0 ? yesterday : '';
        }
      } else {
        newReadDays[dayId] = { completedAt: new Date().toISOString() };
        nowRead = true;

        if (prev.lastCheckInDate === today) {
          newStreak = prev.streak === 0 ? 1 : prev.streak;
        } else if (prev.lastCheckInDate === yesterday) {
          newStreak = prev.streak + 1;
        } else {
          newStreak = 1;
        }
        newLastCheckInDate = today;
      }

      let nextJourneyDay = prev.currentJourneyDay;
      if (nowRead && dayId === prev.currentJourneyDay) {
        for (let i = 1; i <= 366; i++) {
          if (!newReadDays[i]) {
            nextJourneyDay = i;
            break;
          }
        }
      }

      return {
        ...prev,
        readDays: newReadDays,
        currentJourneyDay: nextJourneyDay,
        streak: newStreak,
        lastCheckInDate: newLastCheckInDate,
      };
    });
    return nowRead;
  }, [activeBookId, carnegieProgress.readDays]);

  const isFavorite = useCallback((dayId: number): boolean => {
    return progress.favorites.includes(dayId);
  }, [progress.favorites]);

  const toggleFavorite = useCallback((dayId: number) => {
    if (activeBookId === 'how-to-win-friends') {
      setCarnegieProgress(prev => {
        const exists = prev.favorites.includes(dayId);
        const newFavorites = exists
          ? prev.favorites.filter(id => id !== dayId)
          : [...prev.favorites, dayId];
        return { ...prev, favorites: newFavorites };
      });
      return;
    }
    setStoicProgress(prev => {
      const exists = prev.favorites.includes(dayId);
      const newFavorites = exists
        ? prev.favorites.filter(id => id !== dayId)
        : [...prev.favorites, dayId];
      return { ...prev, favorites: newFavorites };
    });
  }, [activeBookId]);

  const saveNote = useCallback((dayId: number, note: string) => {
    const trimmed = note.trim();
    if (activeBookId === 'how-to-win-friends') {
      setCarnegieProgress(prev => {
        const newNotes = { ...prev.notes };
        if (trimmed === '') {
          delete newNotes[dayId];
        } else {
          newNotes[dayId] = note;
        }
        return { ...prev, notes: newNotes };
      });
      return;
    }
    setStoicProgress(prev => {
      const newNotes = { ...prev.notes };
      if (trimmed === '') {
        delete newNotes[dayId];
      } else {
        newNotes[dayId] = note;
      }
      return { ...prev, notes: newNotes };
    });
  }, [activeBookId]);

  const deleteNote = useCallback((dayId: number) => {
    if (activeBookId === 'how-to-win-friends') {
      setCarnegieProgress(prev => {
        const newNotes = { ...prev.notes };
        delete newNotes[dayId];
        return { ...prev, notes: newNotes };
      });
      return;
    }
    setStoicProgress(prev => {
      const newNotes = { ...prev.notes };
      delete newNotes[dayId];
      return { ...prev, notes: newNotes };
    });
  }, [activeBookId]);

  const getNote = useCallback((dayId: number): string => {
    return progress.notes[dayId] || '';
  }, [progress.notes]);

  const setTheme = useCallback((theme: AppTheme) => {
    setStoicProgress(prev => ({ ...prev, theme }));
  }, []);

  const setFontSize = useCallback((fontSize: FontSize) => {
    setStoicProgress(prev => ({ ...prev, fontSize }));
  }, []);

  const setReadingMode = useCallback((readingMode: ReadingMode) => {
    setStoicProgress(prev => ({ ...prev, readingMode }));
  }, []);

  const setCurrentJourneyDay = useCallback((day: number) => {
    const maxUnits = BOOK_TOTAL_UNITS[activeBookId];
    const clamped = Math.max(1, Math.min(maxUnits, day));
    if (activeBookId === 'how-to-win-friends') {
      setCarnegieProgress(prev => ({ ...prev, currentJourneyDay: clamped }));
      return;
    }
    setStoicProgress(prev => ({ ...prev, currentJourneyDay: clamped }));
  }, [activeBookId]);

  const exportData = useCallback((): string => {
    const backup: BackupData = {
      version: '2.0.0',
      app: 'Personal Wisdom Library (Thai)',
      exportedAt: new Date().toISOString(),
      activeBookId,
      progress: stoicProgress,
      carnegieProgress,
    };
    return JSON.stringify(backup, null, 2);
  }, [activeBookId, stoicProgress, carnegieProgress]);

  const importData = useCallback((jsonStr: string): { success: boolean; newJourneyDay?: number; error?: string } => {
    try {
      const data = JSON.parse(jsonStr);
      const candidateProgress = data.progress || data;
      if (typeof candidateProgress !== 'object' || candidateProgress === null) {
        return { success: false, error: 'รูปแบบไฟล์ไม่ถูกต้อง (Invalid JSON structure)' };
      }

      // Sanitize Stoic readDays (1-366)
      const rawReadDays = typeof candidateProgress.readDays === 'object' && candidateProgress.readDays !== null
        ? candidateProgress.readDays
        : {};
      const readDays: Record<number, { completedAt: string }> = {};
      for (const [key, val] of Object.entries(rawReadDays)) {
        const dayId = Number(key);
        if (dayId >= 1 && dayId <= 366 && typeof val === 'object' && val !== null) {
          const comp = (val as { completedAt?: string }).completedAt;
          readDays[dayId] = { completedAt: typeof comp === 'string' ? comp : new Date().toISOString() };
        }
      }

      const rawFavorites = Array.isArray(candidateProgress.favorites) ? candidateProgress.favorites : [];
      const favorites: number[] = rawFavorites
        .map((x: unknown) => Number(x))
        .filter((id: number) => Number.isInteger(id) && id >= 1 && id <= 366);

      const rawNotes = typeof candidateProgress.notes === 'object' && candidateProgress.notes !== null
        ? candidateProgress.notes
        : {};
      const notes: Record<number, string> = {};
      for (const [key, val] of Object.entries(rawNotes)) {
        const dayId = Number(key);
        if (dayId >= 1 && dayId <= 366 && typeof val === 'string' && val.trim().length > 0) {
          notes[dayId] = val;
        }
      }

      const newStoicProgress: UserProgress = {
        readDays,
        currentJourneyDay: typeof candidateProgress.currentJourneyDay === 'number'
          ? Math.max(1, Math.min(366, candidateProgress.currentJourneyDay))
          : 1,
        streak: typeof candidateProgress.streak === 'number' ? Math.max(0, candidateProgress.streak) : 0,
        lastCheckInDate: typeof candidateProgress.lastCheckInDate === 'string' ? candidateProgress.lastCheckInDate : '',
        favorites,
        notes,
        theme: candidateProgress.theme === 'light' ? 'light' : 'dark',
        fontSize: ['sm', 'md', 'lg', 'xl'].includes(candidateProgress.fontSize) ? candidateProgress.fontSize : 'md',
        readingMode: ['journey', 'calendar', 'mood', 'grid'].includes(candidateProgress.readingMode) ? candidateProgress.readingMode : 'journey',
      };

      setStoicProgress(newStoicProgress);

      // Also restore carnegieProgress if present in v2 backup
      if (data.carnegieProgress && typeof data.carnegieProgress === 'object') {
        const cp = data.carnegieProgress;
        const cReadDays: Record<number, { completedAt: string }> = {};
        if (cp.readDays && typeof cp.readDays === 'object') {
          for (const [key, val] of Object.entries(cp.readDays)) {
            const id = Number(key);
            if (id >= 1 && id <= 30 && typeof val === 'object' && val !== null) {
              const comp = (val as { completedAt?: string }).completedAt;
              cReadDays[id] = { completedAt: typeof comp === 'string' ? comp : new Date().toISOString() };
            }
          }
        }
        const cFavs: number[] = Array.isArray(cp.favorites)
          ? cp.favorites.map(Number).filter((id: number) => Number.isInteger(id) && id >= 1 && id <= 30)
          : [];
        const cNotes: Record<number, string> = {};
        if (cp.notes && typeof cp.notes === 'object') {
          for (const [key, val] of Object.entries(cp.notes)) {
            const id = Number(key);
            if (id >= 1 && id <= 30 && typeof val === 'string' && val.trim().length > 0) {
              cNotes[id] = val;
            }
          }
        }
        const cJourney = typeof cp.currentJourneyDay === 'number'
          ? Math.max(1, Math.min(30, cp.currentJourneyDay))
          : 1;

        setCarnegieProgress({
          readDays: cReadDays,
          currentJourneyDay: cJourney,
          favorites: cFavs,
          notes: cNotes,
        });
      }

      if (data.activeBookId === 'how-to-win-friends' || data.activeBookId === 'daily-stoic') {
        setActiveBookIdState(data.activeBookId);
      }

      return {
        success: true,
        newJourneyDay: activeBookId === 'how-to-win-friends' && data.carnegieProgress
          ? data.carnegieProgress.currentJourneyDay || 1
          : newStoicProgress.currentJourneyDay,
      };
    } catch (e) {
      return { success: false, error: (e as Error).message || 'ไม่สามารถอ่านไฟล์ JSON ได้' };
    }
  }, [activeBookId]);

  const resetProgress = useCallback(() => {
    if (activeBookId === 'how-to-win-friends') {
      setCarnegieProgress(DEFAULT_BOOK_PROGRESS);
      return;
    }
    setStoicProgress(prev => ({
      ...DEFAULT_PROGRESS,
      theme: prev.theme,
    }));
  }, [activeBookId]);

  const stoicReadCount = useMemo(() => {
    return Object.keys(stoicProgress.readDays).filter(k => {
      const n = Number(k);
      return n >= 1 && n <= 366;
    }).length;
  }, [stoicProgress.readDays]);

  const carnegieReadCount = useMemo(() => {
    return Object.keys(carnegieProgress.readDays).filter(k => {
      const n = Number(k);
      return n >= 1 && n <= 30;
    }).length;
  }, [carnegieProgress.readDays]);

  const readCount = activeBookId === 'how-to-win-friends' ? carnegieReadCount : stoicReadCount;
  const totalUnits = BOOK_TOTAL_UNITS[activeBookId];
  const progressPercent = Math.round((readCount / totalUnits) * 100);

  const activeStreak = useMemo(() => {
    return computeActiveStreak(stoicProgress.streak, stoicProgress.lastCheckInDate);
  }, [stoicProgress.streak, stoicProgress.lastCheckInDate]);

  const isCheckedInToday = useMemo(() => {
    return stoicProgress.lastCheckInDate === getTodayString();
  }, [stoicProgress.lastCheckInDate]);

  return {
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
    deleteNote,
    getNote,
    setTheme,
    setFontSize,
    setReadingMode,
    setCurrentJourneyDay,
    readCount,
    totalUnits,
    progressPercent,
    activeStreak,
    isCheckedInToday,
    exportData,
    importData,
    resetProgress,
  };
}
