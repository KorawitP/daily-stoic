import React from 'react';
import {
  Menu,
  Sun,
  Moon,
  Flame,
} from 'lucide-react';
import type { AppTheme } from '../types/stoic.ts';
import { getThemeClasses } from '../utils/theme.ts';

interface HeaderProps {
  currentDayStep: number;
  readCount: number;
  streak: number;
  theme: AppTheme;
  onChangeTheme: (theme: AppTheme) => void;
  onOpenMenu: () => void;
  onResetToCurrentDay?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDayStep,
  readCount,
  streak,
  theme,
  onChangeTheme,
  onOpenMenu,
  onResetToCurrentDay,
}) => {
  const t = getThemeClasses(theme);

  const toggleTheme = () => {
    onChangeTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className={`sticky top-0 z-30 border-b transition-colors duration-200 ${t.navBg}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand without logo */}
        <div
          onClick={onResetToCurrentDay}
          className="flex items-center cursor-pointer select-none group"
          title="The Daily Stoic (366 วันแห่งปัญญา)"
        >
          <span className={`font-serif-thai font-bold text-sm sm:text-base tracking-wider leading-none transition-colors group-hover:text-yellow-400 ${t.textPrimary}`}>
            THE DAILY STOIC
          </span>
        </div>

        {/* Center / Right Status & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Subtle Progress / Streak */}
          <div className="flex items-center gap-2 text-xs text-stone-400 font-mono">
            {streak > 0 && (
              <span className="flex items-center gap-0.5 text-yellow-400 font-semibold" title={`อ่านต่อเนื่อง ${streak} วันติด`}>
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>{streak}</span>
              </span>
            )}
            <span className="hidden xs:inline text-stone-500">•</span>
            <span title={`อ่านแล้ว ${readCount}/366 ก้าว`}>
              ก้าวที่ {currentDayStep}
            </span>
          </div>

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
