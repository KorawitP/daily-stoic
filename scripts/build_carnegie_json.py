import json
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

TRANSLATION_DIR = r'C:\Users\kokok\Downloads\book\translation_how_to_win_friends'
OUT_JSON_PATH = r'C:\Users\kokok\Downloads\book\webapp\src\data\how_to_win_friends.json'
OUT_META_PATH = r'C:\Users\kokok\Downloads\book\webapp\src\data\carnegie_meta.json'

PARTS_CONFIG = [
    {
        'partNumber': 1,
        'file': '01_Part_One_Fundamental_Techniques.md',
        'partNameTh': 'ภาคที่ 1',
        'partNameEn': 'Part One',
        'partThemeTh': 'เทคนิคพื้นฐานในการปฏิบัติต่อผู้อื่น',
        'partThemeEn': 'Fundamental Techniques in Handling People',
        'moodId': 'part_1',
    },
    {
        'partNumber': 2,
        'file': '02_Part_Two_Six_Ways_to_Make_People_Like_You.md',
        'partNameTh': 'ภาคที่ 2',
        'partNameEn': 'Part Two',
        'partThemeTh': '6 วิธีทำให้ผู้คนชื่นชอบคุณ',
        'partThemeEn': 'Six Ways to Make People Like You',
        'moodId': 'part_2',
    },
    {
        'partNumber': 3,
        'file': '03_Part_Three_Win_People_to_Your_Way_of_Thinking.md',
        'partNameTh': 'ภาคที่ 3',
        'partNameEn': 'Part Three',
        'partThemeTh': '12 วิธีจูงใจผู้อื่นให้คล้อยตาม',
        'partThemeEn': 'How to Win People to Your Way of Thinking',
        'moodId': 'part_3',
    },
    {
        'partNumber': 4,
        'file': '04_Part_Four_Be_a_Leader.md',
        'partNameTh': 'ภาคที่ 4',
        'partNameEn': 'Part Four',
        'partThemeTh': '9 วิธีเปลี่ยนพฤติกรรมคนในฐานะผู้นำ',
        'partThemeEn': 'Be a Leader: How to Change People Without Giving Offense',
        'moodId': 'part_4',
    },
]

PRINCIPLES_EN = {
    1: "Don't criticize, condemn or complain.",
    2: "Give honest and sincere appreciation.",
    3: "Arouse in the other person an eager want.",
    4: "Become genuinely interested in other people.",
    5: "Smile.",
    6: "Remember that a person's name is to that person the sweetest and most important sound in any language.",
    7: "Be a good listener. Encourage others to talk about themselves.",
    8: "Talk in terms of the other person's interests.",
    9: "Make the other person feel important—and do it sincerely.",
    10: "The only way to get the best of an argument is to avoid it.",
    11: "Show respect for the other person's opinions. Never say, 'You're wrong.'",
    12: "If you are wrong, admit it quickly and emphatically.",
    13: "Begin in a friendly way.",
    14: "Get the other person saying 'yes, yes' immediately.",
    15: "Let the other person do a great deal of the talking.",
    16: "Let the other person feel that the idea is his or hers.",
    17: "Try honestly to see things from the other person's point of view.",
    18: "Be sympathetic with the other person's ideas and desires.",
    19: "Appeal to the nobler motives.",
    20: "Dramatize your ideas.",
    21: "Throw down a challenge.",
    22: "Begin with praise and honest appreciation.",
    23: "Call attention to people's mistakes indirectly.",
    24: "Talk about your own mistakes before criticizing the other person.",
    25: "Ask questions instead of giving direct orders.",
    26: "Let the other person save face.",
    27: "Praise the slightest improvement and praise every improvement.",
    28: "Give the other person a fine reputation to live up to.",
    29: "Use encouragement. Make the fault seem easy to correct.",
    30: "Make the other person happy about doing the thing you suggest.",
}


def clean_md_inline(s: str) -> str:
    return s.strip()


