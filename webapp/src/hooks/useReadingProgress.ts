import { useState, useEffect, useCallback, useMemo } from 'react';
import type { UserProgress, AppTheme, FontSize, ReadingMode, BackupData } from '../types/stoic.ts';

const STORAGE_KEY = 'stoic_reader_progress_v1';

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

export function useReadingProgress() {
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PROGRESS, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load reading progress from localStorage', e);
    }
    return DEFAULT_PROGRESS;
  });

  // Save to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save reading progress', e);
    }
  }, [progress]);

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(progress.theme);
  }, [progress.theme]);

  const isRead = useCallback((dayId: number): boolean => {
    return Boolean(progress.readDays[dayId]);
  }, [progress.readDays]);

  const toggleRead = useCallback((dayId: number): boolean => {
    let nowRead = false;
    setProgress(prev => {
      const newReadDays = { ...prev.readDays };
      const today = getTodayString();
      const yesterday = getYesterdayString();
      let newStreak = prev.streak;
      let newLastCheckInDate = prev.lastCheckInDate;

      if (newReadDays[dayId]) {
        // Unmark as read
        delete newReadDays[dayId];
        nowRead = false;

        // If today has no other completed days, adjust streak safely
        const otherTodayReads = Object.values(newReadDays).some(item => {
          return item.completedAt && toLocalDateString(item.completedAt) === today;
        });

        if (!otherTodayReads && prev.lastCheckInDate === today) {
          // Revert today's addition
          newStreak = Math.max(0, prev.streak - 1);
          newLastCheckInDate = newStreak > 0 ? yesterday : '';
        }
      } else {
        // Mark as read
        newReadDays[dayId] = { completedAt: new Date().toISOString() };
        nowRead = true;

        // Calculate streak
        if (prev.lastCheckInDate === today) {
          // Already checked in today, keep streak
          newStreak = prev.streak === 0 ? 1 : prev.streak;
        } else if (prev.lastCheckInDate === yesterday) {
          // Checked in yesterday, extend streak
          newStreak = prev.streak + 1;
        } else {
          // Gap of 2+ days or first time ever
          newStreak = 1;
        }
        newLastCheckInDate = today;
      }

      // If user read current journey day, auto advance to next unread
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
  }, []);

  const isFavorite = useCallback((dayId: number): boolean => {
    return progress.favorites.includes(dayId);
  }, [progress.favorites]);

  const toggleFavorite = useCallback((dayId: number) => {
    setProgress(prev => {
      const exists = prev.favorites.includes(dayId);
      const newFavorites = exists
        ? prev.favorites.filter(id => id !== dayId)
        : [...prev.favorites, dayId];
      return { ...prev, favorites: newFavorites };
    });
  }, []);

  const saveNote = useCallback((dayId: number, note: string) => {
    setProgress(prev => {
      const trimmed = note.trim();
      const newNotes = { ...prev.notes };
      if (trimmed === '') {
        delete newNotes[dayId];
      } else {
        newNotes[dayId] = note;
      }
      return {
        ...prev,
        notes: newNotes,
      };
    });
  }, []);

  const deleteNote = useCallback((dayId: number) => {
    setProgress(prev => {
      const newNotes = { ...prev.notes };
      delete newNotes[dayId];
      return { ...prev, notes: newNotes };
    });
  }, []);

  const getNote = useCallback((dayId: number): string => {
    return progress.notes[dayId] || '';
  }, [progress.notes]);

  const setTheme = useCallback((theme: AppTheme) => {
    setProgress(prev => ({ ...prev, theme }));
  }, []);

  const setFontSize = useCallback((fontSize: FontSize) => {
    setProgress(prev => ({ ...prev, fontSize }));
  }, []);

  const setReadingMode = useCallback((readingMode: ReadingMode) => {
    setProgress(prev => ({ ...prev, readingMode }));
  }, []);

  const setCurrentJourneyDay = useCallback((day: number) => {
    setProgress(prev => ({ ...prev, currentJourneyDay: Math.max(1, Math.min(366, day)) }));
  }, []);

  const exportData = useCallback((): string => {
    const backup: BackupData = {
      version: '1.0.0',
      app: 'The Daily Stoic (Thai)',
      exportedAt: new Date().toISOString(),
      progress,
    };
    return JSON.stringify(backup, null, 2);
  }, [progress]);

  const importData = useCallback((jsonStr: string): { success: boolean; newJourneyDay?: number; error?: string } => {
    try {
      const data = JSON.parse(jsonStr);
      const candidateProgress = data.progress || data;
      if (typeof candidateProgress !== 'object' || candidateProgress === null) {
        return { success: false, error: 'รูปแบบไฟล์ไม่ถูกต้อง (Invalid JSON structure)' };
      }

      // Sanitize readDays
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

      // Sanitize favorites (only valid 1-366 IDs)
      const rawFavorites = Array.isArray(candidateProgress.favorites) ? candidateProgress.favorites : [];
      const favorites: number[] = rawFavorites
        .map((x: unknown) => Number(x))
        .filter((id: number) => Number.isInteger(id) && id >= 1 && id <= 366);

      // Sanitize notes
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

      const newProgress: UserProgress = {
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

      setProgress(newProgress);
      return { success: true, newJourneyDay: newProgress.currentJourneyDay };
    } catch (e) {
      return { success: false, error: (e as Error).message || 'ไม่สามารถอ่านไฟล์ JSON ได้' };
    }
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
  }, []);

  const readCount = useMemo(() => {
    return Object.keys(progress.readDays).filter(k => {
      const n = Number(k);
      return n >= 1 && n <= 366;
    }).length;
  }, [progress.readDays]);
  const progressPercent = Math.round((readCount / 366) * 100);

  const activeStreak = useMemo(() => {
    return computeActiveStreak(progress.streak, progress.lastCheckInDate);
  }, [progress.streak, progress.lastCheckInDate]);

  const isCheckedInToday = useMemo(() => {
    return progress.lastCheckInDate === getTodayString();
  }, [progress.lastCheckInDate]);

  return {
    progress,
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
    progressPercent,
    activeStreak,
    isCheckedInToday,
    exportData,
    importData,
    resetProgress,
  };
}
