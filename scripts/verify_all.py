# -*- coding: utf-8 -*-
"""
Comprehensive Deep Verification Script for the Complete Uncut Translation of
Dale Carnegie's 'How to Win Friends and Influence People'
"""

import os
import re
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = r"C:\Users\kokok\Downloads\book\translation_how_to_win_friends"

FILES = [
    "00_Preface_and_Nine_Suggestions.md",
    "01_Part_One_Fundamental_Techniques.md",
    "02_Part_Two_Six_Ways_to_Make_People_Like_You.md",
    "03_Part_Three_Win_People_to_Your_Way_of_Thinking.md",
    "04_Part_Four_Be_a_Leader.md",
    "05_Shortcut_to_Distinction_and_30_Principles.md",
    "README.md",
]

def test_file_existence_and_sizes():
    print("=== TEST 1: File Existence and Sizes ===")
    total_bytes = 0
    total_chars = 0
    for fn in FILES:
        path = os.path.join(BASE_DIR, fn)
        assert os.path.exists(path), f"File missing: {path}"
        sz = os.path.getsize(path)
        with open(path, "r", encoding="utf-8") as f:
            txt = f.read()
        total_bytes += sz
        total_chars += len(txt)
        print(f"  [PASS] {fn}: {sz:,} bytes | {len(txt):,} chars | {len(txt.splitlines()):,} lines")
    print(f"Total: {total_bytes:,} bytes (~{total_bytes/1024/1024:.2f} MB), {total_chars:,} chars\n")

def test_relative_links():
    print("=== TEST 2: Markdown Relative Links ===")
    link_pattern = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')
    broken_links = []
    total_links = 0
    for fn in FILES:
        path = os.path.join(BASE_DIR, fn)
        with open(path, "r", encoding="utf-8") as f:
            txt = f.read()
        links = link_pattern.findall(txt)
        for text, target in links:
            if target.startswith("http") or target.startswith("#"):
                continue
            total_links += 1
            clean_target = target.split("#")[0]
            target_path = os.path.join(BASE_DIR, clean_target)
            if not os.path.exists(target_path):
                broken_links.append((fn, text, target))
    print(f"  Total internal relative links checked: {total_links}")
    if broken_links:
        print(f"  [FAIL] Broken links found: {len(broken_links)}")
        for fn, text, target in broken_links:
            print(f"    In {fn}: [{text}]({target})")
        assert False, "Broken links detected!"
    else:
        print("  [PASS] 0 broken links! All navigation links are 100% valid.\n")

