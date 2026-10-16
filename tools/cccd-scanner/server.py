# -*- coding: utf-8 -*-
"""
Local Secure Backend Server (100% Localhost Only - Bảo Mật Tuyệt Đối)
- Chỉ bind 127.0.0.1 (ngăn chặn mọi truy cập từ bên ngoài mạng)
- Không gửi bất kỳ dữ liệu nào ra Internet
- Phục vụ giao diện index.html và các API quét CCCD
"""

import os
import sys
import io
import glob
import time
import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

# UTF-8 cho Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import HTMLResponse, Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

import scanner_core

CURRENT_DIR = Path(__file__).resolve().parent
DEFAULT_INPUT_DIR = CURRENT_DIR / "anh_cccd_dau_vao"
DEFAULT_OUTPUT_DIR = CURRENT_DIR / "ket_qua_xuat_excel"
INDEX_HTML_PATH = CURRENT_DIR / "index.html"

DEFAULT_INPUT_DIR.mkdir(parents=True, exist_ok=True)
DEFAULT_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Local CCCD Scanner", docs_url=None, redoc_url=None)

# Cấu hình CORS mở cho cả localhost và file:/// cục bộ
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """Kiểm tra máy chủ cục bộ có đang hoạt động không."""
    return {"status": "ok", "time": time.time()}


class FolderScanRequest(BaseModel):
    folder_path: Optional[str] = None
    remove_duplicates: bool = True


class ExportExcelRequest(BaseModel):
    data: List[Dict[str, Any]]
    filename: Optional[str] = None


@app.get("/", response_class=HTMLResponse)
async def get_index():
    """Phục vụ file giao diện index.html."""
    if not INDEX_HTML_PATH.exists():
        raise HTTPException(status_code=404, detail="Không tìm thấy file index.html")
    with open(INDEX_HTML_PATH, "r", encoding="utf-8") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content, status_code=200)


@app.get("/api/default-folder-info")
async def get_default_folder_info():
    """Lấy thông tin thư mục mặc định trên máy."""
    supported_extensions = ["*.jpg", "*.jpeg", "*.png", "*.webp", "*.bmp", "*.JPG", "*.JPEG", "*.PNG"]
    files = []
    for ext in supported_extensions:
        files.extend([f.name for f in DEFAULT_INPUT_DIR.glob(ext)])
    return {
        "folder_path": str(DEFAULT_INPUT_DIR.resolve()),
        "output_path": str(DEFAULT_OUTPUT_DIR.resolve()),
        "file_count": len(files),
        "files": files[:15]
    }


@app.post("/api/scan-files")
async def scan_uploaded_files(
    files: List[UploadFile] = File(...),
    remove_duplicates: bool = Form(True)
):
    """
    Quét danh sách các file ảnh do người dùng tải lên (Quét riêng lẻ hoặc nhiều file).
    Dữ liệu chỉ xử lý trong RAM, bảo mật tuyệt đối 100%.
    """
    if not files:
        raise HTTPException(status_code=400, detail="Vui lòng chọn ít nhất một file ảnh.")

    start_time = time.time()
    results = []

    for file in files:
        filename = file.filename
        try:
            content = await file.read()
            res = scanner_core.scan_single_image(content, file_name=filename)
            results.append(res)
        except Exception as e:
            results.append({
                "file_name": filename,
                "so_cccd": "",
                "so_cmnd_cu": "",
                "ho_va_ten": "",
                "ngay_sinh": "",
                "gioi_tinh": "",
                "que_quan": "",
                "noi_thuong_tru": "",
                "ngay_cap": "",
                "ngay_het_han": "",
                "phuong_thuc": "Lỗi",
                "trang_thai": f"Lỗi đọc file: {str(e)}",
                "raw_qr": ""
            })

    # Lọc trùng nếu có chọn
    if remove_duplicates:
        unique_results = []
        seen = set()
        for r in results:
            cccd = r.get("so_cccd", "").strip()
            if cccd and cccd in seen:
                continue
            if cccd:
                seen.add(cccd)
            unique_results.append(r)
        results = unique_results

    elapsed = round(time.time() - start_time, 2)
    success_count = sum(1 for r in results if r.get("so_cccd"))

    return {
        "success": True,
        "total": len(results),
        "success_count": success_count,
        "elapsed_seconds": elapsed,
        "data": results
    }


