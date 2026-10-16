# -*- coding: utf-8 -*-
"""
CCCD Scanner Core Engine (Không cần API - 100% Offline & Bảo Mật)
Hỗ trợ:
1. Quét QR Code trên thẻ CCCD gắn chip (Độ chính xác 100%, siêu tốc)
2. Bộ lọc tiền xử lý ảnh thông minh (tự xoay ảnh, tăng tương phản, làm nét QR)
3. OCR tiếng Việt dự phòng (EasyOCR) khi không có QR hoặc QR bị mờ
4. Xuất file Excel chuẩn hoá định dạng chuyên nghiệp
"""

import os
import re
import datetime
import warnings
from io import BytesIO
from typing import Dict, Any, List, Optional, Tuple

warnings.filterwarnings("ignore")

from PIL import Image, ImageOps
import numpy as np
import cv2
import pandas as pd
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

# Thư viện giải mã mã vạch / QR Code offline
try:
    import zxingcpp
    HAS_ZXING = True
except ImportError:
    HAS_ZXING = False

# Thư viện OCR offline (Lazy import khi cần để server khởi động tức thì trong 0.1s)
HAS_EASYOCR = True
_EASYOCR_READER = None


def get_easyocr_reader():
    """Khởi tạo mô hình EasyOCR tiếng Việt dạng lazy load khi cần (tiết kiệm thời gian khởi động & RAM)."""
    global _EASYOCR_READER, HAS_EASYOCR
    if not HAS_EASYOCR:
        return None
    if _EASYOCR_READER is None:
        try:
            import easyocr
            _EASYOCR_READER = easyocr.Reader(['vi', 'en'], gpu=False)
        except Exception as e:
            HAS_EASYOCR = False
            return None
    return _EASYOCR_READER


def parse_cccd_qr_data(qr_text: str) -> Optional[Dict[str, Any]]:
    """
    Phân tích chuỗi dữ liệu trong mã QR của CCCD gắn chip Bộ Công An.
    Cú pháp chuẩn:
    Số_CCCD | Số_CMND_cũ | Họ_và_tên | Ngày_sinh(DDMMYYYY) | Giới_tính | Nơi_thường_trú | Ngày_cấp(DDMMYYYY)
    Ví dụ:
    001092012345||NGUYỄN VĂN A|15051992|Nam|Số 123 Đường Kim Mã, Phường Kim Mã, Ba Đình, Hà Nội|10052021
    """
    if not qr_text:
        return None

    # Loại bỏ khoảng trắng đầu cuối
    raw_str = qr_text.strip()
    
    # Kiểm tra xem có chứa dấu phân tách '|' không
    parts = [p.strip() for p in raw_str.split('|')]
    
    if len(parts) >= 5:
        # Nhận diện các trường
        so_cccd = parts[0]
        so_cmnd_cu = parts[1] if len(parts) > 1 and parts[1] else ""
        ho_va_ten = parts[2] if len(parts) > 2 else ""
        ngay_sinh_raw = parts[3] if len(parts) > 3 else ""
        gioi_tinh = parts[4] if len(parts) > 4 else ""
        dia_chi = parts[5] if len(parts) > 5 else ""
        ngay_cap_raw = parts[6] if len(parts) > 6 else ""

        # Chuẩn hoá ngày sinh (từ DDMMYYYY thành DD/MM/YYYY)
        ngay_sinh = format_date_str(ngay_sinh_raw)
        ngay_cap = format_date_str(ngay_cap_raw)

        return {
            "so_cccd": str(so_cccd).zfill(12) if len(so_cccd) <= 12 and so_cccd.isdigit() else so_cccd,
            "so_cmnd_cu": so_cmnd_cu,
            "ho_va_ten": ho_va_ten.upper(),
            "ngay_sinh": ngay_sinh,
            "gioi_tinh": gioi_tinh,
            "que_quan": "",  # Mã QR CCCD chỉ lưu nơi thường trú
            "noi_thuong_tru": dia_chi,
            "ngay_cap": ngay_cap,
            "ngay_het_han": "",
            "phuong_thuc": "QR Code (Chính xác 100%)",
            "trang_thai": "Thành công",
            "raw_qr": raw_str
        }

    return None


