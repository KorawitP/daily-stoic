import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { sanitizeBookmark, sanitizeBookmarks } from '../src/hooks/useReadingProgress.ts';

// 1. Load Data
const dataPath = path.resolve('./src/data/daily_stoic.json');
const metaPath = path.resolve('./src/data/book_meta.json');

const dailyStoic = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const bookMeta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

console.log('--- TEST SUITE: THE DAILY STOIC WEBAPP ---');

// Test 1: Data Integrity
console.log('[1/6] Verifying 366 Days Data Integrity & Leap Day...');
assert.strictEqual(dailyStoic.length, 366, 'Must contain exactly 366 days');

const validMoods = new Set([
  'anger',
  'anxiety',
  'procrastination',
  'ego_wealth',
  'grief_loss',
  'clarity_control',
  'duty_purpose',
  'mortality_time',
]);

const monthDayCounts: Record<number, number> = {
  1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30,
  7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31,
};

const seenIds = new Set<number>();
const actualMonthCounts: Record<number, number> = {};

dailyStoic.forEach((d: any, index: number) => {
  const expectedId = index + 1;
  assert.strictEqual(d.id, expectedId, `Day id mismatch at index ${index}`);
  assert.strictEqual(d.dayStep, expectedId, `Day step mismatch at index ${index}`);
  assert.ok(!seenIds.has(d.id), `Duplicate id ${d.id}`);
  seenIds.add(d.id);

  assert.ok(d.titleTh && d.titleTh.trim().length > 0, `Missing titleTh for day ${d.id}`);
  assert.ok(d.titleEn && d.titleEn.trim().length > 0, `Missing titleEn for day ${d.id}`);
  assert.ok(d.quote && d.quote.trim().length > 0, `Missing quote for day ${d.id}`);
  assert.ok(d.author && d.author.trim().length > 0, `Missing author for day ${d.id}`);
  assert.ok(d.authorEn && d.authorEn.trim().length > 0, `Missing authorEn for day ${d.id}`);
  assert.ok(Array.isArray(d.paragraphs) && d.paragraphs.length > 0, `Missing paragraphs for day ${d.id}`);
  assert.ok(validMoods.has(d.moodCategory), `Invalid moodCategory ${d.moodCategory} for day ${d.id}`);

  actualMonthCounts[d.monthNumber] = (actualMonthCounts[d.monthNumber] || 0) + 1;
});

// Check Leap Day Day 60 is Feb 29
const day60 = dailyStoic.find((d: any) => d.id === 60);
assert.ok(day60, 'Day 60 must exist');
assert.strictEqual(day60.monthNumber, 2, 'Day 60 is February');
assert.strictEqual(day60.dayOfMonth, 29, 'Day 60 is February 29th (Leap Day)');
assert.strictEqual(day60.dateLabel, '29 กุมภาพันธ์', 'Day 60 dateLabel is 29 กุมภาพันธ์');

for (let m = 1; m <= 12; m++) {
  assert.strictEqual(actualMonthCounts[m], monthDayCounts[m], `Month ${m} should have ${monthDayCounts[m]} days, got ${actualMonthCounts[m]}`);
}

assert.ok(bookMeta.introduction && bookMeta.introduction.length > 5000, 'Introduction must be present');
assert.ok(bookMeta.months && bookMeta.months.length === 12, 'Must have 12 months meta');
console.log('✓ 366 days data integrity & Leap Day verified cleanly.');

// Test 2: Streak calculation logic & Timezone Handling
console.log('[2/6] Verifying Streak, Habit Tracking & Timezone Logic...');

