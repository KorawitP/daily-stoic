import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Flame,
  CheckCircle2,
  ChevronRight,
  Download,
  Upload,
  RotateCcw,
  BookOpen,
  BookmarkCheck,
} from 'lucide-react';
import type { StoicDay, AppTheme, BookId, CarnegieMeta, ReadingBookmark } from '../types/stoic.ts';
import { getThemeClasses } from '../utils/theme.ts';
import { renderInlineMarkdown } from '../utils/markdown.tsx';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeBookId: BookId;
  onOpenBookShelf: () => void;
  days: StoicDay[];
  carnegieMeta?: CarnegieMeta;
  currentDayId: number;
  readDays: Record<number, { completedAt: string }>;
  streak: number;
  favorites: number[];
  bookmarks?: Record<number, ReadingBookmark>;
  activeBookmark?: ReadingBookmark | null;
  theme: AppTheme;
  onSelectDay: (dayId: number) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onResetProgress: () => void;
}

type DrawerTab = 'toc' | 'grid' | 'topics' | 'wisdom';

const TOPIC_CATEGORIES = [
  { id: 'anger', title: 'ความโกรธ & ความขัดแย้ง', icon: '🔥', desc: 'เมื่อรู้สึกเดือดดาล ถูกยั่วยุ หรือมีปัญหากับผู้อื่น' },
  { id: 'anxiety', title: 'ความกังวล & ความกลัว', icon: '🛡️', desc: 'เมื่อจิตใจกระวนกระวายถึงอนาคต หรือกลัวความล้มเหลว' },
  { id: 'procrastination', title: 'การผัดวัน & การลงมือทำ', icon: '⚡', desc: 'เมื่อรู้สึกขี้เกียจ เฉื่อยชา หรือรอเวลาที่สมบูรณ์แบบ' },
  { id: 'ego_wealth', title: 'อัตตา & เงินทองชื่อเสียง', icon: '🪙', desc: 'เมื่อหลงไปกับคำเยินยอ ทรัพย์สมบัติ หรือความเย่อหยิ่ง' },
  { id: 'grief_loss', title: 'ความสูญเสีย & ความเศร้า', icon: '💔', desc: 'เมื่อเผชิญเคราะห์กรรม ความเจ็บป่วย หรือการสูญเสีย' },
  { id: 'clarity_control', title: 'การควบคุม & ความแจ่มชัด', icon: '🧭', desc: 'แยกสิ่งที่ควบคุมได้ ออกจากสิ่งที่ควบคุมไม่ได้' },
  { id: 'duty_purpose', title: 'หน้าที่ & คุณธรรม', icon: '⚖️', desc: 'การทำเพื่อประโยชน์ส่วนรวม และดำเนินชีวิตตามคุณธรรม' },
  { id: 'mortality_time', title: 'มรณานุสติ & คุณค่าเวลา', icon: '⏳', desc: 'ระลึกถึงความตาย (Memento Mori) เพื่อเห็นค่าของชีวิต' },
];

const CARNEGIE_PARTS = [
  { id: 'part_1', title: 'ภาคที่ 1: เทคนิคพื้นฐานในการปฏิบัติต่อผู้อื่น', icon: '🤝', desc: '3 กฎรากฐานสำคัญที่สุดในการเข้าใจธรรมชาติของมนุษย์' },
  { id: 'part_2', title: 'ภาคที่ 2: 6 วิธีทำให้ผู้คนชื่นชอบคุณ', icon: '✨', desc: 'ศิลปะแห่งการสร้างมิตรภาพและความประทับใจอย่างจริงใจ' },
  { id: 'part_3', title: 'ภาคที่ 3: 12 วิธีจูงใจผู้อื่นให้คล้อยตาม', icon: '🧭', desc: 'ชนะใจคนให้เห็นพ้องโดยไม่ต้องโต้เถียงหรือหักหาญน้ำใจ' },
  { id: 'part_4', title: 'ภาคที่ 4: 9 วิธีเปลี่ยนพฤติกรรมคนในฐานะผู้นำ', icon: '👑', desc: 'การชี้แนะและพัฒนาผู้อื่นโดยไม่ก่อความขุ่นเคืองหรือบาดหมาง' },
];

