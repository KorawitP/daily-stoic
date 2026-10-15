import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Circle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Quote,
  PenLine,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { StoicDay, AppTheme } from '../types/stoic.ts';
import { getThemeClasses } from '../utils/theme.ts';

interface ReaderViewProps {
  day: StoicDay;
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
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  day,
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
}) => {
  const t = getThemeClasses(theme);

  const [showCalendarDate, setShowCalendarDate] = useState(false);
  const [showJournal, setShowJournal] = useState(Boolean(savedNote));
  const [noteText, setNoteText] = useState(savedNote);
  const [isNoteSaved, setIsNoteSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
      // Don't hijack browser shortcuts like Ctrl+C, Ctrl+R, Ctrl+F
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

  return (
    <article className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* 1. Quiet Meta Line: Step & Theme */}
      <div className="flex items-center justify-between text-xs text-stone-400 font-sans-thai mb-6 pb-2 border-b border-stone-500/10">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-yellow-400">
            ก้าวที่ {day.dayStep}
          </span>
          <span>•</span>
          <span>{day.disciplineTh}</span>
          <span>•</span>
          <span>{day.monthThemeTh}</span>
        </div>

        {/* Subtle date toggle (No pressure) */}
        <button
          onClick={() => setShowCalendarDate(!showCalendarDate)}
          className={`text-[11px] text-stone-400 hover:${t.textSecondary} flex items-center gap-1 cursor-pointer transition-colors`}
          title="ดูวันที่ปฏิทินสากล"
        >
          {showCalendarDate ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          <span>{showCalendarDate ? day.dateLabel : 'ดูวันที่'}</span>
        </button>
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

      {/* 3. Quote Block (Classic Book Style) */}
      <section className={`relative my-8 sm:my-10 p-6 sm:p-8 rounded-xl border-l-3 transition-colors ${t.quoteBoxBg} ${t.quoteBoxBorder}`}>
        <Quote className="absolute top-4 right-4 w-6 h-6 opacity-20 text-yellow-400 pointer-events-none" />

        <blockquote className="relative z-10">
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
      <section className="space-y-6 my-8 sm:my-10 text-left">
        {day.paragraphs.map((para, idx) => (
          <p
            key={idx}
            className={`font-sans-thai text-base sm:text-lg leading-relaxed sm:leading-loose ${t.textPrimary} tracking-normal break-words`}
          >
            {para}
          </p>
        ))}
      </section>

      {/* 5. End of Meditation: Calm Check-in & Actions */}
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
            <span>{isRead ? 'อ่านจบแล้ววันนี้' : 'ทำเครื่องหมายว่าอ่านแล้ว'}</span>
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

        {/* Evening Reflection (Discreet expandable text) */}
        <div>
          {!showJournal ? (
            <button
              onClick={() => setShowJournal(true)}
              className="text-xs text-stone-400 hover:text-yellow-400 flex items-center gap-1.5 cursor-pointer font-sans-thai transition-colors"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>+ เขียนบันทึกสะท้อนคิดประจำวัน</span>
            </button>
          ) : (
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span className="font-semibold flex items-center gap-1.5 text-stone-300">
                  <PenLine className="w-3 h-3 text-yellow-400" />
                  บันทึกสะท้อนคิดยามค่ำ (บันทึกออฟไลน์ในเครื่อง)
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
                placeholder="คุณได้เรียนรู้อะไรจากบทเรียนนี้ และจะนำไปปรับใช้ในชีวิตจริงอย่างไร?..."
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
            <span>ก้าวที่ {day.dayStep - 1}</span>
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
            <span>ก้าวที่ {day.dayStep + 1}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      </div>
    </article>
  );
};
