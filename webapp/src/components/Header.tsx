import React from 'react';
import {
  Menu,
  Sun,
  Moon,
  Flame,
  BookOpen,
  ChevronDown,
} from 'lucide-react';
import type { AppTheme, BookId } from '../types/stoic.ts';
import { getThemeClasses } from '../utils/theme.ts';

interface HeaderProps {
  activeBookId: BookId;
  currentDayStep: number;
  readCount: number;
  totalUnits: number;
  unitLabel: string;
  streak: number;
  theme: AppTheme;
  onChangeTheme: (theme: AppTheme) => void;
  onOpenMenu: () => void;
  onOpenBookShelf: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeBookId,
  currentDayStep,
  readCount,
  totalUnits,
  unitLabel,
  streak,
  theme,
  onChangeTheme,
  onOpenMenu,
  onOpenBookShelf,
}) => {
  const t = getThemeClasses(theme);

  const toggleTheme = () => {
    onChangeTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const bookDisplayTitle =
    activeBookId === 'how-to-win-friends'
      ? 'วิธีชนะมิตรและจูงใจคน'
      : 'THE DAILY STOIC';

  return (
    <header className={`sticky top-0 z-30 border-b transition-colors duration-200 ${t.navBg}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        {/* Book Switcher Button (Replaces static title) */}
        <button
          onClick={onOpenBookShelf}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer select-none group ${t.cardBorder} ${t.cardBg} ${t.cardBgHover}`}
          title="สลับหนังสือ / เปิดคลังหนังสือปัญญา"
        >
          <BookOpen className="w-4 h-4 text-yellow-400 shrink-0" />
          <span className={`font-serif-thai font-bold text-xs sm:text-sm tracking-wide leading-none transition-colors group-hover:text-yellow-400 truncate max-w-[160px] sm:max-w-none ${t.textPrimary}`}>
            {bookDisplayTitle}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-yellow-400 shrink-0 transition-transform group-hover:translate-y-0.5" />
        </button>

        {/* Center / Right Status & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Subtle Progress / Streak */}
          <div className="flex items-center gap-2 text-xs text-stone-400 font-mono">
            {streak > 0 && (
              <span className="flex items-center gap-0.5 text-yellow-400 font-semibold" title={`อ่านต่อเนื่อง ${streak} วันติด`}>
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>{streak}</span>
              </span>
            )}
            <span className="hidden sm:inline text-stone-500">•</span>
            <span className="hidden xs:inline" title={`อ่านแล้ว ${readCount}/${totalUnits} ${unitLabel}`}>
              {unitLabel}ที่ {currentDayStep}/{totalUnits}
            </span>
          </div>

          {/* Quick Shelf Button on Desktop */}
          <button
            onClick={onOpenBookShelf}
            className={`hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-sans-thai font-medium transition-colors cursor-pointer ${t.cardBorder} text-yellow-400 hover:bg-yellow-400/10`}
            title="เลือกหนังสือเล่มอื่นในคลัง"
          >
            <span>สลับเล่ม</span>
          </button>

          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded-lg border text-stone-400 hover:${t.textPrimary} transition-colors cursor-pointer ${t.cardBorder}`}
            title={`เปลี่ยนธีม (ปัจจุบัน: ${theme === 'dark' ? 'โหมดมืด (Dark)' : 'โหมดสว่าง (Light)'})`}
            aria-label="เปลี่ยนธีม"
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-yellow-400" />
            ) : (
              <Sun className="w-4 h-4 text-yellow-500" />
            )}
          </button>

          {/* Menu / Drawer Button */}
          <button
            onClick={onOpenMenu}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${t.cardBorder} ${t.cardBg} ${t.cardBgHover}`}
            title="เปิดสารบัญและเครื่องมือ (Menu)"
          >
            <Menu className="w-4 h-4" />
            <span className="font-sans-thai hidden sm:inline">สารบัญ</span>
          </button>
        </div>
      </div>
    </header>
  );
};