def parse_chapter(raw_block: str, global_idx: int, ch_in_part: int, part_cfg: dict) -> dict:
    lines = [l.rstrip() for l in raw_block.splitlines()]
    # Header line: ## บทที่ 1: "ถ้าอยากเก็บน้ำผึ้ง อย่าเตะรังผึ้ง" (*"If You Want to Gather Honey, Don't Kick Over the Beehive"*)
    header_line = lines[0].strip()
    m_hdr = re.match(r'^##\s*บทที่\s*\d+:\s*(.+?)\s*\(\*(.+?)\*\)\s*$', header_line)
    if m_hdr:
        title_th = m_hdr.group(1).strip()
        title_en = m_hdr.group(2).strip().strip('"').strip('“').strip('”')
    else:
        title_th = re.sub(r'^##\s*บทที่\s*\d+:\s*', '', header_line).strip()
        title_en = ''

    # Principle subtitle line: *ภาคที่ 1 — กฎข้อที่ 1: อย่าวิจารณ์ ตำหนิ หรือบ่น*
    idx = 1
    while idx < len(lines) and not lines[idx].strip():
        idx += 1

    principle_th = ''
    if idx < len(lines) and lines[idx].strip().startswith('*'):
        sub_line = lines[idx].strip().strip('*').strip()
        # Extract after colon if present
        if ':' in sub_line:
            principle_th = sub_line.split(':', 1)[1].strip()
        else:
            principle_th = sub_line
        idx += 1

    # Next non-empty lines: opening quote block (> ...)
    while idx < len(lines) and not lines[idx].strip():
        idx += 1

    quote_lines = []
    author = 'เดล คาร์เนกี (Dale Carnegie)'
    author_en = 'Dale Carnegie'
    source = 'How to Win Friends and Influence People'

    if idx < len(lines) and lines[idx].strip().startswith('>'):
        while idx < len(lines) and lines[idx].strip().startswith('>'):
            qline = re.sub(r'^>\s*', '', lines[idx].strip()).strip()
            if qline.startswith('—') or qline.startswith('-'):
                attr = qline.lstrip('—').lstrip('-').strip()
                if ',' in attr:
                    a_part, s_part = attr.split(',', 1)
                    author = a_part.strip()
                    source = s_part.strip().strip('*')
                else:
                    author = attr
                    source = ''
            else:
                # Strip bold/quotes wrapper
                cleaned_q = qline.strip('*').strip('"').strip('“').strip('”').strip('*')
                if cleaned_q:
                    quote_lines.append(cleaned_q)
            idx += 1

    quote_text = ' '.join(quote_lines).strip()

    # Skip following --- separator
    while idx < len(lines) and (not lines[idx].strip() or lines[idx].strip() == '---'):
        idx += 1

    # Remaining lines belong to the chapter body (stop before ## 📌 สรุปแก่นแท้ภาค or navigation links)
    body_lines = []
    for line in lines[idx:]:
        s = line.strip()
        if s.startswith('## 📌'):
            break
        if s.startswith('[⬅️ กลับสู่หน้าสารบัญหลัก'):
            break
        body_lines.append(line)

    # Group body_lines into paragraphs / blocks
    paragraphs = []
    curr_buf = []

    def flush_buf():
        if not curr_buf:
            return
        joined = '\n'.join(curr_buf).strip()
        curr_buf.clear()
        if joined and joined != '---':
            paragraphs.append(joined)

    for line in body_lines:
        s = line.strip()
        if not s or s == '---':
            flush_buf()
            continue
        if s.startswith('### ') or s.startswith('#### '):
            flush_buf()
            paragraphs.append(s)
            continue
        curr_buf.append(s)

    flush_buf()

    principle_en = PRINCIPLES_EN.get(global_idx, '')

    return {
        'id': global_idx,
        'dayStep': global_idx,
        'dayOfMonth': ch_in_part,
        'monthNumber': part_cfg['partNumber'],
        'dateLabel': f"{part_cfg['partNameTh']} • บทที่ {ch_in_part} (กฎข้อที่ {global_idx})",
        'monthNameTh': part_cfg['partNameTh'],
        'monthNameEn': part_cfg['partNameEn'],
        'monthThemeTh': part_cfg['partThemeTh'],
        'monthThemeEn': part_cfg['partThemeEn'],
        'partNumber': part_cfg['partNumber'],
        'disciplineTh': f"กฎข้อที่ {global_idx}: {principle_th}",
        'disciplineEn': f"Principle {global_idx}: {principle_en}",
        'titleTh': title_th,
        'titleEn': title_en,
        'quote': quote_text,
        'author': author,
        'authorEn': author_en,
        'source': source,
        'paragraphs': paragraphs,
        'moodCategory': part_cfg['moodId'],
        'tags': [part_cfg['moodId'], f"principle_{global_idx}", 'dale_carnegie'],
    }


