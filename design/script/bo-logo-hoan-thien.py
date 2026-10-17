# bo-logo-hoan-thien.py — Bước 2 sau bo-logo-xuat.jsx (luồng 15 Designer).
# Illustrator 2022 không xuất được ICO / WebP → dùng Pillow (đã có sẵn trên máy):
#   favicon.ico gồm đúng 3 bản vẽ riêng 16/32/48 (không co từ ảnh lớn), logo.webp không mất nét, nén lại PNG.
# Chạy: python design/script/bo-logo-hoan-thien.py
import os
from PIL import Image

THU_MUC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'xuat', 'bo-logo')


def duong_dan(ten):
    return os.path.join(THU_MUC, ten)


# 1. favicon.ico
anh = [Image.open(duong_dan('favicon-%d.png' % c)).convert('RGBA') for c in (48, 32, 16)]
anh[0].save(duong_dan('favicon.ico'), format='ICO', sizes=[(48, 48), (32, 32), (16, 16)], append_images=anh[1:])

# 2. logo.webp (đầu trang, nguồn 108×108)
Image.open(duong_dan('logo.png')).convert('RGBA').save(duong_dan('logo.webp'), 'WEBP', lossless=True, method=6)

# 3. Nén lại PNG (không mất dữ liệu)
for ten in os.listdir(THU_MUC):
    if ten.endswith('.png'):
        im = Image.open(duong_dan(ten))
        im.load()
        im.save(duong_dan(ten), optimize=True)

for ten in sorted(os.listdir(THU_MUC)):
    print('%-24s %7d B' % (ten, os.path.getsize(duong_dan(ten))))
