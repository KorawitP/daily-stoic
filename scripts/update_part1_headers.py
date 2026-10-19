# -*- coding: utf-8 -*-
import os

target = r"C:\Users\kokok\Downloads\book\translation_how_to_win_friends\01_Part_One_Fundamental_Techniques.md"

with open(target, 'r', encoding='utf-8') as f:
    text = f.read()

# Top navigation
nav_top = (
    "[⬅️ กลับสู่หน้าสารบัญหลัก (README.md)](README.md) | "
    "[บทก่อนหน้า: บทนำและ 9 คำแนะนำ (00_Preface_and_Nine_Suggestions.md)](00_Preface_and_Nine_Suggestions.md) | "
    "[เข้าสู่ภาคที่ 2: หกวิธีที่จะทำให้ผู้คนชื่นชอบคุณ (02_Part_Two_Six_Ways_to_Make_People_Like_You.md) ➡️](02_Part_Two_Six_Ways_to_Make_People_Like_You.md)\n\n---\n\n"
)

# Chapter 1 replacement
old_ch1 = (
    "## บทที่ 1: \"ถ้าอยากเก็บน้ำผึ้ง อย่าเตะรังผึ้ง\"\n"
    "### (*\"If You Want to Gather Honey, Don't Kick Over the Beehive\"*)\n"
    "#### ภาคที่ 1 — กฎข้อที่ 1"
)
new_ch1 = (
    "## บทที่ 1: \"ถ้าอยากเก็บน้ำผึ้ง อย่าเตะรังผึ้ง\" (*\"If You Want to Gather Honey, Don't Kick Over the Beehive\"*)\n"
    "*ภาคที่ 1 — กฎข้อที่ 1: อย่าวิจารณ์ ตำหนิ หรือบ่น*"
)

# Chapter 2 replacement
old_ch2 = (
    "## บทที่ 2: ความลับอันยิ่งใหญ่ในการปฏิบัติต่อผู้คน\n"
    "### (*The Big Secret of Dealing with People*)\n"
    "#### ภาคที่ 1 — กฎข้อที่ 2"
)
new_ch2 = (
    "## บทที่ 2: ความลับอันยิ่งใหญ่ในการปฏิบัติต่อผู้คน (*The Big Secret of Dealing with People*)\n"
    "*ภาคที่ 1 — กฎข้อที่ 2: จงแสดงความชื่นชมอย่างจริงใจและตรงไปตรงมา*"
)

# Chapter 3 replacement
old_ch3 = (
    "## บทที่ 3: \"ผู้ที่ทำสิ่งนี้ได้ ย่อมมีคนทั้งโลกอยู่เคียงข้าง ผู้ที่ทำไม่ได้ ย่อมเดินบนเส้นทางอันโดดเดี่ยว\"\n"
    "### (*\"He Who Can Do This Has the Whole World with Him. He Who Cannot Walks a Lonely Way\"*)\n"
    "#### ภาคที่ 1 — กฎข้อที่ 3"
)
new_ch3 = (
    "## บทที่ 3: \"ผู้ที่ทำสิ่งนี้ได้ ย่อมมีคนทั้งโลกอยู่เคียงข้าง ผู้ที่ทำไม่ได้ ย่อมเดินบนเส้นทางอันโดดเดี่ยว\" (*\"He Who Can Do This Has the Whole World with Him. He Who Cannot Walks a Lonely Way\"*)\n"
    "*ภาคที่ 1 — กฎข้อที่ 3: จงปลุกเร้าความต้องการอย่างกระตือรือร้นในตัวอีกฝ่าย*"
)

nav_bottom = (
    "\n\n---\n\n"
    "[⬅️ กลับสู่หน้าสารบัญหลัก (README.md)](README.md) | "
    "[บทก่อนหน้า: บทนำและ 9 คำแนะนำ (00_Preface_and_Nine_Suggestions.md)](00_Preface_and_Nine_Suggestions.md) | "
    "[เข้าสู่ภาคที่ 2: หกวิธีที่จะทำให้ผู้คนชื่นชอบคุณ (02_Part_Two_Six_Ways_to_Make_People_Like_You.md) ➡️](02_Part_Two_Six_Ways_to_Make_People_Like_You.md)\n"
)

assert old_ch1 in text, "old_ch1 not found"
assert old_ch2 in text, "old_ch2 not found"
assert old_ch3 in text, "old_ch3 not found"

text = text.replace(old_ch1, new_ch1)
text = text.replace(old_ch2, new_ch2)
text = text.replace(old_ch3, new_ch3)

title_sep = "# ภาคที่ 1: เทคนิคพื้นฐานในการปฏิบัติต่อผู้อื่น (Fundamental Techniques in Handling People)\n\n---\n\n"
assert title_sep in text, "title separator not found"
text = text.replace(title_sep, title_sep + nav_top)

text = text.strip() + nav_bottom

with open(target, 'w', encoding='utf-8') as f:
    f.write(text.strip() + '\n')

print("Successfully updated 01_Part_One_Fundamental_Techniques.md with proper headers and navigation!")