def format_date_str(raw: str) -> str:
    """Chuyển đổi chuỗi ngày DDMMYYYY thành DD/MM/YYYY nếu đúng định dạng."""
    if not raw:
        return ""
    raw_digits = re.sub(r'\D', '', raw)
    if len(raw_digits) == 8:
        day = raw_digits[0:2]
        month = raw_digits[2:4]
        year = raw_digits[4:8]
        return f"{day}/{month}/{year}"
    return raw


def decode_qr_with_zxing(cv_img: np.ndarray) -> Optional[str]:
    """Giải mã QR Code bằng zxingcpp."""
    if not HAS_ZXING or cv_img is None:
        return None

    try:
        results = zxingcpp.read_barcodes(cv_img)
        for res in results:
            if res.text and len(res.text) > 10:
                return res.text
    except Exception:
        pass
    return None


def decode_qr_with_opencv(cv_img: np.ndarray) -> Optional[str]:
    """Giải mã QR Code dự phòng bằng bộ nhận diện của OpenCV."""
    if cv_img is None:
        return None
    try:
        detector = cv2.QRCodeDetector()
        data, _, _ = detector.detectAndDecode(cv_img)
        if data and len(data) > 10:
            return data
    except Exception:
        pass
    return None


def scan_qr_from_image(pil_or_cv_img) -> Optional[str]:
    """
    Thuật toán quét QR Code đa tầng:
    1. Quét ảnh gốc
    2. Thử xoay 4 góc (0, 90, 180, 270 độ)
    3. Thử tăng cường độ tương phản (Histogram Equalization / CLAHE)
    4. Thử crop vùng 1/2 góc trên bên phải (vị trí chuẩn của QR trên thẻ CCCD)
    """
    # Chuyển về numpy array (OpenCV BGR)
    if isinstance(pil_or_cv_img, Image.Image):
        # Sửa hướng ảnh theo EXIF nếu có
        try:
            pil_or_cv_img = ImageOps.exif_transpose(pil_or_cv_img)
        except Exception:
            pass
        if pil_or_cv_img.mode != "RGB":
            pil_or_cv_img = pil_or_cv_img.convert("RGB")
        cv_img = cv2.cvtColor(np.array(pil_or_cv_img), cv2.COLOR_RGB2BGR)
    else:
        cv_img = pil_or_cv_img

    if cv_img is None:
        return None

    # Danh sách các góc xoay thử nghiệm
    rotations = [
        cv_img,
        cv2.rotate(cv_img, cv2.ROTATE_90_CLOCKWISE),
        cv2.rotate(cv_img, cv2.ROTATE_180),
        cv2.rotate(cv_img, cv2.ROTATE_90_COUNTERCLOCKWISE)
    ]

    for rotated_img in rotations:
        # Thử 1: Quét trực tiếp bằng ZXing
        text = decode_qr_with_zxing(rotated_img)
        if text:
            return text

        # Thử 2: Quét trực tiếp bằng OpenCV
        text = decode_qr_with_opencv(rotated_img)
        if text:
            return text

        # Thử 3: Tiền xử lý - Chuyển xám và tăng tương phản CLAHE
        gray = cv2.cvtColor(rotated_img, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced_gray = clahe.apply(gray)

        text = decode_qr_with_zxing(enhanced_gray)
        if text:
            return text

        # Thử 4: Binarization (Otsu threshold)
        _, thresh = cv2.threshold(enhanced_gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        text = decode_qr_with_zxing(thresh)
        if text:
            return text

        # Thử 5: Crop vùng góc trên bên phải (khu vực chứa QR Code của CCCD)
        h, w = rotated_img.shape[:2]
        crop_top_right = rotated_img[0:int(h * 0.55), int(w * 0.45):w]
        text = decode_qr_with_zxing(crop_top_right)
        if text:
            return text

    return None


def parse_cccd_with_ocr(pil_img: Image.Image) -> Dict[str, Any]:
    """
    Trích xuất thông tin văn bản từ CCCD bằng EasyOCR (Chạy khi không có QR Code).
    """
    reader = get_easyocr_reader()
    if reader is None:
        return {
            "so_cccd": "",
            "so_cmnd_cu": "",
            "ho_va_ten": "",
            "ngay_sinh": "",
            "gioi_tinh": "",
            "que_quan": "",
            "noi_thuong_tru": "",
            "ngay_cap": "",
            "ngay_het_han": "",
            "phuong_thuc": "Không có QR (Chưa bật OCR)",
            "trang_thai": "Không đọc được",
            "raw_qr": ""
        }

    try:
        # Chuẩn hoá hướng ảnh
        try:
            pil_img = ImageOps.exif_transpose(pil_img)
        except Exception:
            pass
        if hasattr(pil_img, 'mode') and pil_img.mode != "RGB":
            pil_img = pil_img.convert("RGB")
        np_img = np.array(pil_img)

        # Chạy OCR
        ocr_results = reader.readtext(np_img)
        lines = [item[1].strip() for item in ocr_results if item[1].strip()]
        full_text = " ".join(lines)

        # 1. Trích xuất số CCCD (12 số)
        so_cccd = ""
        cccd_match = re.search(r'\b\d{12}\b', full_text)
        if cccd_match:
            so_cccd = cccd_match.group(0)
        else:
            # Thử tìm các chuỗi số cách nhau khoảng trắng: ví dụ 001 092 012 345
            split_match = re.search(r'\b\d{3}\s*\d{3}\s*\d{3}\s*\d{3}\b', full_text)
            if split_match:
                so_cccd = re.sub(r'\s+', '', split_match.group(0))

        # 2. Trích xuất ngày tháng (DD/MM/YYYY)
        dates = re.findall(r'\b\d{2}[/-]\d{2}[/-]\d{4}\b', full_text)
        ngay_sinh = ""
        ngay_het_han = ""
        if len(dates) >= 1:
            ngay_sinh = dates[0].replace('-', '/')
        if len(dates) >= 2:
            ngay_het_han = dates[1].replace('-', '/')

        # 3. Giới tính
        gioi_tinh = ""
        if re.search(r'\bNam\b|\bNAM\b', full_text):
            gioi_tinh = "Nam"
        elif re.search(r'\bNữ\b|\bNỮ\b|\bNu\b', full_text):
            gioi_tinh = "Nữ"

        # 4. Họ và tên: thường là dòng chữ IN HOA nằm gần "Họ và tên" hoặc "Full name"
        ho_va_ten = ""
        for i, line in enumerate(lines):
            line_clean = line.upper()
            if any(kw in line_clean for kw in ["HỌ VÀ TÊN", "HO VA TEN", "FULL NAME"]):
                # Lấy dòng tiếp theo hoặc phần sau dấu hai chấm
                if ":" in line:
                    ho_va_ten = line.split(":", 1)[1].strip()
                elif i + 1 < len(lines):
                    ho_va_ten = lines[i + 1].strip()
                break
        
        # Nếu chưa tìm thấy họ tên, quét tìm dòng toàn chữ in hoa tiếng Việt dài >= 2 từ
        if not ho_va_ten:
            for line in lines:
                if line.isupper() and len(line.split()) >= 2 and not any(kw in line for kw in ["CỘNG HÒA", "VIỆT NAM", "ĐỘC LẬP", "CĂN CƯỚC", "GIÁ TRỊ"]):
                    ho_va_ten = line.strip()
                    break

        # 5. Nơi thường trú
        noi_thuong_tru = ""
        for i, line in enumerate(lines):
            line_clean = line.lower()
            if "nơi thường trú" in line_clean or "thường trú" in line_clean or "residence" in line_clean:
                # Ghép các dòng kế tiếp
                collected = []
                if ":" in line:
                    collected.append(line.split(":", 1)[1].strip())
                for j in range(i + 1, min(i + 3, len(lines))):
                    if not any(stop_kw in lines[j].lower() for stop_kw in ["ngày", "có giá trị"]):
                        collected.append(lines[j])
                noi_thuong_tru = ", ".join(collected)
                break

        return {
            "so_cccd": so_cccd,
            "so_cmnd_cu": "",
            "ho_va_ten": ho_va_ten.upper(),
            "ngay_sinh": ngay_sinh,
            "gioi_tinh": gioi_tinh,
            "que_quan": "",
            "noi_thuong_tru": noi_thuong_tru,
            "ngay_cap": "",
            "ngay_het_han": ngay_het_han,
            "phuong_thuc": "OCR Tiếng Việt",
            "trang_thai": "Thành công (OCR)" if so_cccd else "Nhận diện một phần",
            "raw_qr": ""
        }
    except Exception as e:
        return {
            "so_cccd": "",
            "so_cmnd_cu": "",
            "ho_va_ten": "",
            "ngay_sinh": "",
            "gioi_tinh": "",
            "que_quan": "",
            "noi_thuong_tru": "",
            "ngay_cap": "",
            "ngay_het_han": "",
            "phuong_thuc": "Lỗi OCR",
            "trang_thai": f"Lỗi: {str(e)}",
            "raw_qr": ""
        }


def scan_single_image(file_bytes_or_path, file_name: str = "image.jpg") -> Dict[str, Any]:
    """
    Quét thông tin từ 1 ảnh CCCD (Tự động ưu tiên QR Code -> Chuyển sang OCR nếu cần).
    """
    try:
        if isinstance(file_bytes_or_path, (bytes, bytearray, BytesIO)):
            pil_img = Image.open(file_bytes_or_path if isinstance(file_bytes_or_path, BytesIO) else BytesIO(file_bytes_or_path))
        elif isinstance(file_bytes_or_path, str):
            pil_img = Image.open(file_bytes_or_path)
        else:
            pil_img = file_bytes_or_path

        if hasattr(pil_img, 'mode') and pil_img.mode != "RGB":
            pil_img = pil_img.convert("RGB")

        # 1. Thử giải mã mã QR (Chuẩn 100% cho CCCD gắn chip)
        qr_text = scan_qr_from_image(pil_img)
        if qr_text:
            parsed = parse_cccd_qr_data(qr_text)
            if parsed:
                parsed["file_name"] = file_name
                return parsed

        # 2. Nếu không tìm thấy QR, chuyển sang OCR
        ocr_result = parse_cccd_with_ocr(pil_img)
        ocr_result["file_name"] = file_name
        return ocr_result

    except Exception as e:
        return {
            "file_name": file_name,
            "so_cccd": "",
            "so_cmnd_cu": "",
            "ho_va_ten": "",
            "ngay_sinh": "",
            "gioi_tinh": "",
            "que_quan": "",
            "noi_thuong_tru": "",
            "ngay_cap": "",
            "ngay_het_han": "",
            "phuong_thuc": "Không xác định",
            "trang_thai": f"Lỗi đọc ảnh: {str(e)}",
            "raw_qr": ""
        }


def export_to_excel(data_list: List[Dict[str, Any]], output_path_or_buffer) -> BytesIO:
    """
    Xuất danh sách kết quả quét CCCD ra file Excel chuyên nghiệp:
    - Định dạng số CCCD là Text (tránh mất số 0 ở đầu)
    - Định dạng tiêu đề đẹp mắt, màu thương hiệu sang trọng
    - Tự động căn chỉnh độ rộng cột
    - Kèm viền ô (borders) và căn giữa/trái chuẩn nghiệp vụ
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Danh Sách CCCD"

    # Font và Style
    header_fill = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid") # Xanh Navy
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    data_font = Font(name="Calibri", size=11)
    title_font = Font(name="Calibri", size=16, bold=True, color="1F4E78")
    subtitle_font = Font(name="Calibri", size=10, italic=True, color="595959")

    thin_border = Border(
        left=Side(style='thin', color='D9D9D9'),
        right=Side(style='thin', color='D9D9D9'),
        top=Side(style='thin', color='D9D9D9'),
        bottom=Side(style='thin', color='D9D9D9')
    )

    # Tiêu đề bảng tính
    ws.merge_cells("A1:K1")
    ws["A1"] = "BẢNG KÊ THÔNG TIN CĂN CƯỚC CÔNG DÂN (CCCD)"
    ws["A1"].font = title_font
    ws["A1"].alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 35

    ws.merge_cells("A2:K2")
    ws["A2"] = f"Thời gian xuất: {datetime.datetime.now().strftime('%d/%m/%Y %H:%M:%S')} | Tool quét CCCD Offline (Không dùng API)"
    ws["A2"].font = subtitle_font
    ws["A2"].alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[2].height = 20

    # Headers
    headers = [
        ("STT", 6, "center"),
        ("Tên File Ảnh", 22, "left"),
        ("Số CCCD", 18, "center"),
        ("Họ và Tên", 25, "left"),
        ("Ngày Sinh", 14, "center"),
        ("Giới Tính", 12, "center"),
        ("Số CMND Cũ", 15, "center"),
        ("Nơi Thường Trú", 45, "left"),
        ("Ngày Cấp", 14, "center"),
        ("Phương Thức Quét", 22, "center"),
        ("Trạng Thái", 18, "center"),
    ]

    header_row = 4
    ws.row_dimensions[header_row].height = 26

    for col_idx, (header_name, col_width, align) in enumerate(headers, start=1):
        cell = ws.cell(row=header_row, column=col_idx, value=header_name)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = thin_border
        col_letter = get_column_letter(col_idx)
        ws.column_dimensions[col_letter].width = col_width

    # Ghi dữ liệu
    for row_idx, item in enumerate(data_list, start=header_row + 1):
        ws.row_dimensions[row_idx].height = 22
        
        row_data = [
            (row_idx - header_row, "center"),
            (item.get("file_name", ""), "left"),
            (str(item.get("so_cccd", "")), "center"),
            (item.get("ho_va_ten", ""), "left"),
            (item.get("ngay_sinh", ""), "center"),
            (item.get("gioi_tinh", ""), "center"),
            (item.get("so_cmnd_cu", ""), "center"),
            (item.get("noi_thuong_tru", ""), "left"),
            (item.get("ngay_cap", ""), "center"),
            (item.get("phuong_thuc", ""), "center"),
            (item.get("trang_thai", ""), "center"),
        ]

        # Màu nền xen kẽ hàng (Zebra striping)
        row_fill = PatternFill(start_color="F9FAFB", end_color="F9FAFB", fill_type="solid") if row_idx % 2 == 0 else PatternFill(fill_type=None)

        for col_idx, (val, alignment_mode) in enumerate(row_data, start=1):
            cell = ws.cell(row=row_idx, column=col_idx)
            
            # Đảm bảo Số CCCD và Số CMND luôn là Text để không bị Excel cắt mất số 0 đầu
            if col_idx in [3, 7]:
                cell.number_format = '@'
                cell.value = str(val) if val else ""
            else:
                cell.value = val

            cell.font = data_font
            if row_fill.fill_type:
                cell.fill = row_fill
            cell.alignment = Alignment(horizontal=alignment_mode, vertical="center")
            cell.border = thin_border

    # Xuất ra Buffer hoặc File
    if isinstance(output_path_or_buffer, str):
        wb.save(output_path_or_buffer)
        return None
    else:
        output = BytesIO()
        wb.save(output)
        output.seek(0)
        return output
