# -*- coding: utf-8 -*-
"""
Chế độ quét hàng loạt từ thư mục (Folder Batch Scanner)
Người dùng chỉ cần bỏ toàn bộ ảnh CCCD vào thư mục 'anh_cccd_dau_vao'
rồi chạy file này, hệ thống sẽ tự động quét và xuất file Excel 'ket_qua_cccd.xlsx'
"""

import os
import sys
import glob
import time
import datetime
from pathlib import Path

# Thêm thư mục hiện tại vào sys.path
CURRENT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(CURRENT_DIR))

# Fix Windows console UTF-8 output
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import scanner_core

INPUT_DIR = CURRENT_DIR / "anh_cccd_dau_vao"
OUTPUT_DIR = CURRENT_DIR / "ket_qua_xuat_excel"


def main():
    print("=" * 65)
    print("   TOOL QUÉT CCCD HÀNG LOẠT XUẤT EXCEL (100% OFFLINE / NO API)")
    print("=" * 65)

    # Đảm bảo các thư mục tồn tại
    INPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Tìm các file ảnh hợp lệ
    supported_extensions = ["*.jpg", "*.jpeg", "*.png", "*.webp", "*.bmp", "*.JPG", "*.JPEG", "*.PNG"]
    image_files = []
    for ext in supported_extensions:
        image_files.extend(list(INPUT_DIR.glob(ext)))

    if not image_files:
        print(f"\n[!] Thư mục '{INPUT_DIR.name}' đang trống!")
        print(f"--> Vui lòng copy các file ảnh CCCD vào thư mục:")
        print(f"    {INPUT_DIR.resolve()}")
        print("\nSau đó chạy lại chương trình này.")
        input("\nNhấn Enter để thoát...")
        return

    print(f"\n[+] Tìm thấy {len(image_files)} ảnh trong thư mục '{INPUT_DIR.name}'. Bắt đầu xử lý...")
    start_time = time.time()
    results = []

    for idx, img_path in enumerate(image_files, start=1):
        file_name = img_path.name
        print(f"[{idx}/{len(image_files)}] Đang quét: {file_name}...", end="", flush=True)
        
        try:
            res = scanner_core.scan_single_image(str(img_path), file_name=file_name)
            results.append(res)
            so_cccd = res.get("so_cccd", "")
            ho_ten = res.get("ho_va_ten", "")
            phuong_thuc = res.get("phuong_thuc", "")
            
            if so_cccd:
                print(f"  --> [OK] {so_cccd} | {ho_ten} ({phuong_thuc})")
            else:
                print(f"  --> [!] Không trích xuất được số CCCD ({res.get('trang_thai')})")
        except Exception as e:
            print(f"  --> [LỖI] {e}")

    # Xuất ra file Excel
    time_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    excel_path = OUTPUT_DIR / f"Danh_Sach_CCCD_{time_str}.xlsx"
    
    print("\n[+] Đang tạo và định dạng file Excel...")
    scanner_core.export_to_excel(results, str(excel_path))
    
    total_time = round(time.time() - start_time, 2)
    success_count = sum(1 for r in results if r.get("so_cccd"))

    print("\n" + "=" * 65)
    print("                     KẾT QUẢ TỔNG KẾT")
    print("=" * 65)
    print(f"- Tổng số file ảnh:        {len(image_files)}")
    print(f"- Số CCCD quét thành công: {success_count} / {len(image_files)}")
    print(f"- Thời gian xử lý:         {total_time} giây")
    print(f"- File Excel đã lưu tại:   {excel_path.resolve()}")
    print("=" * 65)
    
    # Mở file Excel nếu người dùng muốn
    try:
        os.startfile(str(excel_path))
        print("[+] Đã tự động mở file Excel cho bạn.")
    except Exception:
        pass

    input("\nNhấn Enter để kết thúc...")


if __name__ == "__main__":
    main()
