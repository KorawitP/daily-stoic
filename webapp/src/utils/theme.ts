import type { AppTheme } from '../types/stoic.ts';

export interface ThemeColors {
  appBg: string;
  cardBg: string;
  cardBgHover: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentBg: string;
  quoteBoxBg: string;
  quoteBoxBorder: string;
  navBg: string;
}

export function getThemeClasses(theme: AppTheme): ThemeColors {
  if (theme === 'light') {
    return {
      appBg: 'bg-[#ffffff] text-[#0a0a0a]',
      cardBg: 'bg-[#f5f5f5]',
      cardBgHover: 'hover:bg-[#ebebeb]',
      cardBorder: 'border-[#e5e5e5]',
      textPrimary: 'text-[#0a0a0a]',
      textSecondary: 'text-[#525252]',
      textMuted: 'text-[#737373]',
      accent: 'text-yellow-600',
      accentBg: 'bg-yellow-50 text-yellow-800 border-yellow-300',
      quoteBoxBg: 'bg-[#fafafa]',
      quoteBoxBorder: 'border-yellow-500/60',
      navBg: 'bg-white/95 backdrop-blur-md border-[#e5e5e5]',
    };
  }

  // Default: Dark (Strictly Black, White, Yellow)
  return {
    appBg: 'bg-[#0a0a0a] text-white',
    cardBg: 'bg-[#141414]',
    cardBgHover: 'hover:bg-[#1f1f1f]',
    cardBorder: 'border-[#262626]',
    textPrimary: 'text-white',
    textSecondary: 'text-[#a3a3a3]',
    textMuted: 'text-[#737373]',
    accent: 'text-yellow-400',
    accentBg: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
    quoteBoxBg: 'bg-[#121212]',
    quoteBoxBorder: 'border-yellow-400/60',
    navBg: 'bg-[#0a0a0a]/95 backdrop-blur-md border-[#262626]',
  };
}
