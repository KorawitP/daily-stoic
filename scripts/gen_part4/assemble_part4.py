# -*- coding: utf-8 -*-
import os
import sys

from part4_header import get_header
from part4_ch1 import get_chapter_1
from part4_ch2 import get_chapter_2
from part4_ch3 import get_chapter_3
from part4_ch4 import get_chapter_4
from part4_ch5 import get_chapter_5
from part4_ch6 import get_chapter_6
from part4_ch7 import get_chapter_7
from part4_ch8 import get_chapter_8
from part4_ch9 import get_chapter_9
from part4_summary import get_summary

OUTPUT_PATH = r"C:\Users\kokok\Downloads\book\translation_how_to_win_friends\04_Part_Four_Be_a_Leader.md"

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
