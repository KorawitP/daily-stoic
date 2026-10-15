import type { AppTheme, FontSize } from '../types/stoic.ts';

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
  switch (theme) {
    case 'dark':
      return {
        appBg: 'bg-[#0f0f11] text-[#e4e4e9]',
        cardBg: 'bg-[#18181d]',
        cardBgHover: 'hover:bg-[#222229]',
        cardBorder: 'border-[#27272f]',
        textPrimary: 'text-[#f4f4f7]',
        textSecondary: 'text-[#9fa0af]',
        textMuted: 'text-[#6d6e7e]',
        accent: 'text-amber-400',
        accentBg: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
        quoteBoxBg: 'bg-[#15151a]',
        quoteBoxBorder: 'border-amber-500/40',
        navBg: 'bg-[#131317]/90 backdrop-blur-md border-[#27272f]',
      };
    case 'light':
      return {
        appBg: 'bg-[#fafafa] text-[#1c1917]',
        cardBg: 'bg-[#ffffff]',
        cardBgHover: 'hover:bg-[#f3f4f6]',
        cardBorder: 'border-[#e5e7eb]',
        textPrimary: 'text-[#111827]',
        textSecondary: 'text-[#4b5563]',
        textMuted: 'text-[#9ca3af]',
        accent: 'text-amber-700',
        accentBg: 'bg-amber-50 text-amber-800 border-amber-200',
        quoteBoxBg: 'bg-[#f8fafc]',
        quoteBoxBorder: 'border-amber-600/40',
        navBg: 'bg-white/90 backdrop-blur-md border-gray-200',
      };
    case 'parchment':
    default:
      return {
        appBg: 'bg-[#f7f2e7] text-[#2c2621]',
        cardBg: 'bg-[#ede5d3]',
        cardBgHover: 'hover:bg-[#e4dbca]',
        cardBorder: 'border-[#dbd1bd]',
        textPrimary: 'text-[#241e1a]',
        textSecondary: 'text-[#6b5f54]',
        textMuted: 'text-[#948779]',
        accent: 'text-[#8c501c]',
        accentBg: 'bg-[#8c501c]/10 text-[#713e14] border-[#8c501c]/30',
        quoteBoxBg: 'bg-[#f2ece0]',
        quoteBoxBorder: 'border-[#8c501c]/40',
        navBg: 'bg-[#f2ece0]/95 backdrop-blur-md border-[#dbd1bd]',
      };
  }
}

export function getFontSizeClass(size: FontSize): {
  body: string;
  quote: string;
  title: string;
} {
  switch (size) {
    case 'sm':
      return {
        body: 'text-base leading-relaxed',
        quote: 'text-base leading-relaxed',
        title: 'text-2xl',
      };
    case 'lg':
      return {
        body: 'text-xl leading-loose',
        quote: 'text-xl leading-relaxed',
        title: 'text-3xl sm:text-4xl',
      };
    case 'xl':
      return {
        body: 'text-2xl leading-loose',
        quote: 'text-2xl leading-relaxed',
        title: 'text-4xl sm:text-5xl',
      };
    case 'md':
    default:
      return {
        body: 'text-lg leading-relaxed sm:leading-loose',
        quote: 'text-lg leading-relaxed',
        title: 'text-2xl sm:text-3xl',
      };
  }
}
