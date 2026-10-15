import React from 'react';
import {
  Menu,
  Sun,
  Moon,
  Scroll,
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

  const cycleTheme = () => {
    if (theme === 'parchment') onChangeTheme('dark');
    else if (theme === 'dark') onChangeTheme('light');
    else onChangeTheme('parchment');
  };

  return (
    <header className={`sticky top-0 z-30 border-b transition-colors duration-200 ${t.navBg}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={onResetToCurrentDay}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
          title="The Daily Stoic (366 วันแห่งปัญญา)"
        >
          <div className="w-7 h-7 rounded-full bg-amber-600/15 text-amber-700 dark:text-amber-400 flex items-center justify-center font-serif font-bold text-sm border border-amber-600/30">
            Σ
          </div>
          <div>
            <span className="font-serif-thai font-bold text-sm sm:text-base tracking-wider leading-none group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
              THE DAILY STOIC
            </span>
          </div>
        </div>

        {/* Center / Right Quiet Status & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Subtle Progress / Streak */}
          <div className="flex items-center gap-2 text-xs text-stone-500 font-mono">
            {streak > 0 && (
              <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-semibold" title={`อ่านต่อเนื่อง ${streak} วันติด`}>
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>{streak}</span>
              </span>
            )}
            <span className="hidden xs:inline text-stone-400">•</span>
            <span title={`อ่านแล้ว ${readCount}/366 ก้าว`}>
              ก้าวที่ {currentDayStep}
            </span>
          </div>

          {/* Theme switcher */}
          <button
            onClick={cycleTheme}
            className={`p-1.5 rounded-lg border text-stone-500 hover:${t.textPrimary} transition-colors cursor-pointer ${t.cardBorder}`}
            title={`เปลี่ยนธีม (ปัจจุบัน: ${
              theme === 'parchment' ? 'กระดาษโบราณ' : theme === 'dark' ? 'มืดสโตอิก' : 'สว่าง'
            })`}
            aria-label="เปลี่ยนธีม"
          >
            {theme === 'parchment' ? (
              <Scroll className="w-4 h-4 text-amber-800" />
            ) : theme === 'dark' ? (
              <Moon className="w-4 h-4 text-amber-300" />
            ) : (
              <Sun className="w-4 h-4 text-amber-600" />
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
