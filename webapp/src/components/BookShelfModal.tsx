import React, { useEffect } from 'react';
import { X, BookOpen, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import type { BookId, AppTheme } from '../types/stoic.ts';
import { getThemeClasses } from '../utils/theme.ts';

interface BookShelfModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBookId: BookId;
  onSelectBook: (bookId: BookId) => void;
  stoicReadCount: number;
  stoicCurrentDay: number;
  carnegieReadCount: number;
  carnegieCurrentDay: number;
  theme: AppTheme;
}

export const BookShelfModal: React.FC<BookShelfModalProps> = ({
  isOpen,
  onClose,
  activeBookId,
  onSelectBook,
  stoicReadCount,
  stoicCurrentDay,
  carnegieReadCount,
  carnegieCurrentDay,
  theme,
}) => {
  const t = getThemeClasses(theme);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const stoicPct = Math.round((stoicReadCount / 366) * 100);
  const carnegiePct = Math.round((carnegieReadCount / 30) * 100);

  const books: {
    id: BookId;
    badge: string;
    titleTh: string;
    titleEn: string;
    author: string;
    desc: string;
    totalUnits: number;
    unitLabel: string;
    readCount: number;
    currentStep: number;
    pct: number;
    highlights: string[];
  }[] = [
    {
      id: 'daily-stoic',
      badge: 'ปรัชญาสโตอิก • 366 วัน',
      titleTh: 'THE DAILY STOIC',
      titleEn: '366 Meditations on Wisdom, Perseverance, and the Art of Living',
      author: 'Ryan Holiday & Stephen Hanselman',
      desc: '366 บทภาวนาแห่งปัญญา ความอดทน และศิลปะแห่งการใช้ชีวิตจาก มาร์คัส ออเรเลียส, เซเนกา และอีพิคเตตัส',
      totalUnits: 366,
      unitLabel: 'ก้าว',
      readCount: stoicReadCount,
      currentStep: stoicCurrentDay,
      pct: stoicPct,
      highlights: ['3 วินัยแห่งสโตอิก', 'กำแพงอิฐ 366 ก้อน', 'ยาใจสโตอิก 8 อารมณ์'],
    },
    {
      id: 'how-to-win-friends',
      badge: 'จิตวิทยาและมนุษยสัมพันธ์ • 30 บท (ฉบับสมบูรณ์)',
      titleTh: 'วิธีชนะมิตรและจูงใจคน',
      titleEn: 'How to Win Friends and Influence People',
      author: 'Dale Carnegie (เดล คาร์เนกี)',
      desc: 'คัมภีร์มนุษยสัมพันธ์ระดับโลกฉบับแปลไทยครบทุกบรรทัด 4 ภาค 30 บท พร้อม 30 กฎเหล็กแห่งการชนะใจคนและภาวะผู้นำ',
      totalUnits: 30,
      unitLabel: 'บท',
      readCount: carnegieReadCount,
      currentStep: carnegieCurrentDay,
      pct: carnegiePct,
      highlights: ['ครบ 4 ภาค 30 บทเต็ม', 'สรุป 30 กฎเหล็กคาร์เนกี', 'คำนำ & 9 วิธีอ่านให้ได้ผลสูงสุด'],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-label="ปิดคลังหนังสือ"
      />

      <div
        className={`relative z-10 w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${t.cardBg} ${t.cardBorder}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${t.navBg}`}>
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-yellow-400" />
            <div>
              <h2 className={`font-serif-thai font-bold text-base sm:text-lg leading-tight ${t.textPrimary}`}>
                คลังหนังสือปัญญา (Personal Wisdom Library)
              </h2>
              <p className={`text-xs font-sans-thai ${t.textSecondary}`}>
                เลือกหนังสือที่ต้องการศึกษา • ระบบบันทึกความคืบหน้าแยกแต่ละเล่มอัตโนมัติ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border text-stone-400 hover:${t.textPrimary} ${t.cardBorder} cursor-pointer transition-colors`}
            title="ปิดหน้าต่าง (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Book List */}
        <div className="p-5 overflow-y-auto space-y-4">
          {books.map(b => {
            const isSelected = b.id === activeBookId;

            return (
              <div
                key={b.id}
                onClick={() => {
                  onSelectBook(b.id);
                  onClose();
                }}
                className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-4 ${
                  isSelected
                    ? 'border-yellow-400 bg-yellow-400/5'
                    : `${t.appBg} ${t.cardBorder} hover:border-yellow-400/50`
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-yellow-400/15 text-yellow-400 font-semibold">
                        {b.badge}
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[11px] font-sans-thai font-bold text-black bg-yellow-400 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" /> กำลังเปิดอ่าน
                        </span>
                      )}
                    </div>
                    <h3 className={`font-serif-thai font-bold text-xl sm:text-2xl pt-1 ${t.textPrimary}`}>
                      {b.titleTh}
                    </h3>
                    <p className={`text-xs sm:text-sm font-serif italic ${t.textMuted}`}>
                      {b.titleEn} — {b.author}
                    </p>
                  </div>
                </div>

                <p className={`text-xs sm:text-sm font-sans-thai leading-relaxed ${t.textSecondary}`}>
                  {b.desc}
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-1.5">
                  {b.highlights.map((h, i) => (
                    <span
                      key={i}
                      className={`text-[11px] font-sans-thai px-2.5 py-1 rounded-lg border ${t.cardBorder} ${t.textSecondary} flex items-center gap-1`}
                    >
                      <Sparkles className="w-3 h-3 text-yellow-400 shrink-0" />
                      {h}
                    </span>
                  ))}
                </div>

                {/* Progress Bar & Action */}
                <div className="pt-2 border-t border-stone-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className={t.textPrimary}>
                        อ่านแล้ว <strong className="text-yellow-400">{b.readCount}</strong> / {b.totalUnits} {b.unitLabel} ({b.pct}%)
                      </span>
                      <span className={t.textMuted}>
                        ค้างอยู่ที่{b.unitLabel}ที่ {b.currentStep}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-stone-500/20 overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 transition-all duration-300"
                        style={{ width: `${Math.max(b.readCount > 0 ? 3 : 0, b.pct)}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onSelectBook(b.id);
                      onClose();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-sans-thai font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                        : `border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black`
                    }`}
                  >
                    <span>{isSelected ? 'อ่านต่อจากเดิม' : 'เปิดอ่านเล่มนี้'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