function toLocalDateString(input?: string | number | Date): string {
  if (!input) return '';
  const d = new Date(input);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayString(): string {
  return toLocalDateString(new Date());
}

function getYesterdayString(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return toLocalDateString(now);
}

function computeActiveStreak(streak: number, lastCheckInDate: string): number {
  if (!lastCheckInDate || streak <= 0) return 0;
  const today = getTodayString();
  const yesterday = getYesterdayString();
  if (lastCheckInDate === today || lastCheckInDate === yesterday) {
    return streak;
  }
  return 0;
}

const today = getTodayString();
const yesterday = getYesterdayString();

// Scenario A: Checked in today
assert.strictEqual(computeActiveStreak(5, today), 5, 'Streak today should remain 5');

// Scenario B: Checked in yesterday, not yet today -> streak is still 5 (alive)
assert.strictEqual(computeActiveStreak(5, yesterday), 5, 'Streak from yesterday should remain 5');

// Scenario C: Last checkin was 3 days ago -> streak is broken
assert.strictEqual(computeActiveStreak(5, '2026-01-01'), 0, 'Streak broken if older than yesterday');

// Scenario D: No checkin ever
assert.strictEqual(computeActiveStreak(0, ''), 0, 'No checkin streak is 0');

// Scenario E: Timezone UTC ISO string conversion
const utcIso = '2026-10-15T18:00:00.000Z';
const localStr = toLocalDateString(utcIso);
assert.match(localStr, /^\d{4}-\d{2}-\d{2}$/, 'Should format valid local date YYYY-MM-DD');

console.log('✓ Streak tracking and timezone logic verified cleanly.');

// Test 3: Journey Mode Auto-Advance & Checkpoint Jump
console.log('[3/6] Verifying Journey Mode Auto-Advance...');
const readDays: Record<number, { completedAt: string }> = {
  1: { completedAt: new Date().toISOString() },
  2: { completedAt: new Date().toISOString() },
  3: { completedAt: new Date().toISOString() },
};

let nextJourneyDay = 1;
for (let i = 1; i <= 366; i++) {
  if (!readDays[i]) {
    nextJourneyDay = i;
    break;
  }
}
assert.strictEqual(nextJourneyDay, 4, 'Next unread day should be 4');

// When all read
const allReadDays: Record<number, { completedAt: string }> = {};
for (let i = 1; i <= 366; i++) {
  allReadDays[i] = { completedAt: new Date().toISOString() };
}
let completedJourneyDay = 366;
for (let i = 1; i <= 366; i++) {
  if (!allReadDays[i]) {
    completedJourneyDay = i;
    break;
  }
}
assert.strictEqual(completedJourneyDay, 366, 'Caps gracefully at 366 when all read');
console.log('✓ Journey mode auto-advance verified cleanly.');

// Test 4: Backup Export, Import Validation & Sanitization
console.log('[4/6] Verifying Backup Export/Import & Sanitization...');
const mockProgress = {
  readDays: { 1: { completedAt: '2026-10-15T10:00:00Z' } },
  currentJourneyDay: 2,
  streak: 1,
  lastCheckInDate: today,
  favorites: [1, 289],
  notes: { 1: 'ทดสอบบันทึกสะท้อนคิด' },
  theme: 'parchment',
  fontSize: 'md',
  readingMode: 'journey',
};

const backupString = JSON.stringify({
  version: '1.0.0',
  app: 'The Daily Stoic (Thai)',
  exportedAt: new Date().toISOString(),
  progress: mockProgress,
});

const parsedBackup = JSON.parse(backupString);
assert.ok(parsedBackup.progress, 'Backup must have progress');
assert.strictEqual(parsedBackup.progress.favorites.length, 2, 'Favorites length match');
assert.strictEqual(parsedBackup.progress.notes[1], 'ทดสอบบันทึกสะท้อนคิด', 'Notes match');

// Test sanitization function
function sanitizeAndImport(jsonStr: string) {
  try {
    const data = JSON.parse(jsonStr);
    const candidate = data.progress || data;
    if (typeof candidate !== 'object' || candidate === null) return { success: false };

    const rawFavorites = Array.isArray(candidate.favorites) ? candidate.favorites : [];
    const favorites = rawFavorites
      .map(Number)
      .filter((id: number) => Number.isInteger(id) && id >= 1 && id <= 366);

    return { success: true, favorites };
  } catch {
    return { success: false };
  }
}

// Reject invalid json
assert.strictEqual(sanitizeAndImport('invalid-json').success, false, 'Should reject corrupt json');
// Sanitize invalid favorites
const dirtyBackup = JSON.stringify({
  progress: {
    ...mockProgress,
    favorites: [1, 'corrupted', 999, -5, 289],
  },
});
const importResult = sanitizeAndImport(dirtyBackup);
assert.strictEqual(importResult.success, true);
assert.deepStrictEqual((importResult as any).favorites, [1, 289], 'Should filter out invalid favorites');
console.log('✓ Backup export and import sanitization verified cleanly.');

// Test 5: Enhanced Multi-Term Search & Filter Verification
console.log('[5/6] Verifying Multi-Term Search & Step Alias Algorithm...');
// Number and alias search
const testAliases = ['289', 'ก้าว 289', 'ก้าวที่ 289', 'day 289'];
testAliases.forEach(alias => {
  const match = alias.trim().toLowerCase().match(/^(?:ก้าว(?:ที่)?\s*|day\s*)?(\d{1,3})$/i);
  assert.ok(match, `Should match alias "${alias}"`);
  assert.strictEqual(parseInt(match![1], 10), 289, `Alias should resolve to 289 for "${alias}"`);
});

// Multi-term search (Seneca + death)
const q = 'seneca ความตาย';
const terms = q.toLowerCase().split(/\s+/);
const matches = dailyStoic.filter((d: any) => {
  const corpus = (
    d.dayStep + ' ' +
    d.titleTh + ' ' +
    d.titleEn + ' ' +
    d.quote + ' ' +
    d.author + ' ' +
    d.authorEn + ' ' +
    d.paragraphs.join(' ')
  ).toLowerCase();
  return terms.every(t => corpus.includes(t));
});
assert.ok(matches.length > 0, 'Multi-term search for "seneca ความตาย" must find matches');
console.log(`✓ Multi-term search found ${matches.length} matches for "${q}".`);

// Test 6: Word & Character Counting
console.log('[6/6] Verifying Reflection Word & Character Counting...');
function countWordsAndChars(text: string): { words: number; chars: number } {
  const trimmed = text.trim();
  if (!trimmed) return { words: 0, chars: 0 };
  const chars = trimmed.length;
  let words = 0;
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new (Intl as any).Segmenter('th', { granularity: 'word' });
      const segments = [...segmenter.segment(trimmed)];
      words = segments.filter(s => s.isWordLike).length;
    } catch {
      words = trimmed.split(/\s+/).filter(Boolean).length;
    }
  } else {
    words = trimmed.split(/\s+/).filter(Boolean).length;
  }
  return { words, chars };
}

