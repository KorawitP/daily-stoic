# -*- coding: utf-8 -*-
"""
parse_to_json.py
Parses the 12 Thai-translated markdown files of The Daily Stoic into structured JSON.
Includes all 366 days without cutting any content.
"""

import os
import sys
import glob
import re
import json

# Force UTF-8 stdout
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRANS_DIR = os.path.join(BASE_DIR, "translation")
OUTPUT_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

MONTH_METADATA = [
    {"num": 1, "name_th": "มกราคม", "name_en": "January", "theme_th": "ความแจ่มชัด", "theme_en": "Clarity", "part": 1, "discipline_th": "วินัยแห่งการรับรู้", "discipline_en": "The Discipline of Perception", "days": 31},
    {"num": 2, "name_th": "กุมภาพันธ์", "name_en": "February", "theme_th": "ตัณหาและอารมณ์", "theme_en": "Passions and Emotions", "part": 1, "discipline_th": "วินัยแห่งการรับรู้", "discipline_en": "The Discipline of Perception", "days": 29},
    {"num": 3, "name_th": "มีนาคม", "name_en": "March", "theme_th": "ความตระหนักรู้", "theme_en": "Awareness", "part": 1, "discipline_th": "วินัยแห่งการรับรู้", "discipline_en": "The Discipline of Perception", "days": 31},
    {"num": 4, "name_th": "เมษายน", "name_en": "April", "theme_th": "ความคิดที่ปราศจากอคติ", "theme_en": "Unbiased Thought", "part": 1, "discipline_th": "วินัยแห่งการรับรู้", "discipline_en": "The Discipline of Perception", "days": 30},
    {"num": 5, "name_th": "พฤษภาคม", "name_en": "May", "theme_th": "การกระทำที่ถูกต้อง", "theme_en": "Right Action", "part": 2, "discipline_th": "วินัยแห่งการกระทำ", "discipline_en": "The Discipline of Action", "days": 31},
    {"num": 6, "name_th": "มิถุนายน", "name_en": "June", "theme_th": "การแก้ปัญหา", "theme_en": "Problem Solving", "part": 2, "discipline_th": "วินัยแห่งการกระทำ", "discipline_en": "The Discipline of Action", "days": 30},
    {"num": 7, "name_th": "กรกฎาคม", "name_en": "July", "theme_th": "หน้าที่", "theme_en": "Duty", "part": 2, "discipline_th": "วินัยแห่งการกระทำ", "discipline_en": "The Discipline of Action", "days": 31},
    {"num": 8, "name_th": "สิงหาคม", "name_en": "August", "theme_th": "ปฏิบัตินิยม", "theme_en": "Pragmatism", "part": 2, "discipline_th": "วินัยแห่งการกระทำ", "discipline_en": "The Discipline of Action", "days": 31},
    {"num": 9, "name_th": "กันยายน", "name_en": "September", "theme_th": "ความทรหดและฟื้นตัวเร็ว", "theme_en": "Fortitude and Resilience", "part": 3, "discipline_th": "วินัยแห่งเจตจำนง", "discipline_en": "The Discipline of Will", "days": 30},
    {"num": 10, "name_th": "ตุลาคม", "name_en": "October", "theme_th": "คุณธรรมและความเมตตา", "theme_en": "Virtue and Kindness", "part": 3, "discipline_th": "วินัยแห่งเจตจำนง", "discipline_en": "The Discipline of Will", "days": 31},
    {"num": 11, "name_th": "พฤศจิกายน", "name_en": "November", "theme_th": "การยอมรับและรักในโชคชะตา", "theme_en": "Acceptance / Amor Fati", "part": 3, "discipline_th": "วินัยแห่งเจตจำนง", "discipline_en": "The Discipline of Will", "days": 30},
    {"num": 12, "name_th": "ธันวาคม", "name_en": "December", "theme_th": "มรณานุสติ", "theme_en": "Meditation on Mortality", "part": 3, "discipline_th": "วินัยแห่งเจตจำนง", "discipline_en": "The Discipline of Will", "days": 31},
]

