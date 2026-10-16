@echo off
chcp 65001 >nul
title [DANG CHAY] TOOL QUET CCCD XUAT EXCEL (100%% OFFLINE - BAO MAT)

cls
echo ========================================================================
echo       TOOL QUET CAN CUOC CONG DAN (CCCD) -> XUAT EXCEL
echo       Che Do: 100%% OFFLINE - LOCALHOST (127.0.0.1) - BAO MAT TUYET DOI
echo ========================================================================
echo.
echo   [!] LUU Y RAT QUAN TRONG:
echo   ------------------------------------------------------------------
echo   >> HAY GIU CUA SO NAY LUON MO TRONG KHI SU DUNG PHAN MEM!
echo   >> Neu anh tat cua so nay, web se bi bao loi "Failed to fetch".
echo   ------------------------------------------------------------------
echo.
echo   [+] Dang khoi dong may chu noi bo: http://127.0.0.1:8000 ...
echo   [+] Dang tu dong mo trinh duyet Web...
echo ========================================================================
echo.

cd /d "%~dp0"

:: Tu dong mo trinh duyet sau 3 giay de may chu kip khoi dong
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://127.0.0.1:8000"

:: Khoi dong may chu local
python server.py

echo.
echo May chu da dung.
pause