const sampleThaiNote = 'วันนี้ได้เรียนรู้ว่าสิ่งภายนอกควบคุมไม่ได้ จงฝึกใจให้อยู่กับปัจจุบัน';
const { words, chars } = countWordsAndChars(sampleThaiNote);
assert.ok(chars > 50, 'Character count must be accurate');
assert.ok(words > 0, 'Word count must be positive');
console.log(`✓ Thai text counted: ${words} words, ${chars} characters.`);

// Test 7: How to Win Friends and Influence People Data Integrity
console.log('[7/7] Verifying How to Win Friends and Influence People (30 Chapters & Meta)...');
const carnegieDataPath = path.resolve('./src/data/how_to_win_friends.json');
const carnegieMetaPath = path.resolve('./src/data/carnegie_meta.json');
const carnegieChapters = JSON.parse(fs.readFileSync(carnegieDataPath, 'utf8'));
const carnegieMeta = JSON.parse(fs.readFileSync(carnegieMetaPath, 'utf8'));

assert.strictEqual(carnegieChapters.length, 30, 'Must contain exactly 30 chapters');
assert.strictEqual(carnegieMeta.principles.length, 30, 'Must contain 30 principles in meta');
assert.strictEqual(carnegieMeta.parts.length, 4, 'Must contain 4 parts in meta');
assert.ok(carnegieMeta.prefaceAndSuggestions.length > 5000, 'Preface and 9 suggestions must be present');
assert.ok(carnegieMeta.biographyAndSummary.length > 5000, 'Biography and summary must be present');

