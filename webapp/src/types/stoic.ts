export interface StoicDay {
  id: number;
  dayStep: number;
  dayOfMonth: number;
  monthNumber: number;
  dateLabel: string;
  monthNameTh: string;
  monthNameEn: string;
  monthThemeTh: string;
  monthThemeEn: string;
  partNumber: number;
  disciplineTh: string;
  disciplineEn: string;
  titleTh: string;
  titleEn: string;
  quote: string;
  author: string;
  authorEn: string;
  source: string;
  paragraphs: string[];
  moodCategory: string;
  tags: string[];
}

export type ReadingMode = 'journey' | 'calendar' | 'mood' | 'grid';
export type AppTheme = 'parchment' | 'dark' | 'light';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';

export interface MoodCategoryInfo {
  id: string;
  title_th: string;
  title_en: string;
  icon: string;
  color: string;
  keywords: string[];
}

export interface MonthInfo {
  num: number;
  name_th: string;
  name_en: string;
  theme_th: string;
  theme_en: string;
  part: number;
  discipline_th: string;
  discipline_en: string;
  days: number;
}

export interface BookMeta {
  bookTitleTh: string;
  bookTitleEn: string;
  authors: string;
  totalDays: number;
  moodCategories: Record<string, MoodCategoryInfo>;
  months: MonthInfo[];
  introduction: string;
  glossary: string;
}

export interface DayProgress {
  completedAt: string; // ISO string
}

export interface UserProgress {
  readDays: Record<number, DayProgress>; // dayId -> progress
  currentJourneyDay: number;
  streak: number;
  lastCheckInDate: string; // YYYY-MM-DD
  favorites: number[]; // day IDs
  notes: Record<number, string>; // dayId -> personal reflection note
  theme: AppTheme;
  fontSize: FontSize;
  readingMode: ReadingMode;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  app: string;
  progress: UserProgress;
}

export interface ReflectionItem {
  dayId: number;
  dayStep: number;
  dateLabel: string;
  titleTh: string;
  author: string;
  quote: string;
  note: string;
}

