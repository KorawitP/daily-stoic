# -*- coding: utf-8 -*-
import os
import sys

from part3_header import get_header
from part3_ch1 import get_chapter_1
from part3_ch2 import get_chapter_2
from part3_ch3 import get_chapter_3
from part3_ch4 import get_chapter_4
from part3_ch5 import get_chapter_5
from part3_ch6 import get_chapter_6
from part3_ch7 import get_chapter_7
from part3_ch8 import get_chapter_8
from part3_ch9 import get_chapter_9
from part3_ch10 import get_chapter_10
from part3_ch11 import get_chapter_11
from part3_ch12 import get_chapter_12
from part3_summary import get_summary

OUTPUT_PATH = r"C:\Users\kokok\Downloads\book\translation_how_to_win_friends\03_Part_Three_Win_People_to_Your_Way_of_Thinking.md"

def build():
    parts = [
        get_header(),
        get_chapter_1(),
        get_chapter_2(),
        get_chapter_3(),
        get_chapter_4(),
        get_chapter_5(),
        get_chapter_6(),
        get_chapter_7(),
        get_chapter_8(),
        get_chapter_9(),
        get_chapter_10(),
        get_chapter_11(),
        get_chapter_12(),
        get_summary(),
    ]
    full_text = "\n".join(p.strip() for p in parts) + "\n"
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(full_text)
    
    print(f"Successfully generated {OUTPUT_PATH}")
    print(f"Total Chars: {len(full_text)}")
    print(f"Total Lines: {len(full_text.splitlines())}")
    print(f"File Size: {os.path.getsize(OUTPUT_PATH)} bytes")

if __name__ == "__main__":
    build()