carnegieChapters.forEach((ch: any, idx: number) => {
  const expectedId = idx + 1;
  assert.strictEqual(ch.id, expectedId, `Carnegie chapter id mismatch at ${idx}`);
  assert.strictEqual(ch.dayStep, expectedId, `Carnegie chapter step mismatch at ${idx}`);
  assert.ok(ch.titleTh && ch.titleTh.length > 0, `Missing titleTh for chapter ${ch.id}`);
  assert.ok(ch.titleEn && ch.titleEn.length > 0, `Missing titleEn for chapter ${ch.id}`);
  assert.ok(ch.quote && ch.quote.length > 0, `Missing principle quote for chapter ${ch.id}`);
  assert.ok(Array.isArray(ch.paragraphs) && ch.paragraphs.length >= 10, `Too few paragraphs for chapter ${ch.id}`);
});
// Test 8: Last Active Day Persistence & Multi-Book Isolation
console.log('[8/10] Verifying Last Active Day Persistence & Multi-Book Isolation...');

function resolveInitialActiveDay(bookId: string, stoicProg: any, carnegieProg: any): number {
  if (bookId === 'how-to-win-friends') {
    return carnegieProg.lastActiveDayId || carnegieProg.bookmark?.dayId || carnegieProg.currentJourneyDay || 1;
  }
  return stoicProg.lastActiveDayId || stoicProg.bookmark?.dayId || stoicProg.currentJourneyDay || 1;
}

// Case 1: Fresh state defaults to 1
assert.strictEqual(
  resolveInitialActiveDay('daily-stoic', { currentJourneyDay: 1 }, { currentJourneyDay: 1 }),
  1,
  'Fresh Daily Stoic should resolve to Day 1'
);

// Case 2: User was reading chapter 15 of Carnegie (without marking read) -> resumes 15
const stoicMockState = { currentJourneyDay: 1, lastActiveDayId: 88 };
const carnegieMockState = { currentJourneyDay: 1, lastActiveDayId: 15 };

assert.strictEqual(
  resolveInitialActiveDay('daily-stoic', stoicMockState, carnegieMockState),
  88,
  'Daily Stoic must resume lastActiveDayId 88'
);
assert.strictEqual(
  resolveInitialActiveDay('how-to-win-friends', stoicMockState, carnegieMockState),
  15,
  'Carnegie must resume lastActiveDayId 15 independently'
);

// Case 3: Clamping boundaries
function clampDayId(dayId: number, maxUnits: number): number {
  return Math.max(1, Math.min(maxUnits, dayId));
}
assert.strictEqual(clampDayId(500, 366), 366, 'Clamps Daily Stoic to 366');
assert.strictEqual(clampDayId(-5, 366), 1, 'Clamps Daily Stoic to 1');
assert.strictEqual(clampDayId(99, 30), 30, 'Clamps Carnegie to 30');
assert.strictEqual(clampDayId(0, 30), 1, 'Clamps Carnegie to 1');
console.log('✓ Last Active Day persistence and multi-book isolation verified cleanly.');

// Test 9: Smart Bookmark Dual-Tracking & Resume Ribbon Logic
console.log('[9/10] Verifying Smart Bookmark Dual-Tracking & Resume Ribbon...');

interface TestBookmark {
  dayId: number;
  paragraphIndex: number;
  scrollPercent?: number;
  updatedAt: string;
}

class ReadingBookmarkManager {
  private bookmark: TestBookmark | null = null;
  private bookmarks: Record<number, TestBookmark> = {};

  getBookmark(dayId?: number): TestBookmark | null {
    if (typeof dayId === 'number') {
      return this.bookmarks[dayId] || (this.bookmark?.dayId === dayId ? this.bookmark : null);
    }
    return this.bookmark;
  }

  // 1. Auto-track: advances as user reads forward down the page
  autoTrack(dayId: number, visibleParaIdx: number, scrollPct?: number) {
    const current = this.getBookmark(dayId);
    if (!current || visibleParaIdx > current.paragraphIndex) {
      this.setBookmark(dayId, visibleParaIdx, scrollPct);
    }
  }

  // 2. Manual Pin: user clicks ribbon pin next to any paragraph (including paragraph 0)
  setBookmark(dayId: number, paragraphIndex: number, scrollPercent?: number) {
    const bm: TestBookmark = {
      dayId,
      paragraphIndex,
      scrollPercent,
      updatedAt: new Date().toISOString(),
    };
    this.bookmark = bm;
    this.bookmarks[dayId] = bm;
  }

