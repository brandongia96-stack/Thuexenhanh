@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title [CEO.INDEX] TRUNG TAM DIEU HANH THUEXENHANH

cls
echo ========================================================================
echo       THUEXENHANH — CEO COMMAND CENTER (CEO.INDEX)
echo ========================================================================
echo.
echo   [1/3] Khoi dong May chu Viet Bai SEO Top 3 (Port 4646)...
start "SEO_WRITER_SERVER" /min cmd /c "node tools\seo-writer\server.mjs"

echo   [2/3] Khoi dong May chu Quet CCCD Xuat Excel (Port 8000)...
start "CCCD_SCANNER_SERVER" /min cmd /c "python tools\cccd-scanner\server.py"

echo   [3/3] Dang mo Giao Dien Dieu Hanh CEO.INDEX ...
timeout /t 2 /nobreak >nul
start "" "%~dp0CEO.INDEX.html"

echo.
echo ========================================================================
echo   HE THONG DA KHOI DONG THANH CONG!
echo   - Giao dien CEO:      file:///%~dp0CEO.INDEX.html
echo   - SEO Content AI:     http://127.0.0.1:4646
echo   - CCCD Offline Core:  http://127.0.0.1:8000
echo.
echo   [*] De dung toan bo may chu, chi can dong cua so nay va go lenh tat.
echo ========================================================================
echo.
pause