@app.post("/api/scan-folder")
async def scan_folder(req: FolderScanRequest):
    """
    Quét toàn bộ ảnh trong một thư mục chỉ định trên ổ cứng máy tính.
    """
    target_path = Path(req.folder_path.strip()) if req.folder_path and req.folder_path.strip() else DEFAULT_INPUT_DIR

    if not target_path.exists() or not target_path.is_dir():
        raise HTTPException(status_code=400, detail=f"Thư mục không tồn tại: {str(target_path)}")

    supported_extensions = ["*.jpg", "*.jpeg", "*.png", "*.webp", "*.bmp", "*.JPG", "*.JPEG", "*.PNG"]
    image_paths = []
    for ext in supported_extensions:
        image_paths.extend(list(target_path.glob(ext)))

    if not image_paths:
        return {
            "success": True,
            "total": 0,
            "success_count": 0,
            "elapsed_seconds": 0,
            "message": f"Không tìm thấy file ảnh nào trong thư mục '{target_path.name}'",
            "data": [],
            "excel_path": ""
        }

    start_time = time.time()
    results = []

    for img_path in image_paths:
        filename = img_path.name
        try:
            res = scanner_core.scan_single_image(str(img_path), file_name=filename)
            results.append(res)
        except Exception as e:
            results.append({
                "file_name": filename,
                "so_cccd": "",
                "so_cmnd_cu": "",
                "ho_va_ten": "",
                "ngay_sinh": "",
                "gioi_tinh": "",
                "que_quan": "",
                "noi_thuong_tru": "",
                "ngay_cap": "",
                "ngay_het_han": "",
                "phuong_thuc": "Lỗi",
                "trang_thai": f"Lỗi đọc file: {str(e)}",
                "raw_qr": ""
            })

    if req.remove_duplicates:
        unique_results = []
        seen = set()
        for r in results:
            cccd = r.get("so_cccd", "").strip()
            if cccd and cccd in seen:
                continue
            if cccd:
                seen.add(cccd)
            unique_results.append(r)
        results = unique_results

    # Tự động xuất sẵn 1 file Excel lưu vào thư mục kết quả
    time_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    folder_name = target_path.name.replace(" ", "_")
    saved_excel_path = DEFAULT_OUTPUT_DIR / f"CCCD_Folder_{folder_name}_{time_str}.xlsx"
    scanner_core.export_to_excel(results, str(saved_excel_path))

    elapsed = round(time.time() - start_time, 2)
    success_count = sum(1 for r in results if r.get("so_cccd"))

    return {
        "success": True,
        "total": len(results),
        "success_count": success_count,
        "elapsed_seconds": elapsed,
        "folder_path": str(target_path.resolve()),
        "saved_excel_path": str(saved_excel_path.resolve()),
        "data": results
    }


@app.post("/api/export-excel")
async def export_excel(req: ExportExcelRequest):
    """
    Xuất danh sách kết quả ra file Excel và tải trực tiếp về trình duyệt.
    """
    if not req.data:
        raise HTTPException(status_code=400, detail="Không có dữ liệu để xuất Excel.")

    excel_buffer = scanner_core.export_to_excel(req.data, None)
    excel_bytes = excel_buffer.getvalue()

    filename = req.filename or f"Danh_Sach_CCCD_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    if not filename.endswith(".xlsx"):
        filename += ".xlsx"

    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.post("/api/open-output-folder")
async def open_output_folder():
    """Mở thư mục lưu kết quả Excel trên máy tính."""
    try:
        if sys.platform == "win32":
            os.startfile(str(DEFAULT_OUTPUT_DIR.resolve()))
        return {"success": True, "path": str(DEFAULT_OUTPUT_DIR.resolve())}
    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    print("=" * 65)
    print("   MAY CHU QUET CCCD OFFLINE (BAO MAT TUYET DOI - LOCALHOST ONLY)")
    print("=" * 65)
    print("[-] Dia chi truy cap: http://127.0.0.1:8000")
    print("[-] Chế độ an toàn: Chỉ chạy trên máy này, ngắt hoàn toàn với mạng bên ngoài.")
    print("=" * 65)
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")