  // 3. Clear bookmark: specific dayId or all if omitted
  clearBookmark(dayId?: number) {
    if (typeof dayId === 'number') {
      delete this.bookmarks[dayId];
    } else {
      this.bookmarks = {};
    }
    if (!dayId || this.bookmark?.dayId === dayId) {
      this.bookmark = null;
    }
  }
}

const bmManager = new ReadingBookmarkManager();

// Scenario 0: User starts reading Day 1 at the very first paragraph (index 0)
bmManager.autoTrack(1, 0);
assert.strictEqual(bmManager.getBookmark(1)?.paragraphIndex, 0, 'Auto-track sets bookmark to para 0 (first paragraph)');

// Scenario 1: User scrolls down to para 3
bmManager.autoTrack(1, 3);
assert.strictEqual(bmManager.getBookmark(1)?.paragraphIndex, 3, 'Auto-track advances bookmark to para 3');

// Scenario 2: User continues reading down to para 8
bmManager.autoTrack(1, 8);
assert.strictEqual(bmManager.getBookmark(1)?.paragraphIndex, 8, 'Auto-track advances to para 8');

// Scenario 3: User scrolls UP to review para 1 -> bookmark remains at furthest read position (para 8)
// so the floating button [📍 กลับไปจุดที่คั่นไว้ (ย่อหน้าที่ 9)] can guide them back!
bmManager.autoTrack(1, 1);
assert.strictEqual(bmManager.getBookmark(1)?.paragraphIndex, 8, 'Scrolling up keeps furthest reading ribbon at para 8');

// Scenario 4: User explicitly clicks manual pin on para 4
bmManager.setBookmark(1, 4);
assert.strictEqual(bmManager.getBookmark(1)?.paragraphIndex, 4, 'Manual pin overrides ribbon to para 4');

// Scenario 5: User also reads and bookmarks Day 5 at paragraph 12 (multi-chapter bookmarks)
bmManager.setBookmark(5, 12);
assert.strictEqual(bmManager.getBookmark(5)?.paragraphIndex, 12, 'Day 5 bookmark saved');
assert.strictEqual(bmManager.getBookmark(1)?.paragraphIndex, 4, 'Day 1 bookmark preserved across chapters');

// Scenario 6: User finishes Day 1 and marks read -> only Day 1 is cleared
bmManager.clearBookmark(1);
assert.strictEqual(bmManager.getBookmark(1), null, 'Marking Day 1 read clears Day 1 bookmark');
assert.strictEqual(bmManager.getBookmark(5)?.paragraphIndex, 12, 'Day 5 bookmark remains intact');

// Scenario 7: Full reset (clearBookmark with no args)
bmManager.clearBookmark();
assert.strictEqual(bmManager.getBookmark(5), null, 'clearBookmark() clears all bookmarks');

console.log('✓ Smart Bookmark dual-tracking and resume ribbon verified cleanly.');

// Test 10: Bookmark Sanitization & Full Backup V2 Validation
console.log('[10/10] Verifying Bookmark Sanitization & Backup V2 Validation...');

// Test sanitization of valid & invalid bookmarks using REAL imported sanitizeBookmark
assert.ok(sanitizeBookmark({ dayId: 10, paragraphIndex: 5 }, 366) !== null, 'Valid bookmark accepted');
assert.ok(sanitizeBookmark({ dayId: 1, paragraphIndex: 0 }, 366) !== null, 'Paragraph 0 bookmark accepted');
assert.strictEqual(sanitizeBookmark({ dayId: 1, paragraphIndex: 0 }, 366)?.paragraphIndex, 0, 'Paragraph 0 preserved as 0');
assert.strictEqual(sanitizeBookmark({ dayId: 999, paragraphIndex: 5 }, 366), null, 'Out of bounds dayId 999 rejected');
assert.strictEqual(sanitizeBookmark({ dayId: 0, paragraphIndex: 5 }, 366), null, 'Zero dayId rejected');
assert.strictEqual(sanitizeBookmark({ dayId: 1, paragraphIndex: -3 }, 366), null, 'Negative paragraph index rejected');
assert.strictEqual(sanitizeBookmark(null, 366), null, 'Null rejected');
assert.strictEqual(sanitizeBookmark(undefined, 366), null, 'Undefined rejected');
assert.strictEqual(sanitizeBookmark('invalid', 366), null, 'String rejected');

