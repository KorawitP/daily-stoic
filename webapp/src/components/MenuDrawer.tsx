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
} from 'lucide-react';
import type { StoicDay, AppTheme, FontSize } from '../types/stoic.ts';
import { getThemeClasses } from '../utils/theme.ts';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  days: StoicDay[];
  currentDayId: number;
  readDays: Record<number, { completedAt: string }>;
  streak: number;
  favorites: number[];
  theme: AppTheme;
  fontSize: FontSize;
  onChangeFontSize: (size: FontSize) => void;
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

const GREEK_TERMS = [
  { term: 'Amor Fati', desc: 'ความรักในโชคชะตา โอบรับทุกสิ่งที่เกิดขึ้นประหนึ่งมันเกิดมาเพื่อฝึกฝนเรา' },
  { term: 'Memento Mori', desc: 'มรณานุสติ การระลึกถึงความตายเสมอเพื่อใช้ชีวิตปัจจุบันอย่างมีคุณค่า' },
  { term: 'Ataraxia (ἀταραξία)', desc: 'ความสงบสุขแห่งจิตใจ อิสรภาพจากการถูกรบกวนโดยสิ่งภายนอก' },
  { term: 'Apatheia (ἀπάθεια)', desc: 'ความเยือกเย็นที่ไม่ตกเป็นทาสของตัณหาและอารมณ์สุดโต่ง' },
  { term: 'Prohairesis (προαίρεσις)', desc: 'อำนาจการตัดสินใจเลือกอย่างมีเหตุผล เจตจำนงเสรีที่ไม่มีใครพรากไปได้' },
  { term: 'Logos (λόγος)', desc: 'เหตุผลและกฎระเบียบแห่งธรรมชาติอันเป็นแกนชี้นำจักรวาล' },
  { term: 'Sympatheia (συμπάθεια)', desc: 'ความเชื่อมโยงถึงกันของมวลมนุษยชาติและสรรพสิ่งในเอกภพ' },
  { term: 'Diairesis (διαίเรสิส)', desc: 'การแยกสิ่งที่ควบคุมได้ ออกจากสิ่งที่อยู่นอกเหนือการควบคุม' },
];

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  days,
  currentDayId,
  readDays,
  streak,
  favorites,
  theme,
  fontSize,
  onChangeFontSize,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const readCount = Object.keys(readDays).length;
  const progressPercent = Math.round((readCount / 366) * 100);

  // Filter TOC days
  const filteredDays = days.filter(d => {
    if (filterFavorites && !favorites.includes(d.id)) return false;
    if (selectedTopic && d.moodCategory !== selectedTopic) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.trim().toLowerCase();
    // Step match e.g. "ก้าว 10" or "10"
    const stepMatch = query.match(/^(?:ก้าว(?:ที่)?\s*|day\s*)?(\d{1,3})$/i);
    if (stepMatch) {
      return d.id === parseInt(stepMatch[1], 10);
    }
    const corpus = `${d.titleTh} ${d.titleEn} ${d.author} ${d.quote} ${d.dateLabel}`.toLowerCase();
    return query.split(/\s+/).every(term => corpus.includes(term));
  });

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
        <div className={`p-4 border-b flex items-center justify-between ${t.navBg}`}>
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-sm tracking-wide">
              สารบัญ & เครื่องมือ
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-500/10 text-stone-500 font-mono">
              {readCount}/366 ก้าว ({progressPercent}%)
            </span>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border text-stone-400 hover:${t.textPrimary} ${t.cardBorder} cursor-pointer`}
            title="ปิดเมนู (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 border-b text-xs text-center font-sans-thai bg-stone-500/5">
          <button
            onClick={() => { setActiveTab('toc'); setSelectedTopic(null); }}
            className={`py-2.5 border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'toc'
                ? 'border-amber-600 text-amber-700 dark:text-amber-400 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            สารบัญ 366
          </button>
          <button
            onClick={() => setActiveTab('grid')}
            className={`py-2.5 border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'grid'
                ? 'border-amber-600 text-amber-700 dark:text-amber-400 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            กำแพงอิฐ
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`py-2.5 border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'topics'
                ? 'border-amber-600 text-amber-700 dark:text-amber-400 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            ยาใจสโตอิก
          </button>
          <button
            onClick={() => setActiveTab('wisdom')}
            className={`py-2.5 border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'wisdom'
                ? 'border-amber-600 text-amber-700 dark:text-amber-400 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            อภิธานศัพท์
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
                    placeholder="ค้นหาก้าวที่ (1-366) หรือชื่อบท..."
                    className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs font-sans-thai focus:outline-hidden ${t.appBg} ${t.cardBorder} ${t.textPrimary}`}
                  />
                </div>
                <button
                  onClick={() => setFilterFavorites(!filterFavorites)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer whitespace-nowrap ${
                    filterFavorites
                      ? 'bg-amber-600 text-white border-amber-600'
                      : `${t.cardBorder} ${t.textSecondary}`
                  }`}
                  title="แสดงเฉพาะรายการโปรด"
                >
                  ★ โปรด ({favorites.length})
                </button>
              </div>

              {selectedTopic && (
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300">
                  <span>กำลังกรองตามหมวด: {TOPIC_CATEGORIES.find(c => c.id === selectedTopic)?.title}</span>
                  <button
                    onClick={() => setSelectedTopic(null)}
                    className="underline text-[11px] cursor-pointer"
                  >
                    ล้างตัวกรอง
                  </button>
                </div>
              )}

              {/* Day items list */}
              <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {filteredDays.length > 0 ? (
                  filteredDays.map(d => {
                    const isCompleted = Boolean(readDays[d.id]);
                    const isCurrent = d.id === currentDayId;

                    return (
                      <div
                        key={d.id}
                        onClick={() => {
                          onSelectDay(d.id);
                          onClose();
                        }}
                        className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          isCurrent
                            ? 'border-amber-600/60 bg-amber-500/15 font-medium'
                            : `${t.appBg} ${t.cardBorder} hover:${t.cardBgHover}`
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-mono">
                            <span className={isCurrent ? 'text-amber-700 dark:text-amber-400 font-bold' : ''}>
                              ก้าวที่ {d.dayStep}
                            </span>
                            <span>•</span>
                            <span>{d.monthThemeTh}</span>
                          </div>
                          <div className={`text-xs font-serif-thai truncate mt-0.5 ${t.textPrimary}`}>
                            {d.titleTh}
                          </div>
                          <div className={`text-[10px] ${t.textMuted} truncate italic font-serif`}>
                            {d.author}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isCompleted && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-xs text-stone-400 font-sans-thai">
                    ไม่พบก้าวที่ค้นหา
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Brick Grid */}
          {activeTab === 'grid' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-500/15">
                <span>ก่อแล้ว {readCount} จาก 366 ก้อน</span>
                <span className="flex items-center gap-1 font-mono text-amber-600">
                  <Flame className="w-3.5 h-3.5 fill-current" /> {streak} วันต่อเนื่อง
                </span>
              </div>

              {/* 366 Bricks */}
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
                          ? 'bg-amber-700 dark:bg-amber-500 text-white'
                          : isCurrent
                          ? 'border border-amber-600 bg-amber-500/30 text-amber-900 dark:text-amber-200 font-bold'
                          : 'bg-stone-300/50 dark:bg-stone-800/60 hover:bg-stone-400'
                      }`}
                      title={`ก้าวที่ ${d.dayStep}: ${d.titleTh}`}
                    >
                      {d.dayStep}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Stoic Topics (First-Aid) */}
          {activeTab === 'topics' && (
            <div className="space-y-2">
              <p className="text-xs text-stone-500 leading-relaxed font-sans-thai mb-3">
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
                      <div className="flex items-center gap-1.5 text-xs font-serif-thai font-bold text-amber-800 dark:text-amber-300">
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
          )}

          {/* TAB 4: Stoic Wisdom & Greek Glossary */}
          {activeTab === 'wisdom' && (
            <div className="space-y-3">
              <div className="text-xs text-stone-500 font-sans-thai mb-2">
                คำสำคัญและหลักการฝึกฝนของชาวสโตอิก:
              </div>
              {GREEK_TERMS.map((term, idx) => (
                <div key={idx} className={`p-3 rounded-lg border text-xs ${t.appBg} ${t.cardBorder}`}>
                  <div className="font-serif-thai font-bold text-amber-800 dark:text-amber-400 mb-0.5">
                    {term.term}
                  </div>
                  <div className={`text-[11px] ${t.textSecondary} leading-relaxed`}>
                    {term.desc}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer Tools */}
        <div className={`p-3 border-t text-xs flex items-center justify-between gap-2 ${t.navBg}`}>
          {/* Font size adjuster */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-stone-400">ขนาด:</span>
            {(['sm', 'md', 'lg', 'xl'] as FontSize[]).map(sz => (
              <button
                key={sz}
                onClick={() => onChangeFontSize(sz)}
                className={`px-1.5 py-0.5 rounded-sm text-[11px] font-mono cursor-pointer ${
                  fontSize === sz
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-stone-400 hover:text-stone-700'
                }`}
              >
                {sz.toUpperCase()}
              </button>
            ))}
          </div>

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
              className={`p-1.5 rounded-md border text-stone-400 hover:${t.textPrimary} ${t.cardBorder} cursor-pointer`}
              title="ส่งออกข้อมูลสำรอง (Backup JSON)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`p-1.5 rounded-md border text-stone-400 hover:${t.textPrimary} ${t.cardBorder} cursor-pointer`}
              title="นำเข้าข้อมูลสำรอง (Import JSON)"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (window.confirm('คุณต้องการรีเซ็ตข้อมูลการอ่านและเริ่มต้นใหม่ทั้งหมดใช่หรือไม่?')) {
                  onResetProgress();
                }
              }}
              className={`p-1.5 rounded-md border text-stone-400 hover:text-rose-500 ${t.cardBorder} cursor-pointer`}
              title="รีเซ็ตความคืบหน้า"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