MOOD_CATEGORIES = {
    "anger": {
        "id": "anger",
        "title_th": "ความโกรธ & ความขัดแย้ง",
        "title_en": "Anger & Conflict",
        "icon": "Flame",
        "color": "rose",
        "keywords": ["โกรธ", "โมโห", "อารมณ์เสีย", "ขัดแย้ง", "แค้น", "ดุดัน", "อภัย", "ศัตรู", "เกลียด", "ละมุนละม่อม", "คำสบประมาท", "ใจร้อน"]
    },
    "anxiety": {
        "id": "anxiety",
        "title_th": "ความกังวล & ความกลัว",
        "title_en": "Anxiety & Fear",
        "icon": "ShieldAlert",
        "color": "amber",
        "keywords": ["กังวล", "กลัว", "หวาดหวั่น", "เครียด", "อนาคต", "ตื่นตระหนก", "ความไม่แน่นอน", "ภัยพิบัติ", "ความวิตก", "ตื่นกลัว"]
    },
    "procrastination": {
        "id": "procrastination",
        "title_th": "การผัดวัน & การลงมือทำ",
        "title_en": "Procrastination & Action",
        "icon": "Zap",
        "color": "emerald",
        "keywords": ["ผัดวัน", "ขี้เกียจ", "รอคอย", "เริ่มต้น", "ลงมือ", "วินัย", "เฉื่อยชา", "ลังเล", "การกระทำ", "นิสัย", "อย่ามัวแต่"]
    },
    "ego_wealth": {
        "id": "ego_wealth",
        "title_th": "อัตตา & เงินทองชื่อเสียง",
        "title_en": "Ego, Wealth & Status",
        "icon": "Coins",
        "color": "violet",
        "keywords": ["อัตตา", "เย่อหยิ่ง", "อวด", "ชื่อเสียง", "สรรเสริญ", "เงิน", "ร่ำรวย", "ทรัพย์", "สมบัติ", "หลงตัวเอง", "ความโลภ", "ความมั่งคั่ง", "โอ้อวด"]
    },
    "grief_loss": {
        "id": "grief_loss",
        "title_th": "ความสูญเสีย & ความเศร้า",
        "title_en": "Grief, Loss & Adversity",
        "icon": "HeartCrack",
        "color": "indigo",
        "keywords": ["สูญเสีย", "เศร้า", "เจ็บปวด", "โศก", "พลัดพราก", "ร้องไห้", "ล้มเหลว", "โชคร้าย", "บาดเจ็บ", "ความทุกข์", "โศกเศร้า"]
    },
    "clarity_control": {
        "id": "clarity_control",
        "title_th": "การควบคุม & ความแจ่มชัด",
        "title_en": "Control & Clarity",
        "icon": "Compass",
        "color": "sky",
        "keywords": ["ควบคุม", "แจ่มชัด", "สงบ", "ภายนอก", "ภายใน", "ทางเลือก", "ปัญญา", "เหตุผล", "จิตใจ", "การรับรู้", "ความเงียบสงบ"]
    },
    "duty_purpose": {
        "id": "duty_purpose",
        "title_th": "หน้าที่ & คุณธรรม",
        "title_en": "Duty, Purpose & Kindness",
        "icon": "Scale",
        "color": "teal",
        "keywords": ["หน้าที่", "ประโยชน์ส่วนรวม", "เมตตา", "คุณธรรม", "รับผิดชอบ", "อุปนิสัย", "เสียสละ", "ความยุติธรรม", "ความดีงาม"]
    },
    "mortality_time": {
        "id": "mortality_time",
        "title_th": "มรณานุสติ & เวลาชีวิต",
        "title_en": "Mortality & Time (Memento Mori)",
        "icon": "Hourglass",
        "color": "stone",
        "keywords": ["ความตาย", "มรณะ", "ตาย", "เวลา", "ชั่วคราว", "วาระสุดท้าย", "อนิจจัง", "วันสุดท้าย", "ชีวิตอันสั้น", "memento mori"]
    }
}

def determine_mood_category(title_th, title_en, quote, content, month_num):
    text_to_check = f"{title_th} {title_en} {quote} {' '.join(content[:2])}".lower()
    
    # Priority for December -> mortality
    if month_num == 12:
        return "mortality_time"
    # Priority for February -> emotions / anger / desire
    if month_num == 2 and any(k in text_to_check for k in ["โกรธ", "โมโห", "อารมณ์", "แค้น"]):
        return "anger"
    # Priority for November -> grief_loss or clarity_control (acceptance)
    if month_num == 11:
        if any(k in text_to_check for k in ["สูญเสีย", "ความทุกข์", "ชะตากรรม"]):
            return "grief_loss"
        return "clarity_control"

    scores = {}
    for cat_id, cat_info in MOOD_CATEGORIES.items():
        score = 0
        for kw in cat_info["keywords"]:
            if kw in title_th:
                score += 3
            if kw in title_en.lower():
                score += 3
            if kw in quote:
                score += 2
            score += text_to_check.count(kw)
        scores[cat_id] = score

    best_cat = max(scores, key=scores.get)
    if scores[best_cat] > 0:
        return best_cat
    
    # Default fallbacks based on month discipline
    if month_num in [1, 2, 3, 4]:
        return "clarity_control"
    elif month_num in [5, 6, 7, 8]:
        return "duty_purpose"
    else:
        return "mortality_time"

