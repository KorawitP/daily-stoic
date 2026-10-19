import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CheckCircle2,
  Circle,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Quote,
  PenLine,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { StoicDay, AppTheme, BookId, ReadingBookmark } from '../types/stoic.ts';
import { getThemeClasses } from '../utils/theme.ts';
import { renderInlineMarkdown } from '../utils/markdown.tsx';

interface ReaderViewProps {
  day: StoicDay;
  activeBookId: BookId;
  unitLabel: string;
  theme: AppTheme;
  isRead: boolean;
  onToggleRead: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  savedNote: string;
  onSaveNote: (note: string) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  disabledKeyboardShortcuts?: boolean;
  currentBookmark?: ReadingBookmark | null;
  onSetBookmark?: (dayId: number, paragraphIndex: number, scrollPercent?: number) => void;
  onClearBookmark?: (dayId: number) => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  day,
  activeBookId,
  unitLabel,
  theme,
  isRead,
  onToggleRead,
  isFavorite,
  onToggleFavorite,
  savedNote,
  onSaveNote,
  onPrevDay,
  onNextDay,
  hasPrev,
  hasNext,
  disabledKeyboardShortcuts,
  currentBookmark,
  onSetBookmark,
  onClearBookmark: _onClearBookmark,
}) => {
  const t = getThemeClasses(theme);

  const [showCalendarDate, setShowCalendarDate] = useState(false);
  const [showJournal, setShowJournal] = useState(Boolean(savedNote));
  const [noteText, setNoteText] = useState(savedNote);
  const [isNoteSaved, setIsNoteSaved] = useState(false);
  const [glowingIndex, setGlowingIndex] = useState<number | null>(null);
  const [showFloatingResume, setShowFloatingResume] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrolledChapterKeyRef = useRef<string | null>(null);
  const isAutoScrollingRef = useRef(false);
  const lastManualPinTimeRef = useRef(0);

  // Smooth Auto-Scroll on chapter/book switch if bookmark exists, otherwise reset to top
  useEffect(() => {
    const chapterKey = `${activeBookId}-${day.id}`;
    if (lastScrolledChapterKeyRef.current === chapterKey) {
      return;
    }
    lastScrolledChapterKeyRef.current = chapterKey;

    if (
      currentBookmark &&
      currentBookmark.dayId === day.id &&
      typeof currentBookmark.paragraphIndex === 'number' &&
      currentBookmark.paragraphIndex >= 0
    ) {
      const targetIdx = currentBookmark.paragraphIndex;
      isAutoScrollingRef.current = true;
      const timer = setTimeout(() => {
        const el = document.getElementById(`para-container-${day.id}-${targetIdx}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          const targetY = rect.top + window.scrollY - 90;
          window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
          setGlowingIndex(targetIdx);
          setTimeout(() => setGlowingIndex(null), 2200);
        } else {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
        setTimeout(() => {
          isAutoScrollingRef.current = false;
        }, 800);
      }, 180);
      return () => {
        clearTimeout(timer);
        isAutoScrollingRef.current = false;
      };
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [day.id, activeBookId, currentBookmark]);

  // Flush pending debounced note on unmount / navigation
  const textRef = useRef(noteText);
  const onSaveNoteRef = useRef(onSaveNote);
  const initialNoteRef = useRef(savedNote);

  useEffect(() => {
    textRef.current = noteText;
    onSaveNoteRef.current = onSaveNote;
    initialNoteRef.current = savedNote;
  }, [noteText, onSaveNote, savedNote]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (textRef.current !== initialNoteRef.current) {
        onSaveNoteRef.current(textRef.current);
      }
    };
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (disabledKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'h' || e.key === 'H') {
        if (hasPrev) onPrevDay();
      } else if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') {
        if (hasNext) onNextDay();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        onToggleRead();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        onToggleFavorite();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasPrev, hasNext, onPrevDay, onNextDay, onToggleRead, onToggleFavorite, disabledKeyboardShortcuts]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNoteText(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSaveNote(val);
      setIsNoteSaved(true);
      setTimeout(() => setIsNoteSaved(false), 2000);
    }, 600);
  };

  const handleNoteBlur = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onSaveNote(noteText);
    setIsNoteSaved(true);
    setTimeout(() => setIsNoteSaved(false), 2000);
  };

  const handleManualPin = useCallback((idx: number) => {
    if (!onSetBookmark) return;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
    lastManualPinTimeRef.current = Date.now();

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPct = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
    onSetBookmark(day.id, idx, scrollPct);
    setGlowingIndex(idx);
    setTimeout(() => setGlowingIndex(null), 2200);

    setToastMessage(`📍 ปักหมุดคั่นหน้าไว้ที่ย่อหน้าที่ ${idx + 1} แล้ว`);
    setTimeout(() => setToastMessage(null), 2500);
  }, [day.id, onSetBookmark]);

  const handleScrollToBookmark = useCallback(() => {
    if (!currentBookmark || currentBookmark.dayId !== day.id) return;
    const el = document.getElementById(`para-container-${day.id}-${currentBookmark.paragraphIndex}`);
    if (el) {
      isAutoScrollingRef.current = true;
      const rect = el.getBoundingClientRect();
      const targetY = rect.top + window.scrollY - 90;
      window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      setGlowingIndex(currentBookmark.paragraphIndex);
      setTimeout(() => setGlowingIndex(null), 2200);
      setTimeout(() => {
        isAutoScrollingRef.current = false;
      }, 800);
    }
  }, [currentBookmark, day.id]);

  // Scroll listener for floating resume visibility and debounced auto-tracking
  useEffect(() => {
    const handleScroll = () => {
      // 1. Floating button visibility: show when user scrolls away from bookmark
      if (
        currentBookmark &&
        currentBookmark.dayId === day.id &&
        typeof currentBookmark.paragraphIndex === 'number' &&
        currentBookmark.paragraphIndex >= 0
      ) {
        const bookmarkEl = document.getElementById(`para-container-${day.id}-${currentBookmark.paragraphIndex}`);
        if (bookmarkEl) {
          const rect = bookmarkEl.getBoundingClientRect();
          const isOutOfView = rect.top > window.innerHeight - 80 || rect.bottom < 80;
          setShowFloatingResume(isOutOfView);
        } else {
          setShowFloatingResume(false);
        }
      } else {
        setShowFloatingResume(false);
      }

      // 2. Debounced auto-track reading position
      if (isAutoScrollingRef.current) return;
      if (Date.now() - lastManualPinTimeRef.current < 1200) return;

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        if (window.scrollY < 200) return;

        const paraElements = document.querySelectorAll<HTMLElement>('[data-para-idx]');
        if (!paraElements || paraElements.length === 0) return;

        const focusY = 140;
        let bestIdx: number | null = null;
        let minDistance = Infinity;

        for (const el of Array.from(paraElements)) {
          const rect = el.getBoundingClientRect();
          const pIdx = Number(el.getAttribute('data-para-idx'));
          if (rect.top <= focusY && rect.bottom >= focusY) {
            bestIdx = pIdx;
            break; // Exactly on focal line
          }
          const distance = Math.abs(rect.top - focusY);
          if (distance < minDistance && rect.top <= window.innerHeight * 0.6) {
            minDistance = distance;
            bestIdx = pIdx;
          }
        }

        if (bestIdx !== null && bestIdx >= 0) {
          const currentBookmarkedIdx = (currentBookmark && currentBookmark.dayId === day.id)
            ? currentBookmark.paragraphIndex
            : -1;

          if (bestIdx > currentBookmarkedIdx && onSetBookmark) {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPct = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
            onSetBookmark(day.id, bestIdx, scrollPct);
          }
        }
      }, 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [day.id, currentBookmark, onSetBookmark]);

  const renderParagraphBlock = (para: string, idx: number) => {
    const trimmed = para.trim();

    // 1. Subheading (### ...)
    if (trimmed.startsWith('### ')) {
      const headingText = trimmed.replace(/^###\s+/, '');
      return (
        <h2
          key={idx}
          className={`font-serif-thai font-bold text-lg sm:text-xl pt-4 pb-1 border-b border-yellow-400/20 text-yellow-400`}
        >
          {renderInlineMarkdown(headingText)}
        </h2>
      );
    }

    // 2. Principle Pin Highlight Box (📌 ...)
    if (trimmed.startsWith('📌')) {
      return (
        <div
          key={idx}
          className={`p-5 sm:p-6 rounded-xl border-2 border-yellow-400 ${t.quoteBoxBg} my-6`}
        >
          <p className={`font-serif-thai text-base sm:text-lg leading-relaxed font-semibold ${t.textPrimary}`}>
            {renderInlineMarkdown(trimmed)}
          </p>
        </div>
      );
    }

    // 3. Blockquote (> ...)
    if (trimmed.startsWith('> ')) {
      const lines = trimmed
        .split('\n')
        .map(line => line.replace(/^>\s?/, '').trim())
        .filter(Boolean);
      return (
        <blockquote
          key={idx}
          className={`pl-4 sm:pl-5 py-3 pr-4 my-4 border-l-3 border-yellow-400 rounded-r-xl ${t.quoteBoxBg} font-serif-thai italic text-base sm:text-lg leading-relaxed ${t.textPrimary} space-y-2`}
        >
          {lines.map((l, i) => (
            <p key={i}>{renderInlineMarkdown(l)}</p>
          ))}
        </blockquote>
      );
    }

    // 4. Multi-line Bullet or Numbered List
    const lines = trimmed.split('\n');
    if (lines.length > 1 && lines.every(l => /^(\*|-|\d+\.)\s+/.test(l.trim()))) {
      return (
        <ul key={idx} className="space-y-2 pl-5 list-disc marker:text-yellow-400">
          {lines.map((l, i) => {
            const cleanItem = l.trim().replace(/^(\*|-|\d+\.)\s+/, '');
            return (
              <li
                key={i}
                className={`font-sans-thai text-base sm:text-lg leading-relaxed ${t.textPrimary}`}
              >
                {renderInlineMarkdown(cleanItem)}
              </li>
            );
          })}
        </ul>
      );
    }

    // 5. Standard Narrative Paragraph (with support for line breaks)
    return (
      <p
        key={idx}
        className={`font-sans-thai text-base sm:text-lg leading-relaxed sm:leading-loose ${t.textPrimary} tracking-normal break-words whitespace-pre-line`}
      >
        {renderInlineMarkdown(trimmed)}
      </p>
    );
  };

  return (
    <article className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* 1. Quiet Meta Line: Step & Theme */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-400 font-sans-thai mb-6 pb-2 border-b border-stone-500/10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono font-bold text-yellow-400">
            {unitLabel}ที่ {day.dayStep}
          </span>
          <span>•</span>
          <span>{day.monthNameTh}: {day.monthThemeTh}</span>
        </div>

        {/* Subtle date toggle for Daily Stoic, or Part badge for Carnegie */}
        {activeBookId === 'daily-stoic' ? (
          <button
            onClick={() => setShowCalendarDate(!showCalendarDate)}
            className={`text-[11px] text-stone-400 hover:${t.textSecondary} flex items-center gap-1 cursor-pointer transition-colors`}
            title="ดูวันที่ปฏิทินสากล"
          >
            {showCalendarDate ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span>{showCalendarDate ? day.dateLabel : 'ดูวันที่'}</span>
          </button>
        ) : (
          <span className="text-[11px] font-mono text-yellow-400">
            {day.dateLabel}
          </span>
        )}
      </div>

      {/* 2. Titles */}
      <header className="mb-8 sm:mb-10">
        <h1 className={`font-serif-thai font-bold text-2xl sm:text-3xl leading-tight mb-2 ${t.textPrimary}`}>
          {day.titleTh}
        </h1>
        <p className={`font-serif italic text-sm sm:text-base ${t.textMuted}`}>
          {day.titleEn}
        </p>
      </header>

      {/* 3. Quote / Core Principle Block (Classic Book Style) */}
      <section className={`relative my-8 sm:my-10 p-6 sm:p-8 rounded-xl border-l-3 transition-colors ${t.quoteBoxBg} ${t.quoteBoxBorder}`}>
        <Quote className="absolute top-4 right-4 w-6 h-6 opacity-20 text-yellow-400 pointer-events-none" />

        <blockquote className="relative z-10">
          {activeBookId === 'how-to-win-friends' && (
            <div className="text-xs font-mono uppercase tracking-wider text-yellow-400 font-bold mb-2">
              แก่นสำคัญประจำบท (Core Principle)
            </div>
          )}
          <p className={`font-serif-thai italic font-medium text-lg sm:text-xl ${t.textPrimary} mb-4 leading-relaxed`}>
            &ldquo;{day.quote}&rdquo;
          </p>

          <footer className="pt-2 text-xs sm:text-sm font-sans-thai text-yellow-400">
            — {day.author}
            {day.source && (
              <span className={`block sm:inline sm:ml-1.5 font-normal italic ${t.textSecondary}`}>
                ({day.source})
              </span>
            )}
          </footer>
        </blockquote>
      </section>

      {/* 4. Full Uncut Translation Body */}
      <section className="space-y-6 my-8 sm:my-10 text-left pl-6 sm:pl-8 pr-1 relative">
        {day.paragraphs.map((para, idx) => {
          const isBookmarked =
            currentBookmark?.dayId === day.id && currentBookmark.paragraphIndex === idx;
          const isGlowing = glowingIndex === idx;

          return (
            <div
              key={idx}
              id={`para-container-${day.id}-${idx}`}
              data-para-idx={idx}
              className={`relative group/para transition-all duration-700 ${
                isGlowing
                  ? 'bg-yellow-400/15 shadow-[0_0_25px_rgba(250,204,21,0.25)] rounded-xl p-3 -m-3 border border-yellow-400/40'
                  : ''
              }`}
            >
              {/* Visual Resume Ribbon ("📍 อ่านถึงตรงนี้ • คลิกเพื่ออ่านต่อ") */}
              {isBookmarked && (
                <div
                  id={`bookmark-ribbon-${day.id}`}
                  onClick={handleScrollToBookmark}
                  className="mb-5 -mt-1 relative py-2 flex items-center gap-3 cursor-pointer select-none group"
                  title="อ่านถึงตรงนี้ • คลิกเพื่อเน้นย่อหน้า"
                >
                  <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-yellow-400/60 to-yellow-400" />
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-yellow-400/15 border border-yellow-400/50 text-yellow-400 text-xs sm:text-sm font-sans-thai shadow-xs group-hover:bg-yellow-400/25 group-hover:border-yellow-400 transition-all">
                    <BookmarkCheck className="w-4 h-4 text-yellow-400 fill-yellow-400/30" />
                    <span className="font-semibold tracking-wide">📍 อ่านถึงตรงนี้ • คลิกเพื่ออ่านต่อ</span>
                  </div>
                  <div className="flex-1 h-[2px] bg-gradient-to-r from-yellow-400 via-yellow-400/60 to-transparent" />
                </div>
              )}

              {/* Text content with gutter pin button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleManualPin(idx);
                  }}
                  className={`absolute -left-6 sm:-left-8 top-1 p-1 rounded-md transition-all duration-150 cursor-pointer ${
                    isBookmarked
                      ? 'text-yellow-400 opacity-100 scale-110'
                      : 'text-stone-400 hover:text-yellow-400 opacity-40 sm:opacity-0 group-hover/para:opacity-100 hover:scale-110'
                  }`}
                  title={isBookmarked ? 'คั่นหน้าอยู่ที่ย่อหน้านี้แล้ว' : `ปักหมุดคั่นหน้าย่อหน้านี้ (ย่อหน้าที่ ${idx + 1})`}
                  aria-label={`ปักหมุดคั่นหน้าย่อหน้าที่ ${idx + 1}`}
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="w-4 h-4 text-yellow-400 fill-yellow-400/30" />
                  ) : (
                    <Bookmark className="w-3.5 h-3.5 hover:fill-yellow-400/20" />
                  )}
                </button>

                {renderParagraphBlock(para, idx)}
              </div>
            </div>
          );
        })}
      </section>

      {/* 5. End of Chapter / Meditation: Calm Check-in & Actions */}
      <div className="mt-12 pt-6 border-t border-stone-500/15 flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          {/* Calm Check-in Button */}
          <button
            onClick={onToggleRead}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${
              isRead
                ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30'
                : `${t.cardBg} ${t.cardBorder} hover:${t.cardBgHover} ${t.textPrimary}`
            }`}
          >
            {isRead ? (
              <CheckCircle2 className="w-4 h-4 text-yellow-400 fill-yellow-400/20" />
            ) : (
              <Circle className="w-4 h-4 text-stone-400" />
            )}
            <span>
              {isRead
                ? `อ่านจบ${unitLabel}นี้แล้ว`
                : `ทำเครื่องหมายว่าอ่านจบ${unitLabel}นี้แล้ว`}
            </span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={onToggleFavorite}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              isFavorite
                ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/40'
                : `${t.cardBorder} text-stone-400 hover:${t.textPrimary}`
            }`}
            title={isFavorite ? 'นำออกจากรายการโปรด' : 'บันทึกเป็นรายการโปรด'}
          >
            <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Personal Reflection */}
        <div>
          {!showJournal ? (
            <button
              onClick={() => setShowJournal(true)}
              className="text-xs text-stone-400 hover:text-yellow-400 flex items-center gap-1.5 cursor-pointer font-sans-thai transition-colors"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>+ เขียนบันทึกสะท้อนคิดจากการอ่าน{unitLabel}นี้</span>
            </button>
          ) : (
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span className="font-semibold flex items-center gap-1.5 text-stone-300">
                  <PenLine className="w-3 h-3 text-yellow-400" />
                  บันทึกสะท้อนคิดส่วนตัว (บันทึกออฟไลน์ในเครื่อง)
                </span>
                {isNoteSaved && (
                  <span className="text-[11px] text-yellow-400 flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> บันทึกแล้ว
                  </span>
                )}
              </div>
              <textarea
                value={noteText}
                onChange={handleNoteChange}
                onBlur={handleNoteBlur}
                placeholder="คุณได้เรียนรู้อะไรจากบทเรียนนี้ และจะนำไปปรับใช้กับผู้คนหรือชีวิตจริงอย่างไร?..."
                rows={3}
                className={`w-full p-3 rounded-xl border text-xs sm:text-sm font-sans-thai resize-y focus:outline-hidden focus:ring-1 focus:ring-yellow-400/40 ${t.appBg} ${t.cardBorder} ${t.textPrimary}`}
              />
            </div>
          )}
        </div>

        {/* 6. End-of-Article Natural Navigation */}
        <nav className="flex items-center justify-between pt-6 border-t border-stone-500/10 text-xs sm:text-sm font-sans-thai">
          <button
            onClick={onPrevDay}
            disabled={!hasPrev}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
              hasPrev
                ? `${t.cardBorder} ${t.cardBg} hover:${t.cardBgHover} ${t.textPrimary}`
                : 'opacity-30 cursor-not-allowed border-transparent text-stone-400'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{unitLabel}ที่ {day.dayStep - 1}</span>
          </button>

          <button
            onClick={onNextDay}
            disabled={!hasNext}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
              hasNext
                ? `${t.cardBorder} ${t.cardBg} hover:${t.cardBgHover} ${t.textPrimary}`
                : 'opacity-30 cursor-not-allowed border-transparent text-stone-400'
            }`}
          >
            <span>{unitLabel}ที่ {day.dayStep + 1}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      </div>

      {/* 7. Floating Quick Resume Button */}
      {showFloatingResume && currentBookmark && currentBookmark.dayId === day.id && typeof currentBookmark.paragraphIndex === 'number' && currentBookmark.paragraphIndex >= 0 && (
        <aside
          aria-label="วาร์ปกลับไปจุดที่คั่นไว้"
          className="fixed bottom-6 right-4 sm:right-8 z-40 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <button
            onClick={handleScrollToBookmark}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-stone-900/95 dark:bg-stone-800/95 text-yellow-400 border border-yellow-400/50 shadow-2xl backdrop-blur-md hover:bg-stone-800 hover:border-yellow-400 hover:scale-105 active:scale-95 transition-all cursor-pointer font-sans-thai text-xs sm:text-sm group"
            title={`คลิกเพื่อเลื่อนกลับไปยังจุดที่คั่นไว้ (ย่อหน้าที่ ${currentBookmark.paragraphIndex + 1})`}
          >
            <BookmarkCheck className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
            <span className="font-medium">
              กลับไปจุดที่คั่นไว้ (ย่อหน้าที่ {currentBookmark.paragraphIndex + 1})
            </span>
          </button>
        </aside>
      )}

      {/* 8. Transient Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-stone-900/95 dark:bg-stone-800/95 text-yellow-400 border border-yellow-400/40 shadow-xl backdrop-blur-md text-xs sm:text-sm font-sans-thai flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <BookmarkCheck className="w-4 h-4 text-yellow-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </article>
  );
};
