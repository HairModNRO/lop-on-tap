"""Cat font Material Icons xuong dung nhung bieu tuong client dung.

Font day du cua Flutter la 1,6 MB — nhieu gap sau muoi lan ca ung dung. Cat
xuong thi con vai kilobyte, va van la DUNG font ma ban Flutter ve, nen bieu
tuong giong het chu khong phai giong giong.

Ten trong Flutter -> ten trong file codepoints:
  Icons.chevron_right        -> chevron_right_baseline
  Icons.menu_book_outlined   -> menu_book_outlined
"""

import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

FLUTTER = Path("D:/flutter/bin/cache/artifacts/material_fonts")
RA = Path("D:/WebCrawler/web-client/vendor/icon")

TEN = """
block check check_circle_outline chevron_right clear close cloud_off_outlined
copy download_outlined error_outline filter_alt filter_alt_off history
hourglass_empty inbox_outlined info_outline install_desktop ios_share
leaderboard_outlined logout menu_book_outlined open_in_browser open_in_new
picture_as_pdf_outlined play_circle_outline quiz_outlined refresh search
shuffle smart_display_outlined visibility visibility_off
arrow_back vpn_key article_outlined grid_view_outlined description_outlined
""".split()

ma = {}
for dong in (FLUTTER / "codepoints").read_text(encoding="utf-8").splitlines():
    if not dong.strip():
        continue
    ten, hex_ = dong.rsplit(" ", 1)
    ma[ten] = hex_

thieu = []
chon = {}
for t in TEN:
    # Ten khong co hau to kieu dang thi Flutter dung ban "baseline".
    for thu in (t, t + "_baseline", t + "_outlined", t + "_rounded"):
        if thu in ma:
            chon[t] = ma[thu]
            break
    else:
        thieu.append(t)

if thieu:
    print("KHONG THAY:", " ".join(thieu))

RA.mkdir(parents=True, exist_ok=True)
diem = ",".join("U+" + c for c in sorted(set(chon.values())))

subprocess.run([
    sys.executable, "-m", "fontTools.subset",
    str(FLUTTER / "materialicons-regular.otf"),
    "--unicodes=" + diem,
    "--flavor=woff2",
    "--output-file=" + str(RA / "icon.woff2"),
    "--no-hinting",
    "--desubroutinize",
], check=True)

# Bang tra ten -> ky tu.
#
# Dung String.fromCodePoint chu khong dung chuoi thoat \\u: Material co nhung
# ma nam tren U+FFFF — install_desktop la U+F0521 — va "\\uf0521" trong
# JavaScript doc thanh "\\uf052" roi ky tu "1", nen man hinh hien ra mot con so
# 1 ben canh chu. Da xay ra that.
js = [
    "// Sinh boi scratchpad/cat-font-icon.py. Dung sua tay.",
    "//",
    "// fromCodePoint chu khong phai chuoi thoat: vai ma Material nam tren",
    "// U+FFFF, va '\\uXXXXX' trong JavaScript la bon chu so cong mot ky tu thua.",
    "export const ICON = {",
]
for t in sorted(chon):
    js.append(f"  '{t.replace('_outlined', '')}': String.fromCodePoint(0x{chon[t]}),")
js.append("};")
(RA / "icon.js").write_text("\n".join(js) + "\n", encoding="utf-8")

kb = (RA / "icon.woff2").stat().st_size / 1024
tren = [t for t in chon if len(chon[t]) > 4]
print(f"{len(chon)} bieu tuong -> icon.woff2 {kb:.1f} KB (goc 1607 KB)")
print(f"ma tren U+FFFF: {len(tren)} ({' '.join(sorted(tren))})")