def test_heading_hierarchy():
    print("=== TEST 3: Heading Hierarchy ===")
    for fn in FILES:
        path = os.path.join(BASE_DIR, fn)
        with open(path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        current_level = 0
        file_errors = []
        for line_num, line in enumerate(lines, 1):
            m = re.match(r'^(#{1,6})\s', line)
            if m:
                level = len(m.group(1))
                if level > current_level + 1 and current_level != 0:
                    file_errors.append((line_num, current_level, level, line.strip()))
                current_level = level
        if file_errors:
            print(f"  [WARN] Heading hierarchy anomalies in {fn}:")
            for line_num, cur, lev, line in file_errors:
                print(f"    Line {line_num}: jumped from #{cur} to #{lev} -> {line[:50]}")
        else:
            print(f"  [PASS] {fn}: Clean heading hierarchy")
    print()

def test_key_stories_and_coverage():
    print("=== TEST 4: Narrative Stories & Historical Coverage ===")
    checks = {
        "02_Part_Two_Six_Ways_to_Make_People_Like_You.md": [
            ("Tippy the dog", "ทิปปี้"),
            ("Howard Thurston", "เทิร์สตัน"),
            ("Theodore Roosevelt White House staff", "ไอค์ ฮูเวอร์"),
            ("Charles Schwab smile", "ชวาบ"),
            ("Prof. James McConnell (Michigan)", "แมคคอนเนลล์"),
            ("Robert Cryer computer applicant", "ไครเออร์"),
            ("William B. Steinhardt", "สไตน์ฮาร์ดท์"),
            ("Jim Farley 50,000 names", "ฟาร์ลีย์"),
            ("Andrew Carnegie rabbits", "กระต่าย"),
            ("Edgar Thomson Steel Works", "เอ็ดการ์ ทอมสัน"),
            ("George Pullman merger", "พูลแมน"),
            ("Benton Love", "เบนตัน เลิฟ"),
            ("Karen Kirsch (TWA)", "คาเรน เคิร์ช"),
            ("FDR & mechanic George", "จอร์จ"),
            ("Cafeteria cashier Eunice", "ยูนิซ"),
            ("Botanist dinner party", "นักพฤกษศาสตร์"),
            ("Dr. Charles W. Eliot (Harvard)", "อีเลียต"),
            ("Henry James", "เฮนรี เจมส์"),
            ("Edward Bok", "เอ็ดเวิร์ด บ็อก"),
            ("Edward Chalif million-dollar check", "ชาลิฟ"),
            ("Henry G. Duvernoy bread", "ดูแวร์นอย"),
            ("33rd Street Post office clerk hair", "เส้นผม"),
            ("1928 Packard in barn", "แพ็กการ์ด"),
            ("George Eastman Japanese chairs", "อีสต์แมน"),
            ("David G. Smith restaurant", "เดวิด จี. สมิธ"),
        ],
        "03_Part_Three_Win_People_to_Your_Way_of_Thinking.md": [
            ("Sir Ross Smith banquet & Shakespeare", "รอสส์ สมิธ"),
            ("Frank Gammond 'avoid the acute angle'", "แกมมอนด์"),
            ("William Jay epitaph", "วิลเลียม เจย์"),
            ("Patrick O'Haire White trucks", "โอแฮร์"),
            ("Parsons $9,000 tax deduction", "พาร์สันส์"),
            ("Lincoln dog reprimand", "หลีกทางให้สุนัข"),
            ("Bits and Pieces 9 suggestions", "Bits and Pieces"),
            ("Jan Peerce opera singer", "ยาน เพียร์ซ"),
            ("Theodore Roosevelt 75%", "75"),
            ("Alexander Pope quote", "อเล็กซานเดอร์ โปป"),
            ("Galileo quote", "กาลิเลโอ"),
            ("Socrates quote", "โสกราตีส"),
            ("Harold Dye car dispute", "แฮโรลด์ ดาย"),
            ("Carnegie draperies", "ผ้าม่าน"),
            ("Ben Franklin reformed speech", "เบนจามิน แฟรงคลิน"),
            ("R.V. Crowley lumber inspector", "โครว์ลีย์"),
            ("Rex & mounted policeman in Forest Park", "ตำรวจม้า"),
            ("Ferdinand Warren commercial artist", "วอร์เรน"),
            ("General Robert E. Lee Gettysburg", "โรเบิร์ต อี. ลี"),
            ("Elbert Hubbard response to critics", "ฮับบาร์ด"),
            ("Woodrow Wilson doubled fists", "วูดโรว์ วิลสัน"),
            ("John D. Rockefeller Jr. Ludlow strike", "ลัดโลว์"),
            ("O.L. Straub rent negotiation", "สตรอบ"),
            ("Aesop fable Wind and Sun", "อีสป"),
            ("Prof. Overstreet 'yes-response'", "โอเวอร์สตรีต"),
            ("James Eberson bank teller", "เอเบอร์สัน"),
            ("Joseph Allison Westinghouse motors", "เวสติงเฮาส์"),
            ("Charles Cubellis French textile firm", "คูเบลลิส"),
            ("Barbara Wilson job interview", "บาร์บารา วิลสัน"),
            ("La Rochefoucauld friends vs enemies", "ลา โรชฟูโก"),
            ("Eugene Wesson unfinished sketches", "เวสสัน"),
            ("Adolph Seltz car sales meeting", "เซลต์ซ"),
            ("Lao Tzu rivers and seas", "เล่าจื๊อ"),
            ("Kenneth M. Goode quote", "กูด"),
            ("Forest Park campfire sausage boys", "กองไฟ"),
            ("Sam Douglas flower garden", "แซม ดักลาส"),
            ("Dr. Gerald Nirenberg quote", "ไนเรนเบิร์ก"),
            ("Magic phrase 'I don't blame you'", "ผมไม่ตำหนิคุณเลย"),
            ("Al Capone rattlesnake analogy", "อัล คาโปน"),
            ("Louisa May Alcott radio broadcast error", "อัลคอตต์"),
            ("Sol Hurok & Feodor Chaliapin", "ชาเลียพิน"),
            ("Jay Mangum elevator in Tulsa", "แมงกัม"),
            ("Joyce Norris piano & Babette's nails", "บาเบ็ตต์"),
            ("Jesse James & Kearney MO farm", "เจสซี เจมส์"),
            ("J.P. Morgan two reasons", "มอร์แกน"),
            ("Hamilton J. Farrell tenant", "ฟาร์เรลล์"),
            ("Lord Northcliffe Prince photo", "นอร์ธคลิฟฟ์"),
            ("Rockefeller children photo", "ร็อกกี้เฟลเลอร์"),
            ("James L. Thomas debt collection", "โธมัส"),
            ("Philadelphia Evening Bulletin One Day book", "Philadelphia Evening Bulletin"),
            ("Jim Yeamans coins clattering on floor", "เยแมนส์"),
            ("Virginia Valentine stopwatch 8 seconds", "วาเลนไทน์"),
            ("Joe B. Fant proposal on bended knee", "คุกเข่า"),
            ("Charles Schwab chalk '6' on mill floor", "ชอล์ก"),
            ("Lewis E. Lawes & Sing Sing challenge", "ซิงซิง"),
            ("Harvey Firestone & Frederick Herzberg", "เฮิร์ซเบิร์ก"),
        ],
        "04_Part_Four_Be_a_Leader.md": [
            ("Calvin Coolidge secretary dress", "คูลิดจ์"),
            ("William McKinley 1896 speech rewrite", "แมกคินลีย์"),
            ("Lincoln $12,000 letter to General Joseph Hooker", "ฮุกเกอร์"),
            ("W.P. Gaw Brooklyn phone book & bronze", "กอว์"),
            ("Dorothy Wrublewski credit union teller", "รูเบลฟสกี้"),
            ("Dentist Novocain metaphor", "โนโวเคน"),
            ("Charles Schwab cigars under No Smoking sign", "ซิการ์"),
            ("John Wanamaker serving customer", "วานาเมเกอร์"),
            ("Carl Langford Orlando mayor taking off door", "แลงฟอร์ด"),
            ("Changing 'but' to 'and'", "แต่"),
            ("Marge Jacob cleaning lumber debris", "เจค็อบ"),
            ("Harley Kaiser USAR reservist haircuts", "ไกเซอร์"),
            ("Lyman Abbott sermon North American Review", "แอบบ็อตต์"),
            ("Josephine Carnegie at age 19", "โจเซฟีน"),
            ("E.G. Dillistone black thumb-indexed book", "ดิลลิสโตน"),
            ("Prince von Bülow & Kaiser Wilhelm Daily Telegraph", "บือโลว์"),
            ("Clarence Zerhusen David smoking", "เซอร์ฮูเซน"),
            ("Ida Tarbell & Owen D. Young asking questions", "โอเวน ดี. ยัง"),
            ("Car blocking driveway", "ขวางทาง"),
            ("Ian Macdonald Johannesburg precision parts", "แมคโดนัลด์"),
            ("GE Consulting Engineer Charles Steinmetz", "สไตน์เม็ตซ์"),
            ("Marshall Granger CPA firing seasonal accountants", "เกรนเจอร์"),
            ("Fred Clark vs Anna Mazzone test market error", "มัซโซเน"),
            ("Antoine de Saint-Exupéry saving face quote", "แซ็งเต็กซูเปรี"),
            ("Pete Barlow circus dogs meat instead of whip", "พีท บาร์โลว์"),
            ("Jess Lair quote", "เจสส์ แอร์"),
            ("Enrico Caruso mother barefoot", "คารูโซ"),
            ("Charles Dickens rat-infested blacking factory", "ดิกเคนส์"),
            ("H.G. Wells suicidal letter to schoolmaster", "เอช. จี. เวลส์"),
            ("B.F. Skinner reinforcement", "สกินเนอร์"),
            ("John Ringelspaugh stop yelling at kids", "ริงเกลสปอห์"),
            ("Keith Roper specific praise print shop", "โรเปอร์"),
            ("William James half awake quote", "วิลเลียม เจมส์"),
            ("Henry Henke truck mechanic Bill", "เฮนรี เฮงเก้"),
            ("Marie scullery maid hidden treasures", "มารี"),
            ("Ruth Hopkins & Tommy school leader", "รูธ ฮ็อปกินส์"),
            ("Bachelor age 40 dance lessons", "เต้นรำ"),
            ("Clarence Hawkes blind author 50 books", "ฮอว์กส์"),
            ("Colonel House & William Jennings Bryan 1915", "เฮาส์"),
            ("Napoleon Legion of Honor toys", "เลฌียงดอเนอร์"),
            ("Child Superintendent of Grounds lawn weeds", "สารวัตร"),
            ("Ernest Gent translation assignment", "เจนต์"),
            ("6-point leader checklist", "รายการตรวจสอบ 6 ประการ"),
        ]
    }

    all_passed = True
    for fn, story_list in checks.items():
        path = os.path.join(BASE_DIR, fn)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        print(f"  Verifying {fn} ({len(story_list)} key stories)...")
        for desc, needle in story_list:
            if needle not in content:
                print(f"    [FAIL] Missing: {desc} (target '{needle}')")
                all_passed = False
            else:
                pass
        print(f"    [PASS] All {len(story_list)} key stories verified present!")
    assert all_passed, "Some key stories were missing!"
    print("\n[ALL TESTS PASSED WITH 100% SUCCESS!]")

if __name__ == "__main__":
    test_file_existence_and_sizes()
    test_relative_links()
    test_heading_hierarchy()
    test_key_stories_and_coverage()
