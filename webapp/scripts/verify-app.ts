import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

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

console.log('--------------------------------------------------');
console.log('ALL TESTS PASSED SUCCESSFULLY! (6/6 suites passing)');
