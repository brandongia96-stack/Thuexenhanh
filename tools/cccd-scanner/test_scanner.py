# -*- coding: utf-8 -*-
"""
Script kiểm tra toàn diện chức năng Quét CCCD và Xuất Excel
"""

import os
import sys
from pathlib import Path

# Fix Windows console UTF-8 output
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from PIL import Image, ImageDraw, ImageFont
import qrcode
import pandas as pd
import openpyxl

# Import scanner_core
import scanner_core

CURRENT_DIR = Path(__file__).resolve().parent
SAMPLE_DIR = CURRENT_DIR / "anh_cccd_dau_vao"
SAMPLE_DIR.mkdir(parents=True, exist_ok=True)


def create_mock_cccd_image(qr_payload: str, filename: str, full_name: str, cccd_num: str):
    """Tạo ảnh mô phỏng thẻ CCCD với mã QR chuẩn Bộ Công An ở góc trên bên phải."""
    # Kích thước thẻ chuẩn tỷ lệ CCCD (85.6mm x 53.98mm ~ 856 x 540 px)
    width, height = 856, 540
    img = Image.new("RGB", (width, height), color=(240, 245, 250))
    draw = ImageDraw.Draw(img)

    # Vẽ khung thẻ
    draw.rectangle([10, 10, width - 10, height - 10], outline=(70, 130, 180), width=4)

    # Tiêu đề Quốc hiệu
    draw.text((150, 40), "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", fill=(0, 0, 0))
    draw.text((220, 65), "Độc lập - Tự do - Hạnh phúc", fill=(0, 0, 0))
    draw.text((230, 110), "CĂN CƯỚC CÔNG DÂN", fill=(180, 0, 0))

    # Thông tin công dân
    draw.text((60, 180), f"Số / No.: {cccd_num}", fill=(0, 0, 120))
    draw.text((60, 230), f"Họ và tên / Full name: {full_name}", fill=(0, 0, 0))
    draw.text((60, 280), "Ngày sinh / Date of birth: 15/05/1992", fill=(0, 0, 0))
    draw.text((60, 330), "Giới tính / Sex: Nam    Quốc tịch / Nationality: Việt Nam", fill=(0, 0, 0))
    draw.text((60, 380), "Quê quán: Hà Nội", fill=(0, 0, 0))
    draw.text((60, 430), "Nơi thường trú: Ba Đình, Hà Nội", fill=(0, 0, 0))

    # Tạo mã QR chuẩn
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=4,
        border=2,
    )
    qr.add_data(qr_payload.encode('utf-8'))
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")

    # Dán QR Code vào góc trên bên phải (vị trí chuẩn của thẻ CCCD)
    qr_rgb = qr_img.convert("RGB")
    qr_w, qr_h = qr_rgb.size
    box = (width - qr_w - 40, 40, width - 40, 40 + qr_h)
    img.paste(qr_rgb, box)

    save_path = SAMPLE_DIR / filename
    img.save(save_path)
    return str(save_path)


def test_pipeline():
    print(">>> 1. Đang tạo ảnh CCCD mẫu mô phỏng để test...")
    
    sample1_payload = "001092012345||NGUYỄN VĂN AN|15051992|Nam|Số 123 Đường Kim Mã, Phường Kim Mã, Ba Đình, Hà Nội|10052021"
    sample2_payload = "038095098765|168345678|TRẦN THỊ BÍCH|20111995|Nữ|Thôn 1, Xã An Đồng, Huyện An Dương, Hải Phòng|15082021"

    img1_path = create_mock_cccd_image(sample1_payload, "cccd_mau_1.png", "NGUYỄN VĂN AN", "001092012345")
    img2_path = create_mock_cccd_image(sample2_payload, "cccd_mau_2.png", "TRẦN THỊ BÍCH", "038095098765")
    
    print(f"    - Đã tạo: {img1_path}")
    print(f"    - Đã tạo: {img2_path}")

    print("\n>>> 2. Đang tiến hành quét tự động qua scanner_core...")
    res1 = scanner_core.scan_single_image(img1_path, "cccd_mau_1.png")
    res2 = scanner_core.scan_single_image(img2_path, "cccd_mau_2.png")

    print("\n[Kết quả CCCD 1]:")
    for k, v in res1.items():
        if k != "raw_qr":
            print(f"  - {k}: {v}")

    print("\n[Kết quả CCCD 2]:")
    for k, v in res2.items():
        if k != "raw_qr":
            print(f"  - {k}: {v}")

    # Kiểm tra tính chính xác
    assert res1["so_cccd"] == "001092012345", f"Lỗi số CCCD 1: {res1['so_cccd']}"
    assert res1["ho_va_ten"] == "NGUYỄN VĂN AN", f"Lỗi họ tên 1: {res1['ho_va_ten']}"
    assert res1["ngay_sinh"] == "15/05/1992", f"Lỗi ngày sinh 1: {res1['ngay_sinh']}"
    assert res1["gioi_tinh"] == "Nam", f"Lỗi giới tính 1: {res1['gioi_tinh']}"

    assert res2["so_cccd"] == "038095098765", f"Lỗi số CCCD 2: {res2['so_cccd']}"
    assert res2["so_cmnd_cu"] == "168345678", f"Lỗi CMND cũ 2: {res2['so_cmnd_cu']}"
    assert res2["ho_va_ten"] == "TRẦN THỊ BÍCH", f"Lỗi họ tên 2: {res2['ho_va_ten']}"
    assert res2["ngay_sinh"] == "20/11/1995", f"Lỗi ngày sinh 2: {res2['ngay_sinh']}"
    assert res2["gioi_tinh"] == "Nữ", f"Lỗi giới tính 2: {res2['gioi_tinh']}"

    print("\n>>> 3. Đang xuất file Excel thử nghiệm...")
    out_dir = CURRENT_DIR / "ket_qua_xuat_excel"
    out_dir.mkdir(parents=True, exist_ok=True)
    excel_path = out_dir / "Test_Ket_Qua_CCCD.xlsx"
    scanner_core.export_to_excel([res1, res2], str(excel_path))
    print(f"    - File Excel đã được tạo thành công tại: {excel_path}")

    # Đọc lại kiểm tra nội dung file Excel
    df = pd.read_excel(excel_path, skiprows=3)
    print("\n>>> 4. Đọc lại nội dung Excel:")
    print(df[["STT", "Số CCCD", "Họ và Tên", "Ngày Sinh", "Giới Tính", "Nơi Thường Trú"]])

    print("\n" + "=" * 60)
    print(">>> KIỂM TRA THÀNH CÔNG 100%! TOOL HOẠT ĐỘNG HOÀN HẢO!")
    print("=" * 60)


if __name__ == "__main__":
    test_pipeline()
