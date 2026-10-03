@echo off
setlocal

echo ========================================================
echo AI GOI Y DUYET TIN (chi ghi goi y, KHONG tu duyet)
echo ========================================================
echo Truoc khi bat: luong 12 phai ghi viec gui anh/mo ta xe sang
echo Google (Gemini) vao Chinh sach bao ve du lieu ca nhan.
echo.

set /p GEMINI_KEY="1. Nhap GEMINI_API_KEY (lay tu https://aistudio.google.com/): "
if "%GEMINI_KEY%"=="" (
    echo [Loi] Chua nhap API Key!
    pause
    exit /b
)

rem Secret sinh ngau nhien moi lan chay - KHONG ghi cung vao file (repo cong khai).
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"') do set WEBHOOK_SECRET=%%i

echo.
echo [2/3] Luu secret vao Supabase...
call npx supabase secrets set GEMINI_API_KEY="%GEMINI_KEY%" WEBHOOK_SECRET="%WEBHOOK_SECRET%"

echo.
echo [3/3] Deploy Edge Function...
call npx supabase functions deploy ai-moderator --no-verify-jwt

echo.
echo Buoc cuoi, lam tay tren Supabase Dashboard:
echo  - Database -^> Webhooks -^> Create
echo  - Bang: moderation_queue, Event: Insert
echo  - URL: https://nxwywykhlkdhofgnmmpp.supabase.co/functions/v1/ai-moderator
echo  - HTTP Header: x-webhook-secret = %WEBHOOK_SECRET%
echo (Chi hien secret o day mot lan, khong luu o dau ca.)
echo.
pause
