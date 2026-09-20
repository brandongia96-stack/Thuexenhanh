@echo off
REM Bang dieu khien trien khai - Thuexenhanh
REM Nhay doi chuot vao file nay de mo.
cd /d "%~dp0..\.."
start "" http://127.0.0.1:4545
node tools\deploy-ui\server.mjs
pause
