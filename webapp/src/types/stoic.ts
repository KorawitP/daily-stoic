export type BookId = 'daily-stoic' | 'how-to-win-friends';

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
export type AppTheme = 'dark' | 'light';
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

export interface CarnegiePartInfo {
  num: number;
  id: string;
  name_th: string;
  name_en: string;
  theme_th: string;
  theme_en: string;
  chapters: number;
}

export interface CarnegiePrincipleInfo {
  id: number;
  partNumber: number;
  partNameTh: string;
  partThemeTh: string;
  chapterTitleTh: string;
  chapterTitleEn: string;
  principleTh: string;
  principleEn: string;
}

export interface CarnegieMeta {
  bookId: BookId;
  bookTitleTh: string;
  bookTitleEn: string;
  authors: string;
  totalDays: number;
  parts: CarnegiePartInfo[];
  principles: CarnegiePrincipleInfo[];
  prefaceAndSuggestions: string;
  biographyAndSummary: string;
}

export interface ReadingBookmark {
  dayId: number;
  paragraphIndex: number;
  scrollPercent?: number;
  updatedAt: string; // ISO string
}

export interface DayProgress {
  completedAt: string; // ISO string
}

export interface BookProgressState {
  readDays: Record<number, DayProgress>;
  currentJourneyDay: number;
  lastActiveDayId?: number;
  bookmark?: ReadingBookmark | null;
  bookmarks?: Record<number, ReadingBookmark>;
  favorites: number[];
  notes: Record<number, string>;
}

export interface UserProgress {
  readDays: Record<number, DayProgress>; // dayId -> progress (active book or daily-stoic legacy)
  currentJourneyDay: number;
  lastActiveDayId?: number;
  bookmark?: ReadingBookmark | null;
  bookmarks?: Record<number, ReadingBookmark>;
  streak: number;
  lastCheckInDate: string; // YYYY-MM-DD
  favorites: number[]; // day IDs
  notes: Record<number, string>; // dayId -> personal reflection note
  theme: AppTheme;
  fontSize?: FontSize;
  readingMode: ReadingMode;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  app: string;
  activeBookId?: BookId;
  progress: UserProgress;
  carnegieProgress?: BookProgressState;
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