const GREEK_TERMS = [
  { term: 'Amor Fati', desc: 'ความรักในโชคชะตา โอบรับทุกสิ่งที่เกิดขึ้นประหนึ่งมันเกิดมาเพื่อฝึกฝนเรา' },
  { term: 'Memento Mori', desc: 'มรณานุสติ การระลึกถึงความตายเสมอเพื่อใช้ชีวิตปัจจุบันอย่างมีคุณค่า' },
  { term: 'Ataraxia (ἀταραξία)', desc: 'ความสงบสุขแห่งจิตใจ อิสรภาพจากการถูกรบกวนโดยสิ่งภายนอก' },
  { term: 'Apatheia (ἀπάθεια)', desc: 'ความเยือกเย็นที่ไม่ตกเป็นทาสของตัณหาและอารมณ์สุดโต่ง' },
  { term: 'Prohairesis (προαίρεσις)', desc: 'อำนาจการตัดสินใจเลือกอย่างมีเหตุผล เจตจำนงเสรีที่ไม่มีใครพรากไปได้' },
  { term: 'Logos (λόγος)', desc: 'เหตุผลและกฎระเบียบแห่งธรรมชาติอันเป็นแกนชี้นำจักรวาล' },
  { term: 'Sympatheia (συμπάθεια)', desc: 'ความเชื่อมโยงถึงกันของมวลมนุษยชาติและสรรพสิ่งในเอกภพ' },
  { term: 'Diairesis (διαίρεσις)', desc: 'การแยกสิ่งที่ควบคุมได้ ออกจากสิ่งที่อยู่นอกเหนือการควบคุม' },
];

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  activeBookId,
  onOpenBookShelf,
  days,
  carnegieMeta,
  currentDayId,
  readDays,
  streak,
  favorites,
  bookmarks,
  activeBookmark,
  theme,
  onSelectDay,
  onExportBackup,
  onImportBackup,
  onResetProgress,
}) => {
  const t = getThemeClasses(theme);
  const [activeTab, setActiveTab] = useState<DrawerTab>('toc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [carnegieDocView, setCarnegieDocView] = useState<'preface' | 'bio'>('preface');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCarnegie = activeBookId === 'how-to-win-friends';
  const totalUnits = isCarnegie ? 30 : 366;
  const unitLabel = isCarnegie ? 'บท' : 'ก้าว';

  // Close on ESC
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

  const readCount = Object.keys(readDays).filter(k => {
    const n = Number(k);
    return n >= 1 && n <= totalUnits;
  }).length;
  const progressPercent = Math.round((readCount / totalUnits) * 100);

  // Filter TOC days
  const filteredDays = days.filter(d => {
    if (filterFavorites && !favorites.includes(d.id)) return false;
    if (selectedTopic && d.moodCategory !== selectedTopic) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.trim().toLowerCase();
    const stepMatch = query.match(/^(?:ก้าว(?:ที่)?\s*|บท(?:ที่)?\s*|กฎ(?:ข้อที่)?\s*|day\s*|ch\s*)?(\d{1,3})$/i);
    if (stepMatch) {
      return d.id === parseInt(stepMatch[1], 10);
    }
    const corpus = `${d.titleTh} ${d.titleEn} ${d.author} ${d.quote} ${d.dateLabel} ${d.disciplineTh}`.toLowerCase();
    return query.split(/\s+/).every(term => corpus.includes(term));
  });

  const renderMarkdownDocument = (mdText: string) => {
    const blocks = mdText
      .split(/\n{2,}/)
      .map(b => b.trim())
      .filter(Boolean);

    return (
      <div className="space-y-4">
        {blocks.map((block, idx) => {
          if (block === '---') {
            return <hr key={idx} className="border-stone-500/20 my-3" />;
          }
          if (block.startsWith('# ')) {
            return (
              <h3 key={idx} className="font-serif-thai font-bold text-base sm:text-lg text-yellow-400 pt-2">
                {renderInlineMarkdown(block.replace(/^#\s+/, ''))}
              </h3>
            );
          }
          if (block.startsWith('## ')) {
            return (
              <h4 key={idx} className="font-serif-thai font-bold text-sm sm:text-base text-yellow-400 pt-2">
                {renderInlineMarkdown(block.replace(/^##\s+/, ''))}
              </h4>
            );
          }
          if (block.startsWith('### ') || block.startsWith('#### ')) {
            return (
              <h5 key={idx} className={`font-serif-thai font-bold text-xs sm:text-sm pt-1 ${t.textPrimary}`}>
                {renderInlineMarkdown(block.replace(/^#{3,4}\s+/, ''))}
              </h5>
            );
          }
          if (block.startsWith('> ')) {
            return (
              <blockquote
                key={idx}
                className={`pl-3 py-2 pr-3 border-l-2 border-yellow-400 rounded-r-lg ${t.quoteBoxBg} text-xs sm:text-sm italic leading-relaxed ${t.textPrimary}`}
              >
                {renderInlineMarkdown(block.replace(/^>\s+/gm, ''))}
              </blockquote>
            );
          }
          return (
            <p key={idx} className={`text-xs sm:text-sm font-sans-thai leading-relaxed whitespace-pre-line ${t.textPrimary}`}>
              {renderInlineMarkdown(block)}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-label="ปิดเมนู"
      />

      {/* Drawer content */}
      <aside
        className={`relative z-10 w-full max-w-md h-full shadow-2xl flex flex-col border-l transition-colors duration-150 ${t.cardBg} ${t.cardBorder}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className={`p-4 border-b flex items-center justify-between gap-2 ${t.navBg}`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-serif-thai font-bold text-sm tracking-wide truncate">
              {isCarnegie ? 'วิธีชนะมิตรและจูงใจคน' : 'THE DAILY STOIC'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-500/10 text-yellow-400 font-mono shrink-0">
              {readCount}/{totalUnits} {unitLabel} ({progressPercent}%)
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                onClose();
                onOpenBookShelf();
              }}
              className="px-2.5 py-1 rounded-lg border border-yellow-400/50 text-yellow-400 hover:bg-yellow-400 hover:text-black text-xs font-sans-thai font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="สลับหนังสือในคลัง"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>สลับเล่ม</span>
            </button>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg border text-stone-400 hover:${t.textPrimary} ${t.cardBorder} cursor-pointer`}
              title="ปิดเมนู (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 border-b text-xs text-center font-sans-thai bg-stone-500/5">
          <button
            onClick={() => { setActiveTab('toc'); setSelectedTopic(null); }}
            className={`py-2.5 border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'toc'
                ? 'border-yellow-400 text-yellow-400 font-bold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            {isCarnegie ? 'สารบัญ 30 บท' : 'สารบัญ 366'}
          </button>
          <button
            onClick={() => setActiveTab('grid')}
            className={`py-2.5 border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'grid'
                ? 'border-yellow-400 text-yellow-400 font-bold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            {isCarnegie ? 'ตาราง 30 บท' : 'กำแพงอิฐ'}
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`py-2.5 border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'topics'
                ? 'border-yellow-400 text-yellow-400 font-bold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            {isCarnegie ? '30 กฎเหล็ก' : 'ยาใจสโตอิก'}
          </button>
          <button
            onClick={() => setActiveTab('wisdom')}
            className={`py-2.5 border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'wisdom'
                ? 'border-yellow-400 text-yellow-400 font-bold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            {isCarnegie ? 'คำนำ & 9 วิธี' : 'อภิธานศัพท์'}
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: Table of Contents */}
          {activeTab === 'toc' && (
            <div className="space-y-3">
              {/* Search box & Favorite filter */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={
                      isCarnegie
                        ? 'ค้นหาบทที่ (1-30) ชื่อบท หรือกฎเหล็ก...'
                        : 'ค้นหาก้าวที่ (1-366) หรือชื่อบท...'
                    }
                    className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs font-sans-thai focus:outline-hidden ${t.appBg} ${t.cardBorder} ${t.textPrimary}`}
                  />
                </div>
                <button
                  onClick={() => setFilterFavorites(!filterFavorites)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer whitespace-nowrap ${
                    filterFavorites
                      ? 'bg-yellow-400 text-black border-yellow-400 font-semibold'
                      : `${t.cardBorder} ${t.textSecondary} hover:${t.textPrimary}`
                  }`}
                  title="แสดงเฉพาะรายการโปรด"
                >
                  ★ โปรด ({favorites.length})
                </button>
              </div>

              {/* Part Filter Pills for Carnegie */}
              {isCarnegie && (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedTopic(null)}
                    className={`px-2 py-1 rounded-md text-[11px] font-sans-thai border cursor-pointer transition-colors ${
                      selectedTopic === null
                        ? 'bg-yellow-400 text-black border-yellow-400 font-bold'
                        : `${t.cardBorder} ${t.textSecondary}`
                    }`}
                  >
                    ทั้งหมด (30)
                  </button>
                  {CARNEGIE_PARTS.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedTopic(selectedTopic === p.id ? null : p.id)}
                      className={`px-2 py-1 rounded-md text-[11px] font-sans-thai border cursor-pointer transition-colors ${
                        selectedTopic === p.id
                          ? 'bg-yellow-400 text-black border-yellow-400 font-bold'
                          : `${t.cardBorder} ${t.textSecondary}`
                      }`}
                    >
                      ภาคที่ {i + 1}
                    </button>
                  ))}
                </div>
              )}

              {!isCarnegie && selectedTopic && (
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                  <span>กำลังกรองตามหมวด: {TOPIC_CATEGORIES.find(c => c.id === selectedTopic)?.title}</span>
                  <button
                    onClick={() => setSelectedTopic(null)}
                    className="underline text-[11px] cursor-pointer"
                  >
                    ล้างตัวกรอง
                  </button>
                </div>
              )}

              {/* Day / Chapter items list */}
              <div className="space-y-1.5 max-h-[calc(100vh-290px)] overflow-y-auto pr-1">
                {filteredDays.length > 0 ? (
                  filteredDays.map(d => {
                    const isCompleted = Boolean(readDays[d.id]);
                    const isCurrent = d.id === currentDayId;
                    const chapterBookmark = bookmarks?.[d.id] || (activeBookmark?.dayId === d.id ? activeBookmark : null);

                    return (
                      <div
                        key={d.id}
                        onClick={() => {
                          onSelectDay(d.id);
                          onClose();
                        }}
                        className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          isCurrent
                            ? 'border-yellow-400/60 bg-yellow-400/10 font-medium'
                            : `${t.appBg} ${t.cardBorder} hover:${t.cardBgHover}`
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-mono">
                            <span className={isCurrent ? 'text-yellow-400 font-bold' : ''}>
                              {unitLabel}ที่ {d.dayStep}
                            </span>
                            <span>•</span>
                            <span className="truncate">{d.monthNameTh}: {d.monthThemeTh}</span>
                          </div>
                          <div className={`text-xs font-serif-thai truncate mt-0.5 ${t.textPrimary}`}>
                            {d.titleTh}
                          </div>
                          <div className={`text-[10px] ${t.textMuted} truncate italic font-serif`}>
                            {isCarnegie ? d.disciplineTh : d.author}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {chapterBookmark && !isCompleted && typeof chapterBookmark.paragraphIndex === 'number' && chapterBookmark.paragraphIndex >= 0 && (
                            <span
                              className="flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-400/15 border border-yellow-400/30 px-1.5 py-0.5 rounded-md font-sans-thai font-medium"
                              title={`อ่านค้างไว้ที่ย่อหน้าที่ ${chapterBookmark.paragraphIndex + 1}`}
                            >
                              <BookmarkCheck className="w-3 h-3 text-yellow-400" />
                              <span className="hidden xs:inline">ย่อหน้าที่ {chapterBookmark.paragraphIndex + 1}</span>
                            </span>
                          )}
                          {isCompleted && (
                            <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-xs text-stone-400 font-sans-thai">
                    ไม่พบ{unitLabel}ที่ค้นหา
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Grid View (366 Bricks for Stoic, 30 Tiles for Carnegie) */}
          {activeTab === 'grid' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-400 pb-2 border-b border-stone-500/15">
                <span>อ่านแล้ว {readCount} จาก {totalUnits} {unitLabel}</span>
                <span className="flex items-center gap-1 font-mono text-yellow-400">
                  <Flame className="w-3.5 h-3.5 fill-current" /> {streak} วันต่อเนื่อง
                </span>
              </div>

              {isCarnegie ? (
                <div className="grid grid-cols-5 gap-2 p-3 rounded-xl border bg-stone-500/5 border-stone-500/10">
                  {days.map(d => {
                    const isCompleted = Boolean(readDays[d.id]);
                    const isCurrent = d.id === currentDayId;

                    return (
                      <button
                        key={d.id}
                        onClick={() => {
                          onSelectDay(d.id);
                          onClose();
                        }}
                        className={`py-3 rounded-lg text-xs font-mono transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          isCompleted
                            ? 'bg-yellow-400 text-black font-bold'
                            : isCurrent
                            ? 'border-2 border-yellow-400 bg-yellow-400/20 text-yellow-400 font-bold'
                            : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                        }`}
                        title={`บทที่ ${d.dayStep}: ${d.titleTh}`}
                      >
                        <span>บท {d.dayStep}</span>
                        <span className="text-[9px] opacity-75">ภาค {d.partNumber}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-1 p-2 rounded-xl border bg-stone-500/5 border-stone-500/10 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {days.map(d => {
                    const isCompleted = Boolean(readDays[d.id]);
                    const isCurrent = d.id === currentDayId;

                    return (
                      <button
                        key={d.id}
                        onClick={() => {
                          onSelectDay(d.id);
                          onClose();
                        }}
                        className={`aspect-square rounded-xs text-[8px] font-mono transition-all cursor-pointer ${
                          isCompleted
                            ? 'bg-yellow-400 text-black font-semibold'
                            : isCurrent
                            ? 'border border-yellow-400 bg-yellow-400/20 text-yellow-400 font-bold'
                            : 'bg-stone-800 hover:bg-stone-700 text-stone-400'
                        }`}
                        title={`ก้าวที่ ${d.dayStep}: ${d.titleTh}`}
                      >
                        {d.dayStep}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Stoic First-Aid OR Carnegie 30 Principles */}
          {activeTab === 'topics' && (
            isCarnegie ? (
              <div className="space-y-2.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                <p className="text-xs text-stone-400 leading-relaxed font-sans-thai mb-2">
                  สรุป 30 กฎเหล็กแห่งการชนะมิตรและจูงใจคน (คลิกที่กฎเพื่อเปิดอ่านบทนั้นทันที):
                </p>
                {(carnegieMeta?.principles || []).map(p => {
                  const isCompleted = Boolean(readDays[p.id]);
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelectDay(p.id);
                        onClose();
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2.5 ${t.appBg} ${t.cardBorder} hover:${t.cardBgHover}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-stone-400">
                          <span className="text-yellow-400 font-bold">{p.partNameTh}</span>
                          <span>•</span>
                          <span>บทที่ {p.id}</span>
                        </div>
                        <div className={`text-xs font-serif-thai font-bold ${t.textPrimary}`}>
                          {p.principleTh}
                        </div>
                        <div className={`text-[11px] italic font-serif ${t.textMuted}`}>
                          {p.principleEn}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 pt-1">
                        {isCompleted && <CheckCircle2 className="w-4 h-4 text-yellow-400" />}
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-stone-400 leading-relaxed font-sans-thai mb-3">
                  เลือกสภาวะอารมณ์ที่คุณกำลังเผชิญ เพื่อเปิดรับบทเรียนที่ตรงกับปัญหาใจของคุณที่สุด:
                </p>
                {TOPIC_CATEGORIES.map(cat => {
                  const count = days.filter(d => d.moodCategory === cat.id).length;

                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setSelectedTopic(cat.id);
                        setActiveTab('toc');
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${t.appBg} ${t.cardBorder} hover:${t.cardBgHover}`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-serif-thai font-bold text-yellow-400">
                          <span>{cat.icon}</span>
                          <span>{cat.title}</span>
                        </div>
                        <p className={`text-[11px] ${t.textSecondary} mt-0.5 line-clamp-1 font-sans-thai`}>
                          {cat.desc}
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-stone-400 shrink-0">
                        {count} บท
                      </span>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* TAB 4: Stoic Glossary OR Carnegie Preface & 9 Suggestions + Bio */}
          {activeTab === 'wisdom' && (
            isCarnegie ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setCarnegieDocView('preface')}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-sans-thai cursor-pointer transition-colors ${
                      carnegieDocView === 'preface'
                        ? 'bg-yellow-400 text-black border-yellow-400 font-bold'
                        : `${t.cardBorder} ${t.textSecondary}`
                    }`}
                  >
                    คำนำ & 9 คำแนะนำการอ่าน
                  </button>
                  <button
                    onClick={() => setCarnegieDocView('bio')}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-sans-thai cursor-pointer transition-colors ${
                      carnegieDocView === 'bio'
                        ? 'bg-yellow-400 text-black border-yellow-400 font-bold'
                        : `${t.cardBorder} ${t.textSecondary}`
                    }`}
                  >
                    ประวัติ เดล คาร์เนกี
                  </button>
                </div>

                <div className={`p-3.5 rounded-xl border max-h-[calc(100vh-260px)] overflow-y-auto ${t.appBg} ${t.cardBorder}`}>
                  {carnegieDocView === 'preface'
                    ? renderMarkdownDocument(carnegieMeta?.prefaceAndSuggestions || '')
                    : renderMarkdownDocument(carnegieMeta?.biographyAndSummary || '')}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-stone-400 font-sans-thai mb-2">
                  คำสำคัญและหลักการฝึกฝนของชาวสโตอิก:
                </div>
                {GREEK_TERMS.map((term, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border text-xs ${t.appBg} ${t.cardBorder}`}>
                    <div className="font-serif-thai font-bold text-yellow-400 mb-0.5">
                      {term.term}
                    </div>
                    <div className={`text-[11px] ${t.textSecondary} leading-relaxed`}>
                      {term.desc}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Drawer Footer Tools */}
        <div className={`p-3 border-t text-xs flex items-center justify-between gap-2 ${t.navBg}`}>
          <span className="text-[11px] text-stone-400 font-sans-thai">
            สำรอง & กู้คืนข้อมูลคลังหนังสือ (JSON)
          </span>

          {/* Backup / Export */}
          <div className="flex items-center gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  onImportBackup(file);
                  e.target.value = '';
                }
              }}
              className="hidden"
            />
            <button
              onClick={onExportBackup}
              className={`p-1.5 rounded-md border text-stone-400 hover:text-yellow-400 ${t.cardBorder} cursor-pointer transition-colors`}
              title="ส่งออกข้อมูลสำรอง (Backup JSON)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`p-1.5 rounded-md border text-stone-400 hover:text-yellow-400 ${t.cardBorder} cursor-pointer transition-colors`}
              title="นำเข้าข้อมูลสำรอง (Import JSON)"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (window.confirm(`คุณต้องการรีเซ็ตข้อมูลการอ่านของหนังสือเล่มนี้และเริ่มต้นใหม่ใช่หรือไม่?`)) {
                  onResetProgress();
                }
              }}
              className={`p-1.5 rounded-md border text-stone-400 hover:text-yellow-400 ${t.cardBorder} cursor-pointer transition-colors`}
              title="รีเซ็ตความคืบหน้าของเล่มนี้"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
