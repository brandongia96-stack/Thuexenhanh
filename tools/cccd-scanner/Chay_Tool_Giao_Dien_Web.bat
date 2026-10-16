@echo off
chcp 65001 >nul
title TOOL QUET CCCD XUAT EXCEL (OFFLINE - NO API)

echo ================================================================
echo       DANG KHOI DONG TOOL QUET CCCD XUAT EXCEL (OFFLINE)
echo ================================================================
echo [1] He thong chay 100%% cuc bo tren may tinh cua ban.
echo [2] Khong can bat ky API nao, khong ton phi, bao mat tuyet doi.
echo [3] Dang khoi dong trinh duyet Web...
echo ================================================================

cd /d "%~dp0"
python -m streamlit run app.py --server.port 8501 --server.headless false

pause