def main():
    chapters = []
    global_idx = 0

    for part_cfg in PARTS_CONFIG:
        filepath = os.path.join(TRANSLATION_DIR, part_cfg['file'])
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()

        raw_blocks = re.split(r'(?=^## บทที่ \d+:)', text, flags=re.M)
        ch_in_part = 0
        for block in raw_blocks:
            if not block.strip().startswith('## บทที่'):
                continue
            global_idx += 1
            ch_in_part += 1
            ch_obj = parse_chapter(block, global_idx, ch_in_part, part_cfg)
            chapters.append(ch_obj)

    assert len(chapters) == 30, f"Expected 30 chapters, got {len(chapters)}"

    # Read Preface & 9 Suggestions and Lowell Thomas Biography
    with open(os.path.join(TRANSLATION_DIR, '00_Preface_and_Nine_Suggestions.md'), 'r', encoding='utf-8') as f:
        preface_md = f.read()

    with open(os.path.join(TRANSLATION_DIR, '05_Shortcut_to_Distinction_and_30_Principles.md'), 'r', encoding='utf-8') as f:
        shortcut_md = f.read()

    # Clean navigation links from preface_md and shortcut_md
    def strip_nav(md_text: str) -> str:
        out = []
        for line in md_text.splitlines():
            if '[⬅️ กลับสู่หน้าสารบัญหลัก' in line:
                continue
            out.append(line)
        return '\n'.join(out).strip()

    principles_list = []
    for ch in chapters:
        principles_list.append({
            'id': ch['id'],
            'partNumber': ch['partNumber'],
            'partNameTh': ch['monthNameTh'],
            'partThemeTh': ch['monthThemeTh'],
            'chapterTitleTh': ch['titleTh'],
            'chapterTitleEn': ch['titleEn'],
            'principleTh': ch['disciplineTh'],
            'principleEn': ch['disciplineEn'],
        })

    carnegie_meta = {
        'bookId': 'how-to-win-friends',
        'bookTitleTh': 'วิธีชนะมิตรและจูงใจคน',
        'bookTitleEn': 'How to Win Friends and Influence People',
        'authors': 'Dale Carnegie (เดล คาร์เนกี)',
        'totalDays': 30,
        'parts': [
            {
                'num': p['partNumber'],
                'id': p['moodId'],
                'name_th': p['partNameTh'],
                'name_en': p['partNameEn'],
                'theme_th': p['partThemeTh'],
                'theme_en': p['partThemeEn'],
                'chapters': len([c for c in chapters if c['partNumber'] == p['partNumber']]),
            }
            for p in PARTS_CONFIG
        ],
        'principles': principles_list,
        'prefaceAndSuggestions': strip_nav(preface_md),
        'biographyAndSummary': strip_nav(shortcut_md),
    }

    with open(OUT_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(chapters, f, ensure_ascii=False, indent=2)

    with open(OUT_META_PATH, 'w', encoding='utf-8') as f:
        json.dump(carnegie_meta, f, ensure_ascii=False, indent=2)

    total_paras = sum(len(c['paragraphs']) for c in chapters)
    print(f"Successfully generated {len(chapters)} chapters ({total_paras} paragraphs/blocks) to {OUT_JSON_PATH}")
    print(f"Successfully generated metadata to {OUT_META_PATH}")


if __name__ == '__main__':
    main()