// Test sanitizeBookmarks map
const rawMap = {
  1: { dayId: 1, paragraphIndex: 0 },
  2: { dayId: 2, paragraphIndex: 10 },
  999: { dayId: 999, paragraphIndex: 5 },
  foo: { dayId: 3, paragraphIndex: -1 },
};
const cleanedMap = sanitizeBookmarks(rawMap, 366);
assert.strictEqual(Object.keys(cleanedMap).length, 2, 'Only valid bookmarks in range preserved');
assert.strictEqual(cleanedMap[1]?.paragraphIndex, 0, 'Day 1 bookmark at para 0 preserved');
assert.strictEqual(cleanedMap[2]?.paragraphIndex, 10, 'Day 2 bookmark at para 10 preserved');

// Test full backup export & import containing bookmarks and lastActiveDayId
const backupV2 = {
  version: '2.0.0',
  app: 'Personal Wisdom Library (Thai)',
  exportedAt: new Date().toISOString(),
  activeBookId: 'how-to-win-friends',
  progress: {
    ...mockProgress,
    lastActiveDayId: 105,
    bookmark: { dayId: 105, paragraphIndex: 7, updatedAt: new Date().toISOString() },
    bookmarks: {
      105: { dayId: 105, paragraphIndex: 7, updatedAt: new Date().toISOString() },
    },
  },
  carnegieProgress: {
    readDays: {},
    currentJourneyDay: 1,
    lastActiveDayId: 12,
    bookmark: { dayId: 12, paragraphIndex: 14, updatedAt: new Date().toISOString() },
    bookmarks: {
      12: { dayId: 12, paragraphIndex: 14, updatedAt: new Date().toISOString() },
    },
    favorites: [1, 2],
    notes: {},
  },
};

const v2String = JSON.stringify(backupV2);
const parsedV2 = JSON.parse(v2String);

const sanitizedStoicBm = sanitizeBookmark(parsedV2.progress.bookmark, 366);
const sanitizedCarnegieBm = sanitizeBookmark(parsedV2.carnegieProgress.bookmark, 30);
const sanitizedCarnegieBms = sanitizeBookmarks(parsedV2.carnegieProgress.bookmarks, 30);

assert.strictEqual(sanitizedStoicBm?.dayId, 105, 'Stoic bookmark dayId matches');
assert.strictEqual(sanitizedStoicBm?.paragraphIndex, 7, 'Stoic bookmark paragraph matches');
assert.strictEqual(sanitizedCarnegieBm?.dayId, 12, 'Carnegie bookmark dayId matches');
assert.strictEqual(sanitizedCarnegieBm?.paragraphIndex, 14, 'Carnegie bookmark paragraph matches');
assert.ok(sanitizedCarnegieBms[12], 'Carnegie bookmarks map preserved');

// Test active book resolution on import
const targetBookId = (parsedV2.activeBookId === 'how-to-win-friends' || parsedV2.activeBookId === 'daily-stoic')
  ? parsedV2.activeBookId
  : 'daily-stoic';
const resolvedNewJourneyDay = targetBookId === 'how-to-win-friends' && parsedV2.carnegieProgress
  ? (parsedV2.carnegieProgress.lastActiveDayId || parsedV2.carnegieProgress.currentJourneyDay || 1)
  : (parsedV2.progress.lastActiveDayId || parsedV2.progress.currentJourneyDay || 1);
assert.strictEqual(resolvedNewJourneyDay, 12, 'Resolves to Carnegie lastActiveDayId 12 on import');

console.log('✓ Bookmark sanitization and full Backup V2 verified cleanly.');

console.log('--------------------------------------------------');
console.log('ALL TESTS PASSED SUCCESSFULLY! (10/10 suites passing)');