def parse_entries():
    files = sorted(glob.glob(os.path.join(TRANS_DIR, "[0-1][0-9]_*.md")))
    # exclude 00_Introduction
    month_files = [f for f in files if not os.path.basename(f).startswith("00_")]
    
    entry_pattern = re.compile(
        r'###\s+(\d+)\s+([^:]+):\s+(.+?)\s+\((.*)\)\s*\n\n((?:>.*\n)+)\n([\s\S]*?)(?=\n---\n|\n###|\Z)'
    )
    
    all_days = []
    global_id = 1

    for idx, fpath in enumerate(month_files):
        meta = MONTH_METADATA[idx]
        with open(fpath, "r", encoding="utf-8") as fp:
            content = fp.read()
            
        matches = list(entry_pattern.finditer(content))
        print(f"Parsing {os.path.basename(fpath)}: {len(matches)} days (Expected {meta['days']})")
        
        for m in matches:
            day_of_month = int(m.group(1))
            date_month_str = m.group(2).strip()
            title_th = m.group(3).strip()
            title_en = m.group(4).strip()
            quote_raw = m.group(5).strip()
            body_raw = m.group(6).strip()
            
            # Parse quote block
            lines = [l.lstrip('> ').strip() for l in quote_raw.splitlines() if l.strip()]
            citation_line = lines[-1] if lines else ""
            quote_lines = lines[:-1] if len(lines) > 1 else lines
            
            quote_text = " ".join(quote_lines)
            # Remove leading/trailing markdown bold/quotes
            quote_text = re.sub(r'^\*{0,2}["“”]?', '', quote_text)
            quote_text = re.sub(r'["“”]?\*{0,2}$', '', quote_text).strip()
            
            # Parse author & source from citation_line
            # e.g.: — เอพิกเตตุส (Epictetus), *Discourses*, 2.5.4–5
            citation_clean = re.sub(r'^[—–-]\s*', '', citation_line).strip()
            author_parts = citation_clean.split(',', 1)
            author = re.sub(r'\*+', '', author_parts[0]).strip()
            source = re.sub(r'\*+', '', author_parts[1]).strip() if len(author_parts) > 1 else ""
            
            # Clean author short name (e.g. Epictetus, Seneca, Marcus Aurelius)
            en_match = re.search(r'\(([^)]+)\)', author)
            author_en = en_match.group(1).strip() if en_match else author
            
            # Parse paragraphs
            paragraphs = [p.strip() for p in body_raw.split("\n\n") if p.strip()]
            
            # Mood category & tags
            mood = determine_mood_category(title_th, title_en, quote_text, paragraphs, meta["num"])
            
            tags = [
                meta["theme_en"].lower(),
                meta["discipline_en"].lower().replace("the discipline of ", ""),
                author_en.lower()
            ]
            if mood not in tags:
                tags.append(mood)
                
            day_entry = {
                "id": global_id,
                "dayStep": global_id,
                "dayOfMonth": day_of_month,
                "monthNumber": meta["num"],
                "dateLabel": f"{day_of_month} {meta['name_th']}",
                "monthNameTh": meta["name_th"],
                "monthNameEn": meta["name_en"],
                "monthThemeTh": meta["theme_th"],
                "monthThemeEn": meta["theme_en"],
                "partNumber": meta["part"],
                "disciplineTh": meta["discipline_th"],
                "disciplineEn": meta["discipline_en"],
                "titleTh": title_th,
                "titleEn": title_en,
                "quote": quote_text,
                "author": author,
                "authorEn": author_en,
                "source": source,
                "paragraphs": paragraphs,
                "moodCategory": mood,
                "tags": tags
            }
            
            all_days.append(day_entry)
            global_id += 1
            
    print(f"\nTotal days extracted: {len(all_days)}")
    assert len(all_days) == 366, f"Expected exactly 366 days, got {len(all_days)}"
    
    # Save daily_stoic.json
    out_file = os.path.join(OUTPUT_DIR, "daily_stoic.json")
    with open(out_file, "w", encoding="utf-8") as fp:
        json.dump(all_days, fp, ensure_ascii=False, indent=2)
    print(f"Saved: {out_file} ({os.path.getsize(out_file):,} bytes)")
    
    # Also parse Intro & Glossary
    parse_intro_and_glossary()

def parse_intro_and_glossary():
    intro_path = os.path.join(TRANS_DIR, "00_Introduction.md")
    glossary_path = os.path.join(TRANS_DIR, "99_Glossary_and_Summary.md")
    
    intro_content = ""
    if os.path.exists(intro_path):
        with open(intro_path, "r", encoding="utf-8") as fp:
            intro_content = fp.read()
            
    glossary_content = ""
    if os.path.exists(glossary_path):
        with open(glossary_path, "r", encoding="utf-8") as fp:
            glossary_content = fp.read()
            
    meta_info = {
        "bookTitleTh": "The Daily Stoic: 366 วันแห่งปัญญาและการใช้ชีวิต",
        "bookTitleEn": "The Daily Stoic: 366 Meditations on Wisdom, Perseverance, and the Art of Living",
        "authors": "Ryan Holiday & Stephen Hanselman",
        "totalDays": 366,
        "moodCategories": MOOD_CATEGORIES,
        "months": MONTH_METADATA,
        "introduction": intro_content,
        "glossary": glossary_content
    }
    
    meta_file = os.path.join(OUTPUT_DIR, "book_meta.json")
    with open(meta_file, "w", encoding="utf-8") as fp:
        json.dump(meta_info, fp, ensure_ascii=False, indent=2)
    print(f"Saved: {meta_file} ({os.path.getsize(meta_file):,} bytes)")

if __name__ == "__main__":
    parse_entries()
